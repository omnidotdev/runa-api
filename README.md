# 🌙 Runa API

Runa is a project management platform.

## Local Development

First, `cp .env.local.template .env.local` and fill in the values. Then, generate TLS certificates by running `bun src/scripts/generateTlsCert.ts`.

### Building and Running

Install dependencies:

```sh
bun install
```

Setup the database (only required once, to create the database):

```sh
bun db:setup
```

Run database migrations:

```sh
bun db:migrate
```

Run the dev server:

```sh
bun run dev
```

## MCP Server

The API serves a [Model Context Protocol](https://modelcontextprotocol.io) server at `POST /mcp` (stateless Streamable HTTP), so AI assistants and agents can work with Runa boards.

Authenticate with a workspace API token (created in workspace settings under API tokens): `Authorization: Bearer runa_...`. Each tool call runs as that token, so its scopes, its single workspace, and the creator's project permissions all apply.

| Tool | Scope |
| --- | --- |
| `list_projects`, `list_columns` | `project:read` |
| `list_tasks`, `get_task` | `task:read` |
| `create_task`, `update_task`, `move_task` | `task:write` |
| `add_comment` | `comment:write` |

Requires `ACCEPT_API_TOKENS=true`.

## License

The code in this repository is licensed under Apache 2.0, &copy; [Omni LLC](https://omni.dev). See [LICENSE.md](LICENSE.md) for more information.
