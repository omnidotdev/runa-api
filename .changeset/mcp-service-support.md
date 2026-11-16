---
"@omnidotdev/runa-api": minor
---

The MCP server moves to its own service at `https://mcp.runa.omni.dev/mcp`, with browser sign-in alongside API tokens. The API adds `viewer` and `viewerWorkspaces` queries, and refuses sign-in tokens issued for other Omni services.
