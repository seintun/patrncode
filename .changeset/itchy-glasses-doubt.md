---
sophocode: patch
---

Fix CSP violations that blocked Pyodide, Monaco Editor, and React hydration in production. Set CSP nonce on request headers before SSR, add cdn.jsdelivr.net to CSP directives, and fix Monaco accessibility overlay and loading placeholder.
