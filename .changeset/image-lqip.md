---
"@omnidotdev/runa-api": minor
---

Images show a soft blurred preview while they load. Project avatar and board background uploads now return a blur-up placeholder (`lqip`), stored as the new `project.imageLqip` field and inside the image `background`. Both places only accept a small base64 image data URI (at most 4096 characters)
