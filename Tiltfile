# load environment variables
load("ext://dotenv", "dotenv")

dotenv(fn=".env.local")

project_name = "runa-api"

local_resource(
    "install-deps-%s" % project_name,
    cmd="bun i",
    deps=["package.json"],
    labels=[project_name],
)

local_resource(
    "dev-%s" % project_name,
    cmd="bun dev",
    labels=[project_name],
)
