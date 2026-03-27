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

function runTestCase(py, code, input) {
  const indentedCode = code
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n');

  const setup = `
import sys, io

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
    return { actual: '', error: cleanError(syntaxErr.message) };
  }

  const actual = py.globals.get('_actual') || '';
  const errorMsg = py.globals.get('_error_msg');
  const stderr = py.globals.get('_errors') || '';

  if (errorMsg) {
    return { actual: '', error: cleanError(errorMsg) };
  }
  if (stderr) {
    return { actual: '', error: cleanError(stderr) };
  }
  return { actual, error: undefined };
}

self.onmessage = async function (event) {
  const { code, testCases, timeout } = event.data;

  try {
    const py = await loadPyodideInstance();

    const results = [];
    const timeoutMs = timeout || 5000;

    for (const tc of testCases) {
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

        const { actual, error } = runTestCase(py, code, tc.input);

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

        const passed = error === undefined && actual.trim() === tc.expected.trim();

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
        results.push({
          passed: false,
          input: tc.isHidden ? '' : tc.input,
          expected: tc.isHidden ? '' : tc.expected,
          actual: '',
          error: runError.message || 'Unknown execution error',
        });
      } finally {
        clearTimeout(timer);
      }
    }

    self.postMessage({ results });
  } catch (err) {
    self.postMessage({
      error: err.message || 'Failed to load Pyodide',
    });
  }
};
