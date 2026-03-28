let pyodide = null;
let loading = false;

async function loadPyodideInstance() {
  if (pyodide) return pyodide;
  if (loading) {
    // Wait for existing load
    while (loading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return pyodide;
  }
  loading = true;
  try {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js');
    pyodide = await self.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/',
    });
    return pyodide;
  } finally {
    loading = false;
  }
}

function runTestCase(py, code, input, funcName) {
  const indentedCode = code
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n');

  if (!funcName) {
    console.warn('[PyodideWorker] No function definition found in code.');
  }

  const setup = `
import sys, io, json

_stdout_capture = io.StringIO()
_stderr_capture = io.StringIO()
_orig_stdout = sys.stdout
_orig_stderr = sys.stderr
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture

try:
    _inputs = ${JSON.stringify(input.split('\n'))}
    _input_iter = iter(_inputs)
    def input(*args):
        try:
            return next(_input_iter)
        except StopIteration:
            return ''
`;

  // Compute offset dynamically: count lines in the combined script
  // before user code starts (setup + "except Exception" line)
  const setupLineCount = setup.split('\n').length;
  const codeLineOffset = setupLineCount + 1; // +1 for the blank line before user code

  const execution = `
${indentedCode}
${
  funcName
    ? `
    # Automatic function invocation for coding problems
    try:
        try:
            _args = json.loads(${JSON.stringify(input)})
        except Exception:
            _args = ${JSON.stringify(input)} # Fallback to raw string

        if isinstance(_args, list):
            _result = ${funcName}(*_args)
        else:
            _result = ${funcName}(_args)
            
        if _result is not None:
            # Standardizing result output to JSON for easier JS matching
            try:
                print(json.dumps(_result))
            except (TypeError, OverflowError):
                # Fallback for non-serializable objects (like custom classes)
                print(str(_result))
    except Exception as _e:
        raise _e
`
    : ''
}
except Exception as _e:
    import traceback as _tb
    _error_msg = _tb.format_exc()
else:
    _error_msg = None
finally:
    sys.stdout = _orig_stdout
    sys.stderr = _orig_stderr

_actual = _stdout_capture.getvalue().strip()
_errors = _stderr_capture.getvalue().strip()
`;

  function cleanError(raw) {
    if (!raw) return raw;
    // Log the full traceback to console for developer debugging
    console.error('[PyodideWorker] Python Traceback:', raw);
    
    return raw
      .split('\n')
      .filter(
        (line) =>
          !line.includes('/lib/python') &&
          !line.includes('pyodide') &&
          line.trim() !== 'Traceback (most recent call last):',
      )
      .join('\n')
      .replace(/line (\d+)/g, (_, n) => `line ${Math.max(1, parseInt(n, 10) - codeLineOffset)}`)
      .trim();
  }

  try {
    py.runPython(setup + '\n' + execution);
  } catch (syntaxErr) {
    console.error('[PyodideWorker] Syntax Error during execution:', syntaxErr);
    return { actual: '', error: `Syntax Error: ${cleanError(syntaxErr.message)}` };
  }

  const actual = py.globals.get('_actual') || '';
  const errorMsg = py.globals.get('_error_msg');
  const stderr = py.globals.get('_errors') || '';

  if (errorMsg) {
    return { actual: '', error: cleanError(errorMsg) };
  }
  if (stderr) {
    // Treat stderr as a warning/error if it's not empty, but don't fail if we have actual output?
    // Actually, most coding platforms fail if there's stderr.
    return { actual, error: cleanError(stderr) };
  }
  return { actual, error: undefined };
}

self.onmessage = async function (event) {
  const { code, testCases, timeout, functionName } = event.data;

  try {
    console.log('[PyodideWorker] Initializing execution...');
    const py = await loadPyodideInstance();

    // Fallback if functionName wasn't passed from the UI
    const finalFunctionName =
      functionName ||
      (code.match(/^[ \t]*def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/m) || [])[1] ||
      null;

    const results = [];
    const timeoutMs = timeout || 5000;

    for (const [index, tc] of testCases.entries()) {
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
      }, timeoutMs);

      try {
        if (timedOut) {
          results.push({
            passed: false,
            input: tc.isHidden ? '' : tc.input,
            expected: tc.isHidden ? '' : tc.expected,
            actual: '',
            error: 'Timeout: execution exceeded 5s limit',
          });
          continue;
        }

        const { actual, error } = runTestCase(py, code, tc.input, finalFunctionName);

        if (timedOut) {
          results.push({
            passed: false,
            input: tc.isHidden ? '' : tc.input,
            expected: tc.isHidden ? '' : tc.expected,
            actual: '',
            error: 'Timeout: execution exceeded 5s limit',
          });
          continue;
        }

        function normalize(val) {
          if (!val) return '';
          const trimmed = val.trim();
          
          // Helper for Python values that don't match JSON
          if (trimmed === 'True') return 'true';
          if (trimmed === 'False') return 'false';
          if (trimmed === 'None') return 'null';
          
          try {
            // Attempt to parse and re-stringify to normalize spacing/formatting
            return JSON.stringify(JSON.parse(trimmed));
          } catch {
            // If it's not JSON, return the trimmed string
            return trimmed;
          }
        }

        const normalizedActual = normalize(actual);
        const normalizedExpected = normalize(tc.expected);
        const passed = error === undefined && normalizedActual === normalizedExpected;

        if (tc.isHidden) {
          results.push({ passed, input: '', expected: '', actual: '' });
        } else {
          results.push({
            passed,
            input: tc.input,
            expected: tc.expected,
            actual: error ? '' : actual,
            error,
          });
        }
      } catch (runError) {
        console.error(`[PyodideWorker] Unhandled error in test case ${index + 1}:`, runError);
        results.push({
          passed: false,
          input: tc.isHidden ? '' : tc.input,
          expected: tc.isHidden ? '' : tc.expected,
          actual: '',
          error: runError.message || 'Unknown internal execution error',
        });
      } finally {
        clearTimeout(timer);
      }
    }

    self.postMessage({ results });
  } catch (err) {
    console.error('[PyodideWorker] Fatal Initialization Error:', err);
    self.postMessage({
      error: `Failed to load Pyodide: ${err.message || 'Unknown error'}. Please check your internet connection or try a different browser.`,
    });
  }
};
