---
"@omnidotdev/runa-api": patch
---

Uploads no longer fail once a workspace stores more than about 2 GB of attachments. Attachments can now use the full per-file size of the workspace plan (25 MB Free, 100 MB Pro, 250 MB Team) instead of being cut off at 20 MB for images, 50 MB for videos, and 25 MB for other files. Project avatars and backgrounds stay limited to 20 MB
