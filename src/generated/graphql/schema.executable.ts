// @ts-nocheck
import { PgCondition, PgDeleteSingleStep, PgExecutor, TYPES, assertPgClassSingleStep, listOfCodec, makeRegistry, pgDeleteSingle, pgInsertSingle, pgSelectFromRecord, pgUpdateSingle, recordCodec, sqlValueWithCodec } from "@dataplan/pg";
import { ConnectionStep, EdgeStep, ObjectStep, __ValueStep, access, assertEdgeCapableStep, assertExecutableStep, assertPageInfoCapableStep, bakedInputRuntime, connection, constant, context, createObjectAndApplyChildren, first, inhibitOnNull, lambda, list, makeGrafastSchema, node, object, rootValue, specFromNodeId } from "grafast";
import { GraphQLError, Kind } from "graphql";
import { sql } from "pg-sql2";
const handler = {
  typeName: "Query",
  codec: {
    name: "raw",
    encode: Object.assign(function rawEncode(value) {
      return typeof value === "string" ? value : null;
    }, {
      isSyncAndSafe: true
    }),
    decode: Object.assign(function rawDecode(value) {
      return typeof value === "string" ? value : null;
    }, {
      isSyncAndSafe: true
    })
  },
  match(specifier) {
    return specifier === "query";
  },
  getIdentifiers(_value) {
    return [];
  },
  getSpec() {
    return "irrelevant";
  },
  get() {
    return rootValue();
  },
  plan() {
    return constant`query`;
  }
};
const nodeIdCodecs_base64JSON_base64JSON = {
  name: "base64JSON",
  encode: (() => {
    function base64JSONEncode(value) {
      return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
    }
    base64JSONEncode.isSyncAndSafe = !0;
    return base64JSONEncode;
  })(),
  decode: (() => {
    function base64JSONDecode(value) {
      return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    }
    base64JSONDecode.isSyncAndSafe = !0;
    return base64JSONDecode;
  })()
};
const nodeIdCodecs = {
  __proto__: null,
  raw: handler.codec,
  base64JSON: nodeIdCodecs_base64JSON_base64JSON,
  pipeString: {
    name: "pipeString",
    encode: Object.assign(function pipeStringEncode(value) {
      return Array.isArray(value) ? value.join("|") : null;
    }, {
      isSyncAndSafe: true
    }),
    decode: Object.assign(function pipeStringDecode(value) {
      return typeof value === "string" ? value.split("|") : null;
    }, {
      isSyncAndSafe: true
    })
  }
};
const executor = new PgExecutor({
  name: "main",
  context() {
    const ctx = context();
    return object({
      pgSettings: "pgSettings" != null ? ctx.get("pgSettings") : constant(null),
      withPgClient: ctx.get("withPgClient")
    });
  }
});
const projectUserIdentifier = sql.identifier("public", "project_user");
const spec_projectUser = {
  name: "projectUser",
  identifier: projectUserIdentifier,
  attributes: {
    __proto__: null,
    project_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    user_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "236571",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "project_user"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const projectUserCodec = recordCodec(spec_projectUser);
const taskUserIdentifier = sql.identifier("public", "task_user");
const spec_taskUser = {
  name: "taskUser",
  identifier: taskUserIdentifier,
  attributes: {
    __proto__: null,
    task_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    user_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "236590",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "task_user"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const taskUserCodec = recordCodec(spec_taskUser);
const workspaceUserIdentifier = sql.identifier("public", "workspace_user");
const spec_workspaceUser = {
  name: "workspaceUser",
  identifier: workspaceUserIdentifier,
  attributes: {
    __proto__: null,
    workspace_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    user_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "236616",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "workspace_user"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const workspaceUserCodec = recordCodec(spec_workspaceUser);
const userIdentifier = sql.identifier("public", "user");
const spec_user = {
  name: "user",
  identifier: userIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    identity_provider_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "236596",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "user"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const userCodec = recordCodec(spec_user);
const workspaceIdentifier = sql.identifier("public", "workspace");
const spec_workspace = {
  name: "workspace",
  identifier: workspaceIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    name: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "236606",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "workspace"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const workspaceCodec = recordCodec(spec_workspace);
const columnIdentifier = sql.identifier("public", "column");
const spec_column = {
  name: "column",
  identifier: columnIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    title: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    project_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "236540",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "column"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const columnCodec = recordCodec(spec_column);
const assigneeIdentifier = sql.identifier("public", "assignee");
const spec_assignee = {
  name: "assignee",
  identifier: assigneeIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    user_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    name: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    avatar_url: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "236530",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "assignee"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const assigneeCodec = recordCodec(spec_assignee);
const postIdentifier = sql.identifier("public", "post");
const spec_post = {
  name: "post",
  identifier: postIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    title: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    description: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    author_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "236550",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "post"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const postCodec = recordCodec(spec_post);
const projectIdentifier = sql.identifier("public", "project");
const spec_project = {
  name: "project",
  identifier: projectIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    name: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    description: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    prefix: {
      description: undefined,
      codec: TYPES.varchar,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    color: {
      description: undefined,
      codec: TYPES.varchar,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    labels: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    workspace_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    view_mode: {
      description: undefined,
      codec: TYPES.varchar,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "236560",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "project"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const projectCodec = recordCodec(spec_project);
const taskIdentifier = sql.identifier("public", "task");
const spec_task = {
  name: "task",
  identifier: taskIdentifier,
  attributes: {
    __proto__: null,
    id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    content: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    description: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    priority: {
      description: undefined,
      codec: TYPES.varchar,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    column_id: {
      description: undefined,
      codec: TYPES.uuid,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    assignees: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    labels: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    due_date: {
      description: undefined,
      codec: TYPES.text,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    },
    updated_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true,
        isIndexed: false
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "236577",
    isTableLike: true,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "task"
    },
    tags: {
      __proto__: null
    }
  },
  executor: executor
};
const taskCodec = recordCodec(spec_task);
const project_userUniques = [{
  isPrimary: true,
  attributes: ["project_id", "user_id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_project_user_project_user = {
  executor: executor,
  name: "project_user",
  identifier: "main.public.project_user",
  from: projectUserIdentifier,
  codec: projectUserCodec,
  uniques: project_userUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "project_user"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const task_userUniques = [{
  isPrimary: true,
  attributes: ["task_id", "user_id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_task_user_task_user = {
  executor: executor,
  name: "task_user",
  identifier: "main.public.task_user",
  from: taskUserIdentifier,
  codec: taskUserCodec,
  uniques: task_userUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "task_user"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const workspace_userUniques = [{
  isPrimary: true,
  attributes: ["workspace_id", "user_id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_workspace_user_workspace_user = {
  executor: executor,
  name: "workspace_user",
  identifier: "main.public.workspace_user",
  from: workspaceUserIdentifier,
  codec: workspaceUserCodec,
  uniques: workspace_userUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "workspace_user"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const userUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}, {
  isPrimary: false,
  attributes: ["identity_provider_id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_user_user = {
  executor: executor,
  name: "user",
  identifier: "main.public.user",
  from: userIdentifier,
  codec: userCodec,
  uniques: userUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "user"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const workspaceUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_workspace_workspace = {
  executor: executor,
  name: "workspace",
  identifier: "main.public.workspace",
  from: workspaceIdentifier,
  codec: workspaceCodec,
  uniques: workspaceUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "workspace"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const columnUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_column_column = {
  executor: executor,
  name: "column",
  identifier: "main.public.column",
  from: columnIdentifier,
  codec: columnCodec,
  uniques: columnUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "column"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const assigneeUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_assignee_assignee = {
  executor: executor,
  name: "assignee",
  identifier: "main.public.assignee",
  from: assigneeIdentifier,
  codec: assigneeCodec,
  uniques: assigneeUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "assignee"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const postUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_post_post = {
  executor: executor,
  name: "post",
  identifier: "main.public.post",
  from: postIdentifier,
  codec: postCodec,
  uniques: postUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "post"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const projectUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_project_project = {
  executor: executor,
  name: "project",
  identifier: "main.public.project",
  from: projectIdentifier,
  codec: projectCodec,
  uniques: projectUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "project"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const taskUniques = [{
  isPrimary: true,
  attributes: ["id"],
  description: undefined,
  extensions: {
    tags: {
      __proto__: null
    }
  }
}];
const registryConfig_pgResources_task_task = {
  executor: executor,
  name: "task",
  identifier: "main.public.task",
  from: taskIdentifier,
  codec: taskCodec,
  uniques: taskUniques,
  isVirtual: false,
  description: undefined,
  extensions: {
    description: undefined,
    pg: {
      serviceName: "main",
      schemaName: "public",
      name: "task"
    },
    isInsertable: true,
    isUpdatable: true,
    isDeletable: true,
    tags: {},
    canSelect: true,
    canInsert: true,
    canUpdate: true,
    canDelete: true
  }
};
const registryConfig = {
  pgExecutors: {
    __proto__: null,
    main: executor
  },
  pgCodecs: {
    __proto__: null,
    projectUser: projectUserCodec,
    uuid: TYPES.uuid,
    timestamptz: TYPES.timestamptz,
    taskUser: taskUserCodec,
    workspaceUser: workspaceUserCodec,
    user: userCodec,
    workspace: workspaceCodec,
    text: TYPES.text,
    column: columnCodec,
    assignee: assigneeCodec,
    post: postCodec,
    project: projectCodec,
    varchar: TYPES.varchar,
    jsonb: TYPES.jsonb,
    task: taskCodec
  },
  pgResources: {
    __proto__: null,
    project_user: registryConfig_pgResources_project_user_project_user,
    task_user: registryConfig_pgResources_task_user_task_user,
    workspace_user: registryConfig_pgResources_workspace_user_workspace_user,
    user: registryConfig_pgResources_user_user,
    workspace: registryConfig_pgResources_workspace_workspace,
    column: registryConfig_pgResources_column_column,
    assignee: registryConfig_pgResources_assignee_assignee,
    post: registryConfig_pgResources_post_post,
    project: registryConfig_pgResources_project_project,
    task: registryConfig_pgResources_task_task
  },
  pgRelations: {
    __proto__: null,
    assignee: {
      __proto__: null,
      userByMyUserId: {
        localCodec: assigneeCodec,
        remoteResourceOptions: registryConfig_pgResources_user_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["user_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    column: {
      __proto__: null,
      projectByMyProjectId: {
        localCodec: columnCodec,
        remoteResourceOptions: registryConfig_pgResources_project_project,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["project_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      tasksByTheirColumnId: {
        localCodec: columnCodec,
        remoteResourceOptions: registryConfig_pgResources_task_task,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["column_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    post: {
      __proto__: null,
      userByMyAuthorId: {
        localCodec: postCodec,
        remoteResourceOptions: registryConfig_pgResources_user_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["author_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    project: {
      __proto__: null,
      workspaceByMyWorkspaceId: {
        localCodec: projectCodec,
        remoteResourceOptions: registryConfig_pgResources_workspace_workspace,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["workspace_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      columnsByTheirProjectId: {
        localCodec: projectCodec,
        remoteResourceOptions: registryConfig_pgResources_column_column,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["project_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      projectUsersByTheirProjectId: {
        localCodec: projectCodec,
        remoteResourceOptions: registryConfig_pgResources_project_user_project_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["project_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    projectUser: {
      __proto__: null,
      projectByMyProjectId: {
        localCodec: projectUserCodec,
        remoteResourceOptions: registryConfig_pgResources_project_project,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["project_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      userByMyUserId: {
        localCodec: projectUserCodec,
        remoteResourceOptions: registryConfig_pgResources_user_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["user_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    task: {
      __proto__: null,
      columnByMyColumnId: {
        localCodec: taskCodec,
        remoteResourceOptions: registryConfig_pgResources_column_column,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["column_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      taskUsersByTheirTaskId: {
        localCodec: taskCodec,
        remoteResourceOptions: registryConfig_pgResources_task_user_task_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["task_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    taskUser: {
      __proto__: null,
      taskByMyTaskId: {
        localCodec: taskUserCodec,
        remoteResourceOptions: registryConfig_pgResources_task_task,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["task_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      userByMyUserId: {
        localCodec: taskUserCodec,
        remoteResourceOptions: registryConfig_pgResources_user_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["user_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    user: {
      __proto__: null,
      assigneesByTheirUserId: {
        localCodec: userCodec,
        remoteResourceOptions: registryConfig_pgResources_assignee_assignee,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["user_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      postsByTheirAuthorId: {
        localCodec: userCodec,
        remoteResourceOptions: registryConfig_pgResources_post_post,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["author_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      projectUsersByTheirUserId: {
        localCodec: userCodec,
        remoteResourceOptions: registryConfig_pgResources_project_user_project_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["user_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      taskUsersByTheirUserId: {
        localCodec: userCodec,
        remoteResourceOptions: registryConfig_pgResources_task_user_task_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["user_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      workspaceUsersByTheirUserId: {
        localCodec: userCodec,
        remoteResourceOptions: registryConfig_pgResources_workspace_user_workspace_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["user_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    workspace: {
      __proto__: null,
      projectsByTheirWorkspaceId: {
        localCodec: workspaceCodec,
        remoteResourceOptions: registryConfig_pgResources_project_project,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["workspace_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      workspaceUsersByTheirWorkspaceId: {
        localCodec: workspaceCodec,
        remoteResourceOptions: registryConfig_pgResources_workspace_user_workspace_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["id"],
        remoteAttributes: ["workspace_id"],
        isUnique: false,
        isReferencee: true,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    },
    workspaceUser: {
      __proto__: null,
      userByMyUserId: {
        localCodec: workspaceUserCodec,
        remoteResourceOptions: registryConfig_pgResources_user_user,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["user_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      },
      workspaceByMyWorkspaceId: {
        localCodec: workspaceUserCodec,
        remoteResourceOptions: registryConfig_pgResources_workspace_workspace,
        localCodecPolymorphicTypes: undefined,
        localAttributes: ["workspace_id"],
        remoteAttributes: ["id"],
        isUnique: true,
        isReferencee: false,
        description: undefined,
        extensions: {
          tags: {
            behavior: []
          }
        }
      }
    }
  }
};
const registry = makeRegistry(registryConfig);
const pgResource_project_userPgResource = registry.pgResources["project_user"];
const pgResource_task_userPgResource = registry.pgResources["task_user"];
const pgResource_workspace_userPgResource = registry.pgResources["workspace_user"];
const pgResource_userPgResource = registry.pgResources["user"];
const pgResource_workspacePgResource = registry.pgResources["workspace"];
const pgResource_columnPgResource = registry.pgResources["column"];
const pgResource_assigneePgResource = registry.pgResources["assignee"];
const pgResource_postPgResource = registry.pgResources["post"];
const pgResource_projectPgResource = registry.pgResources["project"];
const pgResource_taskPgResource = registry.pgResources["task"];
const nodeIdHandlerByTypeName = {
  __proto__: null,
  Query: handler,
  ProjectUser: {
    typeName: "ProjectUser",
    codec: nodeIdCodecs_base64JSON_base64JSON,
    deprecationReason: undefined,
    plan($record) {
      return list([constant("ProjectUser", false), $record.get("project_id"), $record.get("user_id")]);
    },
    getSpec($list) {
      return {
        project_id: inhibitOnNull(access($list, [1])),
        user_id: inhibitOnNull(access($list, [2]))
      };
    },
    getIdentifiers(value) {
      return value.slice(1);
    },
    get(spec) {
      return pgResource_project_userPgResource.get(spec);
    },
    match(obj) {
      return obj[0] === "ProjectUser";
    }
  },
  TaskUser: {
    typeName: "TaskUser",
    codec: nodeIdCodecs_base64JSON_base64JSON,
    deprecationReason: undefined,
    plan($record) {
      return list([constant("TaskUser", false), $record.get("task_id"), $record.get("user_id")]);
    },
    getSpec($list) {
      return {
        task_id: inhibitOnNull(access($list, [1])),
        user_id: inhibitOnNull(access($list, [2]))
      };
    },
    getIdentifiers(value) {
      return value.slice(1);
    },
    get(spec) {
      return pgResource_task_userPgResource.get(spec);
    },
    match(obj) {
      return obj[0] === "TaskUser";
    }
  },
  WorkspaceUser: {
    typeName: "WorkspaceUser",
    codec: nodeIdCodecs_base64JSON_base64JSON,
    deprecationReason: undefined,
    plan($record) {
      return list([constant("WorkspaceUser", false), $record.get("workspace_id"), $record.get("user_id")]);
    },
    getSpec($list) {
      return {
        workspace_id: inhibitOnNull(access($list, [1])),
        user_id: inhibitOnNull(access($list, [2]))
      };
    },
    getIdentifiers(value) {
      return value.slice(1);
    },
    get(spec) {
      return pgResource_workspace_userPgResource.get(spec);
    },
    match(obj) {
      return obj[0] === "WorkspaceUser";
    }
  },
  User: {
    typeName: "User",
    codec: nodeIdCodecs_base64JSON_base64JSON,
    deprecationReason: undefined,
    plan($record) {
      return list([constant("User", false), $record.get("id")]);
    },
    getSpec($list) {
      return {
        id: inhibitOnNull(access($list, [1]))
      };
    },
    getIdentifiers(value) {
      return value.slice(1);
    },
    get(spec) {
      return pgResource_userPgResource.get(spec);
    },
    match(obj) {
      return obj[0] === "User";
    }
  },
  Workspace: {
    typeName: "Workspace",
    codec: nodeIdCodecs_base64JSON_base64JSON,
    deprecationReason: undefined,
    plan($record) {
      return list([constant("Workspace", false), $record.get("id")]);
    },
    getSpec($list) {
      return {
        id: inhibitOnNull(access($list, [1]))
      };
    },
    getIdentifiers(value) {
      return value.slice(1);
    },
    get(spec) {
      return pgResource_workspacePgResource.get(spec);
    },
    match(obj) {
      return obj[0] === "Workspace";
    }
  },
  Column: {
    typeName: "Column",
    codec: nodeIdCodecs_base64JSON_base64JSON,
    deprecationReason: undefined,
    plan($record) {
      return list([constant("Column", false), $record.get("id")]);
    },
    getSpec($list) {
      return {
        id: inhibitOnNull(access($list, [1]))
      };
    },
    getIdentifiers(value) {
      return value.slice(1);
    },
    get(spec) {
      return pgResource_columnPgResource.get(spec);
    },
    match(obj) {
      return obj[0] === "Column";
    }
  },
  Assignee: {
    typeName: "Assignee",
    codec: nodeIdCodecs_base64JSON_base64JSON,
    deprecationReason: undefined,
    plan($record) {
      return list([constant("Assignee", false), $record.get("id")]);
    },
    getSpec($list) {
      return {
        id: inhibitOnNull(access($list, [1]))
      };
    },
    getIdentifiers(value) {
      return value.slice(1);
    },
    get(spec) {
      return pgResource_assigneePgResource.get(spec);
    },
    match(obj) {
      return obj[0] === "Assignee";
    }
  },
  Post: {
    typeName: "Post",
    codec: nodeIdCodecs_base64JSON_base64JSON,
    deprecationReason: undefined,
    plan($record) {
      return list([constant("Post", false), $record.get("id")]);
    },
    getSpec($list) {
      return {
        id: inhibitOnNull(access($list, [1]))
      };
    },
    getIdentifiers(value) {
      return value.slice(1);
    },
    get(spec) {
      return pgResource_postPgResource.get(spec);
    },
    match(obj) {
      return obj[0] === "Post";
    }
  },
  Project: {
    typeName: "Project",
    codec: nodeIdCodecs_base64JSON_base64JSON,
    deprecationReason: undefined,
    plan($record) {
      return list([constant("Project", false), $record.get("id")]);
    },
    getSpec($list) {
      return {
        id: inhibitOnNull(access($list, [1]))
      };
    },
    getIdentifiers(value) {
      return value.slice(1);
    },
    get(spec) {
      return pgResource_projectPgResource.get(spec);
    },
    match(obj) {
      return obj[0] === "Project";
    }
  },
  Task: {
    typeName: "Task",
    codec: nodeIdCodecs_base64JSON_base64JSON,
    deprecationReason: undefined,
    plan($record) {
      return list([constant("Task", false), $record.get("id")]);
    },
    getSpec($list) {
      return {
        id: inhibitOnNull(access($list, [1]))
      };
    },
    getIdentifiers(value) {
      return value.slice(1);
    },
    get(spec) {
      return pgResource_taskPgResource.get(spec);
    },
    match(obj) {
      return obj[0] === "Task";
    }
  }
};
function specForHandler(handler) {
  function spec(nodeId) {
    if (nodeId == null) return null;
    try {
      const specifier = handler.codec.decode(nodeId);
      if (handler.match(specifier)) return specifier;
    } catch {}
    return null;
  }
  spec.displayName = `specifier_${handler.typeName}_${handler.codec.name}`;
  spec.isSyncAndSafe = !0;
  return spec;
}
const nodeFetcher_ProjectUser = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.ProjectUser));
  return nodeIdHandlerByTypeName.ProjectUser.get(nodeIdHandlerByTypeName.ProjectUser.getSpec($decoded));
};
const nodeFetcher_TaskUser = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.TaskUser));
  return nodeIdHandlerByTypeName.TaskUser.get(nodeIdHandlerByTypeName.TaskUser.getSpec($decoded));
};
const nodeFetcher_WorkspaceUser = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.WorkspaceUser));
  return nodeIdHandlerByTypeName.WorkspaceUser.get(nodeIdHandlerByTypeName.WorkspaceUser.getSpec($decoded));
};
const nodeFetcher_User = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.User));
  return nodeIdHandlerByTypeName.User.get(nodeIdHandlerByTypeName.User.getSpec($decoded));
};
const nodeFetcher_Workspace = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.Workspace));
  return nodeIdHandlerByTypeName.Workspace.get(nodeIdHandlerByTypeName.Workspace.getSpec($decoded));
};
const nodeFetcher_Column = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.Column));
  return nodeIdHandlerByTypeName.Column.get(nodeIdHandlerByTypeName.Column.getSpec($decoded));
};
const nodeFetcher_Assignee = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.Assignee));
  return nodeIdHandlerByTypeName.Assignee.get(nodeIdHandlerByTypeName.Assignee.getSpec($decoded));
};
const nodeFetcher_Post = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.Post));
  return nodeIdHandlerByTypeName.Post.get(nodeIdHandlerByTypeName.Post.getSpec($decoded));
};
const nodeFetcher_Project = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.Project));
  return nodeIdHandlerByTypeName.Project.get(nodeIdHandlerByTypeName.Project.getSpec($decoded));
};
const nodeFetcher_Task = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.Task));
  return nodeIdHandlerByTypeName.Task.get(nodeIdHandlerByTypeName.Task.getSpec($decoded));
};
function qbWhereBuilder(qb) {
  return qb.whereBuilder();
}
function isEmpty(o) {
  return typeof o === "object" && o !== null && Object.keys(o).length === 0;
}
function assertAllowed(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed2(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed3(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed4(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed5(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed6(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed7(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed8(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed9(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed10(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function UUIDSerialize(value) {
  return "" + value;
}
const coerce = string => {
  if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(string)) throw new GraphQLError("Invalid UUID, expected 32 hexadecimal characters, optionally with hypens");
  return string;
};
function assertAllowed11(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed12(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed13(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed14(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_project.attributes.id
};
const colSpec2 = {
  fieldName: "workspaceId",
  attributeName: "workspace_id",
  attribute: spec_project.attributes.workspace_id
};
function assertAllowed15(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed16(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed17(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const resolve = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec = () => TYPES.boolean;
const resolveSqlValue = () => sql.null;
const resolve2 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec2(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive.includes(resolveDomains(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive.includes(resolveDomains(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive.includes(resolveDomains(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive.includes(resolveDomains(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve3 = (i, v) => sql`${i} <> ${v}`;
const resolve4 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve5 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve6 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec3(c) {
  if (forceTextTypesSensitive.includes(resolveDomains(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve7 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve8 = (i, v) => sql`${i} < ${v}`;
const resolve9 = (i, v) => sql`${i} <= ${v}`;
const resolve10 = (i, v) => sql`${i} > ${v}`;
const resolve11 = (i, v) => sql`${i} >= ${v}`;
function assertAllowed18(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec3 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_column.attributes.id
};
const colSpec4 = {
  fieldName: "projectId",
  attributeName: "project_id",
  attribute: spec_column.attributes.project_id
};
function assertAllowed19(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed20(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed21(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed22(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec5 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_task.attributes.id
};
const colSpec6 = {
  fieldName: "columnId",
  attributeName: "column_id",
  attribute: spec_task.attributes.column_id
};
function assertAllowed23(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed24(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed25(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed26(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec7 = {
  fieldName: "taskId",
  attributeName: "task_id",
  attribute: spec_taskUser.attributes.task_id
};
const colSpec8 = {
  fieldName: "userId",
  attributeName: "user_id",
  attribute: spec_taskUser.attributes.user_id
};
function assertAllowed27(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed28(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec9 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_user.attributes.id
};
const colSpec10 = {
  fieldName: "identityProviderId",
  attributeName: "identity_provider_id",
  attribute: spec_user.attributes.identity_provider_id
};
function assertAllowed29(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed30(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed31(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec11 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_assignee.attributes.id
};
const colSpec12 = {
  fieldName: "userId",
  attributeName: "user_id",
  attribute: spec_assignee.attributes.user_id
};
function assertAllowed32(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed33(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed34(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec13 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_post.attributes.id
};
const colSpec14 = {
  fieldName: "authorId",
  attributeName: "author_id",
  attribute: spec_post.attributes.author_id
};
function assertAllowed35(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed36(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed37(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec15 = {
  fieldName: "projectId",
  attributeName: "project_id",
  attribute: spec_projectUser.attributes.project_id
};
const colSpec16 = {
  fieldName: "userId",
  attributeName: "user_id",
  attribute: spec_projectUser.attributes.user_id
};
function assertAllowed38(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed39(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed40(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed41(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec17 = {
  fieldName: "workspaceId",
  attributeName: "workspace_id",
  attribute: spec_workspaceUser.attributes.workspace_id
};
const colSpec18 = {
  fieldName: "userId",
  attributeName: "user_id",
  attribute: spec_workspaceUser.attributes.user_id
};
function assertAllowed42(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed43(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec19 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_workspace.attributes.id
};
function assertAllowed44(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed45(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed46(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed47(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed48(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed49(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed50(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed51(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed52(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed53(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed54(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed55(value, mode) {
  if (mode === "object" && !false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !false) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const specFromArgs_ProjectUser = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.ProjectUser, $nodeId);
};
const specFromArgs_TaskUser = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.TaskUser, $nodeId);
};
const specFromArgs_WorkspaceUser = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.WorkspaceUser, $nodeId);
};
const specFromArgs_User = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.User, $nodeId);
};
const specFromArgs_Workspace = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Workspace, $nodeId);
};
const specFromArgs_Column = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Column, $nodeId);
};
const specFromArgs_Assignee = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Assignee, $nodeId);
};
const specFromArgs_Post = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Post, $nodeId);
};
const specFromArgs_Project = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Project, $nodeId);
};
const specFromArgs_Task = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Task, $nodeId);
};
const specFromArgs_ProjectUser2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.ProjectUser, $nodeId);
};
const specFromArgs_TaskUser2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.TaskUser, $nodeId);
};
const specFromArgs_WorkspaceUser2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.WorkspaceUser, $nodeId);
};
const specFromArgs_User2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.User, $nodeId);
};
const specFromArgs_Workspace2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Workspace, $nodeId);
};
const specFromArgs_Column2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Column, $nodeId);
};
const specFromArgs_Assignee2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Assignee, $nodeId);
};
const specFromArgs_Post2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Post, $nodeId);
};
const specFromArgs_Project2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Project, $nodeId);
};
const specFromArgs_Task2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Task, $nodeId);
};
export const typeDefs = /* GraphQL */`"""The root query type which gives access points into the data universe."""
type Query implements Node {
  """
  Exposes the root query type nested one level down. This is helpful for Relay 1
  which can only query top level fields if they are in a particular form.
  """
  query: Query!

  """
  The root query type must be a \`Node\` to work well with Relay 1 mutations. This just resolves to \`query\`.
  """
  id: ID!

  """Fetches an object given its globally unique \`ID\`."""
  node(
    """The globally unique \`ID\`."""
    id: ID!
  ): Node

  """Get a single \`ProjectUser\`."""
  projectUser(projectId: UUID!, userId: UUID!): ProjectUser

  """Get a single \`TaskUser\`."""
  taskUser(taskId: UUID!, userId: UUID!): TaskUser

  """Get a single \`WorkspaceUser\`."""
  workspaceUser(workspaceId: UUID!, userId: UUID!): WorkspaceUser

  """Get a single \`User\`."""
  user(rowId: UUID!): User

  """Get a single \`User\`."""
  userByIdentityProviderId(identityProviderId: UUID!): User

  """Get a single \`Workspace\`."""
  workspace(rowId: UUID!): Workspace

  """Get a single \`Column\`."""
  column(rowId: UUID!): Column

  """Get a single \`Assignee\`."""
  assignee(rowId: UUID!): Assignee

  """Get a single \`Post\`."""
  post(rowId: UUID!): Post

  """Get a single \`Project\`."""
  project(rowId: UUID!): Project

  """Get a single \`Task\`."""
  task(rowId: UUID!): Task

  """Reads a single \`ProjectUser\` using its globally unique \`ID\`."""
  projectUserById(
    """
    The globally unique \`ID\` to be used in selecting a single \`ProjectUser\`.
    """
    id: ID!
  ): ProjectUser

  """Reads a single \`TaskUser\` using its globally unique \`ID\`."""
  taskUserById(
    """The globally unique \`ID\` to be used in selecting a single \`TaskUser\`."""
    id: ID!
  ): TaskUser

  """Reads a single \`WorkspaceUser\` using its globally unique \`ID\`."""
  workspaceUserById(
    """
    The globally unique \`ID\` to be used in selecting a single \`WorkspaceUser\`.
    """
    id: ID!
  ): WorkspaceUser

  """Reads a single \`User\` using its globally unique \`ID\`."""
  userById(
    """The globally unique \`ID\` to be used in selecting a single \`User\`."""
    id: ID!
  ): User

  """Reads a single \`Workspace\` using its globally unique \`ID\`."""
  workspaceById(
    """The globally unique \`ID\` to be used in selecting a single \`Workspace\`."""
    id: ID!
  ): Workspace

  """Reads a single \`Column\` using its globally unique \`ID\`."""
  columnById(
    """The globally unique \`ID\` to be used in selecting a single \`Column\`."""
    id: ID!
  ): Column

  """Reads a single \`Assignee\` using its globally unique \`ID\`."""
  assigneeById(
    """The globally unique \`ID\` to be used in selecting a single \`Assignee\`."""
    id: ID!
  ): Assignee

  """Reads a single \`Post\` using its globally unique \`ID\`."""
  postById(
    """The globally unique \`ID\` to be used in selecting a single \`Post\`."""
    id: ID!
  ): Post

  """Reads a single \`Project\` using its globally unique \`ID\`."""
  projectById(
    """The globally unique \`ID\` to be used in selecting a single \`Project\`."""
    id: ID!
  ): Project

  """Reads a single \`Task\` using its globally unique \`ID\`."""
  taskById(
    """The globally unique \`ID\` to be used in selecting a single \`Task\`."""
    id: ID!
  ): Task

  """Reads and enables pagination through a set of \`ProjectUser\`."""
  projectUsers(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ProjectUserCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ProjectUserFilter

    """The method to use when ordering \`ProjectUser\`."""
    orderBy: [ProjectUserOrderBy!] = [PRIMARY_KEY_ASC]
  ): ProjectUserConnection

  """Reads and enables pagination through a set of \`TaskUser\`."""
  taskUsers(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: TaskUserCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: TaskUserFilter

    """The method to use when ordering \`TaskUser\`."""
    orderBy: [TaskUserOrderBy!] = [PRIMARY_KEY_ASC]
  ): TaskUserConnection

  """Reads and enables pagination through a set of \`WorkspaceUser\`."""
  workspaceUsers(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: WorkspaceUserCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: WorkspaceUserFilter

    """The method to use when ordering \`WorkspaceUser\`."""
    orderBy: [WorkspaceUserOrderBy!] = [PRIMARY_KEY_ASC]
  ): WorkspaceUserConnection

  """Reads and enables pagination through a set of \`User\`."""
  users(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: UserCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: UserFilter

    """The method to use when ordering \`User\`."""
    orderBy: [UserOrderBy!] = [PRIMARY_KEY_ASC]
  ): UserConnection

  """Reads and enables pagination through a set of \`Workspace\`."""
  workspaces(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: WorkspaceCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: WorkspaceFilter

    """The method to use when ordering \`Workspace\`."""
    orderBy: [WorkspaceOrderBy!] = [PRIMARY_KEY_ASC]
  ): WorkspaceConnection

  """Reads and enables pagination through a set of \`Column\`."""
  columns(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ColumnCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ColumnFilter

    """The method to use when ordering \`Column\`."""
    orderBy: [ColumnOrderBy!] = [PRIMARY_KEY_ASC]
  ): ColumnConnection

  """Reads and enables pagination through a set of \`Assignee\`."""
  assignees(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: AssigneeCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: AssigneeFilter

    """The method to use when ordering \`Assignee\`."""
    orderBy: [AssigneeOrderBy!] = [PRIMARY_KEY_ASC]
  ): AssigneeConnection

  """Reads and enables pagination through a set of \`Post\`."""
  posts(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: PostCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: PostFilter

    """The method to use when ordering \`Post\`."""
    orderBy: [PostOrderBy!] = [PRIMARY_KEY_ASC]
  ): PostConnection

  """Reads and enables pagination through a set of \`Project\`."""
  projects(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ProjectCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ProjectFilter

    """The method to use when ordering \`Project\`."""
    orderBy: [ProjectOrderBy!] = [PRIMARY_KEY_ASC]
  ): ProjectConnection

  """Reads and enables pagination through a set of \`Task\`."""
  tasks(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: TaskCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: TaskFilter

    """The method to use when ordering \`Task\`."""
    orderBy: [TaskOrderBy!] = [PRIMARY_KEY_ASC]
  ): TaskConnection
}

"""An object with a globally unique \`ID\`."""
interface Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
}

type ProjectUser implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  projectId: UUID!
  userId: UUID!
  createdAt: Datetime

  """Reads a single \`Project\` that is related to this \`ProjectUser\`."""
  project: Project

  """Reads a single \`User\` that is related to this \`ProjectUser\`."""
  user: User
}

"""
A universally unique identifier as defined by [RFC 4122](https://tools.ietf.org/html/rfc4122).
"""
scalar UUID

"""
A point in time as described by the [ISO
8601](https://en.wikipedia.org/wiki/ISO_8601) and, if it has a timezone, [RFC
3339](https://datatracker.ietf.org/doc/html/rfc3339) standards. Input values
that do not conform to both ISO 8601 and RFC 3339 may be coerced, which may lead
to unexpected results.
"""
scalar Datetime

type Project implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  name: String!
  description: String
  prefix: String
  color: String
  labels: JSON
  workspaceId: UUID!
  viewMode: String!
  createdAt: Datetime
  updatedAt: Datetime

  """Reads a single \`Workspace\` that is related to this \`Project\`."""
  workspace: Workspace

  """Reads and enables pagination through a set of \`Column\`."""
  columns(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ColumnCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ColumnFilter

    """The method to use when ordering \`Column\`."""
    orderBy: [ColumnOrderBy!] = [PRIMARY_KEY_ASC]
  ): ColumnConnection!

  """Reads and enables pagination through a set of \`ProjectUser\`."""
  projectUsers(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ProjectUserCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ProjectUserFilter

    """The method to use when ordering \`ProjectUser\`."""
    orderBy: [ProjectUserOrderBy!] = [PRIMARY_KEY_ASC]
  ): ProjectUserConnection!
}

"""
Represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
"""
scalar JSON

type Workspace implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  name: String!
  createdAt: Datetime
  updatedAt: Datetime

  """Reads and enables pagination through a set of \`Project\`."""
  projects(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ProjectCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ProjectFilter

    """The method to use when ordering \`Project\`."""
    orderBy: [ProjectOrderBy!] = [PRIMARY_KEY_ASC]
  ): ProjectConnection!

  """Reads and enables pagination through a set of \`WorkspaceUser\`."""
  workspaceUsers(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: WorkspaceUserCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: WorkspaceUserFilter

    """The method to use when ordering \`WorkspaceUser\`."""
    orderBy: [WorkspaceUserOrderBy!] = [PRIMARY_KEY_ASC]
  ): WorkspaceUserConnection!
}

"""A connection to a list of \`Project\` values."""
type ProjectConnection {
  """A list of \`Project\` objects."""
  nodes: [Project]!

  """
  A list of edges which contains the \`Project\` and cursor to aid in pagination.
  """
  edges: [ProjectEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`Project\` you could get from the connection."""
  totalCount: Int!
}

"""A \`Project\` edge in the connection."""
type ProjectEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Project\` at the end of the edge."""
  node: Project
}

"""A location in a connection that can be used for resuming pagination."""
scalar Cursor

"""Information about pagination in a connection."""
type PageInfo {
  """When paginating forwards, are there more items?"""
  hasNextPage: Boolean!

  """When paginating backwards, are there more items?"""
  hasPreviousPage: Boolean!

  """When paginating backwards, the cursor to continue."""
  startCursor: Cursor

  """When paginating forwards, the cursor to continue."""
  endCursor: Cursor
}

"""
A condition to be used against \`Project\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input ProjectCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`workspaceId\` field."""
  workspaceId: UUID
}

"""
A filter to be used against \`Project\` object types. All fields are combined with a logical ‘and.’
"""
input ProjectFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`workspaceId\` field."""
  workspaceId: UUIDFilter

  """Filter by the object’s \`columns\` relation."""
  columns: ProjectToManyColumnFilter

  """Some related \`columns\` exist."""
  columnsExist: Boolean

  """Filter by the object’s \`projectUsers\` relation."""
  projectUsers: ProjectToManyProjectUserFilter

  """Some related \`projectUsers\` exist."""
  projectUsersExist: Boolean

  """Filter by the object’s \`workspace\` relation."""
  workspace: WorkspaceFilter

  """Checks for all expressions in this list."""
  and: [ProjectFilter!]

  """Checks for any expressions in this list."""
  or: [ProjectFilter!]

  """Negates the expression."""
  not: ProjectFilter
}

"""
A filter to be used against UUID fields. All fields are combined with a logical ‘and.’
"""
input UUIDFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: UUID

  """Not equal to the specified value."""
  notEqualTo: UUID

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: UUID

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: UUID

  """Included in the specified list."""
  in: [UUID!]

  """Not included in the specified list."""
  notIn: [UUID!]

  """Less than the specified value."""
  lessThan: UUID

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: UUID

  """Greater than the specified value."""
  greaterThan: UUID

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: UUID
}

"""
A filter to be used against many \`Column\` object types. All fields are combined with a logical ‘and.’
"""
input ProjectToManyColumnFilter {
  """
  Every related \`Column\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: ColumnFilter

  """
  Some related \`Column\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: ColumnFilter

  """
  No related \`Column\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: ColumnFilter
}

"""
A filter to be used against \`Column\` object types. All fields are combined with a logical ‘and.’
"""
input ColumnFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`projectId\` field."""
  projectId: UUIDFilter

  """Filter by the object’s \`tasks\` relation."""
  tasks: ColumnToManyTaskFilter

  """Some related \`tasks\` exist."""
  tasksExist: Boolean

  """Filter by the object’s \`project\` relation."""
  project: ProjectFilter

  """Checks for all expressions in this list."""
  and: [ColumnFilter!]

  """Checks for any expressions in this list."""
  or: [ColumnFilter!]

  """Negates the expression."""
  not: ColumnFilter
}

"""
A filter to be used against many \`Task\` object types. All fields are combined with a logical ‘and.’
"""
input ColumnToManyTaskFilter {
  """
  Every related \`Task\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: TaskFilter

  """
  Some related \`Task\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: TaskFilter

  """
  No related \`Task\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: TaskFilter
}

"""
A filter to be used against \`Task\` object types. All fields are combined with a logical ‘and.’
"""
input TaskFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`columnId\` field."""
  columnId: UUIDFilter

  """Filter by the object’s \`taskUsers\` relation."""
  taskUsers: TaskToManyTaskUserFilter

  """Some related \`taskUsers\` exist."""
  taskUsersExist: Boolean

  """Filter by the object’s \`column\` relation."""
  column: ColumnFilter

  """Checks for all expressions in this list."""
  and: [TaskFilter!]

  """Checks for any expressions in this list."""
  or: [TaskFilter!]

  """Negates the expression."""
  not: TaskFilter
}

"""
A filter to be used against many \`TaskUser\` object types. All fields are combined with a logical ‘and.’
"""
input TaskToManyTaskUserFilter {
  """
  Every related \`TaskUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: TaskUserFilter

  """
  Some related \`TaskUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: TaskUserFilter

  """
  No related \`TaskUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: TaskUserFilter
}

"""
A filter to be used against \`TaskUser\` object types. All fields are combined with a logical ‘and.’
"""
input TaskUserFilter {
  """Filter by the object’s \`taskId\` field."""
  taskId: UUIDFilter

  """Filter by the object’s \`userId\` field."""
  userId: UUIDFilter

  """Filter by the object’s \`task\` relation."""
  task: TaskFilter

  """Filter by the object’s \`user\` relation."""
  user: UserFilter

  """Checks for all expressions in this list."""
  and: [TaskUserFilter!]

  """Checks for any expressions in this list."""
  or: [TaskUserFilter!]

  """Negates the expression."""
  not: TaskUserFilter
}

"""
A filter to be used against \`User\` object types. All fields are combined with a logical ‘and.’
"""
input UserFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`identityProviderId\` field."""
  identityProviderId: UUIDFilter

  """Filter by the object’s \`assignees\` relation."""
  assignees: UserToManyAssigneeFilter

  """Some related \`assignees\` exist."""
  assigneesExist: Boolean

  """Filter by the object’s \`authoredPosts\` relation."""
  authoredPosts: UserToManyPostFilter

  """Some related \`authoredPosts\` exist."""
  authoredPostsExist: Boolean

  """Filter by the object’s \`projectUsers\` relation."""
  projectUsers: UserToManyProjectUserFilter

  """Some related \`projectUsers\` exist."""
  projectUsersExist: Boolean

  """Filter by the object’s \`taskUsers\` relation."""
  taskUsers: UserToManyTaskUserFilter

  """Some related \`taskUsers\` exist."""
  taskUsersExist: Boolean

  """Filter by the object’s \`workspaceUsers\` relation."""
  workspaceUsers: UserToManyWorkspaceUserFilter

  """Some related \`workspaceUsers\` exist."""
  workspaceUsersExist: Boolean

  """Checks for all expressions in this list."""
  and: [UserFilter!]

  """Checks for any expressions in this list."""
  or: [UserFilter!]

  """Negates the expression."""
  not: UserFilter
}

"""
A filter to be used against many \`Assignee\` object types. All fields are combined with a logical ‘and.’
"""
input UserToManyAssigneeFilter {
  """
  Every related \`Assignee\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: AssigneeFilter

  """
  Some related \`Assignee\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: AssigneeFilter

  """
  No related \`Assignee\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: AssigneeFilter
}

"""
A filter to be used against \`Assignee\` object types. All fields are combined with a logical ‘and.’
"""
input AssigneeFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`userId\` field."""
  userId: UUIDFilter

  """Filter by the object’s \`user\` relation."""
  user: UserFilter

  """Checks for all expressions in this list."""
  and: [AssigneeFilter!]

  """Checks for any expressions in this list."""
  or: [AssigneeFilter!]

  """Negates the expression."""
  not: AssigneeFilter
}

"""
A filter to be used against many \`Post\` object types. All fields are combined with a logical ‘and.’
"""
input UserToManyPostFilter {
  """
  Every related \`Post\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: PostFilter

  """
  Some related \`Post\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: PostFilter

  """
  No related \`Post\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: PostFilter
}

"""
A filter to be used against \`Post\` object types. All fields are combined with a logical ‘and.’
"""
input PostFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`authorId\` field."""
  authorId: UUIDFilter

  """Filter by the object’s \`author\` relation."""
  author: UserFilter

  """Checks for all expressions in this list."""
  and: [PostFilter!]

  """Checks for any expressions in this list."""
  or: [PostFilter!]

  """Negates the expression."""
  not: PostFilter
}

"""
A filter to be used against many \`ProjectUser\` object types. All fields are combined with a logical ‘and.’
"""
input UserToManyProjectUserFilter {
  """
  Every related \`ProjectUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: ProjectUserFilter

  """
  Some related \`ProjectUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: ProjectUserFilter

  """
  No related \`ProjectUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: ProjectUserFilter
}

"""
A filter to be used against \`ProjectUser\` object types. All fields are combined with a logical ‘and.’
"""
input ProjectUserFilter {
  """Filter by the object’s \`projectId\` field."""
  projectId: UUIDFilter

  """Filter by the object’s \`userId\` field."""
  userId: UUIDFilter

  """Filter by the object’s \`project\` relation."""
  project: ProjectFilter

  """Filter by the object’s \`user\` relation."""
  user: UserFilter

  """Checks for all expressions in this list."""
  and: [ProjectUserFilter!]

  """Checks for any expressions in this list."""
  or: [ProjectUserFilter!]

  """Negates the expression."""
  not: ProjectUserFilter
}

"""
A filter to be used against many \`TaskUser\` object types. All fields are combined with a logical ‘and.’
"""
input UserToManyTaskUserFilter {
  """
  Every related \`TaskUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: TaskUserFilter

  """
  Some related \`TaskUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: TaskUserFilter

  """
  No related \`TaskUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: TaskUserFilter
}

"""
A filter to be used against many \`WorkspaceUser\` object types. All fields are combined with a logical ‘and.’
"""
input UserToManyWorkspaceUserFilter {
  """
  Every related \`WorkspaceUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: WorkspaceUserFilter

  """
  Some related \`WorkspaceUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: WorkspaceUserFilter

  """
  No related \`WorkspaceUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: WorkspaceUserFilter
}

"""
A filter to be used against \`WorkspaceUser\` object types. All fields are combined with a logical ‘and.’
"""
input WorkspaceUserFilter {
  """Filter by the object’s \`workspaceId\` field."""
  workspaceId: UUIDFilter

  """Filter by the object’s \`userId\` field."""
  userId: UUIDFilter

  """Filter by the object’s \`user\` relation."""
  user: UserFilter

  """Filter by the object’s \`workspace\` relation."""
  workspace: WorkspaceFilter

  """Checks for all expressions in this list."""
  and: [WorkspaceUserFilter!]

  """Checks for any expressions in this list."""
  or: [WorkspaceUserFilter!]

  """Negates the expression."""
  not: WorkspaceUserFilter
}

"""
A filter to be used against \`Workspace\` object types. All fields are combined with a logical ‘and.’
"""
input WorkspaceFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`projects\` relation."""
  projects: WorkspaceToManyProjectFilter

  """Some related \`projects\` exist."""
  projectsExist: Boolean

  """Filter by the object’s \`workspaceUsers\` relation."""
  workspaceUsers: WorkspaceToManyWorkspaceUserFilter

  """Some related \`workspaceUsers\` exist."""
  workspaceUsersExist: Boolean

  """Checks for all expressions in this list."""
  and: [WorkspaceFilter!]

  """Checks for any expressions in this list."""
  or: [WorkspaceFilter!]

  """Negates the expression."""
  not: WorkspaceFilter
}

"""
A filter to be used against many \`Project\` object types. All fields are combined with a logical ‘and.’
"""
input WorkspaceToManyProjectFilter {
  """
  Every related \`Project\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: ProjectFilter

  """
  Some related \`Project\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: ProjectFilter

  """
  No related \`Project\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: ProjectFilter
}

"""
A filter to be used against many \`WorkspaceUser\` object types. All fields are combined with a logical ‘and.’
"""
input WorkspaceToManyWorkspaceUserFilter {
  """
  Every related \`WorkspaceUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: WorkspaceUserFilter

  """
  Some related \`WorkspaceUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: WorkspaceUserFilter

  """
  No related \`WorkspaceUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: WorkspaceUserFilter
}

"""
A filter to be used against many \`ProjectUser\` object types. All fields are combined with a logical ‘and.’
"""
input ProjectToManyProjectUserFilter {
  """
  Every related \`ProjectUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  every: ProjectUserFilter

  """
  Some related \`ProjectUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  some: ProjectUserFilter

  """
  No related \`ProjectUser\` matches the filter criteria. All fields are combined with a logical ‘and.’
  """
  none: ProjectUserFilter
}

"""Methods to use when ordering \`Project\`."""
enum ProjectOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  WORKSPACE_ID_ASC
  WORKSPACE_ID_DESC
}

"""A connection to a list of \`WorkspaceUser\` values."""
type WorkspaceUserConnection {
  """A list of \`WorkspaceUser\` objects."""
  nodes: [WorkspaceUser]!

  """
  A list of edges which contains the \`WorkspaceUser\` and cursor to aid in pagination.
  """
  edges: [WorkspaceUserEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`WorkspaceUser\` you could get from the connection."""
  totalCount: Int!
}

type WorkspaceUser implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  workspaceId: UUID!
  userId: UUID!
  createdAt: Datetime

  """Reads a single \`User\` that is related to this \`WorkspaceUser\`."""
  user: User

  """Reads a single \`Workspace\` that is related to this \`WorkspaceUser\`."""
  workspace: Workspace
}

type User implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  identityProviderId: UUID!
  createdAt: Datetime
  updatedAt: Datetime

  """Reads and enables pagination through a set of \`Assignee\`."""
  assignees(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: AssigneeCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: AssigneeFilter

    """The method to use when ordering \`Assignee\`."""
    orderBy: [AssigneeOrderBy!] = [PRIMARY_KEY_ASC]
  ): AssigneeConnection!

  """Reads and enables pagination through a set of \`Post\`."""
  authoredPosts(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: PostCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: PostFilter

    """The method to use when ordering \`Post\`."""
    orderBy: [PostOrderBy!] = [PRIMARY_KEY_ASC]
  ): PostConnection!

  """Reads and enables pagination through a set of \`ProjectUser\`."""
  projectUsers(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: ProjectUserCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: ProjectUserFilter

    """The method to use when ordering \`ProjectUser\`."""
    orderBy: [ProjectUserOrderBy!] = [PRIMARY_KEY_ASC]
  ): ProjectUserConnection!

  """Reads and enables pagination through a set of \`TaskUser\`."""
  taskUsers(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: TaskUserCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: TaskUserFilter

    """The method to use when ordering \`TaskUser\`."""
    orderBy: [TaskUserOrderBy!] = [PRIMARY_KEY_ASC]
  ): TaskUserConnection!

  """Reads and enables pagination through a set of \`WorkspaceUser\`."""
  workspaceUsers(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: WorkspaceUserCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: WorkspaceUserFilter

    """The method to use when ordering \`WorkspaceUser\`."""
    orderBy: [WorkspaceUserOrderBy!] = [PRIMARY_KEY_ASC]
  ): WorkspaceUserConnection!
}

"""A connection to a list of \`Assignee\` values."""
type AssigneeConnection {
  """A list of \`Assignee\` objects."""
  nodes: [Assignee]!

  """
  A list of edges which contains the \`Assignee\` and cursor to aid in pagination.
  """
  edges: [AssigneeEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`Assignee\` you could get from the connection."""
  totalCount: Int!
}

type Assignee implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  userId: UUID!
  name: String!
  avatarUrl: String
  createdAt: Datetime
  updatedAt: Datetime

  """Reads a single \`User\` that is related to this \`Assignee\`."""
  user: User
}

"""A \`Assignee\` edge in the connection."""
type AssigneeEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Assignee\` at the end of the edge."""
  node: Assignee
}

"""
A condition to be used against \`Assignee\` object types. All fields are tested
for equality and combined with a logical ‘and.’
"""
input AssigneeCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`userId\` field."""
  userId: UUID
}

"""Methods to use when ordering \`Assignee\`."""
enum AssigneeOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  USER_ID_ASC
  USER_ID_DESC
}

"""A connection to a list of \`Post\` values."""
type PostConnection {
  """A list of \`Post\` objects."""
  nodes: [Post]!

  """
  A list of edges which contains the \`Post\` and cursor to aid in pagination.
  """
  edges: [PostEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`Post\` you could get from the connection."""
  totalCount: Int!
}

type Post implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  title: String
  description: String
  authorId: UUID!
  createdAt: Datetime
  updatedAt: Datetime

  """Reads a single \`User\` that is related to this \`Post\`."""
  author: User
}

"""A \`Post\` edge in the connection."""
type PostEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Post\` at the end of the edge."""
  node: Post
}

"""
A condition to be used against \`Post\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input PostCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`authorId\` field."""
  authorId: UUID
}

"""Methods to use when ordering \`Post\`."""
enum PostOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  AUTHOR_ID_ASC
  AUTHOR_ID_DESC
}

"""A connection to a list of \`ProjectUser\` values."""
type ProjectUserConnection {
  """A list of \`ProjectUser\` objects."""
  nodes: [ProjectUser]!

  """
  A list of edges which contains the \`ProjectUser\` and cursor to aid in pagination.
  """
  edges: [ProjectUserEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`ProjectUser\` you could get from the connection."""
  totalCount: Int!
}

"""A \`ProjectUser\` edge in the connection."""
type ProjectUserEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`ProjectUser\` at the end of the edge."""
  node: ProjectUser
}

"""
A condition to be used against \`ProjectUser\` object types. All fields are tested
for equality and combined with a logical ‘and.’
"""
input ProjectUserCondition {
  """Checks for equality with the object’s \`projectId\` field."""
  projectId: UUID

  """Checks for equality with the object’s \`userId\` field."""
  userId: UUID
}

"""Methods to use when ordering \`ProjectUser\`."""
enum ProjectUserOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  PROJECT_ID_ASC
  PROJECT_ID_DESC
  USER_ID_ASC
  USER_ID_DESC
}

"""A connection to a list of \`TaskUser\` values."""
type TaskUserConnection {
  """A list of \`TaskUser\` objects."""
  nodes: [TaskUser]!

  """
  A list of edges which contains the \`TaskUser\` and cursor to aid in pagination.
  """
  edges: [TaskUserEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`TaskUser\` you could get from the connection."""
  totalCount: Int!
}

type TaskUser implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  taskId: UUID!
  userId: UUID!
  createdAt: Datetime

  """Reads a single \`Task\` that is related to this \`TaskUser\`."""
  task: Task

  """Reads a single \`User\` that is related to this \`TaskUser\`."""
  user: User
}

type Task implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  content: String!
  description: String!
  priority: String!
  columnId: UUID!
  assignees: JSON
  labels: JSON
  dueDate: String
  createdAt: Datetime
  updatedAt: Datetime

  """Reads a single \`Column\` that is related to this \`Task\`."""
  column: Column

  """Reads and enables pagination through a set of \`TaskUser\`."""
  taskUsers(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: TaskUserCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: TaskUserFilter

    """The method to use when ordering \`TaskUser\`."""
    orderBy: [TaskUserOrderBy!] = [PRIMARY_KEY_ASC]
  ): TaskUserConnection!
}

type Column implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  title: String!
  projectId: UUID!
  createdAt: Datetime
  updatedAt: Datetime

  """Reads a single \`Project\` that is related to this \`Column\`."""
  project: Project

  """Reads and enables pagination through a set of \`Task\`."""
  tasks(
    """Only read the first \`n\` values of the set."""
    first: Int

    """Only read the last \`n\` values of the set."""
    last: Int

    """
    Skip the first \`n\` values from our \`after\` cursor, an alternative to cursor
    based pagination. May not be used with \`last\`.
    """
    offset: Int

    """Read all values in the set before (above) this cursor."""
    before: Cursor

    """Read all values in the set after (below) this cursor."""
    after: Cursor

    """
    A condition to be used in determining which values should be returned by the collection.
    """
    condition: TaskCondition

    """
    A filter to be used in determining which values should be returned by the collection.
    """
    filter: TaskFilter

    """The method to use when ordering \`Task\`."""
    orderBy: [TaskOrderBy!] = [PRIMARY_KEY_ASC]
  ): TaskConnection!
}

"""A connection to a list of \`Task\` values."""
type TaskConnection {
  """A list of \`Task\` objects."""
  nodes: [Task]!

  """
  A list of edges which contains the \`Task\` and cursor to aid in pagination.
  """
  edges: [TaskEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`Task\` you could get from the connection."""
  totalCount: Int!
}

"""A \`Task\` edge in the connection."""
type TaskEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Task\` at the end of the edge."""
  node: Task
}

"""
A condition to be used against \`Task\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input TaskCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`columnId\` field."""
  columnId: UUID
}

"""Methods to use when ordering \`Task\`."""
enum TaskOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  COLUMN_ID_ASC
  COLUMN_ID_DESC
}

"""
A condition to be used against \`TaskUser\` object types. All fields are tested
for equality and combined with a logical ‘and.’
"""
input TaskUserCondition {
  """Checks for equality with the object’s \`taskId\` field."""
  taskId: UUID

  """Checks for equality with the object’s \`userId\` field."""
  userId: UUID
}

"""Methods to use when ordering \`TaskUser\`."""
enum TaskUserOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  TASK_ID_ASC
  TASK_ID_DESC
  USER_ID_ASC
  USER_ID_DESC
}

"""A \`TaskUser\` edge in the connection."""
type TaskUserEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`TaskUser\` at the end of the edge."""
  node: TaskUser
}

"""
A condition to be used against \`WorkspaceUser\` object types. All fields are
tested for equality and combined with a logical ‘and.’
"""
input WorkspaceUserCondition {
  """Checks for equality with the object’s \`workspaceId\` field."""
  workspaceId: UUID

  """Checks for equality with the object’s \`userId\` field."""
  userId: UUID
}

"""Methods to use when ordering \`WorkspaceUser\`."""
enum WorkspaceUserOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  WORKSPACE_ID_ASC
  WORKSPACE_ID_DESC
  USER_ID_ASC
  USER_ID_DESC
}

"""A \`WorkspaceUser\` edge in the connection."""
type WorkspaceUserEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`WorkspaceUser\` at the end of the edge."""
  node: WorkspaceUser
}

"""A connection to a list of \`Column\` values."""
type ColumnConnection {
  """A list of \`Column\` objects."""
  nodes: [Column]!

  """
  A list of edges which contains the \`Column\` and cursor to aid in pagination.
  """
  edges: [ColumnEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`Column\` you could get from the connection."""
  totalCount: Int!
}

"""A \`Column\` edge in the connection."""
type ColumnEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Column\` at the end of the edge."""
  node: Column
}

"""
A condition to be used against \`Column\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input ColumnCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`projectId\` field."""
  projectId: UUID
}

"""Methods to use when ordering \`Column\`."""
enum ColumnOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  PROJECT_ID_ASC
  PROJECT_ID_DESC
}

"""A connection to a list of \`User\` values."""
type UserConnection {
  """A list of \`User\` objects."""
  nodes: [User]!

  """
  A list of edges which contains the \`User\` and cursor to aid in pagination.
  """
  edges: [UserEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`User\` you could get from the connection."""
  totalCount: Int!
}

"""A \`User\` edge in the connection."""
type UserEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`User\` at the end of the edge."""
  node: User
}

"""
A condition to be used against \`User\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input UserCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`identityProviderId\` field."""
  identityProviderId: UUID
}

"""Methods to use when ordering \`User\`."""
enum UserOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  IDENTITY_PROVIDER_ID_ASC
  IDENTITY_PROVIDER_ID_DESC
}

"""A connection to a list of \`Workspace\` values."""
type WorkspaceConnection {
  """A list of \`Workspace\` objects."""
  nodes: [Workspace]!

  """
  A list of edges which contains the \`Workspace\` and cursor to aid in pagination.
  """
  edges: [WorkspaceEdge]!

  """Information to aid in pagination."""
  pageInfo: PageInfo!

  """The count of *all* \`Workspace\` you could get from the connection."""
  totalCount: Int!
}

"""A \`Workspace\` edge in the connection."""
type WorkspaceEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Workspace\` at the end of the edge."""
  node: Workspace
}

"""
A condition to be used against \`Workspace\` object types. All fields are tested
for equality and combined with a logical ‘and.’
"""
input WorkspaceCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID
}

"""Methods to use when ordering \`Workspace\`."""
enum WorkspaceOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
}

"""
The root mutation type which contains root level fields which mutate data.
"""
type Mutation {
  """Creates a single \`ProjectUser\`."""
  createProjectUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateProjectUserInput!
  ): CreateProjectUserPayload

  """Creates a single \`TaskUser\`."""
  createTaskUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateTaskUserInput!
  ): CreateTaskUserPayload

  """Creates a single \`WorkspaceUser\`."""
  createWorkspaceUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateWorkspaceUserInput!
  ): CreateWorkspaceUserPayload

  """Creates a single \`User\`."""
  createUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateUserInput!
  ): CreateUserPayload

  """Creates a single \`Workspace\`."""
  createWorkspace(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateWorkspaceInput!
  ): CreateWorkspacePayload

  """Creates a single \`Column\`."""
  createColumn(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateColumnInput!
  ): CreateColumnPayload

  """Creates a single \`Assignee\`."""
  createAssignee(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateAssigneeInput!
  ): CreateAssigneePayload

  """Creates a single \`Post\`."""
  createPost(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreatePostInput!
  ): CreatePostPayload

  """Creates a single \`Project\`."""
  createProject(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateProjectInput!
  ): CreateProjectPayload

  """Creates a single \`Task\`."""
  createTask(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateTaskInput!
  ): CreateTaskPayload

  """
  Updates a single \`ProjectUser\` using its globally unique id and a patch.
  """
  updateProjectUserById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateProjectUserByIdInput!
  ): UpdateProjectUserPayload

  """Updates a single \`ProjectUser\` using a unique key and a patch."""
  updateProjectUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateProjectUserInput!
  ): UpdateProjectUserPayload

  """Updates a single \`TaskUser\` using its globally unique id and a patch."""
  updateTaskUserById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateTaskUserByIdInput!
  ): UpdateTaskUserPayload

  """Updates a single \`TaskUser\` using a unique key and a patch."""
  updateTaskUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateTaskUserInput!
  ): UpdateTaskUserPayload

  """
  Updates a single \`WorkspaceUser\` using its globally unique id and a patch.
  """
  updateWorkspaceUserById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateWorkspaceUserByIdInput!
  ): UpdateWorkspaceUserPayload

  """Updates a single \`WorkspaceUser\` using a unique key and a patch."""
  updateWorkspaceUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateWorkspaceUserInput!
  ): UpdateWorkspaceUserPayload

  """Updates a single \`User\` using its globally unique id and a patch."""
  updateUserById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateUserByIdInput!
  ): UpdateUserPayload

  """Updates a single \`User\` using a unique key and a patch."""
  updateUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateUserInput!
  ): UpdateUserPayload

  """Updates a single \`User\` using a unique key and a patch."""
  updateUserByIdentityProviderId(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateUserByIdentityProviderIdInput!
  ): UpdateUserPayload

  """Updates a single \`Workspace\` using its globally unique id and a patch."""
  updateWorkspaceById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateWorkspaceByIdInput!
  ): UpdateWorkspacePayload

  """Updates a single \`Workspace\` using a unique key and a patch."""
  updateWorkspace(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateWorkspaceInput!
  ): UpdateWorkspacePayload

  """Updates a single \`Column\` using its globally unique id and a patch."""
  updateColumnById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateColumnByIdInput!
  ): UpdateColumnPayload

  """Updates a single \`Column\` using a unique key and a patch."""
  updateColumn(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateColumnInput!
  ): UpdateColumnPayload

  """Updates a single \`Assignee\` using its globally unique id and a patch."""
  updateAssigneeById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateAssigneeByIdInput!
  ): UpdateAssigneePayload

  """Updates a single \`Assignee\` using a unique key and a patch."""
  updateAssignee(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateAssigneeInput!
  ): UpdateAssigneePayload

  """Updates a single \`Post\` using its globally unique id and a patch."""
  updatePostById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdatePostByIdInput!
  ): UpdatePostPayload

  """Updates a single \`Post\` using a unique key and a patch."""
  updatePost(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdatePostInput!
  ): UpdatePostPayload

  """Updates a single \`Project\` using its globally unique id and a patch."""
  updateProjectById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateProjectByIdInput!
  ): UpdateProjectPayload

  """Updates a single \`Project\` using a unique key and a patch."""
  updateProject(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateProjectInput!
  ): UpdateProjectPayload

  """Updates a single \`Task\` using its globally unique id and a patch."""
  updateTaskById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateTaskByIdInput!
  ): UpdateTaskPayload

  """Updates a single \`Task\` using a unique key and a patch."""
  updateTask(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: UpdateTaskInput!
  ): UpdateTaskPayload

  """Deletes a single \`ProjectUser\` using its globally unique id."""
  deleteProjectUserById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteProjectUserByIdInput!
  ): DeleteProjectUserPayload

  """Deletes a single \`ProjectUser\` using a unique key."""
  deleteProjectUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteProjectUserInput!
  ): DeleteProjectUserPayload

  """Deletes a single \`TaskUser\` using its globally unique id."""
  deleteTaskUserById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteTaskUserByIdInput!
  ): DeleteTaskUserPayload

  """Deletes a single \`TaskUser\` using a unique key."""
  deleteTaskUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteTaskUserInput!
  ): DeleteTaskUserPayload

  """Deletes a single \`WorkspaceUser\` using its globally unique id."""
  deleteWorkspaceUserById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteWorkspaceUserByIdInput!
  ): DeleteWorkspaceUserPayload

  """Deletes a single \`WorkspaceUser\` using a unique key."""
  deleteWorkspaceUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteWorkspaceUserInput!
  ): DeleteWorkspaceUserPayload

  """Deletes a single \`User\` using its globally unique id."""
  deleteUserById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteUserByIdInput!
  ): DeleteUserPayload

  """Deletes a single \`User\` using a unique key."""
  deleteUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteUserInput!
  ): DeleteUserPayload

  """Deletes a single \`User\` using a unique key."""
  deleteUserByIdentityProviderId(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteUserByIdentityProviderIdInput!
  ): DeleteUserPayload

  """Deletes a single \`Workspace\` using its globally unique id."""
  deleteWorkspaceById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteWorkspaceByIdInput!
  ): DeleteWorkspacePayload

  """Deletes a single \`Workspace\` using a unique key."""
  deleteWorkspace(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteWorkspaceInput!
  ): DeleteWorkspacePayload

  """Deletes a single \`Column\` using its globally unique id."""
  deleteColumnById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteColumnByIdInput!
  ): DeleteColumnPayload

  """Deletes a single \`Column\` using a unique key."""
  deleteColumn(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteColumnInput!
  ): DeleteColumnPayload

  """Deletes a single \`Assignee\` using its globally unique id."""
  deleteAssigneeById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteAssigneeByIdInput!
  ): DeleteAssigneePayload

  """Deletes a single \`Assignee\` using a unique key."""
  deleteAssignee(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteAssigneeInput!
  ): DeleteAssigneePayload

  """Deletes a single \`Post\` using its globally unique id."""
  deletePostById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeletePostByIdInput!
  ): DeletePostPayload

  """Deletes a single \`Post\` using a unique key."""
  deletePost(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeletePostInput!
  ): DeletePostPayload

  """Deletes a single \`Project\` using its globally unique id."""
  deleteProjectById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteProjectByIdInput!
  ): DeleteProjectPayload

  """Deletes a single \`Project\` using a unique key."""
  deleteProject(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteProjectInput!
  ): DeleteProjectPayload

  """Deletes a single \`Task\` using its globally unique id."""
  deleteTaskById(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteTaskByIdInput!
  ): DeleteTaskPayload

  """Deletes a single \`Task\` using a unique key."""
  deleteTask(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: DeleteTaskInput!
  ): DeleteTaskPayload
}

"""The output of our create \`ProjectUser\` mutation."""
type CreateProjectUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`ProjectUser\` that was created by this mutation."""
  projectUser: ProjectUser

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`ProjectUser\`. May be used by Relay 1."""
  projectUserEdge(
    """The method to use when ordering \`ProjectUser\`."""
    orderBy: [ProjectUserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ProjectUserEdge
}

"""All input for the create \`ProjectUser\` mutation."""
input CreateProjectUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`ProjectUser\` to be created by this mutation."""
  projectUser: ProjectUserInput!
}

"""An input for mutations affecting \`ProjectUser\`"""
input ProjectUserInput {
  projectId: UUID!
  userId: UUID!
  createdAt: Datetime
}

"""The output of our create \`TaskUser\` mutation."""
type CreateTaskUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`TaskUser\` that was created by this mutation."""
  taskUser: TaskUser

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`TaskUser\`. May be used by Relay 1."""
  taskUserEdge(
    """The method to use when ordering \`TaskUser\`."""
    orderBy: [TaskUserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): TaskUserEdge
}

"""All input for the create \`TaskUser\` mutation."""
input CreateTaskUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`TaskUser\` to be created by this mutation."""
  taskUser: TaskUserInput!
}

"""An input for mutations affecting \`TaskUser\`"""
input TaskUserInput {
  taskId: UUID!
  userId: UUID!
  createdAt: Datetime
}

"""The output of our create \`WorkspaceUser\` mutation."""
type CreateWorkspaceUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`WorkspaceUser\` that was created by this mutation."""
  workspaceUser: WorkspaceUser

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`WorkspaceUser\`. May be used by Relay 1."""
  workspaceUserEdge(
    """The method to use when ordering \`WorkspaceUser\`."""
    orderBy: [WorkspaceUserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): WorkspaceUserEdge
}

"""All input for the create \`WorkspaceUser\` mutation."""
input CreateWorkspaceUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`WorkspaceUser\` to be created by this mutation."""
  workspaceUser: WorkspaceUserInput!
}

"""An input for mutations affecting \`WorkspaceUser\`"""
input WorkspaceUserInput {
  workspaceId: UUID!
  userId: UUID!
  createdAt: Datetime
}

"""The output of our create \`User\` mutation."""
type CreateUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`User\` that was created by this mutation."""
  user: User

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`User\`. May be used by Relay 1."""
  userEdge(
    """The method to use when ordering \`User\`."""
    orderBy: [UserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): UserEdge
}

"""All input for the create \`User\` mutation."""
input CreateUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`User\` to be created by this mutation."""
  user: UserInput!
}

"""An input for mutations affecting \`User\`"""
input UserInput {
  rowId: UUID
  identityProviderId: UUID!
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our create \`Workspace\` mutation."""
type CreateWorkspacePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Workspace\` that was created by this mutation."""
  workspace: Workspace

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Workspace\`. May be used by Relay 1."""
  workspaceEdge(
    """The method to use when ordering \`Workspace\`."""
    orderBy: [WorkspaceOrderBy!]! = [PRIMARY_KEY_ASC]
  ): WorkspaceEdge
}

"""All input for the create \`Workspace\` mutation."""
input CreateWorkspaceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`Workspace\` to be created by this mutation."""
  workspace: WorkspaceInput!
}

"""An input for mutations affecting \`Workspace\`"""
input WorkspaceInput {
  rowId: UUID
  name: String!
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our create \`Column\` mutation."""
type CreateColumnPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Column\` that was created by this mutation."""
  column: Column

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Column\`. May be used by Relay 1."""
  columnEdge(
    """The method to use when ordering \`Column\`."""
    orderBy: [ColumnOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ColumnEdge
}

"""All input for the create \`Column\` mutation."""
input CreateColumnInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`Column\` to be created by this mutation."""
  column: ColumnInput!
}

"""An input for mutations affecting \`Column\`"""
input ColumnInput {
  rowId: UUID
  title: String!
  projectId: UUID!
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our create \`Assignee\` mutation."""
type CreateAssigneePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Assignee\` that was created by this mutation."""
  assignee: Assignee

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Assignee\`. May be used by Relay 1."""
  assigneeEdge(
    """The method to use when ordering \`Assignee\`."""
    orderBy: [AssigneeOrderBy!]! = [PRIMARY_KEY_ASC]
  ): AssigneeEdge
}

"""All input for the create \`Assignee\` mutation."""
input CreateAssigneeInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`Assignee\` to be created by this mutation."""
  assignee: AssigneeInput!
}

"""An input for mutations affecting \`Assignee\`"""
input AssigneeInput {
  rowId: UUID
  userId: UUID!
  name: String!
  avatarUrl: String
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our create \`Post\` mutation."""
type CreatePostPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Post\` that was created by this mutation."""
  post: Post

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Post\`. May be used by Relay 1."""
  postEdge(
    """The method to use when ordering \`Post\`."""
    orderBy: [PostOrderBy!]! = [PRIMARY_KEY_ASC]
  ): PostEdge
}

"""All input for the create \`Post\` mutation."""
input CreatePostInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`Post\` to be created by this mutation."""
  post: PostInput!
}

"""An input for mutations affecting \`Post\`"""
input PostInput {
  rowId: UUID
  title: String
  description: String
  authorId: UUID!
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our create \`Project\` mutation."""
type CreateProjectPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Project\` that was created by this mutation."""
  project: Project

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Project\`. May be used by Relay 1."""
  projectEdge(
    """The method to use when ordering \`Project\`."""
    orderBy: [ProjectOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ProjectEdge
}

"""All input for the create \`Project\` mutation."""
input CreateProjectInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`Project\` to be created by this mutation."""
  project: ProjectInput!
}

"""An input for mutations affecting \`Project\`"""
input ProjectInput {
  rowId: UUID
  name: String!
  description: String
  prefix: String
  color: String
  labels: JSON
  workspaceId: UUID!
  viewMode: String
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our create \`Task\` mutation."""
type CreateTaskPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Task\` that was created by this mutation."""
  task: Task

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Task\`. May be used by Relay 1."""
  taskEdge(
    """The method to use when ordering \`Task\`."""
    orderBy: [TaskOrderBy!]! = [PRIMARY_KEY_ASC]
  ): TaskEdge
}

"""All input for the create \`Task\` mutation."""
input CreateTaskInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """The \`Task\` to be created by this mutation."""
  task: TaskInput!
}

"""An input for mutations affecting \`Task\`"""
input TaskInput {
  rowId: UUID
  content: String!
  description: String!
  priority: String
  columnId: UUID!
  assignees: JSON
  labels: JSON
  dueDate: String
  createdAt: Datetime
  updatedAt: Datetime
}

"""The output of our update \`ProjectUser\` mutation."""
type UpdateProjectUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`ProjectUser\` that was updated by this mutation."""
  projectUser: ProjectUser

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`ProjectUser\`. May be used by Relay 1."""
  projectUserEdge(
    """The method to use when ordering \`ProjectUser\`."""
    orderBy: [ProjectUserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ProjectUserEdge
}

"""All input for the \`updateProjectUserById\` mutation."""
input UpdateProjectUserByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`ProjectUser\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`ProjectUser\` being updated.
  """
  patch: ProjectUserPatch!
}

"""
Represents an update to a \`ProjectUser\`. Fields that are set will be updated.
"""
input ProjectUserPatch {
  projectId: UUID
  userId: UUID
  createdAt: Datetime
}

"""All input for the \`updateProjectUser\` mutation."""
input UpdateProjectUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  projectId: UUID!
  userId: UUID!

  """
  An object where the defined keys will be set on the \`ProjectUser\` being updated.
  """
  patch: ProjectUserPatch!
}

"""The output of our update \`TaskUser\` mutation."""
type UpdateTaskUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`TaskUser\` that was updated by this mutation."""
  taskUser: TaskUser

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`TaskUser\`. May be used by Relay 1."""
  taskUserEdge(
    """The method to use when ordering \`TaskUser\`."""
    orderBy: [TaskUserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): TaskUserEdge
}

"""All input for the \`updateTaskUserById\` mutation."""
input UpdateTaskUserByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`TaskUser\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`TaskUser\` being updated.
  """
  patch: TaskUserPatch!
}

"""
Represents an update to a \`TaskUser\`. Fields that are set will be updated.
"""
input TaskUserPatch {
  taskId: UUID
  userId: UUID
  createdAt: Datetime
}

"""All input for the \`updateTaskUser\` mutation."""
input UpdateTaskUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  taskId: UUID!
  userId: UUID!

  """
  An object where the defined keys will be set on the \`TaskUser\` being updated.
  """
  patch: TaskUserPatch!
}

"""The output of our update \`WorkspaceUser\` mutation."""
type UpdateWorkspaceUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`WorkspaceUser\` that was updated by this mutation."""
  workspaceUser: WorkspaceUser

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`WorkspaceUser\`. May be used by Relay 1."""
  workspaceUserEdge(
    """The method to use when ordering \`WorkspaceUser\`."""
    orderBy: [WorkspaceUserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): WorkspaceUserEdge
}

"""All input for the \`updateWorkspaceUserById\` mutation."""
input UpdateWorkspaceUserByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`WorkspaceUser\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`WorkspaceUser\` being updated.
  """
  patch: WorkspaceUserPatch!
}

"""
Represents an update to a \`WorkspaceUser\`. Fields that are set will be updated.
"""
input WorkspaceUserPatch {
  workspaceId: UUID
  userId: UUID
  createdAt: Datetime
}

"""All input for the \`updateWorkspaceUser\` mutation."""
input UpdateWorkspaceUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  workspaceId: UUID!
  userId: UUID!

  """
  An object where the defined keys will be set on the \`WorkspaceUser\` being updated.
  """
  patch: WorkspaceUserPatch!
}

"""The output of our update \`User\` mutation."""
type UpdateUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`User\` that was updated by this mutation."""
  user: User

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`User\`. May be used by Relay 1."""
  userEdge(
    """The method to use when ordering \`User\`."""
    orderBy: [UserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): UserEdge
}

"""All input for the \`updateUserById\` mutation."""
input UpdateUserByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`User\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`User\` being updated.
  """
  patch: UserPatch!
}

"""Represents an update to a \`User\`. Fields that are set will be updated."""
input UserPatch {
  rowId: UUID
  identityProviderId: UUID
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateUser\` mutation."""
input UpdateUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`User\` being updated.
  """
  patch: UserPatch!
}

"""All input for the \`updateUserByIdentityProviderId\` mutation."""
input UpdateUserByIdentityProviderIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  identityProviderId: UUID!

  """
  An object where the defined keys will be set on the \`User\` being updated.
  """
  patch: UserPatch!
}

"""The output of our update \`Workspace\` mutation."""
type UpdateWorkspacePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Workspace\` that was updated by this mutation."""
  workspace: Workspace

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Workspace\`. May be used by Relay 1."""
  workspaceEdge(
    """The method to use when ordering \`Workspace\`."""
    orderBy: [WorkspaceOrderBy!]! = [PRIMARY_KEY_ASC]
  ): WorkspaceEdge
}

"""All input for the \`updateWorkspaceById\` mutation."""
input UpdateWorkspaceByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Workspace\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`Workspace\` being updated.
  """
  patch: WorkspacePatch!
}

"""
Represents an update to a \`Workspace\`. Fields that are set will be updated.
"""
input WorkspacePatch {
  rowId: UUID
  name: String
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateWorkspace\` mutation."""
input UpdateWorkspaceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`Workspace\` being updated.
  """
  patch: WorkspacePatch!
}

"""The output of our update \`Column\` mutation."""
type UpdateColumnPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Column\` that was updated by this mutation."""
  column: Column

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Column\`. May be used by Relay 1."""
  columnEdge(
    """The method to use when ordering \`Column\`."""
    orderBy: [ColumnOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ColumnEdge
}

"""All input for the \`updateColumnById\` mutation."""
input UpdateColumnByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Column\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`Column\` being updated.
  """
  patch: ColumnPatch!
}

"""
Represents an update to a \`Column\`. Fields that are set will be updated.
"""
input ColumnPatch {
  rowId: UUID
  title: String
  projectId: UUID
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateColumn\` mutation."""
input UpdateColumnInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`Column\` being updated.
  """
  patch: ColumnPatch!
}

"""The output of our update \`Assignee\` mutation."""
type UpdateAssigneePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Assignee\` that was updated by this mutation."""
  assignee: Assignee

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Assignee\`. May be used by Relay 1."""
  assigneeEdge(
    """The method to use when ordering \`Assignee\`."""
    orderBy: [AssigneeOrderBy!]! = [PRIMARY_KEY_ASC]
  ): AssigneeEdge
}

"""All input for the \`updateAssigneeById\` mutation."""
input UpdateAssigneeByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Assignee\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`Assignee\` being updated.
  """
  patch: AssigneePatch!
}

"""
Represents an update to a \`Assignee\`. Fields that are set will be updated.
"""
input AssigneePatch {
  rowId: UUID
  userId: UUID
  name: String
  avatarUrl: String
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateAssignee\` mutation."""
input UpdateAssigneeInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`Assignee\` being updated.
  """
  patch: AssigneePatch!
}

"""The output of our update \`Post\` mutation."""
type UpdatePostPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Post\` that was updated by this mutation."""
  post: Post

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Post\`. May be used by Relay 1."""
  postEdge(
    """The method to use when ordering \`Post\`."""
    orderBy: [PostOrderBy!]! = [PRIMARY_KEY_ASC]
  ): PostEdge
}

"""All input for the \`updatePostById\` mutation."""
input UpdatePostByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Post\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`Post\` being updated.
  """
  patch: PostPatch!
}

"""Represents an update to a \`Post\`. Fields that are set will be updated."""
input PostPatch {
  rowId: UUID
  title: String
  description: String
  authorId: UUID
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updatePost\` mutation."""
input UpdatePostInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`Post\` being updated.
  """
  patch: PostPatch!
}

"""The output of our update \`Project\` mutation."""
type UpdateProjectPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Project\` that was updated by this mutation."""
  project: Project

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Project\`. May be used by Relay 1."""
  projectEdge(
    """The method to use when ordering \`Project\`."""
    orderBy: [ProjectOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ProjectEdge
}

"""All input for the \`updateProjectById\` mutation."""
input UpdateProjectByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Project\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`Project\` being updated.
  """
  patch: ProjectPatch!
}

"""
Represents an update to a \`Project\`. Fields that are set will be updated.
"""
input ProjectPatch {
  rowId: UUID
  name: String
  description: String
  prefix: String
  color: String
  labels: JSON
  workspaceId: UUID
  viewMode: String
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateProject\` mutation."""
input UpdateProjectInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`Project\` being updated.
  """
  patch: ProjectPatch!
}

"""The output of our update \`Task\` mutation."""
type UpdateTaskPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Task\` that was updated by this mutation."""
  task: Task

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Task\`. May be used by Relay 1."""
  taskEdge(
    """The method to use when ordering \`Task\`."""
    orderBy: [TaskOrderBy!]! = [PRIMARY_KEY_ASC]
  ): TaskEdge
}

"""All input for the \`updateTaskById\` mutation."""
input UpdateTaskByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Task\` to be updated.
  """
  id: ID!

  """
  An object where the defined keys will be set on the \`Task\` being updated.
  """
  patch: TaskPatch!
}

"""Represents an update to a \`Task\`. Fields that are set will be updated."""
input TaskPatch {
  rowId: UUID
  content: String
  description: String
  priority: String
  columnId: UUID
  assignees: JSON
  labels: JSON
  dueDate: String
  createdAt: Datetime
  updatedAt: Datetime
}

"""All input for the \`updateTask\` mutation."""
input UpdateTaskInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!

  """
  An object where the defined keys will be set on the \`Task\` being updated.
  """
  patch: TaskPatch!
}

"""The output of our delete \`ProjectUser\` mutation."""
type DeleteProjectUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`ProjectUser\` that was deleted by this mutation."""
  projectUser: ProjectUser
  deletedProjectUserId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`ProjectUser\`. May be used by Relay 1."""
  projectUserEdge(
    """The method to use when ordering \`ProjectUser\`."""
    orderBy: [ProjectUserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ProjectUserEdge
}

"""All input for the \`deleteProjectUserById\` mutation."""
input DeleteProjectUserByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`ProjectUser\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteProjectUser\` mutation."""
input DeleteProjectUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  projectId: UUID!
  userId: UUID!
}

"""The output of our delete \`TaskUser\` mutation."""
type DeleteTaskUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`TaskUser\` that was deleted by this mutation."""
  taskUser: TaskUser
  deletedTaskUserId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`TaskUser\`. May be used by Relay 1."""
  taskUserEdge(
    """The method to use when ordering \`TaskUser\`."""
    orderBy: [TaskUserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): TaskUserEdge
}

"""All input for the \`deleteTaskUserById\` mutation."""
input DeleteTaskUserByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`TaskUser\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteTaskUser\` mutation."""
input DeleteTaskUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  taskId: UUID!
  userId: UUID!
}

"""The output of our delete \`WorkspaceUser\` mutation."""
type DeleteWorkspaceUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`WorkspaceUser\` that was deleted by this mutation."""
  workspaceUser: WorkspaceUser
  deletedWorkspaceUserId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`WorkspaceUser\`. May be used by Relay 1."""
  workspaceUserEdge(
    """The method to use when ordering \`WorkspaceUser\`."""
    orderBy: [WorkspaceUserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): WorkspaceUserEdge
}

"""All input for the \`deleteWorkspaceUserById\` mutation."""
input DeleteWorkspaceUserByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`WorkspaceUser\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteWorkspaceUser\` mutation."""
input DeleteWorkspaceUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  workspaceId: UUID!
  userId: UUID!
}

"""The output of our delete \`User\` mutation."""
type DeleteUserPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`User\` that was deleted by this mutation."""
  user: User
  deletedUserId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`User\`. May be used by Relay 1."""
  userEdge(
    """The method to use when ordering \`User\`."""
    orderBy: [UserOrderBy!]! = [PRIMARY_KEY_ASC]
  ): UserEdge
}

"""All input for the \`deleteUserById\` mutation."""
input DeleteUserByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`User\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteUser\` mutation."""
input DeleteUserInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""All input for the \`deleteUserByIdentityProviderId\` mutation."""
input DeleteUserByIdentityProviderIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  identityProviderId: UUID!
}

"""The output of our delete \`Workspace\` mutation."""
type DeleteWorkspacePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Workspace\` that was deleted by this mutation."""
  workspace: Workspace
  deletedWorkspaceId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Workspace\`. May be used by Relay 1."""
  workspaceEdge(
    """The method to use when ordering \`Workspace\`."""
    orderBy: [WorkspaceOrderBy!]! = [PRIMARY_KEY_ASC]
  ): WorkspaceEdge
}

"""All input for the \`deleteWorkspaceById\` mutation."""
input DeleteWorkspaceByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Workspace\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteWorkspace\` mutation."""
input DeleteWorkspaceInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`Column\` mutation."""
type DeleteColumnPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Column\` that was deleted by this mutation."""
  column: Column
  deletedColumnId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Column\`. May be used by Relay 1."""
  columnEdge(
    """The method to use when ordering \`Column\`."""
    orderBy: [ColumnOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ColumnEdge
}

"""All input for the \`deleteColumnById\` mutation."""
input DeleteColumnByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Column\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteColumn\` mutation."""
input DeleteColumnInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`Assignee\` mutation."""
type DeleteAssigneePayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Assignee\` that was deleted by this mutation."""
  assignee: Assignee
  deletedAssigneeId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Assignee\`. May be used by Relay 1."""
  assigneeEdge(
    """The method to use when ordering \`Assignee\`."""
    orderBy: [AssigneeOrderBy!]! = [PRIMARY_KEY_ASC]
  ): AssigneeEdge
}

"""All input for the \`deleteAssigneeById\` mutation."""
input DeleteAssigneeByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Assignee\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteAssignee\` mutation."""
input DeleteAssigneeInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`Post\` mutation."""
type DeletePostPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Post\` that was deleted by this mutation."""
  post: Post
  deletedPostId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Post\`. May be used by Relay 1."""
  postEdge(
    """The method to use when ordering \`Post\`."""
    orderBy: [PostOrderBy!]! = [PRIMARY_KEY_ASC]
  ): PostEdge
}

"""All input for the \`deletePostById\` mutation."""
input DeletePostByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Post\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deletePost\` mutation."""
input DeletePostInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`Project\` mutation."""
type DeleteProjectPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Project\` that was deleted by this mutation."""
  project: Project
  deletedProjectId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Project\`. May be used by Relay 1."""
  projectEdge(
    """The method to use when ordering \`Project\`."""
    orderBy: [ProjectOrderBy!]! = [PRIMARY_KEY_ASC]
  ): ProjectEdge
}

"""All input for the \`deleteProjectById\` mutation."""
input DeleteProjectByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Project\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteProject\` mutation."""
input DeleteProjectInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}

"""The output of our delete \`Task\` mutation."""
type DeleteTaskPayload {
  """
  The exact same \`clientMutationId\` that was provided in the mutation input,
  unchanged and unused. May be used by a client to track mutations.
  """
  clientMutationId: String

  """The \`Task\` that was deleted by this mutation."""
  task: Task
  deletedTaskId: ID

  """
  Our root query field type. Allows us to run any query from our mutation payload.
  """
  query: Query

  """An edge for our \`Task\`. May be used by Relay 1."""
  taskEdge(
    """The method to use when ordering \`Task\`."""
    orderBy: [TaskOrderBy!]! = [PRIMARY_KEY_ASC]
  ): TaskEdge
}

"""All input for the \`deleteTaskById\` mutation."""
input DeleteTaskByIdInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String

  """
  The globally unique \`ID\` which will identify a single \`Task\` to be deleted.
  """
  id: ID!
}

"""All input for the \`deleteTask\` mutation."""
input DeleteTaskInput {
  """
  An arbitrary string value with no semantic meaning. Will be included in the
  payload verbatim. May be used to track mutations by the client.
  """
  clientMutationId: String
  rowId: UUID!
}`;
export const plans = {
  Query: {
    __assertStep() {
      return !0;
    },
    query() {
      return rootValue();
    },
    id($parent) {
      const specifier = handler.plan($parent);
      return lambda(specifier, nodeIdCodecs[handler.codec.name].encode);
    },
    node(_$root, args) {
      return node(nodeIdHandlerByTypeName, args.getRaw("id"));
    },
    projectUser(_$root, {
      $projectId,
      $userId
    }) {
      return pgResource_project_userPgResource.get({
        project_id: $projectId,
        user_id: $userId
      });
    },
    taskUser(_$root, {
      $taskId,
      $userId
    }) {
      return pgResource_task_userPgResource.get({
        task_id: $taskId,
        user_id: $userId
      });
    },
    workspaceUser(_$root, {
      $workspaceId,
      $userId
    }) {
      return pgResource_workspace_userPgResource.get({
        workspace_id: $workspaceId,
        user_id: $userId
      });
    },
    user(_$root, {
      $rowId
    }) {
      return pgResource_userPgResource.get({
        id: $rowId
      });
    },
    userByIdentityProviderId(_$root, {
      $identityProviderId
    }) {
      return pgResource_userPgResource.get({
        identity_provider_id: $identityProviderId
      });
    },
    workspace(_$root, {
      $rowId
    }) {
      return pgResource_workspacePgResource.get({
        id: $rowId
      });
    },
    column(_$root, {
      $rowId
    }) {
      return pgResource_columnPgResource.get({
        id: $rowId
      });
    },
    assignee(_$root, {
      $rowId
    }) {
      return pgResource_assigneePgResource.get({
        id: $rowId
      });
    },
    post(_$root, {
      $rowId
    }) {
      return pgResource_postPgResource.get({
        id: $rowId
      });
    },
    project(_$root, {
      $rowId
    }) {
      return pgResource_projectPgResource.get({
        id: $rowId
      });
    },
    task(_$root, {
      $rowId
    }) {
      return pgResource_taskPgResource.get({
        id: $rowId
      });
    },
    projectUserById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_ProjectUser($nodeId);
    },
    taskUserById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_TaskUser($nodeId);
    },
    workspaceUserById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_WorkspaceUser($nodeId);
    },
    userById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_User($nodeId);
    },
    workspaceById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_Workspace($nodeId);
    },
    columnById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_Column($nodeId);
    },
    assigneeById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_Assignee($nodeId);
    },
    postById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_Post($nodeId);
    },
    projectById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_Project($nodeId);
    },
    taskById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_Task($nodeId);
    },
    projectUsers: {
      plan() {
        return connection(pgResource_project_userPgResource.find());
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    taskUsers: {
      plan() {
        return connection(pgResource_task_userPgResource.find());
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed2(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    workspaceUsers: {
      plan() {
        return connection(pgResource_workspace_userPgResource.find());
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed3(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    users: {
      plan() {
        return connection(pgResource_userPgResource.find());
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed4(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    workspaces: {
      plan() {
        return connection(pgResource_workspacePgResource.find());
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed5(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    columns: {
      plan() {
        return connection(pgResource_columnPgResource.find());
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed6(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    assignees: {
      plan() {
        return connection(pgResource_assigneePgResource.find());
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed7(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    posts: {
      plan() {
        return connection(pgResource_postPgResource.find());
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed8(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    projects: {
      plan() {
        return connection(pgResource_projectPgResource.find());
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed9(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    tasks: {
      plan() {
        return connection(pgResource_taskPgResource.find());
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed10(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    }
  },
  ProjectUser: {
    __assertStep: assertPgClassSingleStep,
    id($parent) {
      const specifier = nodeIdHandlerByTypeName.ProjectUser.plan($parent);
      return lambda(specifier, nodeIdCodecs[nodeIdHandlerByTypeName.ProjectUser.codec.name].encode);
    },
    projectId($record) {
      return $record.get("project_id");
    },
    userId($record) {
      return $record.get("user_id");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    project($record) {
      return pgResource_projectPgResource.get({
        id: $record.get("project_id")
      });
    },
    user($record) {
      return pgResource_userPgResource.get({
        id: $record.get("user_id")
      });
    }
  },
  UUID: {
    serialize: UUIDSerialize,
    parseValue(value) {
      return coerce("" + value);
    },
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) throw new GraphQLError(`${"UUID" ?? "This scalar"} can only parse string values (kind = '${ast.kind}')`);
      return coerce(ast.value);
    }
  },
  Datetime: {
    serialize: UUIDSerialize,
    parseValue: UUIDSerialize,
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) throw new GraphQLError(`${"Datetime" ?? "This scalar"} can only parse string values (kind='${ast.kind}')`);
      return ast.value;
    }
  },
  Project: {
    __assertStep: assertPgClassSingleStep,
    id($parent) {
      const specifier = nodeIdHandlerByTypeName.Project.plan($parent);
      return lambda(specifier, nodeIdCodecs[nodeIdHandlerByTypeName.Project.codec.name].encode);
    },
    rowId($record) {
      return $record.get("id");
    },
    workspaceId($record) {
      return $record.get("workspace_id");
    },
    viewMode($record) {
      return $record.get("view_mode");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    updatedAt($record) {
      return $record.get("updated_at");
    },
    workspace($record) {
      return pgResource_workspacePgResource.get({
        id: $record.get("workspace_id")
      });
    },
    columns: {
      plan($record) {
        const $records = pgResource_columnPgResource.find({
          project_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed11(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    projectUsers: {
      plan($record) {
        const $records = pgResource_project_userPgResource.find({
          project_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed12(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    }
  },
  JSON: {
    serialize(value) {
      return value;
    },
    parseValue(value) {
      return value;
    },
    parseLiteral: (() => {
      const parseLiteralToObject = (ast, variables) => {
        switch (ast.kind) {
          case Kind.STRING:
          case Kind.BOOLEAN:
            return ast.value;
          case Kind.INT:
          case Kind.FLOAT:
            return parseFloat(ast.value);
          case Kind.OBJECT:
            {
              const value = Object.create(null);
              ast.fields.forEach(field => {
                value[field.name.value] = parseLiteralToObject(field.value, variables);
              });
              return value;
            }
          case Kind.LIST:
            return ast.values.map(n => parseLiteralToObject(n, variables));
          case Kind.NULL:
            return null;
          case Kind.VARIABLE:
            {
              const name = ast.name.value;
              return variables ? variables[name] : void 0;
            }
          default:
            return;
        }
      };
      return parseLiteralToObject;
    })()
  },
  Workspace: {
    __assertStep: assertPgClassSingleStep,
    id($parent) {
      const specifier = nodeIdHandlerByTypeName.Workspace.plan($parent);
      return lambda(specifier, nodeIdCodecs[nodeIdHandlerByTypeName.Workspace.codec.name].encode);
    },
    rowId($record) {
      return $record.get("id");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    updatedAt($record) {
      return $record.get("updated_at");
    },
    projects: {
      plan($record) {
        const $records = pgResource_projectPgResource.find({
          workspace_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed13(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    workspaceUsers: {
      plan($record) {
        const $records = pgResource_workspace_userPgResource.find({
          workspace_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed14(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    }
  },
  ProjectConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    }
  },
  ProjectEdge: {
    __assertStep: assertEdgeCapableStep,
    cursor($edge) {
      return $edge.cursor();
    },
    node($edge) {
      return $edge.node();
    }
  },
  Cursor: {
    serialize: UUIDSerialize,
    parseValue: UUIDSerialize,
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) throw new GraphQLError(`${"Cursor" ?? "This scalar"} can only parse string values (kind='${ast.kind}')`);
      return ast.value;
    }
  },
  PageInfo: {
    __assertStep: assertPageInfoCapableStep,
    hasNextPage($pageInfo) {
      return $pageInfo.hasNextPage();
    },
    hasPreviousPage($pageInfo) {
      return $pageInfo.hasPreviousPage();
    },
    startCursor($pageInfo) {
      return $pageInfo.startCursor();
    },
    endCursor($pageInfo) {
      return $pageInfo.endCursor();
    }
  },
  ProjectCondition: {
    rowId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    workspaceId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "workspace_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    }
  },
  ProjectFilter: {
    rowId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec;
      return condition;
    },
    workspaceId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec2;
      return condition;
    },
    columns($where, value) {
      assertAllowed15(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: columnIdentifier,
        alias: pgResource_columnPgResource.name,
        localAttributes: registryConfig.pgRelations.project.columnsByTheirProjectId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.project.columnsByTheirProjectId.remoteAttributes
      };
      return $rel;
    },
    columnsExist($where, value) {
      assertAllowed15(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: columnIdentifier,
        alias: pgResource_columnPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.project.columnsByTheirProjectId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.project.columnsByTheirProjectId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    projectUsers($where, value) {
      assertAllowed15(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: projectUserIdentifier,
        alias: pgResource_project_userPgResource.name,
        localAttributes: registryConfig.pgRelations.project.projectUsersByTheirProjectId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.project.projectUsersByTheirProjectId.remoteAttributes
      };
      return $rel;
    },
    projectUsersExist($where, value) {
      assertAllowed15(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: projectUserIdentifier,
        alias: pgResource_project_userPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.project.projectUsersByTheirProjectId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.project.projectUsersByTheirProjectId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    workspace($where, value) {
      assertAllowed16(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: workspaceIdentifier,
        alias: pgResource_workspacePgResource.name
      });
      registryConfig.pgRelations.project.workspaceByMyWorkspaceId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.project.workspaceByMyWorkspaceId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    and($where, value) {
      assertAllowed17(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed17(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed17(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  UUIDFilter: {
    isNull($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec ? resolveInputCodec(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue ? resolveSqlValue($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "isNull"
        });
      $where.where(fragment);
    },
    equalTo($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve2(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "equalTo"
        });
      $where.where(fragment);
    },
    notEqualTo($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve3(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notEqualTo"
        });
      $where.where(fragment);
    },
    distinctFrom($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve4(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "distinctFrom"
        });
      $where.where(fragment);
    },
    notDistinctFrom($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve5(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notDistinctFrom"
        });
      $where.where(fragment);
    },
    in($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec3 ? resolveInputCodec3(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve6(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "in"
        });
      $where.where(fragment);
    },
    notIn($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec3 ? resolveInputCodec3(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve7(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notIn"
        });
      $where.where(fragment);
    },
    lessThan($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve8(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "lessThan"
        });
      $where.where(fragment);
    },
    lessThanOrEqualTo($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve9(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "lessThanOrEqualTo"
        });
      $where.where(fragment);
    },
    greaterThan($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve10(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "greaterThan"
        });
      $where.where(fragment);
    },
    greaterThanOrEqualTo($where, value) {
      if (!$where.extensions?.pgFilterAttribute) throw new Error("Planning error: expected 'pgFilterAttribute' to be present on the $where plan's extensions; your extensions to `postgraphile-plugin-connection-filter` does not implement the required interfaces.");
      if (value === void 0) return;
      const {
          fieldName: parentFieldName,
          attributeName,
          attribute,
          codec,
          expression
        } = $where.extensions.pgFilterAttribute,
        sourceAlias = attribute ? attribute.expression ? attribute.expression($where.alias) : sql`${$where.alias}.${sql.identifier(attributeName)}` : expression ? expression : $where.alias,
        sourceCodec = codec ?? attribute.codec,
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier ? resolveSqlIdentifier(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (false && value === null) return;
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec2 ? resolveInputCodec2(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve11(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "greaterThanOrEqualTo"
        });
      $where.where(fragment);
    }
  },
  ProjectToManyColumnFilter: {
    every($where, value) {
      assertAllowed18(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed18(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed18(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  ColumnFilter: {
    rowId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec3;
      return condition;
    },
    projectId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec4;
      return condition;
    },
    tasks($where, value) {
      assertAllowed19(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: taskIdentifier,
        alias: pgResource_taskPgResource.name,
        localAttributes: registryConfig.pgRelations.column.tasksByTheirColumnId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.column.tasksByTheirColumnId.remoteAttributes
      };
      return $rel;
    },
    tasksExist($where, value) {
      assertAllowed19(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: taskIdentifier,
        alias: pgResource_taskPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.column.tasksByTheirColumnId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.column.tasksByTheirColumnId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    project($where, value) {
      assertAllowed20(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: projectIdentifier,
        alias: pgResource_projectPgResource.name
      });
      registryConfig.pgRelations.column.projectByMyProjectId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.column.projectByMyProjectId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    and($where, value) {
      assertAllowed21(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed21(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed21(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  ColumnToManyTaskFilter: {
    every($where, value) {
      assertAllowed22(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed22(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed22(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  TaskFilter: {
    rowId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec5;
      return condition;
    },
    columnId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec6;
      return condition;
    },
    taskUsers($where, value) {
      assertAllowed23(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: taskUserIdentifier,
        alias: pgResource_task_userPgResource.name,
        localAttributes: registryConfig.pgRelations.task.taskUsersByTheirTaskId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.task.taskUsersByTheirTaskId.remoteAttributes
      };
      return $rel;
    },
    taskUsersExist($where, value) {
      assertAllowed23(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: taskUserIdentifier,
        alias: pgResource_task_userPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.task.taskUsersByTheirTaskId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.task.taskUsersByTheirTaskId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    column($where, value) {
      assertAllowed24(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: columnIdentifier,
        alias: pgResource_columnPgResource.name
      });
      registryConfig.pgRelations.task.columnByMyColumnId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.task.columnByMyColumnId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    and($where, value) {
      assertAllowed25(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed25(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed25(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  TaskToManyTaskUserFilter: {
    every($where, value) {
      assertAllowed26(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed26(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed26(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  TaskUserFilter: {
    taskId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec7;
      return condition;
    },
    userId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec8;
      return condition;
    },
    task($where, value) {
      assertAllowed27(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: taskIdentifier,
        alias: pgResource_taskPgResource.name
      });
      registryConfig.pgRelations.taskUser.taskByMyTaskId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.taskUser.taskByMyTaskId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    user($where, value) {
      assertAllowed27(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: userIdentifier,
        alias: pgResource_userPgResource.name
      });
      registryConfig.pgRelations.taskUser.userByMyUserId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.taskUser.userByMyUserId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    and($where, value) {
      assertAllowed28(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed28(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed28(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  UserFilter: {
    rowId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec9;
      return condition;
    },
    identityProviderId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec10;
      return condition;
    },
    assignees($where, value) {
      assertAllowed29(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: assigneeIdentifier,
        alias: pgResource_assigneePgResource.name,
        localAttributes: registryConfig.pgRelations.user.assigneesByTheirUserId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.user.assigneesByTheirUserId.remoteAttributes
      };
      return $rel;
    },
    assigneesExist($where, value) {
      assertAllowed29(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: assigneeIdentifier,
        alias: pgResource_assigneePgResource.name,
        equals: value
      });
      registryConfig.pgRelations.user.assigneesByTheirUserId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.user.assigneesByTheirUserId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    authoredPosts($where, value) {
      assertAllowed29(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: postIdentifier,
        alias: pgResource_postPgResource.name,
        localAttributes: registryConfig.pgRelations.user.postsByTheirAuthorId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.user.postsByTheirAuthorId.remoteAttributes
      };
      return $rel;
    },
    authoredPostsExist($where, value) {
      assertAllowed29(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: postIdentifier,
        alias: pgResource_postPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.user.postsByTheirAuthorId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.user.postsByTheirAuthorId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    projectUsers($where, value) {
      assertAllowed29(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: projectUserIdentifier,
        alias: pgResource_project_userPgResource.name,
        localAttributes: registryConfig.pgRelations.user.projectUsersByTheirUserId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.user.projectUsersByTheirUserId.remoteAttributes
      };
      return $rel;
    },
    projectUsersExist($where, value) {
      assertAllowed29(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: projectUserIdentifier,
        alias: pgResource_project_userPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.user.projectUsersByTheirUserId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.user.projectUsersByTheirUserId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    taskUsers($where, value) {
      assertAllowed29(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: taskUserIdentifier,
        alias: pgResource_task_userPgResource.name,
        localAttributes: registryConfig.pgRelations.user.taskUsersByTheirUserId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.user.taskUsersByTheirUserId.remoteAttributes
      };
      return $rel;
    },
    taskUsersExist($where, value) {
      assertAllowed29(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: taskUserIdentifier,
        alias: pgResource_task_userPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.user.taskUsersByTheirUserId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.user.taskUsersByTheirUserId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    workspaceUsers($where, value) {
      assertAllowed29(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: workspaceUserIdentifier,
        alias: pgResource_workspace_userPgResource.name,
        localAttributes: registryConfig.pgRelations.user.workspaceUsersByTheirUserId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.user.workspaceUsersByTheirUserId.remoteAttributes
      };
      return $rel;
    },
    workspaceUsersExist($where, value) {
      assertAllowed29(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: workspaceUserIdentifier,
        alias: pgResource_workspace_userPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.user.workspaceUsersByTheirUserId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.user.workspaceUsersByTheirUserId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    and($where, value) {
      assertAllowed30(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed30(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed30(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  UserToManyAssigneeFilter: {
    every($where, value) {
      assertAllowed31(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed31(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed31(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  AssigneeFilter: {
    rowId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec11;
      return condition;
    },
    userId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec12;
      return condition;
    },
    user($where, value) {
      assertAllowed32(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: userIdentifier,
        alias: pgResource_userPgResource.name
      });
      registryConfig.pgRelations.assignee.userByMyUserId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.assignee.userByMyUserId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    and($where, value) {
      assertAllowed33(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed33(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed33(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  UserToManyPostFilter: {
    every($where, value) {
      assertAllowed34(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed34(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed34(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  PostFilter: {
    rowId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec13;
      return condition;
    },
    authorId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec14;
      return condition;
    },
    author($where, value) {
      assertAllowed35(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: userIdentifier,
        alias: pgResource_userPgResource.name
      });
      registryConfig.pgRelations.post.userByMyAuthorId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.post.userByMyAuthorId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    and($where, value) {
      assertAllowed36(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed36(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed36(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  UserToManyProjectUserFilter: {
    every($where, value) {
      assertAllowed37(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed37(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed37(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  ProjectUserFilter: {
    projectId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec15;
      return condition;
    },
    userId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec16;
      return condition;
    },
    project($where, value) {
      assertAllowed38(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: projectIdentifier,
        alias: pgResource_projectPgResource.name
      });
      registryConfig.pgRelations.projectUser.projectByMyProjectId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.projectUser.projectByMyProjectId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    user($where, value) {
      assertAllowed38(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: userIdentifier,
        alias: pgResource_userPgResource.name
      });
      registryConfig.pgRelations.projectUser.userByMyUserId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.projectUser.userByMyUserId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    and($where, value) {
      assertAllowed39(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed39(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed39(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  UserToManyTaskUserFilter: {
    every($where, value) {
      assertAllowed40(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed40(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed40(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  UserToManyWorkspaceUserFilter: {
    every($where, value) {
      assertAllowed41(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed41(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed41(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  WorkspaceUserFilter: {
    workspaceId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec17;
      return condition;
    },
    userId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec18;
      return condition;
    },
    user($where, value) {
      assertAllowed42(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: userIdentifier,
        alias: pgResource_userPgResource.name
      });
      registryConfig.pgRelations.workspaceUser.userByMyUserId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.workspaceUser.userByMyUserId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    workspace($where, value) {
      assertAllowed42(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: workspaceIdentifier,
        alias: pgResource_workspacePgResource.name
      });
      registryConfig.pgRelations.workspaceUser.workspaceByMyWorkspaceId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.workspaceUser.workspaceByMyWorkspaceId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    and($where, value) {
      assertAllowed43(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed43(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed43(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  WorkspaceFilter: {
    rowId(queryBuilder, value) {
      if (value === void 0) return;
      if (!false && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!false && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec19;
      return condition;
    },
    projects($where, value) {
      assertAllowed44(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: projectIdentifier,
        alias: pgResource_projectPgResource.name,
        localAttributes: registryConfig.pgRelations.workspace.projectsByTheirWorkspaceId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.workspace.projectsByTheirWorkspaceId.remoteAttributes
      };
      return $rel;
    },
    projectsExist($where, value) {
      assertAllowed44(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: projectIdentifier,
        alias: pgResource_projectPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.workspace.projectsByTheirWorkspaceId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.workspace.projectsByTheirWorkspaceId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    workspaceUsers($where, value) {
      assertAllowed44(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: workspaceUserIdentifier,
        alias: pgResource_workspace_userPgResource.name,
        localAttributes: registryConfig.pgRelations.workspace.workspaceUsersByTheirWorkspaceId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.workspace.workspaceUsersByTheirWorkspaceId.remoteAttributes
      };
      return $rel;
    },
    workspaceUsersExist($where, value) {
      assertAllowed44(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: workspaceUserIdentifier,
        alias: pgResource_workspace_userPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.workspace.workspaceUsersByTheirWorkspaceId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.workspace.workspaceUsersByTheirWorkspaceId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    and($where, value) {
      assertAllowed45(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed45(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed45(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  WorkspaceToManyProjectFilter: {
    every($where, value) {
      assertAllowed46(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed46(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed46(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  WorkspaceToManyWorkspaceUserFilter: {
    every($where, value) {
      assertAllowed47(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed47(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed47(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  ProjectToManyProjectUserFilter: {
    every($where, value) {
      assertAllowed48(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery.notPlan().andPlan();
    },
    some($where, value) {
      assertAllowed48(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    none($where, value) {
      assertAllowed48(value, "object");
      if (value == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = $where.notPlan().existsPlan({
          tableExpression,
          alias
        });
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  ProjectOrderBy: {
    PRIMARY_KEY_ASC(queryBuilder) {
      projectUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "ASC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PRIMARY_KEY_DESC(queryBuilder) {
      projectUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "DESC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    },
    WORKSPACE_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "workspace_id",
        direction: "ASC"
      });
    },
    WORKSPACE_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "workspace_id",
        direction: "DESC"
      });
    }
  },
  WorkspaceUserConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    }
  },
  WorkspaceUser: {
    __assertStep: assertPgClassSingleStep,
    id($parent) {
      const specifier = nodeIdHandlerByTypeName.WorkspaceUser.plan($parent);
      return lambda(specifier, nodeIdCodecs[nodeIdHandlerByTypeName.WorkspaceUser.codec.name].encode);
    },
    workspaceId($record) {
      return $record.get("workspace_id");
    },
    userId($record) {
      return $record.get("user_id");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    user($record) {
      return pgResource_userPgResource.get({
        id: $record.get("user_id")
      });
    },
    workspace($record) {
      return pgResource_workspacePgResource.get({
        id: $record.get("workspace_id")
      });
    }
  },
  User: {
    __assertStep: assertPgClassSingleStep,
    id($parent) {
      const specifier = nodeIdHandlerByTypeName.User.plan($parent);
      return lambda(specifier, nodeIdCodecs[nodeIdHandlerByTypeName.User.codec.name].encode);
    },
    rowId($record) {
      return $record.get("id");
    },
    identityProviderId($record) {
      return $record.get("identity_provider_id");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    updatedAt($record) {
      return $record.get("updated_at");
    },
    assignees: {
      plan($record) {
        const $records = pgResource_assigneePgResource.find({
          user_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed49(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    authoredPosts: {
      plan($record) {
        const $records = pgResource_postPgResource.find({
          author_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed50(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    projectUsers: {
      plan($record) {
        const $records = pgResource_project_userPgResource.find({
          user_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed51(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    taskUsers: {
      plan($record) {
        const $records = pgResource_task_userPgResource.find({
          user_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed52(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    },
    workspaceUsers: {
      plan($record) {
        const $records = pgResource_workspace_userPgResource.find({
          user_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed53(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    }
  },
  AssigneeConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    }
  },
  Assignee: {
    __assertStep: assertPgClassSingleStep,
    id($parent) {
      const specifier = nodeIdHandlerByTypeName.Assignee.plan($parent);
      return lambda(specifier, nodeIdCodecs[nodeIdHandlerByTypeName.Assignee.codec.name].encode);
    },
    rowId($record) {
      return $record.get("id");
    },
    userId($record) {
      return $record.get("user_id");
    },
    avatarUrl($record) {
      return $record.get("avatar_url");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    updatedAt($record) {
      return $record.get("updated_at");
    },
    user($record) {
      return pgResource_userPgResource.get({
        id: $record.get("user_id")
      });
    }
  },
  AssigneeEdge: {
    __assertStep: assertEdgeCapableStep,
    cursor($edge) {
      return $edge.cursor();
    },
    node($edge) {
      return $edge.node();
    }
  },
  AssigneeCondition: {
    rowId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    userId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "user_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    }
  },
  AssigneeOrderBy: {
    PRIMARY_KEY_ASC(queryBuilder) {
      assigneeUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "ASC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PRIMARY_KEY_DESC(queryBuilder) {
      assigneeUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "DESC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    },
    USER_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "user_id",
        direction: "ASC"
      });
    },
    USER_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "user_id",
        direction: "DESC"
      });
    }
  },
  PostConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    }
  },
  Post: {
    __assertStep: assertPgClassSingleStep,
    id($parent) {
      const specifier = nodeIdHandlerByTypeName.Post.plan($parent);
      return lambda(specifier, nodeIdCodecs[nodeIdHandlerByTypeName.Post.codec.name].encode);
    },
    rowId($record) {
      return $record.get("id");
    },
    authorId($record) {
      return $record.get("author_id");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    updatedAt($record) {
      return $record.get("updated_at");
    },
    author($record) {
      return pgResource_userPgResource.get({
        id: $record.get("author_id")
      });
    }
  },
  PostEdge: {
    __assertStep: assertEdgeCapableStep,
    cursor($edge) {
      return $edge.cursor();
    },
    node($edge) {
      return $edge.node();
    }
  },
  PostCondition: {
    rowId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    authorId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "author_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    }
  },
  PostOrderBy: {
    PRIMARY_KEY_ASC(queryBuilder) {
      postUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "ASC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PRIMARY_KEY_DESC(queryBuilder) {
      postUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "DESC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    },
    AUTHOR_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "author_id",
        direction: "ASC"
      });
    },
    AUTHOR_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "author_id",
        direction: "DESC"
      });
    }
  },
  ProjectUserConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    }
  },
  ProjectUserEdge: {
    __assertStep: assertEdgeCapableStep,
    cursor($edge) {
      return $edge.cursor();
    },
    node($edge) {
      return $edge.node();
    }
  },
  ProjectUserCondition: {
    projectId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "project_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    userId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "user_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    }
  },
  ProjectUserOrderBy: {
    PRIMARY_KEY_ASC(queryBuilder) {
      project_userUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "ASC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PRIMARY_KEY_DESC(queryBuilder) {
      project_userUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "DESC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PROJECT_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "project_id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    PROJECT_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "project_id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    },
    USER_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "user_id",
        direction: "ASC"
      });
    },
    USER_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "user_id",
        direction: "DESC"
      });
    }
  },
  TaskUserConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    }
  },
  TaskUser: {
    __assertStep: assertPgClassSingleStep,
    id($parent) {
      const specifier = nodeIdHandlerByTypeName.TaskUser.plan($parent);
      return lambda(specifier, nodeIdCodecs[nodeIdHandlerByTypeName.TaskUser.codec.name].encode);
    },
    taskId($record) {
      return $record.get("task_id");
    },
    userId($record) {
      return $record.get("user_id");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    task($record) {
      return pgResource_taskPgResource.get({
        id: $record.get("task_id")
      });
    },
    user($record) {
      return pgResource_userPgResource.get({
        id: $record.get("user_id")
      });
    }
  },
  Task: {
    __assertStep: assertPgClassSingleStep,
    id($parent) {
      const specifier = nodeIdHandlerByTypeName.Task.plan($parent);
      return lambda(specifier, nodeIdCodecs[nodeIdHandlerByTypeName.Task.codec.name].encode);
    },
    rowId($record) {
      return $record.get("id");
    },
    columnId($record) {
      return $record.get("column_id");
    },
    dueDate($record) {
      return $record.get("due_date");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    updatedAt($record) {
      return $record.get("updated_at");
    },
    column($record) {
      return pgResource_columnPgResource.get({
        id: $record.get("column_id")
      });
    },
    taskUsers: {
      plan($record) {
        const $records = pgResource_task_userPgResource.find({
          task_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed54(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    }
  },
  Column: {
    __assertStep: assertPgClassSingleStep,
    id($parent) {
      const specifier = nodeIdHandlerByTypeName.Column.plan($parent);
      return lambda(specifier, nodeIdCodecs[nodeIdHandlerByTypeName.Column.codec.name].encode);
    },
    rowId($record) {
      return $record.get("id");
    },
    projectId($record) {
      return $record.get("project_id");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    updatedAt($record) {
      return $record.get("updated_at");
    },
    project($record) {
      return pgResource_projectPgResource.get({
        id: $record.get("project_id")
      });
    },
    tasks: {
      plan($record) {
        const $records = pgResource_taskPgResource.find({
          column_id: $record.get("id")
        });
        return connection($records);
      },
      args: {
        first(_, $connection, arg) {
          $connection.setFirst(arg.getRaw());
        },
        last(_, $connection, val) {
          $connection.setLast(val.getRaw());
        },
        offset(_, $connection, val) {
          $connection.setOffset(val.getRaw());
        },
        before(_, $connection, val) {
          $connection.setBefore(val.getRaw());
        },
        after(_, $connection, val) {
          $connection.setAfter(val.getRaw());
        },
        condition(_condition, $connection, arg) {
          const $select = $connection.getSubplan();
          arg.apply($select, qbWhereBuilder);
        },
        filter(_, $connection, fieldArg) {
          const $pgSelect = $connection.getSubplan();
          fieldArg.apply($pgSelect, (queryBuilder, value) => {
            assertAllowed55(value, "object");
            if (value == null) return;
            const condition = new PgCondition(queryBuilder);
            return condition;
          });
        },
        orderBy(parent, $connection, value) {
          const $select = $connection.getSubplan();
          value.apply($select);
        }
      }
    }
  },
  TaskConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    }
  },
  TaskEdge: {
    __assertStep: assertEdgeCapableStep,
    cursor($edge) {
      return $edge.cursor();
    },
    node($edge) {
      return $edge.node();
    }
  },
  TaskCondition: {
    rowId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    columnId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "column_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    }
  },
  TaskOrderBy: {
    PRIMARY_KEY_ASC(queryBuilder) {
      taskUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "ASC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PRIMARY_KEY_DESC(queryBuilder) {
      taskUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "DESC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    },
    COLUMN_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "column_id",
        direction: "ASC"
      });
    },
    COLUMN_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "column_id",
        direction: "DESC"
      });
    }
  },
  TaskUserCondition: {
    taskId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "task_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    userId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "user_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    }
  },
  TaskUserOrderBy: {
    PRIMARY_KEY_ASC(queryBuilder) {
      task_userUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "ASC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PRIMARY_KEY_DESC(queryBuilder) {
      task_userUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "DESC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    TASK_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "task_id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    TASK_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "task_id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    },
    USER_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "user_id",
        direction: "ASC"
      });
    },
    USER_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "user_id",
        direction: "DESC"
      });
    }
  },
  TaskUserEdge: {
    __assertStep: assertEdgeCapableStep,
    cursor($edge) {
      return $edge.cursor();
    },
    node($edge) {
      return $edge.node();
    }
  },
  WorkspaceUserCondition: {
    workspaceId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "workspace_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    userId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "user_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    }
  },
  WorkspaceUserOrderBy: {
    PRIMARY_KEY_ASC(queryBuilder) {
      workspace_userUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "ASC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PRIMARY_KEY_DESC(queryBuilder) {
      workspace_userUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "DESC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    WORKSPACE_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "workspace_id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    WORKSPACE_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "workspace_id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    },
    USER_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "user_id",
        direction: "ASC"
      });
    },
    USER_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "user_id",
        direction: "DESC"
      });
    }
  },
  WorkspaceUserEdge: {
    __assertStep: assertEdgeCapableStep,
    cursor($edge) {
      return $edge.cursor();
    },
    node($edge) {
      return $edge.node();
    }
  },
  ColumnConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    }
  },
  ColumnEdge: {
    __assertStep: assertEdgeCapableStep,
    cursor($edge) {
      return $edge.cursor();
    },
    node($edge) {
      return $edge.node();
    }
  },
  ColumnCondition: {
    rowId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    projectId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "project_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    }
  },
  ColumnOrderBy: {
    PRIMARY_KEY_ASC(queryBuilder) {
      columnUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "ASC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PRIMARY_KEY_DESC(queryBuilder) {
      columnUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "DESC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    },
    PROJECT_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "project_id",
        direction: "ASC"
      });
    },
    PROJECT_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "project_id",
        direction: "DESC"
      });
    }
  },
  UserConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    }
  },
  UserEdge: {
    __assertStep: assertEdgeCapableStep,
    cursor($edge) {
      return $edge.cursor();
    },
    node($edge) {
      return $edge.node();
    }
  },
  UserCondition: {
    rowId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    identityProviderId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "identity_provider_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    }
  },
  UserOrderBy: {
    PRIMARY_KEY_ASC(queryBuilder) {
      userUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "ASC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PRIMARY_KEY_DESC(queryBuilder) {
      userUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "DESC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    },
    IDENTITY_PROVIDER_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "identity_provider_id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    IDENTITY_PROVIDER_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "identity_provider_id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    }
  },
  WorkspaceConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    }
  },
  WorkspaceEdge: {
    __assertStep: assertEdgeCapableStep,
    cursor($edge) {
      return $edge.cursor();
    },
    node($edge) {
      return $edge.node();
    }
  },
  WorkspaceCondition: {
    rowId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    }
  },
  WorkspaceOrderBy: {
    PRIMARY_KEY_ASC(queryBuilder) {
      workspaceUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "ASC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    PRIMARY_KEY_DESC(queryBuilder) {
      workspaceUniques[0].attributes.forEach(attributeName => {
        queryBuilder.orderBy({
          attribute: attributeName,
          direction: "DESC"
        });
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "ASC"
      });
      queryBuilder.setOrderIsUnique();
    },
    ROW_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "id",
        direction: "DESC"
      });
      queryBuilder.setOrderIsUnique();
    }
  },
  Mutation: {
    __assertStep: __ValueStep,
    createProjectUser: {
      plan(_, args) {
        const $insert = pgInsertSingle(pgResource_project_userPgResource, Object.create(null));
        args.apply($insert);
        return object({
          result: $insert
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    createTaskUser: {
      plan(_, args) {
        const $insert = pgInsertSingle(pgResource_task_userPgResource, Object.create(null));
        args.apply($insert);
        return object({
          result: $insert
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    createWorkspaceUser: {
      plan(_, args) {
        const $insert = pgInsertSingle(pgResource_workspace_userPgResource, Object.create(null));
        args.apply($insert);
        return object({
          result: $insert
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    createUser: {
      plan(_, args) {
        const $insert = pgInsertSingle(pgResource_userPgResource, Object.create(null));
        args.apply($insert);
        return object({
          result: $insert
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    createWorkspace: {
      plan(_, args) {
        const $insert = pgInsertSingle(pgResource_workspacePgResource, Object.create(null));
        args.apply($insert);
        return object({
          result: $insert
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    createColumn: {
      plan(_, args) {
        const $insert = pgInsertSingle(pgResource_columnPgResource, Object.create(null));
        args.apply($insert);
        return object({
          result: $insert
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    createAssignee: {
      plan(_, args) {
        const $insert = pgInsertSingle(pgResource_assigneePgResource, Object.create(null));
        args.apply($insert);
        return object({
          result: $insert
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    createPost: {
      plan(_, args) {
        const $insert = pgInsertSingle(pgResource_postPgResource, Object.create(null));
        args.apply($insert);
        return object({
          result: $insert
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    createProject: {
      plan(_, args) {
        const $insert = pgInsertSingle(pgResource_projectPgResource, Object.create(null));
        args.apply($insert);
        return object({
          result: $insert
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    createTask: {
      plan(_, args) {
        const $insert = pgInsertSingle(pgResource_taskPgResource, Object.create(null));
        args.apply($insert);
        return object({
          result: $insert
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateProjectUserById: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_project_userPgResource, specFromArgs_ProjectUser(args));
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateProjectUser: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_project_userPgResource, {
          project_id: args.getRaw(['input', "projectId"]),
          user_id: args.getRaw(['input', "userId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateTaskUserById: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_task_userPgResource, specFromArgs_TaskUser(args));
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateTaskUser: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_task_userPgResource, {
          task_id: args.getRaw(['input', "taskId"]),
          user_id: args.getRaw(['input', "userId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateWorkspaceUserById: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_workspace_userPgResource, specFromArgs_WorkspaceUser(args));
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateWorkspaceUser: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_workspace_userPgResource, {
          workspace_id: args.getRaw(['input', "workspaceId"]),
          user_id: args.getRaw(['input', "userId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateUserById: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_userPgResource, specFromArgs_User(args));
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateUser: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_userPgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateUserByIdentityProviderId: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_userPgResource, {
          identity_provider_id: args.getRaw(['input', "identityProviderId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateWorkspaceById: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_workspacePgResource, specFromArgs_Workspace(args));
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateWorkspace: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_workspacePgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateColumnById: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_columnPgResource, specFromArgs_Column(args));
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateColumn: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_columnPgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateAssigneeById: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_assigneePgResource, specFromArgs_Assignee(args));
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateAssignee: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_assigneePgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updatePostById: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_postPgResource, specFromArgs_Post(args));
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updatePost: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_postPgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateProjectById: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_projectPgResource, specFromArgs_Project(args));
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateProject: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_projectPgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateTaskById: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_taskPgResource, specFromArgs_Task(args));
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    updateTask: {
      plan(_$root, args) {
        const $update = pgUpdateSingle(pgResource_taskPgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($update);
        return object({
          result: $update
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteProjectUserById: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_project_userPgResource, specFromArgs_ProjectUser2(args));
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteProjectUser: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_project_userPgResource, {
          project_id: args.getRaw(['input', "projectId"]),
          user_id: args.getRaw(['input', "userId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteTaskUserById: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_task_userPgResource, specFromArgs_TaskUser2(args));
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteTaskUser: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_task_userPgResource, {
          task_id: args.getRaw(['input', "taskId"]),
          user_id: args.getRaw(['input', "userId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteWorkspaceUserById: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_workspace_userPgResource, specFromArgs_WorkspaceUser2(args));
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteWorkspaceUser: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_workspace_userPgResource, {
          workspace_id: args.getRaw(['input', "workspaceId"]),
          user_id: args.getRaw(['input', "userId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteUserById: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_userPgResource, specFromArgs_User2(args));
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteUser: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_userPgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteUserByIdentityProviderId: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_userPgResource, {
          identity_provider_id: args.getRaw(['input', "identityProviderId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteWorkspaceById: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_workspacePgResource, specFromArgs_Workspace2(args));
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteWorkspace: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_workspacePgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteColumnById: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_columnPgResource, specFromArgs_Column2(args));
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteColumn: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_columnPgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteAssigneeById: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_assigneePgResource, specFromArgs_Assignee2(args));
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteAssignee: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_assigneePgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deletePostById: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_postPgResource, specFromArgs_Post2(args));
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deletePost: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_postPgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteProjectById: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_projectPgResource, specFromArgs_Project2(args));
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteProject: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_projectPgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteTaskById: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_taskPgResource, specFromArgs_Task2(args));
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    },
    deleteTask: {
      plan(_$root, args) {
        const $delete = pgDeleteSingle(pgResource_taskPgResource, {
          id: args.getRaw(['input', "rowId"])
        });
        args.apply($delete);
        return object({
          result: $delete
        });
      },
      args: {
        input(_, $object) {
          return $object;
        }
      }
    }
  },
  CreateProjectUserPayload: {
    __assertStep: assertExecutableStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    projectUser($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    projectUserEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = project_userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_project_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  CreateProjectUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    projectUser(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  ProjectUserInput: {
    __baked: createObjectAndApplyChildren,
    projectId(obj, val, {
      field,
      schema
    }) {
      obj.set("project_id", bakedInputRuntime(schema, field.type, val));
    },
    userId(obj, val, {
      field,
      schema
    }) {
      obj.set("user_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  CreateTaskUserPayload: {
    __assertStep: assertExecutableStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    taskUser($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    taskUserEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = task_userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_task_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  CreateTaskUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    taskUser(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  TaskUserInput: {
    __baked: createObjectAndApplyChildren,
    taskId(obj, val, {
      field,
      schema
    }) {
      obj.set("task_id", bakedInputRuntime(schema, field.type, val));
    },
    userId(obj, val, {
      field,
      schema
    }) {
      obj.set("user_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  CreateWorkspaceUserPayload: {
    __assertStep: assertExecutableStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    workspaceUser($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    workspaceUserEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = workspace_userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_workspace_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  CreateWorkspaceUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    workspaceUser(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  WorkspaceUserInput: {
    __baked: createObjectAndApplyChildren,
    workspaceId(obj, val, {
      field,
      schema
    }) {
      obj.set("workspace_id", bakedInputRuntime(schema, field.type, val));
    },
    userId(obj, val, {
      field,
      schema
    }) {
      obj.set("user_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  CreateUserPayload: {
    __assertStep: assertExecutableStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    user($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    userEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  CreateUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    user(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UserInput: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    identityProviderId(obj, val, {
      field,
      schema
    }) {
      obj.set("identity_provider_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  CreateWorkspacePayload: {
    __assertStep: assertExecutableStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    workspace($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    workspaceEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = workspaceUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_workspacePgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  CreateWorkspaceInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    workspace(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  WorkspaceInput: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    name(obj, val, {
      field,
      schema
    }) {
      obj.set("name", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  CreateColumnPayload: {
    __assertStep: assertExecutableStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    column($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    columnEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = columnUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_columnPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  CreateColumnInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    column(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  ColumnInput: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    title(obj, val, {
      field,
      schema
    }) {
      obj.set("title", bakedInputRuntime(schema, field.type, val));
    },
    projectId(obj, val, {
      field,
      schema
    }) {
      obj.set("project_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  CreateAssigneePayload: {
    __assertStep: assertExecutableStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    assignee($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    assigneeEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = assigneeUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_assigneePgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  CreateAssigneeInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    assignee(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  AssigneeInput: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    userId(obj, val, {
      field,
      schema
    }) {
      obj.set("user_id", bakedInputRuntime(schema, field.type, val));
    },
    name(obj, val, {
      field,
      schema
    }) {
      obj.set("name", bakedInputRuntime(schema, field.type, val));
    },
    avatarUrl(obj, val, {
      field,
      schema
    }) {
      obj.set("avatar_url", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  CreatePostPayload: {
    __assertStep: assertExecutableStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    post($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    postEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = postUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_postPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  CreatePostInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    post(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  PostInput: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    title(obj, val, {
      field,
      schema
    }) {
      obj.set("title", bakedInputRuntime(schema, field.type, val));
    },
    description(obj, val, {
      field,
      schema
    }) {
      obj.set("description", bakedInputRuntime(schema, field.type, val));
    },
    authorId(obj, val, {
      field,
      schema
    }) {
      obj.set("author_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  CreateProjectPayload: {
    __assertStep: assertExecutableStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    project($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    projectEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = projectUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_projectPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  CreateProjectInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    project(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  ProjectInput: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    name(obj, val, {
      field,
      schema
    }) {
      obj.set("name", bakedInputRuntime(schema, field.type, val));
    },
    description(obj, val, {
      field,
      schema
    }) {
      obj.set("description", bakedInputRuntime(schema, field.type, val));
    },
    prefix(obj, val, {
      field,
      schema
    }) {
      obj.set("prefix", bakedInputRuntime(schema, field.type, val));
    },
    color(obj, val, {
      field,
      schema
    }) {
      obj.set("color", bakedInputRuntime(schema, field.type, val));
    },
    labels(obj, val, {
      field,
      schema
    }) {
      obj.set("labels", bakedInputRuntime(schema, field.type, val));
    },
    workspaceId(obj, val, {
      field,
      schema
    }) {
      obj.set("workspace_id", bakedInputRuntime(schema, field.type, val));
    },
    viewMode(obj, val, {
      field,
      schema
    }) {
      obj.set("view_mode", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  CreateTaskPayload: {
    __assertStep: assertExecutableStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    task($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    taskEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = taskUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_taskPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  CreateTaskInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    task(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  TaskInput: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    content(obj, val, {
      field,
      schema
    }) {
      obj.set("content", bakedInputRuntime(schema, field.type, val));
    },
    description(obj, val, {
      field,
      schema
    }) {
      obj.set("description", bakedInputRuntime(schema, field.type, val));
    },
    priority(obj, val, {
      field,
      schema
    }) {
      obj.set("priority", bakedInputRuntime(schema, field.type, val));
    },
    columnId(obj, val, {
      field,
      schema
    }) {
      obj.set("column_id", bakedInputRuntime(schema, field.type, val));
    },
    assignees(obj, val, {
      field,
      schema
    }) {
      obj.set("assignees", bakedInputRuntime(schema, field.type, val));
    },
    labels(obj, val, {
      field,
      schema
    }) {
      obj.set("labels", bakedInputRuntime(schema, field.type, val));
    },
    dueDate(obj, val, {
      field,
      schema
    }) {
      obj.set("due_date", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdateProjectUserPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    projectUser($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    projectUserEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = project_userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_project_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  UpdateProjectUserByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  ProjectUserPatch: {
    __baked: createObjectAndApplyChildren,
    projectId(obj, val, {
      field,
      schema
    }) {
      obj.set("project_id", bakedInputRuntime(schema, field.type, val));
    },
    userId(obj, val, {
      field,
      schema
    }) {
      obj.set("user_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdateProjectUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UpdateTaskUserPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    taskUser($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    taskUserEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = task_userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_task_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  UpdateTaskUserByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  TaskUserPatch: {
    __baked: createObjectAndApplyChildren,
    taskId(obj, val, {
      field,
      schema
    }) {
      obj.set("task_id", bakedInputRuntime(schema, field.type, val));
    },
    userId(obj, val, {
      field,
      schema
    }) {
      obj.set("user_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdateTaskUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UpdateWorkspaceUserPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    workspaceUser($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    workspaceUserEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = workspace_userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_workspace_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  UpdateWorkspaceUserByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  WorkspaceUserPatch: {
    __baked: createObjectAndApplyChildren,
    workspaceId(obj, val, {
      field,
      schema
    }) {
      obj.set("workspace_id", bakedInputRuntime(schema, field.type, val));
    },
    userId(obj, val, {
      field,
      schema
    }) {
      obj.set("user_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdateWorkspaceUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UpdateUserPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    user($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    userEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  UpdateUserByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UserPatch: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    identityProviderId(obj, val, {
      field,
      schema
    }) {
      obj.set("identity_provider_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdateUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UpdateUserByIdentityProviderIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UpdateWorkspacePayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    workspace($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    workspaceEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = workspaceUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_workspacePgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  UpdateWorkspaceByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  WorkspacePatch: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    name(obj, val, {
      field,
      schema
    }) {
      obj.set("name", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdateWorkspaceInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UpdateColumnPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    column($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    columnEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = columnUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_columnPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  UpdateColumnByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  ColumnPatch: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    title(obj, val, {
      field,
      schema
    }) {
      obj.set("title", bakedInputRuntime(schema, field.type, val));
    },
    projectId(obj, val, {
      field,
      schema
    }) {
      obj.set("project_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdateColumnInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UpdateAssigneePayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    assignee($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    assigneeEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = assigneeUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_assigneePgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  UpdateAssigneeByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  AssigneePatch: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    userId(obj, val, {
      field,
      schema
    }) {
      obj.set("user_id", bakedInputRuntime(schema, field.type, val));
    },
    name(obj, val, {
      field,
      schema
    }) {
      obj.set("name", bakedInputRuntime(schema, field.type, val));
    },
    avatarUrl(obj, val, {
      field,
      schema
    }) {
      obj.set("avatar_url", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdateAssigneeInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UpdatePostPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    post($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    postEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = postUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_postPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  UpdatePostByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  PostPatch: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    title(obj, val, {
      field,
      schema
    }) {
      obj.set("title", bakedInputRuntime(schema, field.type, val));
    },
    description(obj, val, {
      field,
      schema
    }) {
      obj.set("description", bakedInputRuntime(schema, field.type, val));
    },
    authorId(obj, val, {
      field,
      schema
    }) {
      obj.set("author_id", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdatePostInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UpdateProjectPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    project($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    projectEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = projectUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_projectPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  UpdateProjectByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  ProjectPatch: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    name(obj, val, {
      field,
      schema
    }) {
      obj.set("name", bakedInputRuntime(schema, field.type, val));
    },
    description(obj, val, {
      field,
      schema
    }) {
      obj.set("description", bakedInputRuntime(schema, field.type, val));
    },
    prefix(obj, val, {
      field,
      schema
    }) {
      obj.set("prefix", bakedInputRuntime(schema, field.type, val));
    },
    color(obj, val, {
      field,
      schema
    }) {
      obj.set("color", bakedInputRuntime(schema, field.type, val));
    },
    labels(obj, val, {
      field,
      schema
    }) {
      obj.set("labels", bakedInputRuntime(schema, field.type, val));
    },
    workspaceId(obj, val, {
      field,
      schema
    }) {
      obj.set("workspace_id", bakedInputRuntime(schema, field.type, val));
    },
    viewMode(obj, val, {
      field,
      schema
    }) {
      obj.set("view_mode", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdateProjectInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  UpdateTaskPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    task($object) {
      return $object.get("result");
    },
    query() {
      return rootValue();
    },
    taskEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = taskUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_taskPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  UpdateTaskByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  TaskPatch: {
    __baked: createObjectAndApplyChildren,
    rowId(obj, val, {
      field,
      schema
    }) {
      obj.set("id", bakedInputRuntime(schema, field.type, val));
    },
    content(obj, val, {
      field,
      schema
    }) {
      obj.set("content", bakedInputRuntime(schema, field.type, val));
    },
    description(obj, val, {
      field,
      schema
    }) {
      obj.set("description", bakedInputRuntime(schema, field.type, val));
    },
    priority(obj, val, {
      field,
      schema
    }) {
      obj.set("priority", bakedInputRuntime(schema, field.type, val));
    },
    columnId(obj, val, {
      field,
      schema
    }) {
      obj.set("column_id", bakedInputRuntime(schema, field.type, val));
    },
    assignees(obj, val, {
      field,
      schema
    }) {
      obj.set("assignees", bakedInputRuntime(schema, field.type, val));
    },
    labels(obj, val, {
      field,
      schema
    }) {
      obj.set("labels", bakedInputRuntime(schema, field.type, val));
    },
    dueDate(obj, val, {
      field,
      schema
    }) {
      obj.set("due_date", bakedInputRuntime(schema, field.type, val));
    },
    createdAt(obj, val, {
      field,
      schema
    }) {
      obj.set("created_at", bakedInputRuntime(schema, field.type, val));
    },
    updatedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("updated_at", bakedInputRuntime(schema, field.type, val));
    }
  },
  UpdateTaskInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    },
    patch(qb, arg) {
      if (arg != null) return qb.setBuilder();
    }
  },
  DeleteProjectUserPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    projectUser($object) {
      return $object.get("result");
    },
    deletedProjectUserId($object) {
      const $record = $object.getStepForKey("result"),
        specifier = nodeIdHandlerByTypeName.ProjectUser.plan($record);
      return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
    },
    query() {
      return rootValue();
    },
    projectUserEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = project_userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_project_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  DeleteProjectUserByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteProjectUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteTaskUserPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    taskUser($object) {
      return $object.get("result");
    },
    deletedTaskUserId($object) {
      const $record = $object.getStepForKey("result"),
        specifier = nodeIdHandlerByTypeName.TaskUser.plan($record);
      return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
    },
    query() {
      return rootValue();
    },
    taskUserEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = task_userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_task_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  DeleteTaskUserByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteTaskUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteWorkspaceUserPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    workspaceUser($object) {
      return $object.get("result");
    },
    deletedWorkspaceUserId($object) {
      const $record = $object.getStepForKey("result"),
        specifier = nodeIdHandlerByTypeName.WorkspaceUser.plan($record);
      return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
    },
    query() {
      return rootValue();
    },
    workspaceUserEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = workspace_userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_workspace_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  DeleteWorkspaceUserByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteWorkspaceUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteUserPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    user($object) {
      return $object.get("result");
    },
    deletedUserId($object) {
      const $record = $object.getStepForKey("result"),
        specifier = nodeIdHandlerByTypeName.User.plan($record);
      return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
    },
    query() {
      return rootValue();
    },
    userEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = userUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_userPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  DeleteUserByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteUserInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteUserByIdentityProviderIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteWorkspacePayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    workspace($object) {
      return $object.get("result");
    },
    deletedWorkspaceId($object) {
      const $record = $object.getStepForKey("result"),
        specifier = nodeIdHandlerByTypeName.Workspace.plan($record);
      return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
    },
    query() {
      return rootValue();
    },
    workspaceEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = workspaceUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_workspacePgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  DeleteWorkspaceByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteWorkspaceInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteColumnPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    column($object) {
      return $object.get("result");
    },
    deletedColumnId($object) {
      const $record = $object.getStepForKey("result"),
        specifier = nodeIdHandlerByTypeName.Column.plan($record);
      return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
    },
    query() {
      return rootValue();
    },
    columnEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = columnUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_columnPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  DeleteColumnByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteColumnInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteAssigneePayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    assignee($object) {
      return $object.get("result");
    },
    deletedAssigneeId($object) {
      const $record = $object.getStepForKey("result"),
        specifier = nodeIdHandlerByTypeName.Assignee.plan($record);
      return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
    },
    query() {
      return rootValue();
    },
    assigneeEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = assigneeUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_assigneePgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  DeleteAssigneeByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteAssigneeInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeletePostPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    post($object) {
      return $object.get("result");
    },
    deletedPostId($object) {
      const $record = $object.getStepForKey("result"),
        specifier = nodeIdHandlerByTypeName.Post.plan($record);
      return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
    },
    query() {
      return rootValue();
    },
    postEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = postUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_postPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  DeletePostByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeletePostInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteProjectPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    project($object) {
      return $object.get("result");
    },
    deletedProjectId($object) {
      const $record = $object.getStepForKey("result"),
        specifier = nodeIdHandlerByTypeName.Project.plan($record);
      return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
    },
    query() {
      return rootValue();
    },
    projectEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = projectUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_projectPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  DeleteProjectByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteProjectInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteTaskPayload: {
    __assertStep: ObjectStep,
    clientMutationId($mutation) {
      return $mutation.getStepForKey("result").getMeta("clientMutationId");
    },
    task($object) {
      return $object.get("result");
    },
    deletedTaskId($object) {
      const $record = $object.getStepForKey("result"),
        specifier = nodeIdHandlerByTypeName.Task.plan($record);
      return lambda(specifier, nodeIdCodecs_base64JSON_base64JSON.encode);
    },
    query() {
      return rootValue();
    },
    taskEdge($mutation, fieldArgs) {
      const $result = $mutation.getStepForKey("result", !0);
      if (!$result) return constant(null);
      const $select = (() => {
        if ($result instanceof PgDeleteSingleStep) return pgSelectFromRecord($result.resource, $result.record());else {
          const spec = taskUniques[0].attributes.reduce((memo, attributeName) => {
            memo[attributeName] = $result.get(attributeName);
            return memo;
          }, Object.create(null));
          return pgResource_taskPgResource.find(spec);
        }
      })();
      fieldArgs.apply($select, "orderBy");
      const $connection = connection($select),
        $single = $select.row(first($select));
      return new EdgeStep($connection, $single);
    }
  },
  DeleteTaskByIdInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  },
  DeleteTaskInput: {
    clientMutationId(qb, val) {
      qb.setMeta("clientMutationId", val);
    }
  }
};
export const schema = makeGrafastSchema({
  typeDefs: typeDefs,
  plans: plans
});