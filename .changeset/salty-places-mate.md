---
'sophocode': patch
---

fix: chat and pyodide error messages

- Fix chat 404: use DefaultChatTransport in useChat v3
- Fix chat 400: force chat completions API (OpenRouter lacks Responses API)
- Fix chat validation: validate messages array and problem context fields
- Improve pyodide errors: dynamic line offset, traceback formatting, filter internals
