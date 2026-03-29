let pyodide = null;
let loading = false;

/**
 * Singleton Pyodide loader
 */
async function loadPyodideInstance() {
  if (pyodide) return pyodide;
  if (loading) {
    while (loading) await new Promise((r) => setTimeout(r, 100));
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

/**
 * Normalizes Python output for comparison with JSON expectations
 */
function normalize(val) {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed === 'True') return 'true';
  if (trimmed === 'False') return 'false';
  if (trimmed === 'None') return 'null';
  try {
    return JSON.stringify(JSON.parse(trimmed));
  } catch {
    return trimmed;
  }
}

/**
 * Cleans traceback error messages for user display
 */
function cleanError(raw, offset) {
  if (!raw) return raw;
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
    .replace(/line (\d+)/g, (_, n) => `line ${Math.max(1, parseInt(n, 10) - offset)}`)
    .trim();
}

/**
 * Executes a single test case
 */
function runTestCase(py, code, input, funcName) {
  const indentedCode = code.split('\n').map((line) => '    ' + line).join('\n');
  const setup = `
import sys, io, json
_stdout_capture = io.StringIO()
_stderr_capture = io.StringIO()
_orig_stdout, _orig_stderr = sys.stdout, sys.stderr
sys.stdout, sys.stderr = _stdout_capture, _stderr_capture
try:
    _inputs = ${JSON.stringify(input.split('\n'))}
    _input_iter = iter(_inputs)
    def input(*args):
        try: return next(_input_iter)
        except StopIteration: return ''
`;
  const codeLineOffset = setup.split('\n').length + 1;
  const execution = `
${indentedCode}
${funcName ? `
    try:
        _args = json.loads(${JSON.stringify(input)})
        if isinstance(_args, list): _result = ${funcName}(*_args)
        else: _result = ${funcName}(_args)
        if _result is not None: print(json.dumps(_result))
    except Exception as _e: raise _e
` : ''}
except Exception as _e:
    import traceback as _tb
    _error_msg = _tb.format_exc()
else: _error_msg = None
finally:
    sys.stdout, sys.stderr = _orig_stdout, _orig_stderr
_actual = _stdout_capture.getvalue().strip()
_errors = _stderr_capture.getvalue().strip()
`;

  try {
    py.runPython(setup + '\n' + execution);
  } catch (err) {
    return { actual: '', error: `Syntax Error: ${cleanError(err.message, codeLineOffset)}` };
  }

  const actual = py.globals.get('_actual') || '';
  const errorMsg = py.globals.get('_error_msg');
  const stderr = py.globals.get('_errors') || '';

  if (errorMsg) return { actual: '', error: cleanError(errorMsg, codeLineOffset) };
  if (stderr) return { actual, error: cleanError(stderr, codeLineOffset) };
  return { actual, error: undefined };
}

self.onmessage = async function (event) {
  const { code, testCases, timeout = 5000, functionName, prewarm } = event.data;
  try {
    const py = await loadPyodideInstance();
    if (prewarm) return self.postMessage({ status: 'prewarmed' });

    const finalFunctionName = functionName || (code.match(/^[ \t]*def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/m) || [])[1] || null;
    const results = [];

    for (const tc of testCases) {
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; }, timeout);
      try {
        const { actual, error } = runTestCase(py, code, tc.input, finalFunctionName);
        const passed = error === undefined && normalize(actual) === normalize(tc.expected);
        results.push({
          passed,
          input: tc.isHidden ? '' : tc.input,
          expected: tc.isHidden ? '' : tc.expected,
          actual: tc.isHidden || error ? '' : actual,
          error: timedOut ? 'Timeout: 5s limit' : error,
        });
      } finally {
        clearTimeout(timer);
      }
    }
    self.postMessage({ results });
  } catch (err) {
    self.postMessage({ error: `Worker Error: ${err.message}` });
  }
};
