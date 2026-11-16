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

Runa's MCP server is a separate service, [runa-mcp](https://github.com/omnidotdev/runa-mcp), hosted at `https://mcp.runa.omni.dev/mcp`. It forwards each request's credential to this API, so a workspace API token (`runa_...`) or a browser sign-in acts here with its own scopes and permissions. Gatekeeper JWTs are accepted only for the audiences in `GATEKEEPER_AUDIENCE` (default `https://mcp.runa.omni.dev`).

## License

The code in this repository is licensed under Apache 2.0, &copy; [Omni LLC](https://omni.dev). See [LICENSE.md](LICENSE.md) for more information.
