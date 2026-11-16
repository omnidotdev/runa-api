# @omnidotdev/runa-api

## 0.1.0

### Minor Changes

- [#71](https://github.com/omnidotdev/runa-api/pull/71) [`e1f6f3c`](https://github.com/omnidotdev/runa-api/commit/e1f6f3c30c75475740563dcfc35074a3bc057eaa) Thanks [@coopbri](https://github.com/coopbri)! - Add an MCP server at `/mcp` so AI assistants can list, create, update, move, and comment on tasks using a workspace API token.

- [#73](https://github.com/omnidotdev/runa-api/pull/73) [`7c0be6e`](https://github.com/omnidotdev/runa-api/commit/7c0be6e8b777411974ca778328e50461d64122db) Thanks [@coopbri](https://github.com/coopbri)! - The MCP server moves to its own service at `https://mcp.runa.omni.dev/mcp`, with browser sign-in alongside API tokens. The API adds `viewer` and `viewerWorkspaces` queries, and refuses sign-in tokens issued for other Omni services.

- [#63](https://github.com/omnidotdev/runa-api/pull/63) [`245ebe5`](https://github.com/omnidotdev/runa-api/commit/245ebe5475c4a8fcafe28a8e395fc1d9d9e7625d) Thanks [@coopbri](https://github.com/coopbri)! - Email the people involved in a task when someone comments on it or moves it to another project, and email anyone @mentioned in a comment or task description. Each email type has its own on/off setting.

### Patch Changes

- [#74](https://github.com/omnidotdev/runa-api/pull/74) [`bdcfc38`](https://github.com/omnidotdev/runa-api/commit/bdcfc38fbcc4b5bdeb035c048d15b01d941435ef) Thanks [@coopbri](https://github.com/coopbri)! - Fix calendar feeds and due date labels. All-day due dates now land on the right day in subscribed calendars for every time zone, event titles show plain text instead of formatting markup, and a feed stops working once its owner loses access, or its project or workspace is deleted. Activity entries for due dates show the correct day, and the time for due dates that have one.

- [#69](https://github.com/omnidotdev/runa-api/pull/69) [`bd93eda`](https://github.com/omnidotdev/runa-api/commit/bd93eda5473a12338265defb160d5a20723f6cc4) Thanks [@coopbri](https://github.com/coopbri)! - Record task, project, label, column, and comment creations and deletions in the activity feed with their names and workspace.

- [#65](https://github.com/omnidotdev/runa-api/pull/65) [`3a7f21c`](https://github.com/omnidotdev/runa-api/commit/3a7f21c0b66064bb91b0a3f2b37d525aa6223658) Thanks [@coopbri](https://github.com/coopbri)! - Update OpenTelemetry, Biome, and changelog tooling; pin CI actions and Docker base images to digests.

- [#68](https://github.com/omnidotdev/runa-api/pull/68) [`86a310a`](https://github.com/omnidotdev/runa-api/commit/86a310a27d6f91638dd17a940cb84295eb9cbb18) Thanks [@coopbri](https://github.com/coopbri)! - Update Postgraphile to 5.2, TypeScript to 7, and other tooling to their latest major versions.

- [#72](https://github.com/omnidotdev/runa-api/pull/72) [`56c79e3`](https://github.com/omnidotdev/runa-api/commit/56c79e38fe9232326a25d7bea47ffb2d0d59547a) Thanks [@coopbri](https://github.com/coopbri)! - The MCP `list_projects` tool now lists only the token's own workspace projects.

- [#70](https://github.com/omnidotdev/runa-api/pull/70) [`9e6b747`](https://github.com/omnidotdev/runa-api/commit/9e6b7472bb59f1f558ae985dfe090dd107f7e4f2) Thanks [@coopbri](https://github.com/coopbri)! - Security: limit what each request can read to the workspaces it belongs to (plus public projects), and stop exposing user email addresses and internal queues through the API.

- [#66](https://github.com/omnidotdev/runa-api/pull/66) [`6e4d2b8`](https://github.com/omnidotdev/runa-api/commit/6e4d2b8c98a8fe4446c16c99b31c82fd18e7b6cf) Thanks [@coopbri](https://github.com/coopbri)! - Remove the unused maintenance-mode check and its feature-flag client.

- [#64](https://github.com/omnidotdev/runa-api/pull/64) [`cb62a03`](https://github.com/omnidotdev/runa-api/commit/cb62a03af964049eeb2a6025bf56984dd1937a10) Thanks [@coopbri](https://github.com/coopbri)! - Stop the task activity feed from showing "renamed this task" (and other edits) when a field is saved without actually changing, such as after moving a task to another project.
