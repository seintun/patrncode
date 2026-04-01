---
sophocode: patch
---

Fix End Session blocking delay: move AI feedback generation to background using Next.js `after()`, add feedback polling placeholder on summary page. Session now completes in <500ms instead of 5-15s.
