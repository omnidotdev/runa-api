// @ts-nocheck
import { PgBooleanFilter, PgCondition, PgDeleteSingleStep, PgExecutor, PgOrFilter, TYPES, assertPgClassSingleStep, listOfCodec, makeRegistry, pgDeleteSingle, pgInsertSingle, pgSelectFromRecord, pgUpdateSingle, pgWhereConditionSpecListToSQL, recordCodec, sqlValueWithCodec } from "@dataplan/pg";
import { ConnectionStep, EdgeStep, Modifier, ObjectStep, __ValueStep, access, assertEdgeCapableStep, assertExecutableStep, assertPageInfoCapableStep, bakedInputRuntime, connection, constant, context, createObjectAndApplyChildren, first, inhibitOnNull, lambda, list, makeGrafastSchema, node, object, rootValue, specFromNodeId } from "grafast";
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
        canUpdate: true
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "244423",
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
        canUpdate: true
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
        canUpdate: true
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "244413",
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
        canUpdate: true
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
        canUpdate: true
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
        canUpdate: true
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "244358",
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
    name: {
      description: undefined,
      codec: TYPES.text,
      notNull: true,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
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
        canUpdate: true
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
        canUpdate: true
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "244401",
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
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
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
        canUpdate: true
      }
    },
    deleted_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: false,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "244350",
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
        canUpdate: true
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
        canUpdate: true
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
    created_at: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
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
        canUpdate: true
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "244368",
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
        canUpdate: true
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
        canUpdate: true
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
        canUpdate: true
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
        canUpdate: true
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
        canUpdate: true
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
        canUpdate: true
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
        canUpdate: true
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "244378",
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
        canUpdate: true
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
        canUpdate: true
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
        canUpdate: true
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
    labels: {
      description: undefined,
      codec: TYPES.jsonb,
      notNull: false,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    },
    due_date: {
      description: undefined,
      codec: TYPES.timestamptz,
      notNull: false,
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
        canUpdate: true
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
        canUpdate: true
      }
    },
    column_index: {
      description: undefined,
      codec: TYPES.int,
      notNull: true,
      hasDefault: true,
      extensions: {
        tags: {},
        canSelect: true,
        canInsert: true,
        canUpdate: true
      }
    }
  },
  description: undefined,
  extensions: {
    oid: "244389",
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
    workspaceUser: workspaceUserCodec,
    uuid: TYPES.uuid,
    timestamptz: TYPES.timestamptz,
    workspace: workspaceCodec,
    text: TYPES.text,
    column: columnCodec,
    user: userCodec,
    assignee: assigneeCodec,
    post: postCodec,
    project: projectCodec,
    varchar: TYPES.varchar,
    jsonb: TYPES.jsonb,
    task: taskCodec,
    int4: TYPES.int
  },
  pgResources: {
    __proto__: null,
    workspace_user: registryConfig_pgResources_workspace_user_workspace_user,
    workspace: registryConfig_pgResources_workspace_workspace,
    column: registryConfig_pgResources_column_column,
    user: registryConfig_pgResources_user_user,
    assignee: registryConfig_pgResources_assignee_assignee,
    post: registryConfig_pgResources_post_post,
    project: registryConfig_pgResources_project_project,
    task: registryConfig_pgResources_task_task
  },
  pgRelations: {
    __proto__: null,
    assignee: {
      __proto__: null,
      taskByMyTaskId: {
        localCodec: assigneeCodec,
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
      },
      taskByMyTaskId: {
        localCodec: postCodec,
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
      }
    },
    task: {
      __proto__: null,
      userByMyAuthorId: {
        localCodec: taskCodec,
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
      },
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
      assigneesByTheirTaskId: {
        localCodec: taskCodec,
        remoteResourceOptions: registryConfig_pgResources_assignee_assignee,
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
      },
      postsByTheirTaskId: {
        localCodec: taskCodec,
        remoteResourceOptions: registryConfig_pgResources_post_post,
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
      tasksByTheirAuthorId: {
        localCodec: userCodec,
        remoteResourceOptions: registryConfig_pgResources_task_task,
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
const pgResource_workspace_userPgResource = registry.pgResources["workspace_user"];
const pgResource_workspacePgResource = registry.pgResources["workspace"];
const pgResource_columnPgResource = registry.pgResources["column"];
const pgResource_userPgResource = registry.pgResources["user"];
const pgResource_assigneePgResource = registry.pgResources["assignee"];
const pgResource_postPgResource = registry.pgResources["post"];
const pgResource_projectPgResource = registry.pgResources["project"];
const pgResource_taskPgResource = registry.pgResources["task"];
const nodeIdHandlerByTypeName = {
  __proto__: null,
  Query: handler,
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
const nodeFetcher_WorkspaceUser = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.WorkspaceUser));
  return nodeIdHandlerByTypeName.WorkspaceUser.get(nodeIdHandlerByTypeName.WorkspaceUser.getSpec($decoded));
};
const nodeFetcher_Workspace = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.Workspace));
  return nodeIdHandlerByTypeName.Workspace.get(nodeIdHandlerByTypeName.Workspace.getSpec($decoded));
};
const nodeFetcher_Column = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.Column));
  return nodeIdHandlerByTypeName.Column.get(nodeIdHandlerByTypeName.Column.getSpec($decoded));
};
const nodeFetcher_User = $nodeId => {
  const $decoded = lambda($nodeId, specForHandler(nodeIdHandlerByTypeName.User));
  return nodeIdHandlerByTypeName.User.get(nodeIdHandlerByTypeName.User.getSpec($decoded));
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
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed2(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed3(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed4(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed5(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed6(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed7(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed8(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function UUIDSerialize(value) {
  return "" + value;
}
const coerce = string => {
  if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(string)) throw new GraphQLError("Invalid UUID, expected 32 hexadecimal characters, optionally with hypens");
  return string;
};
function assertAllowed9(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed10(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed11(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed12(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed13(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed14(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed15(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed16(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed17(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed18(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const dataTypeToAggregateTypeMap = {};
const spec = {
  id: "distinctCount",
  humanLabel: "distinct count",
  HumanLabel: "Distinct count",
  isSuitableType() {
    return !0;
  },
  sqlAggregateWrap(sqlFrag) {
    return sql`count(distinct ${sqlFrag})`;
  },
  pgTypeCodecModifier(codec) {
    const oid = codec.extensions?.oid;
    return (oid ? dataTypeToAggregateTypeMap[oid] : null) ?? TYPES.bigint;
  }
};
const aggregateGroupBySpec = {
  id: "truncated-to-hour",
  isSuitableType(codec) {
    return codec === TYPES.timestamp || codec === TYPES.timestamptz;
  },
  sqlWrap(sqlFrag) {
    return sql`date_trunc('hour', ${sqlFrag})`;
  },
  sqlWrapCodec(codec) {
    return codec;
  }
};
const aggregateGroupBySpec2 = {
  id: "truncated-to-day",
  isSuitableType(codec) {
    return codec === TYPES.timestamp || codec === TYPES.timestamptz;
  },
  sqlWrap(sqlFrag) {
    return sql`date_trunc('day', ${sqlFrag})`;
  },
  sqlWrapCodec(codec) {
    return codec;
  }
};
const isIntervalLike = codec => !!codec.extensions?.isIntervalLike;
const isNumberLike = codec => !!codec.extensions?.isNumberLike;
const aggregateSpec_isSuitableType = codec => isIntervalLike(codec) || isNumberLike(codec);
const dataTypeToAggregateTypeMap2 = {
  "20": TYPES.numeric,
  "21": TYPES.bigint,
  "23": TYPES.bigint,
  "700": TYPES.float4,
  "701": TYPES.float,
  "790": TYPES.money,
  "1186": TYPES.interval
};
const aggregateSpec = {
  id: "sum",
  humanLabel: "sum",
  HumanLabel: "Sum",
  isSuitableType: aggregateSpec_isSuitableType,
  sqlAggregateWrap(sqlFrag) {
    return sql`coalesce(sum(${sqlFrag}), '0')`;
  },
  isNonNull: true,
  pgTypeCodecModifier(codec) {
    const oid = codec.extensions?.oid;
    return (oid ? dataTypeToAggregateTypeMap2[oid] : null) ?? TYPES.numeric;
  }
};
const infix = () => sql.fragment`=`;
const infix2 = () => sql.fragment`<>`;
const infix3 = () => sql.fragment`>`;
const infix4 = () => sql.fragment`>=`;
const infix5 = () => sql.fragment`<`;
const infix6 = () => sql.fragment`<=`;
const aggregateSpec2 = {
  id: "min",
  humanLabel: "minimum",
  HumanLabel: "Minimum",
  isSuitableType: aggregateSpec_isSuitableType,
  sqlAggregateWrap(sqlFrag) {
    return sql`min(${sqlFrag})`;
  }
};
const aggregateSpec3 = {
  id: "max",
  humanLabel: "maximum",
  HumanLabel: "Maximum",
  isSuitableType: aggregateSpec_isSuitableType,
  sqlAggregateWrap(sqlFrag) {
    return sql`max(${sqlFrag})`;
  }
};
const dataTypeToAggregateTypeMap3 = {
  "20": TYPES.numeric,
  "21": TYPES.numeric,
  "23": TYPES.numeric,
  "700": TYPES.float,
  "701": TYPES.float,
  "1186": TYPES.interval,
  "1700": TYPES.numeric
};
const aggregateSpec4 = {
  id: "average",
  humanLabel: "mean average",
  HumanLabel: "Mean average",
  isSuitableType: aggregateSpec_isSuitableType,
  sqlAggregateWrap(sqlFrag) {
    return sql`avg(${sqlFrag})`;
  },
  pgTypeCodecModifier(codec) {
    const oid = codec.extensions?.oid;
    return (oid ? dataTypeToAggregateTypeMap3[oid] : null) ?? TYPES.numeric;
  }
};
const dataTypeToAggregateTypeMap4 = {
  "700": TYPES.float,
  "701": TYPES.float
};
const aggregateSpec5 = {
  id: "stddevSample",
  humanLabel: "sample standard deviation",
  HumanLabel: "Sample standard deviation",
  isSuitableType: isNumberLike,
  sqlAggregateWrap(sqlFrag) {
    return sql`stddev_samp(${sqlFrag})`;
  },
  pgTypeCodecModifier(codec) {
    const oid = codec.extensions?.oid;
    return (oid ? dataTypeToAggregateTypeMap4[oid] : null) ?? TYPES.numeric;
  }
};
const dataTypeToAggregateTypeMap5 = {
  "700": TYPES.float,
  "701": TYPES.float
};
const aggregateSpec6 = {
  id: "stddevPopulation",
  humanLabel: "population standard deviation",
  HumanLabel: "Population standard deviation",
  isSuitableType: isNumberLike,
  sqlAggregateWrap(sqlFrag) {
    return sql`stddev_pop(${sqlFrag})`;
  },
  pgTypeCodecModifier(codec) {
    const oid = codec.extensions?.oid;
    return (oid ? dataTypeToAggregateTypeMap5[oid] : null) ?? TYPES.numeric;
  }
};
const dataTypeToAggregateTypeMap6 = {
  "700": TYPES.float,
  "701": TYPES.float
};
const aggregateSpec7 = {
  id: "varianceSample",
  humanLabel: "sample variance",
  HumanLabel: "Sample variance",
  isSuitableType: isNumberLike,
  sqlAggregateWrap(sqlFrag) {
    return sql`var_samp(${sqlFrag})`;
  },
  pgTypeCodecModifier(codec) {
    const oid = codec.extensions?.oid;
    return (oid ? dataTypeToAggregateTypeMap6[oid] : null) ?? TYPES.numeric;
  }
};
const dataTypeToAggregateTypeMap7 = {
  "700": TYPES.float,
  "701": TYPES.float
};
const aggregateSpec8 = {
  id: "variancePopulation",
  humanLabel: "population variance",
  HumanLabel: "Population variance",
  isSuitableType: isNumberLike,
  sqlAggregateWrap(sqlFrag) {
    return sql`var_pop(${sqlFrag})`;
  },
  pgTypeCodecModifier(codec) {
    const oid = codec.extensions?.oid;
    return (oid ? dataTypeToAggregateTypeMap7[oid] : null) ?? TYPES.numeric;
  }
};
const colSpec = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_project.attributes.id
};
const colSpec2 = {
  fieldName: "name",
  attributeName: "name",
  attribute: spec_project.attributes.name
};
const colSpec3 = {
  fieldName: "description",
  attributeName: "description",
  attribute: spec_project.attributes.description
};
const colSpec4 = {
  fieldName: "prefix",
  attributeName: "prefix",
  attribute: spec_project.attributes.prefix
};
const colSpec5 = {
  fieldName: "color",
  attributeName: "color",
  attribute: spec_project.attributes.color
};
const colSpec6 = {
  fieldName: "labels",
  attributeName: "labels",
  attribute: spec_project.attributes.labels
};
const colSpec7 = {
  fieldName: "workspaceId",
  attributeName: "workspace_id",
  attribute: spec_project.attributes.workspace_id
};
const colSpec8 = {
  fieldName: "viewMode",
  attributeName: "view_mode",
  attribute: spec_project.attributes.view_mode
};
const colSpec9 = {
  fieldName: "createdAt",
  attributeName: "created_at",
  attribute: spec_project.attributes.created_at
};
const colSpec10 = {
  fieldName: "updatedAt",
  attributeName: "updated_at",
  attribute: spec_project.attributes.updated_at
};
function assertAllowed19(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed20(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed21(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
const resolve12 = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec4 = () => TYPES.boolean;
const resolveSqlValue2 = () => sql.null;
const resolve13 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive2 = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains2(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec5(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive2.includes(resolveDomains2(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive2.includes(resolveDomains2(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier2(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive2.includes(resolveDomains2(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive2.includes(resolveDomains2(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve14 = (i, v) => sql`${i} <> ${v}`;
const resolve15 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve16 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve17 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec6(c) {
  if (forceTextTypesSensitive2.includes(resolveDomains2(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve18 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve19 = (i, v) => sql`${i} < ${v}`;
const resolve20 = (i, v) => sql`${i} <= ${v}`;
const resolve21 = (i, v) => sql`${i} > ${v}`;
const resolve22 = (i, v) => sql`${i} >= ${v}`;
const resolve23 = (i, v) => sql`${i} LIKE ${v}`;
function escapeLikeWildcards(input) {
  if (typeof input !== "string") throw new Error("Non-string input was provided to escapeLikeWildcards");else return input.split("%").join("\\%").split("_").join("\\_");
}
const resolveInput = input => `%${escapeLikeWildcards(input)}%`;
const resolve24 = (i, v) => sql`${i} NOT LIKE ${v}`;
const resolveInput2 = input => `%${escapeLikeWildcards(input)}%`;
const resolve25 = (i, v) => sql`${i} ILIKE ${v}`;
const resolveInput3 = input => `%${escapeLikeWildcards(input)}%`;
const forceTextTypesInsensitive = [TYPES.char, TYPES.bpchar];
function resolveInputCodec7(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesInsensitive.includes(resolveDomains2(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesInsensitive.includes(resolveDomains2(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier3(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesInsensitive.includes(resolveDomains2(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesInsensitive.includes(resolveDomains2(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve26 = (i, v) => sql`${i} NOT ILIKE ${v}`;
const resolveInput4 = input => `%${escapeLikeWildcards(input)}%`;
const resolve27 = (i, v) => sql`${i} LIKE ${v}`;
const resolveInput5 = input => `${escapeLikeWildcards(input)}%`;
const resolve28 = (i, v) => sql`${i} NOT LIKE ${v}`;
const resolveInput6 = input => `${escapeLikeWildcards(input)}%`;
const resolve29 = (i, v) => sql`${i} ILIKE ${v}`;
const resolveInput7 = input => `${escapeLikeWildcards(input)}%`;
const resolve30 = (i, v) => sql`${i} NOT ILIKE ${v}`;
const resolveInput8 = input => `${escapeLikeWildcards(input)}%`;
const resolve31 = (i, v) => sql`${i} LIKE ${v}`;
const resolveInput9 = input => `%${escapeLikeWildcards(input)}`;
const resolve32 = (i, v) => sql`${i} NOT LIKE ${v}`;
const resolveInput10 = input => `%${escapeLikeWildcards(input)}`;
const resolve33 = (i, v) => sql`${i} ILIKE ${v}`;
const resolveInput11 = input => `%${escapeLikeWildcards(input)}`;
const resolve34 = (i, v) => sql`${i} NOT ILIKE ${v}`;
const resolveInput12 = input => `%${escapeLikeWildcards(input)}`;
const resolve35 = (i, v) => sql`${i} LIKE ${v}`;
const resolve36 = (i, v) => sql`${i} NOT LIKE ${v}`;
const resolve37 = (i, v) => sql`${i} ILIKE ${v}`;
const resolve38 = (i, v) => sql`${i} NOT ILIKE ${v}`;
function resolveInputCodec8(inputCodec) {
  if ("equalTo" === "in" || "equalTo" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier4(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue3(_unused, input, inputCodec) {
  if ("equalTo" === "in" || "equalTo" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec9(inputCodec) {
  if ("notEqualTo" === "in" || "notEqualTo" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier5(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue4(_unused, input, inputCodec) {
  if ("notEqualTo" === "in" || "notEqualTo" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec10(inputCodec) {
  if ("distinctFrom" === "in" || "distinctFrom" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier6(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue5(_unused, input, inputCodec) {
  if ("distinctFrom" === "in" || "distinctFrom" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec11(inputCodec) {
  if ("notDistinctFrom" === "in" || "notDistinctFrom" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier7(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue6(_unused, input, inputCodec) {
  if ("notDistinctFrom" === "in" || "notDistinctFrom" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec12(inputCodec) {
  if ("in" === "in" || "in" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier8(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue7(_unused, input, inputCodec) {
  if ("in" === "in" || "in" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec13(inputCodec) {
  if ("notIn" === "in" || "notIn" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier9(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue8(_unused, input, inputCodec) {
  if ("notIn" === "in" || "notIn" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec14(inputCodec) {
  if ("lessThan" === "in" || "lessThan" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier10(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue9(_unused, input, inputCodec) {
  if ("lessThan" === "in" || "lessThan" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec15(inputCodec) {
  if ("lessThanOrEqualTo" === "in" || "lessThanOrEqualTo" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier11(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue10(_unused, input, inputCodec) {
  if ("lessThanOrEqualTo" === "in" || "lessThanOrEqualTo" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec16(inputCodec) {
  if ("greaterThan" === "in" || "greaterThan" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier12(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue11(_unused, input, inputCodec) {
  if ("greaterThan" === "in" || "greaterThan" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
function resolveInputCodec17(inputCodec) {
  if ("greaterThanOrEqualTo" === "in" || "greaterThanOrEqualTo" === "notIn") {
    const t = resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
    return listOfCodec(t, {
      extensions: {
        listItemNonNull: !0
      }
    });
  } else return resolveDomains2(inputCodec) === TYPES.citext ? inputCodec : TYPES.text;
}
function resolveSqlIdentifier13(sourceAlias, codec) {
  return resolveDomains2(codec) === TYPES.citext ? [sourceAlias, codec] : [sql`lower(${sourceAlias}::text)`, TYPES.text];
}
function resolveSqlValue12(_unused, input, inputCodec) {
  if ("greaterThanOrEqualTo" === "in" || "greaterThanOrEqualTo" === "notIn") {
    const sqlList = sqlValueWithCodec(input, inputCodec);
    if (inputCodec.arrayOfCodec === TYPES.citext) return sqlList;else return sql`(select lower(t) from unnest(${sqlList}) t)`;
  } else {
    const sqlValue = sqlValueWithCodec(input, inputCodec);
    if (inputCodec === TYPES.citext) return sqlValue;else return sql`lower(${sqlValue})`;
  }
}
const resolve39 = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec18 = () => TYPES.boolean;
const resolveSqlValue13 = () => sql.null;
const resolve40 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive3 = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains3(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec19(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive3.includes(resolveDomains3(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive3.includes(resolveDomains3(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier14(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive3.includes(resolveDomains3(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive3.includes(resolveDomains3(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve41 = (i, v) => sql`${i} <> ${v}`;
const resolve42 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve43 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve44 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec20(c) {
  if (forceTextTypesSensitive3.includes(resolveDomains3(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve45 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve46 = (i, v) => sql`${i} < ${v}`;
const resolve47 = (i, v) => sql`${i} <= ${v}`;
const resolve48 = (i, v) => sql`${i} > ${v}`;
const resolve49 = (i, v) => sql`${i} >= ${v}`;
const resolve50 = (i, v) => sql`${i} @> ${v}`;
const resolve51 = (i, v) => sql`${i} ? ${v}`;
const resolveInputCodec21 = () => TYPES.text;
const resolve52 = (i, v) => sql`${i} ?& ${v}`;
const resolveInputCodec22 = () => listOfCodec(TYPES.text, {
  extensions: {
    listItemNonNull: !0
  }
});
const resolve53 = (i, v) => sql`${i} ?| ${v}`;
const resolve54 = (i, v) => sql`${i} <@ ${v}`;
const resolve55 = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec23 = () => TYPES.boolean;
const resolveSqlValue14 = () => sql.null;
const resolve56 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive4 = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains4(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec24(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive4.includes(resolveDomains4(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive4.includes(resolveDomains4(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier15(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive4.includes(resolveDomains4(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive4.includes(resolveDomains4(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve57 = (i, v) => sql`${i} <> ${v}`;
const resolve58 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve59 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve60 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec25(c) {
  if (forceTextTypesSensitive4.includes(resolveDomains4(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve61 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve62 = (i, v) => sql`${i} < ${v}`;
const resolve63 = (i, v) => sql`${i} <= ${v}`;
const resolve64 = (i, v) => sql`${i} > ${v}`;
const resolve65 = (i, v) => sql`${i} >= ${v}`;
function assertAllowed22(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const PgAggregateConditionExpression = class PgAggregateConditionExpression extends Modifier {
  spec;
  pgWhereConditionSpecListToSQL;
  alias;
  conditions = [];
  constructor(parent, spec, pgWhereConditionSpecListToSQL) {
    super(parent);
    this.spec = spec;
    this.pgWhereConditionSpecListToSQL = pgWhereConditionSpecListToSQL;
    this.alias = parent.alias;
  }
  where(condition) {
    this.conditions.push(condition);
  }
  apply() {
    const sqlCondition = this.pgWhereConditionSpecListToSQL(this.alias, this.conditions);
    if (sqlCondition) this.parent.expression(sqlCondition);
  }
};
const PgAggregateCondition = class PgAggregateCondition extends Modifier {
  pgWhereConditionSpecListToSQL;
  sql;
  tableExpression;
  alias;
  conditions = [];
  expressions = [];
  constructor(parent, options, pgWhereConditionSpecListToSQL) {
    super(parent);
    this.pgWhereConditionSpecListToSQL = pgWhereConditionSpecListToSQL;
    const {
      sql,
      tableExpression,
      alias
    } = options;
    this.sql = sql;
    this.alias = sql.identifier(Symbol(alias ?? "aggregate"));
    this.tableExpression = tableExpression;
  }
  where(condition) {
    this.conditions.push(condition);
  }
  expression(expression) {
    this.expressions.push(expression);
  }
  forAggregate(spec) {
    return new PgAggregateConditionExpression(this, spec, this.pgWhereConditionSpecListToSQL);
  }
  apply() {
    const {
        sql
      } = this,
      sqlCondition = this.pgWhereConditionSpecListToSQL(this.alias, this.conditions),
      where = sqlCondition ? sql`where ${sqlCondition}` : sql.blank,
      boolExpr = this.expressions.length === 0 ? sql.true : sql.parens(sql.join(this.expressions.map(expr => sql.parens(expr)), `
and
`)),
      subquery = sql`(${sql.indent`\
select ${boolExpr}
from ${this.tableExpression} as ${this.alias}
${where}`}
group by ())`;
    return this.parent.where(subquery);
  }
};
const colSpec11 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_column.attributes.id
};
const colSpec12 = {
  fieldName: "title",
  attributeName: "title",
  attribute: spec_column.attributes.title
};
const colSpec13 = {
  fieldName: "projectId",
  attributeName: "project_id",
  attribute: spec_column.attributes.project_id
};
const colSpec14 = {
  fieldName: "createdAt",
  attributeName: "created_at",
  attribute: spec_column.attributes.created_at
};
const colSpec15 = {
  fieldName: "updatedAt",
  attributeName: "updated_at",
  attribute: spec_column.attributes.updated_at
};
function assertAllowed23(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed24(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed25(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed26(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec16 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_task.attributes.id
};
const colSpec17 = {
  fieldName: "content",
  attributeName: "content",
  attribute: spec_task.attributes.content
};
const colSpec18 = {
  fieldName: "description",
  attributeName: "description",
  attribute: spec_task.attributes.description
};
const colSpec19 = {
  fieldName: "priority",
  attributeName: "priority",
  attribute: spec_task.attributes.priority
};
const colSpec20 = {
  fieldName: "authorId",
  attributeName: "author_id",
  attribute: spec_task.attributes.author_id
};
const colSpec21 = {
  fieldName: "columnId",
  attributeName: "column_id",
  attribute: spec_task.attributes.column_id
};
const colSpec22 = {
  fieldName: "labels",
  attributeName: "labels",
  attribute: spec_task.attributes.labels
};
const colSpec23 = {
  fieldName: "dueDate",
  attributeName: "due_date",
  attribute: spec_task.attributes.due_date
};
const colSpec24 = {
  fieldName: "createdAt",
  attributeName: "created_at",
  attribute: spec_task.attributes.created_at
};
const colSpec25 = {
  fieldName: "updatedAt",
  attributeName: "updated_at",
  attribute: spec_task.attributes.updated_at
};
const colSpec26 = {
  fieldName: "columnIndex",
  attributeName: "column_index",
  attribute: spec_task.attributes.column_index
};
function assertAllowed27(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed28(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed29(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const resolve66 = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec26 = () => TYPES.boolean;
const resolveSqlValue15 = () => sql.null;
const resolve67 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive5 = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains5(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec27(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive5.includes(resolveDomains5(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive5.includes(resolveDomains5(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier16(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive5.includes(resolveDomains5(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive5.includes(resolveDomains5(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve68 = (i, v) => sql`${i} <> ${v}`;
const resolve69 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve70 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve71 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec28(c) {
  if (forceTextTypesSensitive5.includes(resolveDomains5(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve72 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve73 = (i, v) => sql`${i} < ${v}`;
const resolve74 = (i, v) => sql`${i} <= ${v}`;
const resolve75 = (i, v) => sql`${i} > ${v}`;
const resolve76 = (i, v) => sql`${i} >= ${v}`;
function assertAllowed30(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec27 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_assignee.attributes.id
};
const colSpec28 = {
  fieldName: "userId",
  attributeName: "user_id",
  attribute: spec_assignee.attributes.user_id
};
const colSpec29 = {
  fieldName: "taskId",
  attributeName: "task_id",
  attribute: spec_assignee.attributes.task_id
};
const colSpec30 = {
  fieldName: "createdAt",
  attributeName: "created_at",
  attribute: spec_assignee.attributes.created_at
};
const colSpec31 = {
  fieldName: "updatedAt",
  attributeName: "updated_at",
  attribute: spec_assignee.attributes.updated_at
};
const colSpec32 = {
  fieldName: "deletedAt",
  attributeName: "deleted_at",
  attribute: spec_assignee.attributes.deleted_at
};
function assertAllowed31(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed32(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec33 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_user.attributes.id
};
const colSpec34 = {
  fieldName: "identityProviderId",
  attributeName: "identity_provider_id",
  attribute: spec_user.attributes.identity_provider_id
};
const colSpec35 = {
  fieldName: "name",
  attributeName: "name",
  attribute: spec_user.attributes.name
};
const colSpec36 = {
  fieldName: "avatarUrl",
  attributeName: "avatar_url",
  attribute: spec_user.attributes.avatar_url
};
const colSpec37 = {
  fieldName: "createdAt",
  attributeName: "created_at",
  attribute: spec_user.attributes.created_at
};
const colSpec38 = {
  fieldName: "updatedAt",
  attributeName: "updated_at",
  attribute: spec_user.attributes.updated_at
};
function assertAllowed33(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed34(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed35(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const resolve77 = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec29 = () => TYPES.boolean;
const resolveSqlValue16 = () => sql.null;
const resolve78 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive6 = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains6(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec30(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive6.includes(resolveDomains6(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive6.includes(resolveDomains6(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier17(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive6.includes(resolveDomains6(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive6.includes(resolveDomains6(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve79 = (i, v) => sql`${i} <> ${v}`;
const resolve80 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve81 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve82 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec31(c) {
  if (forceTextTypesSensitive6.includes(resolveDomains6(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve83 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve84 = (i, v) => sql`${i} < ${v}`;
const resolve85 = (i, v) => sql`${i} <= ${v}`;
const resolve86 = (i, v) => sql`${i} > ${v}`;
const resolve87 = (i, v) => sql`${i} >= ${v}`;
function assertAllowed36(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec39 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_post.attributes.id
};
const colSpec40 = {
  fieldName: "title",
  attributeName: "title",
  attribute: spec_post.attributes.title
};
const colSpec41 = {
  fieldName: "description",
  attributeName: "description",
  attribute: spec_post.attributes.description
};
const colSpec42 = {
  fieldName: "authorId",
  attributeName: "author_id",
  attribute: spec_post.attributes.author_id
};
const colSpec43 = {
  fieldName: "taskId",
  attributeName: "task_id",
  attribute: spec_post.attributes.task_id
};
const colSpec44 = {
  fieldName: "createdAt",
  attributeName: "created_at",
  attribute: spec_post.attributes.created_at
};
const colSpec45 = {
  fieldName: "updatedAt",
  attributeName: "updated_at",
  attribute: spec_post.attributes.updated_at
};
function assertAllowed37(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed38(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed39(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const resolve88 = (i, _v, input) => sql`${i} ${input ? sql`IS NULL` : sql`IS NOT NULL`}`;
const resolveInputCodec32 = () => TYPES.boolean;
const resolveSqlValue17 = () => sql.null;
const resolve89 = (i, v) => sql`${i} = ${v}`;
const forceTextTypesSensitive7 = [TYPES.citext, TYPES.char, TYPES.bpchar];
function resolveDomains7(c) {
  let current = c;
  while (current.domainOfCodec) current = current.domainOfCodec;
  return current;
}
function resolveInputCodec33(c) {
  if (c.arrayOfCodec) {
    if (forceTextTypesSensitive7.includes(resolveDomains7(c.arrayOfCodec))) return listOfCodec(TYPES.text, {
      extensions: {
        listItemNonNull: c.extensions?.listItemNonNull
      }
    });
    return c;
  } else {
    if (forceTextTypesSensitive7.includes(resolveDomains7(c))) return TYPES.text;
    return c;
  }
}
function resolveSqlIdentifier18(identifier, c) {
  if (c.arrayOfCodec && forceTextTypesSensitive7.includes(resolveDomains7(c.arrayOfCodec))) return [sql`(${identifier})::text[]`, listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: c.extensions?.listItemNonNull
    }
  })];else if (forceTextTypesSensitive7.includes(resolveDomains7(c))) return [sql`(${identifier})::text`, TYPES.text];else return [identifier, c];
}
const resolve90 = (i, v) => sql`${i} <> ${v}`;
const resolve91 = (i, v) => sql`${i} IS DISTINCT FROM ${v}`;
const resolve92 = (i, v) => sql`${i} IS NOT DISTINCT FROM ${v}`;
const resolve93 = (i, v) => sql`${i} = ANY(${v})`;
function resolveInputCodec34(c) {
  if (forceTextTypesSensitive7.includes(resolveDomains7(c))) return listOfCodec(TYPES.text, {
    extensions: {
      listItemNonNull: !0
    }
  });else return listOfCodec(c, {
    extensions: {
      listItemNonNull: !0
    }
  });
}
const resolve94 = (i, v) => sql`${i} <> ALL(${v})`;
const resolve95 = (i, v) => sql`${i} < ${v}`;
const resolve96 = (i, v) => sql`${i} <= ${v}`;
const resolve97 = (i, v) => sql`${i} > ${v}`;
const resolve98 = (i, v) => sql`${i} >= ${v}`;
function assertAllowed40(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec46 = {
  fieldName: "workspaceId",
  attributeName: "workspace_id",
  attribute: spec_workspaceUser.attributes.workspace_id
};
const colSpec47 = {
  fieldName: "userId",
  attributeName: "user_id",
  attribute: spec_workspaceUser.attributes.user_id
};
const colSpec48 = {
  fieldName: "createdAt",
  attributeName: "created_at",
  attribute: spec_workspaceUser.attributes.created_at
};
function assertAllowed41(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed42(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const colSpec49 = {
  fieldName: "rowId",
  attributeName: "id",
  attribute: spec_workspace.attributes.id
};
const colSpec50 = {
  fieldName: "name",
  attributeName: "name",
  attribute: spec_workspace.attributes.name
};
const colSpec51 = {
  fieldName: "createdAt",
  attributeName: "created_at",
  attribute: spec_workspace.attributes.created_at
};
const colSpec52 = {
  fieldName: "updatedAt",
  attributeName: "updated_at",
  attribute: spec_workspace.attributes.updated_at
};
function assertAllowed43(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed44(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed45(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed46(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
function assertAllowed47(value, mode) {
  if (mode === "object" && !true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
  if (mode === "list" && !true) {
    const arr = value;
    if (arr) {
      const l = arr.length;
      for (let i = 0; i < l; i++) if (isEmpty(arr[i])) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
    }
  }
  if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
}
const relation = registry.pgRelations["project"]["columnsByTheirProjectId"];
const relation2 = registry.pgRelations["column"]["tasksByTheirColumnId"];
const infix7 = () => sql.fragment`=`;
const infix8 = () => sql.fragment`<>`;
const infix9 = () => sql.fragment`>`;
const infix10 = () => sql.fragment`>=`;
const infix11 = () => sql.fragment`<`;
const infix12 = () => sql.fragment`<=`;
const relation3 = registry.pgRelations["task"]["assigneesByTheirTaskId"];
const relation4 = registry.pgRelations["task"]["postsByTheirTaskId"];
const relation5 = registry.pgRelations["workspace"]["projectsByTheirWorkspaceId"];
const relation6 = registry.pgRelations["workspace"]["workspaceUsersByTheirWorkspaceId"];
const relation7 = registry.pgRelations["user"]["assigneesByTheirUserId"];
const relation8 = registry.pgRelations["user"]["postsByTheirAuthorId"];
const relation9 = registry.pgRelations["user"]["tasksByTheirAuthorId"];
const relation10 = registry.pgRelations["user"]["workspaceUsersByTheirUserId"];
const specFromArgs_WorkspaceUser = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.WorkspaceUser, $nodeId);
};
const specFromArgs_Workspace = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Workspace, $nodeId);
};
const specFromArgs_Column = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Column, $nodeId);
};
const specFromArgs_User = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.User, $nodeId);
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
const specFromArgs_WorkspaceUser2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.WorkspaceUser, $nodeId);
};
const specFromArgs_Workspace2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Workspace, $nodeId);
};
const specFromArgs_Column2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.Column, $nodeId);
};
const specFromArgs_User2 = args => {
  const $nodeId = args.getRaw(["input", "id"]);
  return specFromNodeId(nodeIdHandlerByTypeName.User, $nodeId);
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

  """Get a single \`WorkspaceUser\`."""
  workspaceUser(workspaceId: UUID!, userId: UUID!): WorkspaceUser

  """Get a single \`Workspace\`."""
  workspace(rowId: UUID!): Workspace

  """Get a single \`Column\`."""
  column(rowId: UUID!): Column

  """Get a single \`User\`."""
  user(rowId: UUID!): User

  """Get a single \`User\`."""
  userByIdentityProviderId(identityProviderId: UUID!): User

  """Get a single \`Assignee\`."""
  assignee(rowId: UUID!): Assignee

  """Get a single \`Post\`."""
  post(rowId: UUID!): Post

  """Get a single \`Project\`."""
  project(rowId: UUID!): Project

  """Get a single \`Task\`."""
  task(rowId: UUID!): Task

  """Reads a single \`WorkspaceUser\` using its globally unique \`ID\`."""
  workspaceUserById(
    """
    The globally unique \`ID\` to be used in selecting a single \`WorkspaceUser\`.
    """
    id: ID!
  ): WorkspaceUser

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

  """Reads a single \`User\` using its globally unique \`ID\`."""
  userById(
    """The globally unique \`ID\` to be used in selecting a single \`User\`."""
    id: ID!
  ): User

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

type User implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  identityProviderId: UUID!
  name: String!
  avatarUrl: String
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

  """Reads and enables pagination through a set of \`Task\`."""
  authoredTasks(
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

  """
  Aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  aggregates: AssigneeAggregates

  """
  Grouped aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  groupedAggregates(
    """The method to use when grouping \`Assignee\` for these aggregates."""
    groupBy: [AssigneeGroupBy!]!

    """Conditions on the grouped aggregates."""
    having: AssigneeHavingInput
  ): [AssigneeAggregates!]
}

type Assignee implements Node {
  """
  A globally unique identifier. Can be used in various places throughout the system to identify this single value.
  """
  id: ID!
  rowId: UUID!
  userId: UUID!
  taskId: UUID!
  createdAt: Datetime
  updatedAt: Datetime
  deletedAt: Datetime

  """Reads a single \`Task\` that is related to this \`Assignee\`."""
  task: Task

  """Reads a single \`User\` that is related to this \`Assignee\`."""
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
  authorId: UUID!
  columnId: UUID!
  labels: JSON
  dueDate: Datetime
  createdAt: Datetime
  updatedAt: Datetime
  columnIndex: Int!

  """Reads a single \`User\` that is related to this \`Task\`."""
  author: User

  """Reads a single \`Column\` that is related to this \`Task\`."""
  column: Column

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
  ): PostConnection!
}

"""
Represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).
"""
scalar JSON

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
}

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

  """
  Aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  aggregates: ProjectAggregates

  """
  Grouped aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  groupedAggregates(
    """The method to use when grouping \`Project\` for these aggregates."""
    groupBy: [ProjectGroupBy!]!

    """Conditions on the grouped aggregates."""
    having: ProjectHavingInput
  ): [ProjectAggregates!]
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

type ProjectAggregates {
  keys: [String]

  """
  Distinct count aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  distinctCount: ProjectDistinctCountAggregates
}

type ProjectDistinctCountAggregates {
  """Distinct count of rowId across the matching connection"""
  rowId: BigInt

  """Distinct count of name across the matching connection"""
  name: BigInt

  """Distinct count of description across the matching connection"""
  description: BigInt

  """Distinct count of prefix across the matching connection"""
  prefix: BigInt

  """Distinct count of color across the matching connection"""
  color: BigInt

  """Distinct count of labels across the matching connection"""
  labels: BigInt

  """Distinct count of workspaceId across the matching connection"""
  workspaceId: BigInt

  """Distinct count of viewMode across the matching connection"""
  viewMode: BigInt

  """Distinct count of createdAt across the matching connection"""
  createdAt: BigInt

  """Distinct count of updatedAt across the matching connection"""
  updatedAt: BigInt
}

"""
A signed eight-byte integer. The upper big integer values are greater than the
max value for a JavaScript number. Therefore all big integers will be output as
strings and not numbers.
"""
scalar BigInt

"""Grouping methods for \`Project\` for usage during aggregation."""
enum ProjectGroupBy {
  NAME
  DESCRIPTION
  PREFIX
  COLOR
  LABELS
  WORKSPACE_ID
  VIEW_MODE
  CREATED_AT
  CREATED_AT_TRUNCATED_TO_HOUR
  CREATED_AT_TRUNCATED_TO_DAY
  UPDATED_AT
  UPDATED_AT_TRUNCATED_TO_HOUR
  UPDATED_AT_TRUNCATED_TO_DAY
}

"""Conditions for \`Project\` aggregates."""
input ProjectHavingInput {
  AND: [ProjectHavingInput!]
  OR: [ProjectHavingInput!]
  sum: ProjectHavingSumInput
  distinctCount: ProjectHavingDistinctCountInput
  min: ProjectHavingMinInput
  max: ProjectHavingMaxInput
  average: ProjectHavingAverageInput
  stddevSample: ProjectHavingStddevSampleInput
  stddevPopulation: ProjectHavingStddevPopulationInput
  varianceSample: ProjectHavingVarianceSampleInput
  variancePopulation: ProjectHavingVariancePopulationInput
}

input ProjectHavingSumInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input HavingDatetimeFilter {
  equalTo: Datetime
  notEqualTo: Datetime
  greaterThan: Datetime
  greaterThanOrEqualTo: Datetime
  lessThan: Datetime
  lessThanOrEqualTo: Datetime
}

input ProjectHavingDistinctCountInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ProjectHavingMinInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ProjectHavingMaxInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ProjectHavingAverageInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ProjectHavingStddevSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ProjectHavingStddevPopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ProjectHavingVarianceSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ProjectHavingVariancePopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

"""
A condition to be used against \`Project\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input ProjectCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`name\` field."""
  name: String

  """Checks for equality with the object’s \`description\` field."""
  description: String

  """Checks for equality with the object’s \`prefix\` field."""
  prefix: String

  """Checks for equality with the object’s \`color\` field."""
  color: String

  """Checks for equality with the object’s \`labels\` field."""
  labels: JSON

  """Checks for equality with the object’s \`workspaceId\` field."""
  workspaceId: UUID

  """Checks for equality with the object’s \`viewMode\` field."""
  viewMode: String

  """Checks for equality with the object’s \`createdAt\` field."""
  createdAt: Datetime

  """Checks for equality with the object’s \`updatedAt\` field."""
  updatedAt: Datetime
}

"""
A filter to be used against \`Project\` object types. All fields are combined with a logical ‘and.’
"""
input ProjectFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`name\` field."""
  name: StringFilter

  """Filter by the object’s \`description\` field."""
  description: StringFilter

  """Filter by the object’s \`prefix\` field."""
  prefix: StringFilter

  """Filter by the object’s \`color\` field."""
  color: StringFilter

  """Filter by the object’s \`labels\` field."""
  labels: JSONFilter

  """Filter by the object’s \`workspaceId\` field."""
  workspaceId: UUIDFilter

  """Filter by the object’s \`viewMode\` field."""
  viewMode: StringFilter

  """Filter by the object’s \`createdAt\` field."""
  createdAt: DatetimeFilter

  """Filter by the object’s \`updatedAt\` field."""
  updatedAt: DatetimeFilter

  """Filter by the object’s \`columns\` relation."""
  columns: ProjectToManyColumnFilter

  """Some related \`columns\` exist."""
  columnsExist: Boolean

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
A filter to be used against String fields. All fields are combined with a logical ‘and.’
"""
input StringFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: String

  """Not equal to the specified value."""
  notEqualTo: String

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: String

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: String

  """Included in the specified list."""
  in: [String!]

  """Not included in the specified list."""
  notIn: [String!]

  """Less than the specified value."""
  lessThan: String

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: String

  """Greater than the specified value."""
  greaterThan: String

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: String

  """Contains the specified string (case-sensitive)."""
  includes: String

  """Does not contain the specified string (case-sensitive)."""
  notIncludes: String

  """Contains the specified string (case-insensitive)."""
  includesInsensitive: String

  """Does not contain the specified string (case-insensitive)."""
  notIncludesInsensitive: String

  """Starts with the specified string (case-sensitive)."""
  startsWith: String

  """Does not start with the specified string (case-sensitive)."""
  notStartsWith: String

  """Starts with the specified string (case-insensitive)."""
  startsWithInsensitive: String

  """Does not start with the specified string (case-insensitive)."""
  notStartsWithInsensitive: String

  """Ends with the specified string (case-sensitive)."""
  endsWith: String

  """Does not end with the specified string (case-sensitive)."""
  notEndsWith: String

  """Ends with the specified string (case-insensitive)."""
  endsWithInsensitive: String

  """Does not end with the specified string (case-insensitive)."""
  notEndsWithInsensitive: String

  """
  Matches the specified pattern (case-sensitive). An underscore (_) matches any single character; a percent sign (%) matches any sequence of zero or more characters.
  """
  like: String

  """
  Does not match the specified pattern (case-sensitive). An underscore (_) matches any single character; a percent sign (%) matches any sequence of zero or more characters.
  """
  notLike: String

  """
  Matches the specified pattern (case-insensitive). An underscore (_) matches any single character; a percent sign (%) matches any sequence of zero or more characters.
  """
  likeInsensitive: String

  """
  Does not match the specified pattern (case-insensitive). An underscore (_) matches any single character; a percent sign (%) matches any sequence of zero or more characters.
  """
  notLikeInsensitive: String

  """Equal to the specified value (case-insensitive)."""
  equalToInsensitive: String

  """Not equal to the specified value (case-insensitive)."""
  notEqualToInsensitive: String

  """
  Not equal to the specified value, treating null like an ordinary value (case-insensitive).
  """
  distinctFromInsensitive: String

  """
  Equal to the specified value, treating null like an ordinary value (case-insensitive).
  """
  notDistinctFromInsensitive: String

  """Included in the specified list (case-insensitive)."""
  inInsensitive: [String!]

  """Not included in the specified list (case-insensitive)."""
  notInInsensitive: [String!]

  """Less than the specified value (case-insensitive)."""
  lessThanInsensitive: String

  """Less than or equal to the specified value (case-insensitive)."""
  lessThanOrEqualToInsensitive: String

  """Greater than the specified value (case-insensitive)."""
  greaterThanInsensitive: String

  """Greater than or equal to the specified value (case-insensitive)."""
  greaterThanOrEqualToInsensitive: String
}

"""
A filter to be used against JSON fields. All fields are combined with a logical ‘and.’
"""
input JSONFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: JSON

  """Not equal to the specified value."""
  notEqualTo: JSON

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: JSON

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: JSON

  """Included in the specified list."""
  in: [JSON!]

  """Not included in the specified list."""
  notIn: [JSON!]

  """Less than the specified value."""
  lessThan: JSON

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: JSON

  """Greater than the specified value."""
  greaterThan: JSON

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: JSON

  """Contains the specified JSON."""
  contains: JSON

  """Contains the specified key."""
  containsKey: String

  """Contains all of the specified keys."""
  containsAllKeys: [String!]

  """Contains any of the specified keys."""
  containsAnyKeys: [String!]

  """Contained by the specified JSON."""
  containedBy: JSON
}

"""
A filter to be used against Datetime fields. All fields are combined with a logical ‘and.’
"""
input DatetimeFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: Datetime

  """Not equal to the specified value."""
  notEqualTo: Datetime

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: Datetime

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: Datetime

  """Included in the specified list."""
  in: [Datetime!]

  """Not included in the specified list."""
  notIn: [Datetime!]

  """Less than the specified value."""
  lessThan: Datetime

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: Datetime

  """Greater than the specified value."""
  greaterThan: Datetime

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: Datetime
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

  """Aggregates across related \`Column\` match the filter criteria."""
  aggregates: ColumnAggregatesFilter
}

"""
A filter to be used against \`Column\` object types. All fields are combined with a logical ‘and.’
"""
input ColumnFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`title\` field."""
  title: StringFilter

  """Filter by the object’s \`projectId\` field."""
  projectId: UUIDFilter

  """Filter by the object’s \`createdAt\` field."""
  createdAt: DatetimeFilter

  """Filter by the object’s \`updatedAt\` field."""
  updatedAt: DatetimeFilter

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

  """Aggregates across related \`Task\` match the filter criteria."""
  aggregates: TaskAggregatesFilter
}

"""
A filter to be used against \`Task\` object types. All fields are combined with a logical ‘and.’
"""
input TaskFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`content\` field."""
  content: StringFilter

  """Filter by the object’s \`description\` field."""
  description: StringFilter

  """Filter by the object’s \`priority\` field."""
  priority: StringFilter

  """Filter by the object’s \`authorId\` field."""
  authorId: UUIDFilter

  """Filter by the object’s \`columnId\` field."""
  columnId: UUIDFilter

  """Filter by the object’s \`labels\` field."""
  labels: JSONFilter

  """Filter by the object’s \`dueDate\` field."""
  dueDate: DatetimeFilter

  """Filter by the object’s \`createdAt\` field."""
  createdAt: DatetimeFilter

  """Filter by the object’s \`updatedAt\` field."""
  updatedAt: DatetimeFilter

  """Filter by the object’s \`columnIndex\` field."""
  columnIndex: IntFilter

  """Filter by the object’s \`assignees\` relation."""
  assignees: TaskToManyAssigneeFilter

  """Some related \`assignees\` exist."""
  assigneesExist: Boolean

  """Filter by the object’s \`posts\` relation."""
  posts: TaskToManyPostFilter

  """Some related \`posts\` exist."""
  postsExist: Boolean

  """Filter by the object’s \`author\` relation."""
  author: UserFilter

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
A filter to be used against Int fields. All fields are combined with a logical ‘and.’
"""
input IntFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: Int

  """Not equal to the specified value."""
  notEqualTo: Int

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: Int

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: Int

  """Included in the specified list."""
  in: [Int!]

  """Not included in the specified list."""
  notIn: [Int!]

  """Less than the specified value."""
  lessThan: Int

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: Int

  """Greater than the specified value."""
  greaterThan: Int

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: Int
}

"""
A filter to be used against many \`Assignee\` object types. All fields are combined with a logical ‘and.’
"""
input TaskToManyAssigneeFilter {
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

  """Aggregates across related \`Assignee\` match the filter criteria."""
  aggregates: AssigneeAggregatesFilter
}

"""
A filter to be used against \`Assignee\` object types. All fields are combined with a logical ‘and.’
"""
input AssigneeFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`userId\` field."""
  userId: UUIDFilter

  """Filter by the object’s \`taskId\` field."""
  taskId: UUIDFilter

  """Filter by the object’s \`createdAt\` field."""
  createdAt: DatetimeFilter

  """Filter by the object’s \`updatedAt\` field."""
  updatedAt: DatetimeFilter

  """Filter by the object’s \`deletedAt\` field."""
  deletedAt: DatetimeFilter

  """Filter by the object’s \`task\` relation."""
  task: TaskFilter

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
A filter to be used against \`User\` object types. All fields are combined with a logical ‘and.’
"""
input UserFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`identityProviderId\` field."""
  identityProviderId: UUIDFilter

  """Filter by the object’s \`name\` field."""
  name: StringFilter

  """Filter by the object’s \`avatarUrl\` field."""
  avatarUrl: StringFilter

  """Filter by the object’s \`createdAt\` field."""
  createdAt: DatetimeFilter

  """Filter by the object’s \`updatedAt\` field."""
  updatedAt: DatetimeFilter

  """Filter by the object’s \`assignees\` relation."""
  assignees: UserToManyAssigneeFilter

  """Some related \`assignees\` exist."""
  assigneesExist: Boolean

  """Filter by the object’s \`authoredPosts\` relation."""
  authoredPosts: UserToManyPostFilter

  """Some related \`authoredPosts\` exist."""
  authoredPostsExist: Boolean

  """Filter by the object’s \`authoredTasks\` relation."""
  authoredTasks: UserToManyTaskFilter

  """Some related \`authoredTasks\` exist."""
  authoredTasksExist: Boolean

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

  """Aggregates across related \`Assignee\` match the filter criteria."""
  aggregates: AssigneeAggregatesFilter
}

"""A filter to be used against aggregates of \`Assignee\` object types."""
input AssigneeAggregatesFilter {
  """
  A filter that must pass for the relevant \`Assignee\` object to be included within the aggregate.
  """
  filter: AssigneeFilter

  """Distinct count aggregate over matching \`Assignee\` objects."""
  distinctCount: AssigneeDistinctCountAggregateFilter
}

input AssigneeDistinctCountAggregateFilter {
  rowId: BigIntFilter
  userId: BigIntFilter
  taskId: BigIntFilter
  createdAt: BigIntFilter
  updatedAt: BigIntFilter
  deletedAt: BigIntFilter
}

"""
A filter to be used against BigInt fields. All fields are combined with a logical ‘and.’
"""
input BigIntFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: BigInt

  """Not equal to the specified value."""
  notEqualTo: BigInt

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: BigInt

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: BigInt

  """Included in the specified list."""
  in: [BigInt!]

  """Not included in the specified list."""
  notIn: [BigInt!]

  """Less than the specified value."""
  lessThan: BigInt

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: BigInt

  """Greater than the specified value."""
  greaterThan: BigInt

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: BigInt
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

  """Aggregates across related \`Post\` match the filter criteria."""
  aggregates: PostAggregatesFilter
}

"""
A filter to be used against \`Post\` object types. All fields are combined with a logical ‘and.’
"""
input PostFilter {
  """Filter by the object’s \`rowId\` field."""
  rowId: UUIDFilter

  """Filter by the object’s \`title\` field."""
  title: StringFilter

  """Filter by the object’s \`description\` field."""
  description: StringFilter

  """Filter by the object’s \`authorId\` field."""
  authorId: UUIDFilter

  """Filter by the object’s \`taskId\` field."""
  taskId: UUIDFilter

  """Filter by the object’s \`createdAt\` field."""
  createdAt: DatetimeFilter

  """Filter by the object’s \`updatedAt\` field."""
  updatedAt: DatetimeFilter

  """Filter by the object’s \`author\` relation."""
  author: UserFilter

  """Filter by the object’s \`task\` relation."""
  task: TaskFilter

  """Checks for all expressions in this list."""
  and: [PostFilter!]

  """Checks for any expressions in this list."""
  or: [PostFilter!]

  """Negates the expression."""
  not: PostFilter
}

"""A filter to be used against aggregates of \`Post\` object types."""
input PostAggregatesFilter {
  """
  A filter that must pass for the relevant \`Post\` object to be included within the aggregate.
  """
  filter: PostFilter

  """Distinct count aggregate over matching \`Post\` objects."""
  distinctCount: PostDistinctCountAggregateFilter
}

input PostDistinctCountAggregateFilter {
  rowId: BigIntFilter
  title: BigIntFilter
  description: BigIntFilter
  authorId: BigIntFilter
  taskId: BigIntFilter
  createdAt: BigIntFilter
  updatedAt: BigIntFilter
}

"""
A filter to be used against many \`Task\` object types. All fields are combined with a logical ‘and.’
"""
input UserToManyTaskFilter {
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

  """Aggregates across related \`Task\` match the filter criteria."""
  aggregates: TaskAggregatesFilter
}

"""A filter to be used against aggregates of \`Task\` object types."""
input TaskAggregatesFilter {
  """
  A filter that must pass for the relevant \`Task\` object to be included within the aggregate.
  """
  filter: TaskFilter

  """Sum aggregate over matching \`Task\` objects."""
  sum: TaskSumAggregateFilter

  """Distinct count aggregate over matching \`Task\` objects."""
  distinctCount: TaskDistinctCountAggregateFilter

  """Minimum aggregate over matching \`Task\` objects."""
  min: TaskMinAggregateFilter

  """Maximum aggregate over matching \`Task\` objects."""
  max: TaskMaxAggregateFilter

  """Mean average aggregate over matching \`Task\` objects."""
  average: TaskAverageAggregateFilter

  """Sample standard deviation aggregate over matching \`Task\` objects."""
  stddevSample: TaskStddevSampleAggregateFilter

  """Population standard deviation aggregate over matching \`Task\` objects."""
  stddevPopulation: TaskStddevPopulationAggregateFilter

  """Sample variance aggregate over matching \`Task\` objects."""
  varianceSample: TaskVarianceSampleAggregateFilter

  """Population variance aggregate over matching \`Task\` objects."""
  variancePopulation: TaskVariancePopulationAggregateFilter
}

input TaskSumAggregateFilter {
  columnIndex: BigIntFilter
}

input TaskDistinctCountAggregateFilter {
  rowId: BigIntFilter
  content: BigIntFilter
  description: BigIntFilter
  priority: BigIntFilter
  authorId: BigIntFilter
  columnId: BigIntFilter
  labels: BigIntFilter
  dueDate: BigIntFilter
  createdAt: BigIntFilter
  updatedAt: BigIntFilter
  columnIndex: BigIntFilter
}

input TaskMinAggregateFilter {
  columnIndex: IntFilter
}

input TaskMaxAggregateFilter {
  columnIndex: IntFilter
}

input TaskAverageAggregateFilter {
  columnIndex: BigFloatFilter
}

"""
A filter to be used against BigFloat fields. All fields are combined with a logical ‘and.’
"""
input BigFloatFilter {
  """
  Is null (if \`true\` is specified) or is not null (if \`false\` is specified).
  """
  isNull: Boolean

  """Equal to the specified value."""
  equalTo: BigFloat

  """Not equal to the specified value."""
  notEqualTo: BigFloat

  """
  Not equal to the specified value, treating null like an ordinary value.
  """
  distinctFrom: BigFloat

  """Equal to the specified value, treating null like an ordinary value."""
  notDistinctFrom: BigFloat

  """Included in the specified list."""
  in: [BigFloat!]

  """Not included in the specified list."""
  notIn: [BigFloat!]

  """Less than the specified value."""
  lessThan: BigFloat

  """Less than or equal to the specified value."""
  lessThanOrEqualTo: BigFloat

  """Greater than the specified value."""
  greaterThan: BigFloat

  """Greater than or equal to the specified value."""
  greaterThanOrEqualTo: BigFloat
}

"""
A floating point number that requires more precision than IEEE 754 binary 64
"""
scalar BigFloat

input TaskStddevSampleAggregateFilter {
  columnIndex: BigFloatFilter
}

input TaskStddevPopulationAggregateFilter {
  columnIndex: BigFloatFilter
}

input TaskVarianceSampleAggregateFilter {
  columnIndex: BigFloatFilter
}

input TaskVariancePopulationAggregateFilter {
  columnIndex: BigFloatFilter
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

  """Aggregates across related \`WorkspaceUser\` match the filter criteria."""
  aggregates: WorkspaceUserAggregatesFilter
}

"""
A filter to be used against \`WorkspaceUser\` object types. All fields are combined with a logical ‘and.’
"""
input WorkspaceUserFilter {
  """Filter by the object’s \`workspaceId\` field."""
  workspaceId: UUIDFilter

  """Filter by the object’s \`userId\` field."""
  userId: UUIDFilter

  """Filter by the object’s \`createdAt\` field."""
  createdAt: DatetimeFilter

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

  """Filter by the object’s \`name\` field."""
  name: StringFilter

  """Filter by the object’s \`createdAt\` field."""
  createdAt: DatetimeFilter

  """Filter by the object’s \`updatedAt\` field."""
  updatedAt: DatetimeFilter

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

  """Aggregates across related \`Project\` match the filter criteria."""
  aggregates: ProjectAggregatesFilter
}

"""A filter to be used against aggregates of \`Project\` object types."""
input ProjectAggregatesFilter {
  """
  A filter that must pass for the relevant \`Project\` object to be included within the aggregate.
  """
  filter: ProjectFilter

  """Distinct count aggregate over matching \`Project\` objects."""
  distinctCount: ProjectDistinctCountAggregateFilter
}

input ProjectDistinctCountAggregateFilter {
  rowId: BigIntFilter
  name: BigIntFilter
  description: BigIntFilter
  prefix: BigIntFilter
  color: BigIntFilter
  labels: BigIntFilter
  workspaceId: BigIntFilter
  viewMode: BigIntFilter
  createdAt: BigIntFilter
  updatedAt: BigIntFilter
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

  """Aggregates across related \`WorkspaceUser\` match the filter criteria."""
  aggregates: WorkspaceUserAggregatesFilter
}

"""
A filter to be used against aggregates of \`WorkspaceUser\` object types.
"""
input WorkspaceUserAggregatesFilter {
  """
  A filter that must pass for the relevant \`WorkspaceUser\` object to be included within the aggregate.
  """
  filter: WorkspaceUserFilter

  """Distinct count aggregate over matching \`WorkspaceUser\` objects."""
  distinctCount: WorkspaceUserDistinctCountAggregateFilter
}

input WorkspaceUserDistinctCountAggregateFilter {
  workspaceId: BigIntFilter
  userId: BigIntFilter
  createdAt: BigIntFilter
}

"""
A filter to be used against many \`Post\` object types. All fields are combined with a logical ‘and.’
"""
input TaskToManyPostFilter {
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

  """Aggregates across related \`Post\` match the filter criteria."""
  aggregates: PostAggregatesFilter
}

"""A filter to be used against aggregates of \`Column\` object types."""
input ColumnAggregatesFilter {
  """
  A filter that must pass for the relevant \`Column\` object to be included within the aggregate.
  """
  filter: ColumnFilter

  """Distinct count aggregate over matching \`Column\` objects."""
  distinctCount: ColumnDistinctCountAggregateFilter
}

input ColumnDistinctCountAggregateFilter {
  rowId: BigIntFilter
  title: BigIntFilter
  projectId: BigIntFilter
  createdAt: BigIntFilter
  updatedAt: BigIntFilter
}

"""Methods to use when ordering \`Project\`."""
enum ProjectOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  NAME_ASC
  NAME_DESC
  DESCRIPTION_ASC
  DESCRIPTION_DESC
  PREFIX_ASC
  PREFIX_DESC
  COLOR_ASC
  COLOR_DESC
  LABELS_ASC
  LABELS_DESC
  WORKSPACE_ID_ASC
  WORKSPACE_ID_DESC
  VIEW_MODE_ASC
  VIEW_MODE_DESC
  CREATED_AT_ASC
  CREATED_AT_DESC
  UPDATED_AT_ASC
  UPDATED_AT_DESC
  COLUMNS_COUNT_ASC
  COLUMNS_COUNT_DESC
  COLUMNS_DISTINCT_COUNT_ROW_ID_ASC
  COLUMNS_DISTINCT_COUNT_ROW_ID_DESC
  COLUMNS_DISTINCT_COUNT_TITLE_ASC
  COLUMNS_DISTINCT_COUNT_TITLE_DESC
  COLUMNS_DISTINCT_COUNT_PROJECT_ID_ASC
  COLUMNS_DISTINCT_COUNT_PROJECT_ID_DESC
  COLUMNS_DISTINCT_COUNT_CREATED_AT_ASC
  COLUMNS_DISTINCT_COUNT_CREATED_AT_DESC
  COLUMNS_DISTINCT_COUNT_UPDATED_AT_ASC
  COLUMNS_DISTINCT_COUNT_UPDATED_AT_DESC
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

  """
  Aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  aggregates: WorkspaceUserAggregates

  """
  Grouped aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  groupedAggregates(
    """The method to use when grouping \`WorkspaceUser\` for these aggregates."""
    groupBy: [WorkspaceUserGroupBy!]!

    """Conditions on the grouped aggregates."""
    having: WorkspaceUserHavingInput
  ): [WorkspaceUserAggregates!]
}

"""A \`WorkspaceUser\` edge in the connection."""
type WorkspaceUserEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`WorkspaceUser\` at the end of the edge."""
  node: WorkspaceUser
}

type WorkspaceUserAggregates {
  keys: [String]

  """
  Distinct count aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  distinctCount: WorkspaceUserDistinctCountAggregates
}

type WorkspaceUserDistinctCountAggregates {
  """Distinct count of workspaceId across the matching connection"""
  workspaceId: BigInt

  """Distinct count of userId across the matching connection"""
  userId: BigInt

  """Distinct count of createdAt across the matching connection"""
  createdAt: BigInt
}

"""Grouping methods for \`WorkspaceUser\` for usage during aggregation."""
enum WorkspaceUserGroupBy {
  WORKSPACE_ID
  USER_ID
  CREATED_AT
  CREATED_AT_TRUNCATED_TO_HOUR
  CREATED_AT_TRUNCATED_TO_DAY
}

"""Conditions for \`WorkspaceUser\` aggregates."""
input WorkspaceUserHavingInput {
  AND: [WorkspaceUserHavingInput!]
  OR: [WorkspaceUserHavingInput!]
  sum: WorkspaceUserHavingSumInput
  distinctCount: WorkspaceUserHavingDistinctCountInput
  min: WorkspaceUserHavingMinInput
  max: WorkspaceUserHavingMaxInput
  average: WorkspaceUserHavingAverageInput
  stddevSample: WorkspaceUserHavingStddevSampleInput
  stddevPopulation: WorkspaceUserHavingStddevPopulationInput
  varianceSample: WorkspaceUserHavingVarianceSampleInput
  variancePopulation: WorkspaceUserHavingVariancePopulationInput
}

input WorkspaceUserHavingSumInput {
  createdAt: HavingDatetimeFilter
}

input WorkspaceUserHavingDistinctCountInput {
  createdAt: HavingDatetimeFilter
}

input WorkspaceUserHavingMinInput {
  createdAt: HavingDatetimeFilter
}

input WorkspaceUserHavingMaxInput {
  createdAt: HavingDatetimeFilter
}

input WorkspaceUserHavingAverageInput {
  createdAt: HavingDatetimeFilter
}

input WorkspaceUserHavingStddevSampleInput {
  createdAt: HavingDatetimeFilter
}

input WorkspaceUserHavingStddevPopulationInput {
  createdAt: HavingDatetimeFilter
}

input WorkspaceUserHavingVarianceSampleInput {
  createdAt: HavingDatetimeFilter
}

input WorkspaceUserHavingVariancePopulationInput {
  createdAt: HavingDatetimeFilter
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

  """Checks for equality with the object’s \`createdAt\` field."""
  createdAt: Datetime
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
  CREATED_AT_ASC
  CREATED_AT_DESC
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

  """
  Aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  aggregates: ColumnAggregates

  """
  Grouped aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  groupedAggregates(
    """The method to use when grouping \`Column\` for these aggregates."""
    groupBy: [ColumnGroupBy!]!

    """Conditions on the grouped aggregates."""
    having: ColumnHavingInput
  ): [ColumnAggregates!]
}

"""A \`Column\` edge in the connection."""
type ColumnEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Column\` at the end of the edge."""
  node: Column
}

type ColumnAggregates {
  keys: [String]

  """
  Distinct count aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  distinctCount: ColumnDistinctCountAggregates
}

type ColumnDistinctCountAggregates {
  """Distinct count of rowId across the matching connection"""
  rowId: BigInt

  """Distinct count of title across the matching connection"""
  title: BigInt

  """Distinct count of projectId across the matching connection"""
  projectId: BigInt

  """Distinct count of createdAt across the matching connection"""
  createdAt: BigInt

  """Distinct count of updatedAt across the matching connection"""
  updatedAt: BigInt
}

"""Grouping methods for \`Column\` for usage during aggregation."""
enum ColumnGroupBy {
  TITLE
  PROJECT_ID
  CREATED_AT
  CREATED_AT_TRUNCATED_TO_HOUR
  CREATED_AT_TRUNCATED_TO_DAY
  UPDATED_AT
  UPDATED_AT_TRUNCATED_TO_HOUR
  UPDATED_AT_TRUNCATED_TO_DAY
}

"""Conditions for \`Column\` aggregates."""
input ColumnHavingInput {
  AND: [ColumnHavingInput!]
  OR: [ColumnHavingInput!]
  sum: ColumnHavingSumInput
  distinctCount: ColumnHavingDistinctCountInput
  min: ColumnHavingMinInput
  max: ColumnHavingMaxInput
  average: ColumnHavingAverageInput
  stddevSample: ColumnHavingStddevSampleInput
  stddevPopulation: ColumnHavingStddevPopulationInput
  varianceSample: ColumnHavingVarianceSampleInput
  variancePopulation: ColumnHavingVariancePopulationInput
}

input ColumnHavingSumInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ColumnHavingDistinctCountInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ColumnHavingMinInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ColumnHavingMaxInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ColumnHavingAverageInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ColumnHavingStddevSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ColumnHavingStddevPopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ColumnHavingVarianceSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input ColumnHavingVariancePopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

"""
A condition to be used against \`Column\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input ColumnCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`title\` field."""
  title: String

  """Checks for equality with the object’s \`projectId\` field."""
  projectId: UUID

  """Checks for equality with the object’s \`createdAt\` field."""
  createdAt: Datetime

  """Checks for equality with the object’s \`updatedAt\` field."""
  updatedAt: Datetime
}

"""Methods to use when ordering \`Column\`."""
enum ColumnOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  TITLE_ASC
  TITLE_DESC
  PROJECT_ID_ASC
  PROJECT_ID_DESC
  CREATED_AT_ASC
  CREATED_AT_DESC
  UPDATED_AT_ASC
  UPDATED_AT_DESC
  TASKS_COUNT_ASC
  TASKS_COUNT_DESC
  TASKS_SUM_COLUMN_INDEX_ASC
  TASKS_SUM_COLUMN_INDEX_DESC
  TASKS_DISTINCT_COUNT_ROW_ID_ASC
  TASKS_DISTINCT_COUNT_ROW_ID_DESC
  TASKS_DISTINCT_COUNT_CONTENT_ASC
  TASKS_DISTINCT_COUNT_CONTENT_DESC
  TASKS_DISTINCT_COUNT_DESCRIPTION_ASC
  TASKS_DISTINCT_COUNT_DESCRIPTION_DESC
  TASKS_DISTINCT_COUNT_PRIORITY_ASC
  TASKS_DISTINCT_COUNT_PRIORITY_DESC
  TASKS_DISTINCT_COUNT_AUTHOR_ID_ASC
  TASKS_DISTINCT_COUNT_AUTHOR_ID_DESC
  TASKS_DISTINCT_COUNT_COLUMN_ID_ASC
  TASKS_DISTINCT_COUNT_COLUMN_ID_DESC
  TASKS_DISTINCT_COUNT_LABELS_ASC
  TASKS_DISTINCT_COUNT_LABELS_DESC
  TASKS_DISTINCT_COUNT_DUE_DATE_ASC
  TASKS_DISTINCT_COUNT_DUE_DATE_DESC
  TASKS_DISTINCT_COUNT_CREATED_AT_ASC
  TASKS_DISTINCT_COUNT_CREATED_AT_DESC
  TASKS_DISTINCT_COUNT_UPDATED_AT_ASC
  TASKS_DISTINCT_COUNT_UPDATED_AT_DESC
  TASKS_DISTINCT_COUNT_COLUMN_INDEX_ASC
  TASKS_DISTINCT_COUNT_COLUMN_INDEX_DESC
  TASKS_MIN_COLUMN_INDEX_ASC
  TASKS_MIN_COLUMN_INDEX_DESC
  TASKS_MAX_COLUMN_INDEX_ASC
  TASKS_MAX_COLUMN_INDEX_DESC
  TASKS_AVERAGE_COLUMN_INDEX_ASC
  TASKS_AVERAGE_COLUMN_INDEX_DESC
  TASKS_STDDEV_SAMPLE_COLUMN_INDEX_ASC
  TASKS_STDDEV_SAMPLE_COLUMN_INDEX_DESC
  TASKS_STDDEV_POPULATION_COLUMN_INDEX_ASC
  TASKS_STDDEV_POPULATION_COLUMN_INDEX_DESC
  TASKS_VARIANCE_SAMPLE_COLUMN_INDEX_ASC
  TASKS_VARIANCE_SAMPLE_COLUMN_INDEX_DESC
  TASKS_VARIANCE_POPULATION_COLUMN_INDEX_ASC
  TASKS_VARIANCE_POPULATION_COLUMN_INDEX_DESC
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

  """
  Aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  aggregates: TaskAggregates

  """
  Grouped aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  groupedAggregates(
    """The method to use when grouping \`Task\` for these aggregates."""
    groupBy: [TaskGroupBy!]!

    """Conditions on the grouped aggregates."""
    having: TaskHavingInput
  ): [TaskAggregates!]
}

"""A \`Task\` edge in the connection."""
type TaskEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Task\` at the end of the edge."""
  node: Task
}

type TaskAggregates {
  keys: [String]

  """
  Sum aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  sum: TaskSumAggregates

  """
  Distinct count aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  distinctCount: TaskDistinctCountAggregates

  """
  Minimum aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  min: TaskMinAggregates

  """
  Maximum aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  max: TaskMaxAggregates

  """
  Mean average aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  average: TaskAverageAggregates

  """
  Sample standard deviation aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  stddevSample: TaskStddevSampleAggregates

  """
  Population standard deviation aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  stddevPopulation: TaskStddevPopulationAggregates

  """
  Sample variance aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  varianceSample: TaskVarianceSampleAggregates

  """
  Population variance aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  variancePopulation: TaskVariancePopulationAggregates
}

type TaskSumAggregates {
  """Sum of columnIndex across the matching connection"""
  columnIndex: BigInt!
}

type TaskDistinctCountAggregates {
  """Distinct count of rowId across the matching connection"""
  rowId: BigInt

  """Distinct count of content across the matching connection"""
  content: BigInt

  """Distinct count of description across the matching connection"""
  description: BigInt

  """Distinct count of priority across the matching connection"""
  priority: BigInt

  """Distinct count of authorId across the matching connection"""
  authorId: BigInt

  """Distinct count of columnId across the matching connection"""
  columnId: BigInt

  """Distinct count of labels across the matching connection"""
  labels: BigInt

  """Distinct count of dueDate across the matching connection"""
  dueDate: BigInt

  """Distinct count of createdAt across the matching connection"""
  createdAt: BigInt

  """Distinct count of updatedAt across the matching connection"""
  updatedAt: BigInt

  """Distinct count of columnIndex across the matching connection"""
  columnIndex: BigInt
}

type TaskMinAggregates {
  """Minimum of columnIndex across the matching connection"""
  columnIndex: Int
}

type TaskMaxAggregates {
  """Maximum of columnIndex across the matching connection"""
  columnIndex: Int
}

type TaskAverageAggregates {
  """Mean average of columnIndex across the matching connection"""
  columnIndex: BigFloat
}

type TaskStddevSampleAggregates {
  """
  Sample standard deviation of columnIndex across the matching connection
  """
  columnIndex: BigFloat
}

type TaskStddevPopulationAggregates {
  """
  Population standard deviation of columnIndex across the matching connection
  """
  columnIndex: BigFloat
}

type TaskVarianceSampleAggregates {
  """Sample variance of columnIndex across the matching connection"""
  columnIndex: BigFloat
}

type TaskVariancePopulationAggregates {
  """Population variance of columnIndex across the matching connection"""
  columnIndex: BigFloat
}

"""Grouping methods for \`Task\` for usage during aggregation."""
enum TaskGroupBy {
  CONTENT
  DESCRIPTION
  PRIORITY
  AUTHOR_ID
  COLUMN_ID
  LABELS
  DUE_DATE
  DUE_DATE_TRUNCATED_TO_HOUR
  DUE_DATE_TRUNCATED_TO_DAY
  CREATED_AT
  CREATED_AT_TRUNCATED_TO_HOUR
  CREATED_AT_TRUNCATED_TO_DAY
  UPDATED_AT
  UPDATED_AT_TRUNCATED_TO_HOUR
  UPDATED_AT_TRUNCATED_TO_DAY
  COLUMN_INDEX
}

"""Conditions for \`Task\` aggregates."""
input TaskHavingInput {
  AND: [TaskHavingInput!]
  OR: [TaskHavingInput!]
  sum: TaskHavingSumInput
  distinctCount: TaskHavingDistinctCountInput
  min: TaskHavingMinInput
  max: TaskHavingMaxInput
  average: TaskHavingAverageInput
  stddevSample: TaskHavingStddevSampleInput
  stddevPopulation: TaskHavingStddevPopulationInput
  varianceSample: TaskHavingVarianceSampleInput
  variancePopulation: TaskHavingVariancePopulationInput
}

input TaskHavingSumInput {
  dueDate: HavingDatetimeFilter
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  columnIndex: HavingIntFilter
}

input HavingIntFilter {
  equalTo: Int
  notEqualTo: Int
  greaterThan: Int
  greaterThanOrEqualTo: Int
  lessThan: Int
  lessThanOrEqualTo: Int
}

input TaskHavingDistinctCountInput {
  dueDate: HavingDatetimeFilter
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  columnIndex: HavingIntFilter
}

input TaskHavingMinInput {
  dueDate: HavingDatetimeFilter
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  columnIndex: HavingIntFilter
}

input TaskHavingMaxInput {
  dueDate: HavingDatetimeFilter
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  columnIndex: HavingIntFilter
}

input TaskHavingAverageInput {
  dueDate: HavingDatetimeFilter
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  columnIndex: HavingIntFilter
}

input TaskHavingStddevSampleInput {
  dueDate: HavingDatetimeFilter
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  columnIndex: HavingIntFilter
}

input TaskHavingStddevPopulationInput {
  dueDate: HavingDatetimeFilter
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  columnIndex: HavingIntFilter
}

input TaskHavingVarianceSampleInput {
  dueDate: HavingDatetimeFilter
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  columnIndex: HavingIntFilter
}

input TaskHavingVariancePopulationInput {
  dueDate: HavingDatetimeFilter
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  columnIndex: HavingIntFilter
}

"""
A condition to be used against \`Task\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input TaskCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`content\` field."""
  content: String

  """Checks for equality with the object’s \`description\` field."""
  description: String

  """Checks for equality with the object’s \`priority\` field."""
  priority: String

  """Checks for equality with the object’s \`authorId\` field."""
  authorId: UUID

  """Checks for equality with the object’s \`columnId\` field."""
  columnId: UUID

  """Checks for equality with the object’s \`labels\` field."""
  labels: JSON

  """Checks for equality with the object’s \`dueDate\` field."""
  dueDate: Datetime

  """Checks for equality with the object’s \`createdAt\` field."""
  createdAt: Datetime

  """Checks for equality with the object’s \`updatedAt\` field."""
  updatedAt: Datetime

  """Checks for equality with the object’s \`columnIndex\` field."""
  columnIndex: Int
}

"""Methods to use when ordering \`Task\`."""
enum TaskOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  CONTENT_ASC
  CONTENT_DESC
  DESCRIPTION_ASC
  DESCRIPTION_DESC
  PRIORITY_ASC
  PRIORITY_DESC
  AUTHOR_ID_ASC
  AUTHOR_ID_DESC
  COLUMN_ID_ASC
  COLUMN_ID_DESC
  LABELS_ASC
  LABELS_DESC
  DUE_DATE_ASC
  DUE_DATE_DESC
  CREATED_AT_ASC
  CREATED_AT_DESC
  UPDATED_AT_ASC
  UPDATED_AT_DESC
  COLUMN_INDEX_ASC
  COLUMN_INDEX_DESC
  ASSIGNEES_COUNT_ASC
  ASSIGNEES_COUNT_DESC
  ASSIGNEES_DISTINCT_COUNT_ROW_ID_ASC
  ASSIGNEES_DISTINCT_COUNT_ROW_ID_DESC
  ASSIGNEES_DISTINCT_COUNT_USER_ID_ASC
  ASSIGNEES_DISTINCT_COUNT_USER_ID_DESC
  ASSIGNEES_DISTINCT_COUNT_TASK_ID_ASC
  ASSIGNEES_DISTINCT_COUNT_TASK_ID_DESC
  ASSIGNEES_DISTINCT_COUNT_CREATED_AT_ASC
  ASSIGNEES_DISTINCT_COUNT_CREATED_AT_DESC
  ASSIGNEES_DISTINCT_COUNT_UPDATED_AT_ASC
  ASSIGNEES_DISTINCT_COUNT_UPDATED_AT_DESC
  ASSIGNEES_DISTINCT_COUNT_DELETED_AT_ASC
  ASSIGNEES_DISTINCT_COUNT_DELETED_AT_DESC
  POSTS_COUNT_ASC
  POSTS_COUNT_DESC
  POSTS_DISTINCT_COUNT_ROW_ID_ASC
  POSTS_DISTINCT_COUNT_ROW_ID_DESC
  POSTS_DISTINCT_COUNT_TITLE_ASC
  POSTS_DISTINCT_COUNT_TITLE_DESC
  POSTS_DISTINCT_COUNT_DESCRIPTION_ASC
  POSTS_DISTINCT_COUNT_DESCRIPTION_DESC
  POSTS_DISTINCT_COUNT_AUTHOR_ID_ASC
  POSTS_DISTINCT_COUNT_AUTHOR_ID_DESC
  POSTS_DISTINCT_COUNT_TASK_ID_ASC
  POSTS_DISTINCT_COUNT_TASK_ID_DESC
  POSTS_DISTINCT_COUNT_CREATED_AT_ASC
  POSTS_DISTINCT_COUNT_CREATED_AT_DESC
  POSTS_DISTINCT_COUNT_UPDATED_AT_ASC
  POSTS_DISTINCT_COUNT_UPDATED_AT_DESC
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

  """Checks for equality with the object’s \`taskId\` field."""
  taskId: UUID

  """Checks for equality with the object’s \`createdAt\` field."""
  createdAt: Datetime

  """Checks for equality with the object’s \`updatedAt\` field."""
  updatedAt: Datetime

  """Checks for equality with the object’s \`deletedAt\` field."""
  deletedAt: Datetime
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
  TASK_ID_ASC
  TASK_ID_DESC
  CREATED_AT_ASC
  CREATED_AT_DESC
  UPDATED_AT_ASC
  UPDATED_AT_DESC
  DELETED_AT_ASC
  DELETED_AT_DESC
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

  """
  Aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  aggregates: PostAggregates

  """
  Grouped aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  groupedAggregates(
    """The method to use when grouping \`Post\` for these aggregates."""
    groupBy: [PostGroupBy!]!

    """Conditions on the grouped aggregates."""
    having: PostHavingInput
  ): [PostAggregates!]
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
  taskId: UUID!
  createdAt: Datetime
  updatedAt: Datetime

  """Reads a single \`User\` that is related to this \`Post\`."""
  author: User

  """Reads a single \`Task\` that is related to this \`Post\`."""
  task: Task
}

"""A \`Post\` edge in the connection."""
type PostEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Post\` at the end of the edge."""
  node: Post
}

type PostAggregates {
  keys: [String]

  """
  Distinct count aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  distinctCount: PostDistinctCountAggregates
}

type PostDistinctCountAggregates {
  """Distinct count of rowId across the matching connection"""
  rowId: BigInt

  """Distinct count of title across the matching connection"""
  title: BigInt

  """Distinct count of description across the matching connection"""
  description: BigInt

  """Distinct count of authorId across the matching connection"""
  authorId: BigInt

  """Distinct count of taskId across the matching connection"""
  taskId: BigInt

  """Distinct count of createdAt across the matching connection"""
  createdAt: BigInt

  """Distinct count of updatedAt across the matching connection"""
  updatedAt: BigInt
}

"""Grouping methods for \`Post\` for usage during aggregation."""
enum PostGroupBy {
  TITLE
  DESCRIPTION
  AUTHOR_ID
  TASK_ID
  CREATED_AT
  CREATED_AT_TRUNCATED_TO_HOUR
  CREATED_AT_TRUNCATED_TO_DAY
  UPDATED_AT
  UPDATED_AT_TRUNCATED_TO_HOUR
  UPDATED_AT_TRUNCATED_TO_DAY
}

"""Conditions for \`Post\` aggregates."""
input PostHavingInput {
  AND: [PostHavingInput!]
  OR: [PostHavingInput!]
  sum: PostHavingSumInput
  distinctCount: PostHavingDistinctCountInput
  min: PostHavingMinInput
  max: PostHavingMaxInput
  average: PostHavingAverageInput
  stddevSample: PostHavingStddevSampleInput
  stddevPopulation: PostHavingStddevPopulationInput
  varianceSample: PostHavingVarianceSampleInput
  variancePopulation: PostHavingVariancePopulationInput
}

input PostHavingSumInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input PostHavingDistinctCountInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input PostHavingMinInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input PostHavingMaxInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input PostHavingAverageInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input PostHavingStddevSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input PostHavingStddevPopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input PostHavingVarianceSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input PostHavingVariancePopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

"""
A condition to be used against \`Post\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input PostCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`title\` field."""
  title: String

  """Checks for equality with the object’s \`description\` field."""
  description: String

  """Checks for equality with the object’s \`authorId\` field."""
  authorId: UUID

  """Checks for equality with the object’s \`taskId\` field."""
  taskId: UUID

  """Checks for equality with the object’s \`createdAt\` field."""
  createdAt: Datetime

  """Checks for equality with the object’s \`updatedAt\` field."""
  updatedAt: Datetime
}

"""Methods to use when ordering \`Post\`."""
enum PostOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  TITLE_ASC
  TITLE_DESC
  DESCRIPTION_ASC
  DESCRIPTION_DESC
  AUTHOR_ID_ASC
  AUTHOR_ID_DESC
  TASK_ID_ASC
  TASK_ID_DESC
  CREATED_AT_ASC
  CREATED_AT_DESC
  UPDATED_AT_ASC
  UPDATED_AT_DESC
}

"""A \`Assignee\` edge in the connection."""
type AssigneeEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Assignee\` at the end of the edge."""
  node: Assignee
}

type AssigneeAggregates {
  keys: [String]

  """
  Distinct count aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  distinctCount: AssigneeDistinctCountAggregates
}

type AssigneeDistinctCountAggregates {
  """Distinct count of rowId across the matching connection"""
  rowId: BigInt

  """Distinct count of userId across the matching connection"""
  userId: BigInt

  """Distinct count of taskId across the matching connection"""
  taskId: BigInt

  """Distinct count of createdAt across the matching connection"""
  createdAt: BigInt

  """Distinct count of updatedAt across the matching connection"""
  updatedAt: BigInt

  """Distinct count of deletedAt across the matching connection"""
  deletedAt: BigInt
}

"""Grouping methods for \`Assignee\` for usage during aggregation."""
enum AssigneeGroupBy {
  USER_ID
  TASK_ID
  CREATED_AT
  CREATED_AT_TRUNCATED_TO_HOUR
  CREATED_AT_TRUNCATED_TO_DAY
  UPDATED_AT
  UPDATED_AT_TRUNCATED_TO_HOUR
  UPDATED_AT_TRUNCATED_TO_DAY
  DELETED_AT
  DELETED_AT_TRUNCATED_TO_HOUR
  DELETED_AT_TRUNCATED_TO_DAY
}

"""Conditions for \`Assignee\` aggregates."""
input AssigneeHavingInput {
  AND: [AssigneeHavingInput!]
  OR: [AssigneeHavingInput!]
  sum: AssigneeHavingSumInput
  distinctCount: AssigneeHavingDistinctCountInput
  min: AssigneeHavingMinInput
  max: AssigneeHavingMaxInput
  average: AssigneeHavingAverageInput
  stddevSample: AssigneeHavingStddevSampleInput
  stddevPopulation: AssigneeHavingStddevPopulationInput
  varianceSample: AssigneeHavingVarianceSampleInput
  variancePopulation: AssigneeHavingVariancePopulationInput
}

input AssigneeHavingSumInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  deletedAt: HavingDatetimeFilter
}

input AssigneeHavingDistinctCountInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  deletedAt: HavingDatetimeFilter
}

input AssigneeHavingMinInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  deletedAt: HavingDatetimeFilter
}

input AssigneeHavingMaxInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  deletedAt: HavingDatetimeFilter
}

input AssigneeHavingAverageInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  deletedAt: HavingDatetimeFilter
}

input AssigneeHavingStddevSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  deletedAt: HavingDatetimeFilter
}

input AssigneeHavingStddevPopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  deletedAt: HavingDatetimeFilter
}

input AssigneeHavingVarianceSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  deletedAt: HavingDatetimeFilter
}

input AssigneeHavingVariancePopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
  deletedAt: HavingDatetimeFilter
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

  """
  Aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  aggregates: WorkspaceAggregates

  """
  Grouped aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  groupedAggregates(
    """The method to use when grouping \`Workspace\` for these aggregates."""
    groupBy: [WorkspaceGroupBy!]!

    """Conditions on the grouped aggregates."""
    having: WorkspaceHavingInput
  ): [WorkspaceAggregates!]
}

"""A \`Workspace\` edge in the connection."""
type WorkspaceEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`Workspace\` at the end of the edge."""
  node: Workspace
}

type WorkspaceAggregates {
  keys: [String]

  """
  Distinct count aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  distinctCount: WorkspaceDistinctCountAggregates
}

type WorkspaceDistinctCountAggregates {
  """Distinct count of rowId across the matching connection"""
  rowId: BigInt

  """Distinct count of name across the matching connection"""
  name: BigInt

  """Distinct count of createdAt across the matching connection"""
  createdAt: BigInt

  """Distinct count of updatedAt across the matching connection"""
  updatedAt: BigInt
}

"""Grouping methods for \`Workspace\` for usage during aggregation."""
enum WorkspaceGroupBy {
  NAME
  CREATED_AT
  CREATED_AT_TRUNCATED_TO_HOUR
  CREATED_AT_TRUNCATED_TO_DAY
  UPDATED_AT
  UPDATED_AT_TRUNCATED_TO_HOUR
  UPDATED_AT_TRUNCATED_TO_DAY
}

"""Conditions for \`Workspace\` aggregates."""
input WorkspaceHavingInput {
  AND: [WorkspaceHavingInput!]
  OR: [WorkspaceHavingInput!]
  sum: WorkspaceHavingSumInput
  distinctCount: WorkspaceHavingDistinctCountInput
  min: WorkspaceHavingMinInput
  max: WorkspaceHavingMaxInput
  average: WorkspaceHavingAverageInput
  stddevSample: WorkspaceHavingStddevSampleInput
  stddevPopulation: WorkspaceHavingStddevPopulationInput
  varianceSample: WorkspaceHavingVarianceSampleInput
  variancePopulation: WorkspaceHavingVariancePopulationInput
}

input WorkspaceHavingSumInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input WorkspaceHavingDistinctCountInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input WorkspaceHavingMinInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input WorkspaceHavingMaxInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input WorkspaceHavingAverageInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input WorkspaceHavingStddevSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input WorkspaceHavingStddevPopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input WorkspaceHavingVarianceSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input WorkspaceHavingVariancePopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

"""
A condition to be used against \`Workspace\` object types. All fields are tested
for equality and combined with a logical ‘and.’
"""
input WorkspaceCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`name\` field."""
  name: String

  """Checks for equality with the object’s \`createdAt\` field."""
  createdAt: Datetime

  """Checks for equality with the object’s \`updatedAt\` field."""
  updatedAt: Datetime
}

"""Methods to use when ordering \`Workspace\`."""
enum WorkspaceOrderBy {
  NATURAL
  PRIMARY_KEY_ASC
  PRIMARY_KEY_DESC
  ROW_ID_ASC
  ROW_ID_DESC
  NAME_ASC
  NAME_DESC
  CREATED_AT_ASC
  CREATED_AT_DESC
  UPDATED_AT_ASC
  UPDATED_AT_DESC
  PROJECTS_COUNT_ASC
  PROJECTS_COUNT_DESC
  PROJECTS_DISTINCT_COUNT_ROW_ID_ASC
  PROJECTS_DISTINCT_COUNT_ROW_ID_DESC
  PROJECTS_DISTINCT_COUNT_NAME_ASC
  PROJECTS_DISTINCT_COUNT_NAME_DESC
  PROJECTS_DISTINCT_COUNT_DESCRIPTION_ASC
  PROJECTS_DISTINCT_COUNT_DESCRIPTION_DESC
  PROJECTS_DISTINCT_COUNT_PREFIX_ASC
  PROJECTS_DISTINCT_COUNT_PREFIX_DESC
  PROJECTS_DISTINCT_COUNT_COLOR_ASC
  PROJECTS_DISTINCT_COUNT_COLOR_DESC
  PROJECTS_DISTINCT_COUNT_LABELS_ASC
  PROJECTS_DISTINCT_COUNT_LABELS_DESC
  PROJECTS_DISTINCT_COUNT_WORKSPACE_ID_ASC
  PROJECTS_DISTINCT_COUNT_WORKSPACE_ID_DESC
  PROJECTS_DISTINCT_COUNT_VIEW_MODE_ASC
  PROJECTS_DISTINCT_COUNT_VIEW_MODE_DESC
  PROJECTS_DISTINCT_COUNT_CREATED_AT_ASC
  PROJECTS_DISTINCT_COUNT_CREATED_AT_DESC
  PROJECTS_DISTINCT_COUNT_UPDATED_AT_ASC
  PROJECTS_DISTINCT_COUNT_UPDATED_AT_DESC
  WORKSPACE_USERS_COUNT_ASC
  WORKSPACE_USERS_COUNT_DESC
  WORKSPACE_USERS_DISTINCT_COUNT_WORKSPACE_ID_ASC
  WORKSPACE_USERS_DISTINCT_COUNT_WORKSPACE_ID_DESC
  WORKSPACE_USERS_DISTINCT_COUNT_USER_ID_ASC
  WORKSPACE_USERS_DISTINCT_COUNT_USER_ID_DESC
  WORKSPACE_USERS_DISTINCT_COUNT_CREATED_AT_ASC
  WORKSPACE_USERS_DISTINCT_COUNT_CREATED_AT_DESC
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

  """
  Aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  aggregates: UserAggregates

  """
  Grouped aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  groupedAggregates(
    """The method to use when grouping \`User\` for these aggregates."""
    groupBy: [UserGroupBy!]!

    """Conditions on the grouped aggregates."""
    having: UserHavingInput
  ): [UserAggregates!]
}

"""A \`User\` edge in the connection."""
type UserEdge {
  """A cursor for use in pagination."""
  cursor: Cursor

  """The \`User\` at the end of the edge."""
  node: User
}

type UserAggregates {
  keys: [String]

  """
  Distinct count aggregates across the matching connection (ignoring before/after/first/last/offset)
  """
  distinctCount: UserDistinctCountAggregates
}

type UserDistinctCountAggregates {
  """Distinct count of rowId across the matching connection"""
  rowId: BigInt

  """Distinct count of identityProviderId across the matching connection"""
  identityProviderId: BigInt

  """Distinct count of name across the matching connection"""
  name: BigInt

  """Distinct count of avatarUrl across the matching connection"""
  avatarUrl: BigInt

  """Distinct count of createdAt across the matching connection"""
  createdAt: BigInt

  """Distinct count of updatedAt across the matching connection"""
  updatedAt: BigInt
}

"""Grouping methods for \`User\` for usage during aggregation."""
enum UserGroupBy {
  NAME
  AVATAR_URL
  CREATED_AT
  CREATED_AT_TRUNCATED_TO_HOUR
  CREATED_AT_TRUNCATED_TO_DAY
  UPDATED_AT
  UPDATED_AT_TRUNCATED_TO_HOUR
  UPDATED_AT_TRUNCATED_TO_DAY
}

"""Conditions for \`User\` aggregates."""
input UserHavingInput {
  AND: [UserHavingInput!]
  OR: [UserHavingInput!]
  sum: UserHavingSumInput
  distinctCount: UserHavingDistinctCountInput
  min: UserHavingMinInput
  max: UserHavingMaxInput
  average: UserHavingAverageInput
  stddevSample: UserHavingStddevSampleInput
  stddevPopulation: UserHavingStddevPopulationInput
  varianceSample: UserHavingVarianceSampleInput
  variancePopulation: UserHavingVariancePopulationInput
}

input UserHavingSumInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input UserHavingDistinctCountInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input UserHavingMinInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input UserHavingMaxInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input UserHavingAverageInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input UserHavingStddevSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input UserHavingStddevPopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input UserHavingVarianceSampleInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

input UserHavingVariancePopulationInput {
  createdAt: HavingDatetimeFilter
  updatedAt: HavingDatetimeFilter
}

"""
A condition to be used against \`User\` object types. All fields are tested for equality and combined with a logical ‘and.’
"""
input UserCondition {
  """Checks for equality with the object’s \`rowId\` field."""
  rowId: UUID

  """Checks for equality with the object’s \`identityProviderId\` field."""
  identityProviderId: UUID

  """Checks for equality with the object’s \`name\` field."""
  name: String

  """Checks for equality with the object’s \`avatarUrl\` field."""
  avatarUrl: String

  """Checks for equality with the object’s \`createdAt\` field."""
  createdAt: Datetime

  """Checks for equality with the object’s \`updatedAt\` field."""
  updatedAt: Datetime
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
  NAME_ASC
  NAME_DESC
  AVATAR_URL_ASC
  AVATAR_URL_DESC
  CREATED_AT_ASC
  CREATED_AT_DESC
  UPDATED_AT_ASC
  UPDATED_AT_DESC
  ASSIGNEES_COUNT_ASC
  ASSIGNEES_COUNT_DESC
  ASSIGNEES_DISTINCT_COUNT_ROW_ID_ASC
  ASSIGNEES_DISTINCT_COUNT_ROW_ID_DESC
  ASSIGNEES_DISTINCT_COUNT_USER_ID_ASC
  ASSIGNEES_DISTINCT_COUNT_USER_ID_DESC
  ASSIGNEES_DISTINCT_COUNT_TASK_ID_ASC
  ASSIGNEES_DISTINCT_COUNT_TASK_ID_DESC
  ASSIGNEES_DISTINCT_COUNT_CREATED_AT_ASC
  ASSIGNEES_DISTINCT_COUNT_CREATED_AT_DESC
  ASSIGNEES_DISTINCT_COUNT_UPDATED_AT_ASC
  ASSIGNEES_DISTINCT_COUNT_UPDATED_AT_DESC
  ASSIGNEES_DISTINCT_COUNT_DELETED_AT_ASC
  ASSIGNEES_DISTINCT_COUNT_DELETED_AT_DESC
  AUTHORED_POSTS_COUNT_ASC
  AUTHORED_POSTS_COUNT_DESC
  AUTHORED_POSTS_DISTINCT_COUNT_ROW_ID_ASC
  AUTHORED_POSTS_DISTINCT_COUNT_ROW_ID_DESC
  AUTHORED_POSTS_DISTINCT_COUNT_TITLE_ASC
  AUTHORED_POSTS_DISTINCT_COUNT_TITLE_DESC
  AUTHORED_POSTS_DISTINCT_COUNT_DESCRIPTION_ASC
  AUTHORED_POSTS_DISTINCT_COUNT_DESCRIPTION_DESC
  AUTHORED_POSTS_DISTINCT_COUNT_AUTHOR_ID_ASC
  AUTHORED_POSTS_DISTINCT_COUNT_AUTHOR_ID_DESC
  AUTHORED_POSTS_DISTINCT_COUNT_TASK_ID_ASC
  AUTHORED_POSTS_DISTINCT_COUNT_TASK_ID_DESC
  AUTHORED_POSTS_DISTINCT_COUNT_CREATED_AT_ASC
  AUTHORED_POSTS_DISTINCT_COUNT_CREATED_AT_DESC
  AUTHORED_POSTS_DISTINCT_COUNT_UPDATED_AT_ASC
  AUTHORED_POSTS_DISTINCT_COUNT_UPDATED_AT_DESC
  AUTHORED_TASKS_COUNT_ASC
  AUTHORED_TASKS_COUNT_DESC
  AUTHORED_TASKS_SUM_COLUMN_INDEX_ASC
  AUTHORED_TASKS_SUM_COLUMN_INDEX_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_ROW_ID_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_ROW_ID_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_CONTENT_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_CONTENT_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_DESCRIPTION_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_DESCRIPTION_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_PRIORITY_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_PRIORITY_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_AUTHOR_ID_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_AUTHOR_ID_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_COLUMN_ID_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_COLUMN_ID_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_LABELS_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_LABELS_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_DUE_DATE_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_DUE_DATE_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_CREATED_AT_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_CREATED_AT_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_UPDATED_AT_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_UPDATED_AT_DESC
  AUTHORED_TASKS_DISTINCT_COUNT_COLUMN_INDEX_ASC
  AUTHORED_TASKS_DISTINCT_COUNT_COLUMN_INDEX_DESC
  AUTHORED_TASKS_MIN_COLUMN_INDEX_ASC
  AUTHORED_TASKS_MIN_COLUMN_INDEX_DESC
  AUTHORED_TASKS_MAX_COLUMN_INDEX_ASC
  AUTHORED_TASKS_MAX_COLUMN_INDEX_DESC
  AUTHORED_TASKS_AVERAGE_COLUMN_INDEX_ASC
  AUTHORED_TASKS_AVERAGE_COLUMN_INDEX_DESC
  AUTHORED_TASKS_STDDEV_SAMPLE_COLUMN_INDEX_ASC
  AUTHORED_TASKS_STDDEV_SAMPLE_COLUMN_INDEX_DESC
  AUTHORED_TASKS_STDDEV_POPULATION_COLUMN_INDEX_ASC
  AUTHORED_TASKS_STDDEV_POPULATION_COLUMN_INDEX_DESC
  AUTHORED_TASKS_VARIANCE_SAMPLE_COLUMN_INDEX_ASC
  AUTHORED_TASKS_VARIANCE_SAMPLE_COLUMN_INDEX_DESC
  AUTHORED_TASKS_VARIANCE_POPULATION_COLUMN_INDEX_ASC
  AUTHORED_TASKS_VARIANCE_POPULATION_COLUMN_INDEX_DESC
  WORKSPACE_USERS_COUNT_ASC
  WORKSPACE_USERS_COUNT_DESC
  WORKSPACE_USERS_DISTINCT_COUNT_WORKSPACE_ID_ASC
  WORKSPACE_USERS_DISTINCT_COUNT_WORKSPACE_ID_DESC
  WORKSPACE_USERS_DISTINCT_COUNT_USER_ID_ASC
  WORKSPACE_USERS_DISTINCT_COUNT_USER_ID_DESC
  WORKSPACE_USERS_DISTINCT_COUNT_CREATED_AT_ASC
  WORKSPACE_USERS_DISTINCT_COUNT_CREATED_AT_DESC
}

"""
The root mutation type which contains root level fields which mutate data.
"""
type Mutation {
  """Creates a single \`WorkspaceUser\`."""
  createWorkspaceUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateWorkspaceUserInput!
  ): CreateWorkspaceUserPayload

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

  """Creates a single \`User\`."""
  createUser(
    """
    The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
    """
    input: CreateUserInput!
  ): CreateUserPayload

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
  name: String!
  avatarUrl: String
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
  taskId: UUID!
  createdAt: Datetime
  updatedAt: Datetime
  deletedAt: Datetime
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
  taskId: UUID!
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
  authorId: UUID!
  columnId: UUID!
  labels: JSON
  dueDate: Datetime
  createdAt: Datetime
  updatedAt: Datetime
  columnIndex: Int
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
  name: String
  avatarUrl: String
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
  taskId: UUID
  createdAt: Datetime
  updatedAt: Datetime
  deletedAt: Datetime
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
  taskId: UUID
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
  authorId: UUID
  columnId: UUID
  labels: JSON
  dueDate: Datetime
  createdAt: Datetime
  updatedAt: Datetime
  columnIndex: Int
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
    workspaceUser(_$root, {
      $workspaceId,
      $userId
    }) {
      return pgResource_workspace_userPgResource.get({
        workspace_id: $workspaceId,
        user_id: $userId
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
    workspaceUserById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_WorkspaceUser($nodeId);
    },
    workspaceById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_Workspace($nodeId);
    },
    columnById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_Column($nodeId);
    },
    userById(_$parent, args) {
      const $nodeId = args.getRaw("id");
      return nodeFetcher_User($nodeId);
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
    avatarUrl($record) {
      return $record.get("avatar_url");
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
    },
    authoredTasks: {
      plan($record) {
        const $records = pgResource_taskPgResource.find({
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
  AssigneeConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    },
    aggregates($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").single();
    },
    groupedAggregates: {
      plan($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate");
      },
      args: {
        groupBy(_$parent, $pgSelect, input) {
          return input.apply($pgSelect);
        },
        having(_$parent, $pgSelect, input) {
          return input.apply($pgSelect, queryBuilder => queryBuilder.havingBuilder());
        }
      }
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
    taskId($record) {
      return $record.get("task_id");
    },
    createdAt($record) {
      return $record.get("created_at");
    },
    updatedAt($record) {
      return $record.get("updated_at");
    },
    deletedAt($record) {
      return $record.get("deleted_at");
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
    authorId($record) {
      return $record.get("author_id");
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
    columnIndex($record) {
      return $record.get("column_index");
    },
    author($record) {
      return pgResource_userPgResource.get({
        id: $record.get("author_id")
      });
    },
    column($record) {
      return pgResource_columnPgResource.get({
        id: $record.get("column_id")
      });
    },
    assignees: {
      plan($record) {
        const $records = pgResource_assigneePgResource.find({
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
    posts: {
      plan($record) {
        const $records = pgResource_postPgResource.find({
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
            assertAllowed15(value, "object");
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
            assertAllowed16(value, "object");
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
            assertAllowed17(value, "object");
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
            assertAllowed18(value, "object");
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
    },
    aggregates($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").single();
    },
    groupedAggregates: {
      plan($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate");
      },
      args: {
        groupBy(_$parent, $pgSelect, input) {
          return input.apply($pgSelect);
        },
        having(_$parent, $pgSelect, input) {
          return input.apply($pgSelect, queryBuilder => queryBuilder.havingBuilder());
        }
      }
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
  ProjectAggregates: {
    __assertStep: assertPgClassSingleStep,
    keys($pgSelectSingle) {
      const $groupDetails = $pgSelectSingle.getClassStep().getGroupDetails();
      return lambda([$groupDetails, $pgSelectSingle], ([groupDetails, item]) => {
        if (groupDetails.indicies.length === 0 || item == null) return null;else return groupDetails.indicies.map(({
          index
        }) => item[index]);
      });
    },
    distinctCount($pgSelectSingle) {
      return $pgSelectSingle;
    }
  },
  ProjectDistinctCountAggregates: {
    rowId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    name($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("name")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.text);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    description($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("description")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.text);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    prefix($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("prefix")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.varchar);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    color($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("color")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.varchar);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    labels($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("labels")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.jsonb);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    workspaceId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("workspace_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    viewMode($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("view_mode")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.varchar);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    createdAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("created_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    updatedAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("updated_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    }
  },
  BigInt: {
    serialize: UUIDSerialize,
    parseValue: UUIDSerialize,
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) throw new GraphQLError(`${"BigInt" ?? "This scalar"} can only parse string values (kind='${ast.kind}')`);
      return ast.value;
    }
  },
  ProjectGroupBy: {
    NAME($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("name")}`,
        codec: TYPES.text
      });
    },
    DESCRIPTION($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("description")}`,
        codec: TYPES.text
      });
    },
    PREFIX($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("prefix")}`,
        codec: TYPES.varchar
      });
    },
    COLOR($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("color")}`,
        codec: TYPES.varchar
      });
    },
    LABELS($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("labels")}`,
        codec: TYPES.jsonb
      });
    },
    WORKSPACE_ID($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("workspace_id")}`,
        codec: TYPES.uuid
      });
    },
    VIEW_MODE($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("view_mode")}`,
        codec: TYPES.varchar
      });
    },
    CREATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("created_at")}`,
        codec: TYPES.timestamptz
      });
    },
    CREATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    CREATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("updated_at")}`,
        codec: TYPES.timestamptz
      });
    },
    UPDATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    }
  },
  ProjectHavingInput: {
    AND($where) {
      return $where;
    },
    OR($where) {
      return new PgOrFilter($where);
    },
    sum($having) {
      return $having;
    },
    distinctCount($having) {
      return $having;
    },
    min($having) {
      return $having;
    },
    max($having) {
      return $having;
    },
    average($having) {
      return $having;
    },
    stddevSample($having) {
      return $having;
    },
    stddevPopulation($having) {
      return $having;
    },
    varianceSample($having) {
      return $having;
    },
    variancePopulation($having) {
      return $having;
    }
  },
  ProjectHavingSumInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_project.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_project.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  HavingDatetimeFilter: {
    equalTo($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix()} ${sqlValueWithCodec(input, TYPES.timestamptz)})`);
    },
    notEqualTo($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix2()} ${sqlValueWithCodec(input, TYPES.timestamptz)})`);
    },
    greaterThan($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix3()} ${sqlValueWithCodec(input, TYPES.timestamptz)})`);
    },
    greaterThanOrEqualTo($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix4()} ${sqlValueWithCodec(input, TYPES.timestamptz)})`);
    },
    lessThan($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix5()} ${sqlValueWithCodec(input, TYPES.timestamptz)})`);
    },
    lessThanOrEqualTo($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix6()} ${sqlValueWithCodec(input, TYPES.timestamptz)})`);
    }
  },
  ProjectHavingDistinctCountInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_project.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_project.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ProjectHavingMinInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_project.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_project.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ProjectHavingMaxInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_project.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_project.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ProjectHavingAverageInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_project.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_project.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ProjectHavingStddevSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_project.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_project.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ProjectHavingStddevPopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_project.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_project.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ProjectHavingVarianceSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_project.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_project.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ProjectHavingVariancePopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_project.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_project.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
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
    name($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "name",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
        }
      });
    },
    description($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "description",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
        }
      });
    },
    prefix($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "prefix",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.varchar)}`;
        }
      });
    },
    color($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "color",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.varchar)}`;
        }
      });
    },
    labels($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "labels",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.jsonb)}`;
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
    },
    viewMode($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "view_mode",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.varchar)}`;
        }
      });
    },
    createdAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "created_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    },
    updatedAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "updated_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    }
  },
  ProjectFilter: {
    rowId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec;
      return condition;
    },
    name(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec2;
      return condition;
    },
    description(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec3;
      return condition;
    },
    prefix(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec4;
      return condition;
    },
    color(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec5;
      return condition;
    },
    labels(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec6;
      return condition;
    },
    workspaceId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec7;
      return condition;
    },
    viewMode(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec8;
      return condition;
    },
    createdAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec9;
      return condition;
    },
    updatedAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec10;
      return condition;
    },
    columns($where, value) {
      assertAllowed19(value, "object");
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
      assertAllowed19(value, "scalar");
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
    workspace($where, value) {
      assertAllowed20(value, "object");
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
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
  StringFilter: {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec4 ? resolveInputCodec4(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue2 ? resolveSqlValue2($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve12(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve13(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve14(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve15(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve16(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec6 ? resolveInputCodec6(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve17(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec6 ? resolveInputCodec6(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve18(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve19(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve20(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve21(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve22(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "greaterThanOrEqualTo"
        });
      $where.where(fragment);
    },
    includes($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput ? resolveInput(value) : value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve23(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "includes"
        });
      $where.where(fragment);
    },
    notIncludes($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput2 ? resolveInput2(value) : value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve24(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notIncludes"
        });
      $where.where(fragment);
    },
    includesInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput3 ? resolveInput3(value) : value,
        inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve25(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "includesInsensitive"
        });
      $where.where(fragment);
    },
    notIncludesInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput4 ? resolveInput4(value) : value,
        inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve26(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notIncludesInsensitive"
        });
      $where.where(fragment);
    },
    startsWith($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput5 ? resolveInput5(value) : value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve27(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "startsWith"
        });
      $where.where(fragment);
    },
    notStartsWith($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput6 ? resolveInput6(value) : value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve28(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notStartsWith"
        });
      $where.where(fragment);
    },
    startsWithInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput7 ? resolveInput7(value) : value,
        inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve29(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "startsWithInsensitive"
        });
      $where.where(fragment);
    },
    notStartsWithInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput8 ? resolveInput8(value) : value,
        inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve30(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notStartsWithInsensitive"
        });
      $where.where(fragment);
    },
    endsWith($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput9 ? resolveInput9(value) : value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve31(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "endsWith"
        });
      $where.where(fragment);
    },
    notEndsWith($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput10 ? resolveInput10(value) : value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve32(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notEndsWith"
        });
      $where.where(fragment);
    },
    endsWithInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput11 ? resolveInput11(value) : value,
        inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve33(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "endsWithInsensitive"
        });
      $where.where(fragment);
    },
    notEndsWithInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = resolveInput12 ? resolveInput12(value) : value,
        inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve34(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notEndsWithInsensitive"
        });
      $where.where(fragment);
    },
    like($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve35(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "like"
        });
      $where.where(fragment);
    },
    notLike($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier2 ? resolveSqlIdentifier2(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec5 ? resolveInputCodec5(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve36(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notLike"
        });
      $where.where(fragment);
    },
    likeInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve37(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "likeInsensitive"
        });
      $where.where(fragment);
    },
    notLikeInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier3 ? resolveSqlIdentifier3(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec7 ? resolveInputCodec7(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve38(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notLikeInsensitive"
        });
      $where.where(fragment);
    },
    equalToInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier4 ? resolveSqlIdentifier4(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec8 ? resolveInputCodec8(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue3 ? resolveSqlValue3($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve13(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "equalToInsensitive"
        });
      $where.where(fragment);
    },
    notEqualToInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier5 ? resolveSqlIdentifier5(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec9 ? resolveInputCodec9(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue4 ? resolveSqlValue4($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve14(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notEqualToInsensitive"
        });
      $where.where(fragment);
    },
    distinctFromInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier6 ? resolveSqlIdentifier6(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec10 ? resolveInputCodec10(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue5 ? resolveSqlValue5($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve15(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "distinctFromInsensitive"
        });
      $where.where(fragment);
    },
    notDistinctFromInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier7 ? resolveSqlIdentifier7(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec11 ? resolveInputCodec11(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue6 ? resolveSqlValue6($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve16(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notDistinctFromInsensitive"
        });
      $where.where(fragment);
    },
    inInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier8 ? resolveSqlIdentifier8(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec12 ? resolveInputCodec12(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue7 ? resolveSqlValue7($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve17(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "inInsensitive"
        });
      $where.where(fragment);
    },
    notInInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier9 ? resolveSqlIdentifier9(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec13 ? resolveInputCodec13(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue8 ? resolveSqlValue8($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve18(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "notInInsensitive"
        });
      $where.where(fragment);
    },
    lessThanInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier10 ? resolveSqlIdentifier10(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec14 ? resolveInputCodec14(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue9 ? resolveSqlValue9($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve19(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "lessThanInsensitive"
        });
      $where.where(fragment);
    },
    lessThanOrEqualToInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier11 ? resolveSqlIdentifier11(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec15 ? resolveInputCodec15(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue10 ? resolveSqlValue10($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve20(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "lessThanOrEqualToInsensitive"
        });
      $where.where(fragment);
    },
    greaterThanInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier12 ? resolveSqlIdentifier12(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec16 ? resolveInputCodec16(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue11 ? resolveSqlValue11($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve21(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "greaterThanInsensitive"
        });
      $where.where(fragment);
    },
    greaterThanOrEqualToInsensitive($where, value) {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier13 ? resolveSqlIdentifier13(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec17 ? resolveInputCodec17(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue12 ? resolveSqlValue12($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve22(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "greaterThanOrEqualToInsensitive"
        });
      $where.where(fragment);
    }
  },
  JSONFilter: {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec18 ? resolveInputCodec18(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue13 ? resolveSqlValue13($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve39(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve40(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve41(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve42(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve43(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec20 ? resolveInputCodec20(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve44(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec20 ? resolveInputCodec20(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve45(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve46(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve47(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve48(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier14 ? resolveSqlIdentifier14(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec19 ? resolveInputCodec19(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve49(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "greaterThanOrEqualTo"
        });
      $where.where(fragment);
    },
    contains($where, value) {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve50(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "contains"
        });
      $where.where(fragment);
    },
    containsKey($where, value) {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec21 ? resolveInputCodec21(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve51(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "containsKey"
        });
      $where.where(fragment);
    },
    containsAllKeys($where, value) {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec22 ? resolveInputCodec22(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve52(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "containsAllKeys"
        });
      $where.where(fragment);
    },
    containsAnyKeys($where, value) {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec22 ? resolveInputCodec22(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve53(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "containsAnyKeys"
        });
      $where.where(fragment);
    },
    containedBy($where, value) {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve54(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "containedBy"
        });
      $where.where(fragment);
    }
  },
  DatetimeFilter: {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec23 ? resolveInputCodec23(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue14 ? resolveSqlValue14($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve55(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec24 ? resolveInputCodec24(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve56(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec24 ? resolveInputCodec24(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve57(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec24 ? resolveInputCodec24(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve58(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec24 ? resolveInputCodec24(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve59(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec25 ? resolveInputCodec25(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve60(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec25 ? resolveInputCodec25(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve61(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec24 ? resolveInputCodec24(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve62(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec24 ? resolveInputCodec24(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve63(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec24 ? resolveInputCodec24(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve64(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier15 ? resolveSqlIdentifier15(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec24 ? resolveInputCodec24(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve65(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "greaterThanOrEqualTo"
        });
      $where.where(fragment);
    }
  },
  ProjectToManyColumnFilter: {
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
    },
    aggregates($where, input) {
      if (input == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = new PgAggregateCondition($where, {
          sql,
          tableExpression,
          alias
        }, pgWhereConditionSpecListToSQL);
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
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec11;
      return condition;
    },
    title(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec12;
      return condition;
    },
    projectId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec13;
      return condition;
    },
    createdAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec14;
      return condition;
    },
    updatedAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec15;
      return condition;
    },
    tasks($where, value) {
      assertAllowed23(value, "object");
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
      assertAllowed23(value, "scalar");
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
      assertAllowed24(value, "object");
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
  ColumnToManyTaskFilter: {
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
    },
    aggregates($where, input) {
      if (input == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = new PgAggregateCondition($where, {
          sql,
          tableExpression,
          alias
        }, pgWhereConditionSpecListToSQL);
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
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec16;
      return condition;
    },
    content(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec17;
      return condition;
    },
    description(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec18;
      return condition;
    },
    priority(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec19;
      return condition;
    },
    authorId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec20;
      return condition;
    },
    columnId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec21;
      return condition;
    },
    labels(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec22;
      return condition;
    },
    dueDate(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec23;
      return condition;
    },
    createdAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec24;
      return condition;
    },
    updatedAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec25;
      return condition;
    },
    columnIndex(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec26;
      return condition;
    },
    assignees($where, value) {
      assertAllowed27(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: assigneeIdentifier,
        alias: pgResource_assigneePgResource.name,
        localAttributes: registryConfig.pgRelations.task.assigneesByTheirTaskId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.task.assigneesByTheirTaskId.remoteAttributes
      };
      return $rel;
    },
    assigneesExist($where, value) {
      assertAllowed27(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: assigneeIdentifier,
        alias: pgResource_assigneePgResource.name,
        equals: value
      });
      registryConfig.pgRelations.task.assigneesByTheirTaskId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.task.assigneesByTheirTaskId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    posts($where, value) {
      assertAllowed27(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: postIdentifier,
        alias: pgResource_postPgResource.name,
        localAttributes: registryConfig.pgRelations.task.postsByTheirTaskId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.task.postsByTheirTaskId.remoteAttributes
      };
      return $rel;
    },
    postsExist($where, value) {
      assertAllowed27(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: postIdentifier,
        alias: pgResource_postPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.task.postsByTheirTaskId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.task.postsByTheirTaskId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    author($where, value) {
      assertAllowed28(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: userIdentifier,
        alias: pgResource_userPgResource.name
      });
      registryConfig.pgRelations.task.userByMyAuthorId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.task.userByMyAuthorId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    column($where, value) {
      assertAllowed28(value, "object");
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
      assertAllowed29(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed29(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed29(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  IntFilter: {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec26 ? resolveInputCodec26(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue15 ? resolveSqlValue15($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve66(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier16 ? resolveSqlIdentifier16(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec27 ? resolveInputCodec27(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve67(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier16 ? resolveSqlIdentifier16(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec27 ? resolveInputCodec27(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve68(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier16 ? resolveSqlIdentifier16(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec27 ? resolveInputCodec27(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve69(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier16 ? resolveSqlIdentifier16(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec27 ? resolveInputCodec27(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve70(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier16 ? resolveSqlIdentifier16(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec28 ? resolveInputCodec28(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve71(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier16 ? resolveSqlIdentifier16(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec28 ? resolveInputCodec28(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve72(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier16 ? resolveSqlIdentifier16(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec27 ? resolveInputCodec27(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve73(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier16 ? resolveSqlIdentifier16(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec27 ? resolveInputCodec27(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve74(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier16 ? resolveSqlIdentifier16(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec27 ? resolveInputCodec27(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve75(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier16 ? resolveSqlIdentifier16(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec27 ? resolveInputCodec27(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve76(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "greaterThanOrEqualTo"
        });
      $where.where(fragment);
    }
  },
  TaskToManyAssigneeFilter: {
    every($where, value) {
      assertAllowed30(value, "object");
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
      assertAllowed30(value, "object");
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
      assertAllowed30(value, "object");
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
    },
    aggregates($where, input) {
      if (input == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = new PgAggregateCondition($where, {
          sql,
          tableExpression,
          alias
        }, pgWhereConditionSpecListToSQL);
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
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec27;
      return condition;
    },
    userId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec28;
      return condition;
    },
    taskId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec29;
      return condition;
    },
    createdAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec30;
      return condition;
    },
    updatedAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec31;
      return condition;
    },
    deletedAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec32;
      return condition;
    },
    task($where, value) {
      assertAllowed31(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: taskIdentifier,
        alias: pgResource_taskPgResource.name
      });
      registryConfig.pgRelations.assignee.taskByMyTaskId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.assignee.taskByMyTaskId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    user($where, value) {
      assertAllowed31(value, "object");
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
      assertAllowed32(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed32(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed32(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  UserFilter: {
    rowId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec33;
      return condition;
    },
    identityProviderId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec34;
      return condition;
    },
    name(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec35;
      return condition;
    },
    avatarUrl(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec36;
      return condition;
    },
    createdAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec37;
      return condition;
    },
    updatedAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec38;
      return condition;
    },
    assignees($where, value) {
      assertAllowed33(value, "object");
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
      assertAllowed33(value, "scalar");
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
      assertAllowed33(value, "object");
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
      assertAllowed33(value, "scalar");
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
    authoredTasks($where, value) {
      assertAllowed33(value, "object");
      const $rel = $where.andPlan();
      $rel.extensions.pgFilterRelation = {
        tableExpression: taskIdentifier,
        alias: pgResource_taskPgResource.name,
        localAttributes: registryConfig.pgRelations.user.tasksByTheirAuthorId.localAttributes,
        remoteAttributes: registryConfig.pgRelations.user.tasksByTheirAuthorId.remoteAttributes
      };
      return $rel;
    },
    authoredTasksExist($where, value) {
      assertAllowed33(value, "scalar");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: taskIdentifier,
        alias: pgResource_taskPgResource.name,
        equals: value
      });
      registryConfig.pgRelations.user.tasksByTheirAuthorId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.user.tasksByTheirAuthorId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
    },
    workspaceUsers($where, value) {
      assertAllowed33(value, "object");
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
      assertAllowed33(value, "scalar");
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
      assertAllowed34(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed34(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed34(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  UserToManyAssigneeFilter: {
    every($where, value) {
      assertAllowed35(value, "object");
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
      assertAllowed35(value, "object");
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
      assertAllowed35(value, "object");
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
    },
    aggregates($where, input) {
      if (input == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = new PgAggregateCondition($where, {
          sql,
          tableExpression,
          alias
        }, pgWhereConditionSpecListToSQL);
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  AssigneeAggregatesFilter: {
    filter($subquery, input) {
      if (input == null) return;
      return new PgCondition($subquery, !1, "AND");
    },
    distinctCount($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(spec);
    }
  },
  AssigneeDistinctCountAggregateFilter: {
    rowId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("id")}`, spec_assignee.attributes.id.codec)
      };
      return $col;
    },
    userId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("user_id")}`, spec_assignee.attributes.user_id.codec)
      };
      return $col;
    },
    taskId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("task_id")}`, spec_assignee.attributes.task_id.codec)
      };
      return $col;
    },
    createdAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("created_at")}`, spec_assignee.attributes.created_at.codec)
      };
      return $col;
    },
    updatedAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("updated_at")}`, spec_assignee.attributes.updated_at.codec)
      };
      return $col;
    },
    deletedAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("deleted_at")}`, spec_assignee.attributes.deleted_at.codec)
      };
      return $col;
    }
  },
  BigIntFilter: {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec29 ? resolveInputCodec29(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue16 ? resolveSqlValue16($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve77(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier17 ? resolveSqlIdentifier17(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec30 ? resolveInputCodec30(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve78(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier17 ? resolveSqlIdentifier17(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec30 ? resolveInputCodec30(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve79(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier17 ? resolveSqlIdentifier17(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec30 ? resolveInputCodec30(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve80(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier17 ? resolveSqlIdentifier17(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec30 ? resolveInputCodec30(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve81(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier17 ? resolveSqlIdentifier17(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec31 ? resolveInputCodec31(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve82(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier17 ? resolveSqlIdentifier17(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec31 ? resolveInputCodec31(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve83(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier17 ? resolveSqlIdentifier17(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec30 ? resolveInputCodec30(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve84(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier17 ? resolveSqlIdentifier17(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec30 ? resolveInputCodec30(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve85(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier17 ? resolveSqlIdentifier17(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec30 ? resolveInputCodec30(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve86(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier17 ? resolveSqlIdentifier17(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec30 ? resolveInputCodec30(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve87(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "greaterThanOrEqualTo"
        });
      $where.where(fragment);
    }
  },
  UserToManyPostFilter: {
    every($where, value) {
      assertAllowed36(value, "object");
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
      assertAllowed36(value, "object");
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
      assertAllowed36(value, "object");
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
    },
    aggregates($where, input) {
      if (input == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = new PgAggregateCondition($where, {
          sql,
          tableExpression,
          alias
        }, pgWhereConditionSpecListToSQL);
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
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec39;
      return condition;
    },
    title(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec40;
      return condition;
    },
    description(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec41;
      return condition;
    },
    authorId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec42;
      return condition;
    },
    taskId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec43;
      return condition;
    },
    createdAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec44;
      return condition;
    },
    updatedAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec45;
      return condition;
    },
    author($where, value) {
      assertAllowed37(value, "object");
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
    task($where, value) {
      assertAllowed37(value, "object");
      if (value == null) return;
      const $subQuery = $where.existsPlan({
        tableExpression: taskIdentifier,
        alias: pgResource_taskPgResource.name
      });
      registryConfig.pgRelations.post.taskByMyTaskId.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = registryConfig.pgRelations.post.taskByMyTaskId.remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    },
    and($where, value) {
      assertAllowed38(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed38(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed38(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  PostAggregatesFilter: {
    filter($subquery, input) {
      if (input == null) return;
      return new PgCondition($subquery, !1, "AND");
    },
    distinctCount($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(spec);
    }
  },
  PostDistinctCountAggregateFilter: {
    rowId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("id")}`, spec_post.attributes.id.codec)
      };
      return $col;
    },
    title($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("title")}`, spec_post.attributes.title.codec)
      };
      return $col;
    },
    description($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("description")}`, spec_post.attributes.description.codec)
      };
      return $col;
    },
    authorId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("author_id")}`, spec_post.attributes.author_id.codec)
      };
      return $col;
    },
    taskId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("task_id")}`, spec_post.attributes.task_id.codec)
      };
      return $col;
    },
    createdAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("created_at")}`, spec_post.attributes.created_at.codec)
      };
      return $col;
    },
    updatedAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("updated_at")}`, spec_post.attributes.updated_at.codec)
      };
      return $col;
    }
  },
  UserToManyTaskFilter: {
    every($where, value) {
      assertAllowed39(value, "object");
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
      assertAllowed39(value, "object");
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
      assertAllowed39(value, "object");
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
    },
    aggregates($where, input) {
      if (input == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = new PgAggregateCondition($where, {
          sql,
          tableExpression,
          alias
        }, pgWhereConditionSpecListToSQL);
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  TaskAggregatesFilter: {
    filter($subquery, input) {
      if (input == null) return;
      return new PgCondition($subquery, !1, "AND");
    },
    sum($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(aggregateSpec);
    },
    distinctCount($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(spec);
    },
    min($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(aggregateSpec2);
    },
    max($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(aggregateSpec3);
    },
    average($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(aggregateSpec4);
    },
    stddevSample($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(aggregateSpec5);
    },
    stddevPopulation($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(aggregateSpec6);
    },
    varianceSample($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(aggregateSpec7);
    },
    variancePopulation($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(aggregateSpec8);
    }
  },
  TaskSumAggregateFilter: {
    columnIndex($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: aggregateSpec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)
      };
      return $col;
    }
  },
  TaskDistinctCountAggregateFilter: {
    rowId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("id")}`, spec_task.attributes.id.codec)
      };
      return $col;
    },
    content($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("content")}`, spec_task.attributes.content.codec)
      };
      return $col;
    },
    description($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("description")}`, spec_task.attributes.description.codec)
      };
      return $col;
    },
    priority($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("priority")}`, spec_task.attributes.priority.codec)
      };
      return $col;
    },
    authorId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("author_id")}`, spec_task.attributes.author_id.codec)
      };
      return $col;
    },
    columnId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("column_id")}`, spec_task.attributes.column_id.codec)
      };
      return $col;
    },
    labels($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("labels")}`, spec_task.attributes.labels.codec)
      };
      return $col;
    },
    dueDate($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("due_date")}`, spec_task.attributes.due_date.codec)
      };
      return $col;
    },
    createdAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("created_at")}`, spec_task.attributes.created_at.codec)
      };
      return $col;
    },
    updatedAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("updated_at")}`, spec_task.attributes.updated_at.codec)
      };
      return $col;
    },
    columnIndex($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)
      };
      return $col;
    }
  },
  TaskMinAggregateFilter: {
    columnIndex($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.int,
        expression: aggregateSpec2.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)
      };
      return $col;
    }
  },
  TaskMaxAggregateFilter: {
    columnIndex($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.int,
        expression: aggregateSpec3.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)
      };
      return $col;
    }
  },
  TaskAverageAggregateFilter: {
    columnIndex($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.numeric,
        expression: aggregateSpec4.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)
      };
      return $col;
    }
  },
  BigFloatFilter: {
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
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec32 ? resolveInputCodec32(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = resolveSqlValue17 ? resolveSqlValue17($where, value, inputCodec) : sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve88(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier18 ? resolveSqlIdentifier18(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec33 ? resolveInputCodec33(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve89(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier18 ? resolveSqlIdentifier18(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec33 ? resolveInputCodec33(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve90(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier18 ? resolveSqlIdentifier18(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec33 ? resolveInputCodec33(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve91(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier18 ? resolveSqlIdentifier18(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec33 ? resolveInputCodec33(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve92(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier18 ? resolveSqlIdentifier18(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec34 ? resolveInputCodec34(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve93(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier18 ? resolveSqlIdentifier18(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec34 ? resolveInputCodec34(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve94(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier18 ? resolveSqlIdentifier18(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec33 ? resolveInputCodec33(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve95(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier18 ? resolveSqlIdentifier18(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec33 ? resolveInputCodec33(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve96(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier18 ? resolveSqlIdentifier18(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec33 ? resolveInputCodec33(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve97(sqlIdentifier, sqlValue, value, $where, {
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
        [sqlIdentifier, identifierCodec] = resolveSqlIdentifier18 ? resolveSqlIdentifier18(sourceAlias, sourceCodec) : [sourceAlias, sourceCodec];
      if (true && value === null) return;
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const resolvedInput = value,
        inputCodec = resolveInputCodec33 ? resolveInputCodec33(codec ?? attribute.codec) : codec ?? attribute.codec,
        sqlValue = sqlValueWithCodec(resolvedInput, inputCodec),
        fragment = resolve98(sqlIdentifier, sqlValue, value, $where, {
          fieldName: parentFieldName ?? null,
          operatorName: "greaterThanOrEqualTo"
        });
      $where.where(fragment);
    }
  },
  BigFloat: {
    serialize: UUIDSerialize,
    parseValue: UUIDSerialize,
    parseLiteral(ast) {
      if (ast.kind !== Kind.STRING) throw new GraphQLError(`${"BigFloat" ?? "This scalar"} can only parse string values (kind='${ast.kind}')`);
      return ast.value;
    }
  },
  TaskStddevSampleAggregateFilter: {
    columnIndex($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.numeric,
        expression: aggregateSpec5.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)
      };
      return $col;
    }
  },
  TaskStddevPopulationAggregateFilter: {
    columnIndex($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.numeric,
        expression: aggregateSpec6.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)
      };
      return $col;
    }
  },
  TaskVarianceSampleAggregateFilter: {
    columnIndex($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.numeric,
        expression: aggregateSpec7.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)
      };
      return $col;
    }
  },
  TaskVariancePopulationAggregateFilter: {
    columnIndex($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.numeric,
        expression: aggregateSpec8.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)
      };
      return $col;
    }
  },
  UserToManyWorkspaceUserFilter: {
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
    },
    aggregates($where, input) {
      if (input == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = new PgAggregateCondition($where, {
          sql,
          tableExpression,
          alias
        }, pgWhereConditionSpecListToSQL);
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
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec46;
      return condition;
    },
    userId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec47;
      return condition;
    },
    createdAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec48;
      return condition;
    },
    user($where, value) {
      assertAllowed41(value, "object");
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
      assertAllowed41(value, "object");
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
      assertAllowed42(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed42(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed42(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  WorkspaceFilter: {
    rowId(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec49;
      return condition;
    },
    name(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec50;
      return condition;
    },
    createdAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec51;
      return condition;
    },
    updatedAt(queryBuilder, value) {
      if (value === void 0) return;
      if (!true && isEmpty(value)) throw Object.assign(new Error("Empty objects are forbidden in filter argument input."), {});
      if (!true && value === null) throw Object.assign(new Error("Null literals are forbidden in filter argument input."), {});
      const condition = new PgCondition(queryBuilder);
      condition.extensions.pgFilterAttribute = colSpec52;
      return condition;
    },
    projects($where, value) {
      assertAllowed43(value, "object");
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
      assertAllowed43(value, "scalar");
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
      assertAllowed43(value, "object");
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
      assertAllowed43(value, "scalar");
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
      assertAllowed44(value, "list");
      if (value == null) return;
      return $where.andPlan();
    },
    or($where, value) {
      assertAllowed44(value, "list");
      if (value == null) return;
      const $or = $where.orPlan();
      return () => $or.andPlan();
    },
    not($where, value) {
      assertAllowed44(value, "object");
      if (value == null) return;
      return $where.notPlan().andPlan();
    }
  },
  WorkspaceToManyProjectFilter: {
    every($where, value) {
      assertAllowed45(value, "object");
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
      assertAllowed45(value, "object");
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
      assertAllowed45(value, "object");
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
    },
    aggregates($where, input) {
      if (input == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = new PgAggregateCondition($where, {
          sql,
          tableExpression,
          alias
        }, pgWhereConditionSpecListToSQL);
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  ProjectAggregatesFilter: {
    filter($subquery, input) {
      if (input == null) return;
      return new PgCondition($subquery, !1, "AND");
    },
    distinctCount($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(spec);
    }
  },
  ProjectDistinctCountAggregateFilter: {
    rowId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("id")}`, spec_project.attributes.id.codec)
      };
      return $col;
    },
    name($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("name")}`, spec_project.attributes.name.codec)
      };
      return $col;
    },
    description($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("description")}`, spec_project.attributes.description.codec)
      };
      return $col;
    },
    prefix($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("prefix")}`, spec_project.attributes.prefix.codec)
      };
      return $col;
    },
    color($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("color")}`, spec_project.attributes.color.codec)
      };
      return $col;
    },
    labels($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("labels")}`, spec_project.attributes.labels.codec)
      };
      return $col;
    },
    workspaceId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("workspace_id")}`, spec_project.attributes.workspace_id.codec)
      };
      return $col;
    },
    viewMode($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("view_mode")}`, spec_project.attributes.view_mode.codec)
      };
      return $col;
    },
    createdAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("created_at")}`, spec_project.attributes.created_at.codec)
      };
      return $col;
    },
    updatedAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("updated_at")}`, spec_project.attributes.updated_at.codec)
      };
      return $col;
    }
  },
  WorkspaceToManyWorkspaceUserFilter: {
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
    },
    aggregates($where, input) {
      if (input == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = new PgAggregateCondition($where, {
          sql,
          tableExpression,
          alias
        }, pgWhereConditionSpecListToSQL);
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  WorkspaceUserAggregatesFilter: {
    filter($subquery, input) {
      if (input == null) return;
      return new PgCondition($subquery, !1, "AND");
    },
    distinctCount($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(spec);
    }
  },
  WorkspaceUserDistinctCountAggregateFilter: {
    workspaceId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("workspace_id")}`, spec_workspaceUser.attributes.workspace_id.codec)
      };
      return $col;
    },
    userId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("user_id")}`, spec_workspaceUser.attributes.user_id.codec)
      };
      return $col;
    },
    createdAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("created_at")}`, spec_workspaceUser.attributes.created_at.codec)
      };
      return $col;
    }
  },
  TaskToManyPostFilter: {
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
    },
    aggregates($where, input) {
      if (input == null) return;
      if (!$where.extensions.pgFilterRelation) throw new Error("Invalid use of filter, 'pgFilterRelation' expected");
      const {
          localAttributes,
          remoteAttributes,
          tableExpression,
          alias
        } = $where.extensions.pgFilterRelation,
        $subQuery = new PgAggregateCondition($where, {
          sql,
          tableExpression,
          alias
        }, pgWhereConditionSpecListToSQL);
      localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = remoteAttributes[i];
        $subQuery.where(sql`${$where.alias}.${sql.identifier(localAttribute)} = ${$subQuery.alias}.${sql.identifier(remoteAttribute)}`);
      });
      return $subQuery;
    }
  },
  ColumnAggregatesFilter: {
    filter($subquery, input) {
      if (input == null) return;
      return new PgCondition($subquery, !1, "AND");
    },
    distinctCount($subquery, input) {
      if (input == null) return;
      return $subquery.forAggregate(spec);
    }
  },
  ColumnDistinctCountAggregateFilter: {
    rowId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("id")}`, spec_column.attributes.id.codec)
      };
      return $col;
    },
    title($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("title")}`, spec_column.attributes.title.codec)
      };
      return $col;
    },
    projectId($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("project_id")}`, spec_column.attributes.project_id.codec)
      };
      return $col;
    },
    createdAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("created_at")}`, spec_column.attributes.created_at.codec)
      };
      return $col;
    },
    updatedAt($parent, input) {
      if (input == null) return;
      const $col = new PgCondition($parent);
      $col.extensions.pgFilterAttribute = {
        codec: TYPES.bigint,
        expression: spec.sqlAggregateWrap(sql`${$col.alias}.${sql.identifier("updated_at")}`, spec_column.attributes.updated_at.codec)
      };
      return $col;
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
    NAME_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "name",
        direction: "ASC"
      });
    },
    NAME_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "name",
        direction: "DESC"
      });
    },
    DESCRIPTION_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "description",
        direction: "ASC"
      });
    },
    DESCRIPTION_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "description",
        direction: "DESC"
      });
    },
    PREFIX_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "prefix",
        direction: "ASC"
      });
    },
    PREFIX_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "prefix",
        direction: "DESC"
      });
    },
    COLOR_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "color",
        direction: "ASC"
      });
    },
    COLOR_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "color",
        direction: "DESC"
      });
    },
    LABELS_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "labels",
        direction: "ASC"
      });
    },
    LABELS_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "labels",
        direction: "DESC"
      });
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
    },
    VIEW_MODE_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "view_mode",
        direction: "ASC"
      });
    },
    VIEW_MODE_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "view_mode",
        direction: "DESC"
      });
    },
    CREATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "ASC"
      });
    },
    CREATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "DESC"
      });
    },
    UPDATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "ASC"
      });
    },
    UPDATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "DESC"
      });
    },
    COLUMNS_COUNT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "ASC"
      });
    },
    COLUMNS_COUNT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "DESC"
      });
    },
    COLUMNS_DISTINCT_COUNT_ROW_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_column.attributes.id.codec)}
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_column.attributes.id.codec) ?? spec_column.attributes.id.codec,
        direction: "ASC"
      });
    },
    COLUMNS_DISTINCT_COUNT_ROW_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_column.attributes.id.codec)}
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_column.attributes.id.codec) ?? spec_column.attributes.id.codec,
        direction: "DESC"
      });
    },
    COLUMNS_DISTINCT_COUNT_TITLE_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("title")}`, spec_column.attributes.title.codec)}
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_column.attributes.title.codec) ?? spec_column.attributes.title.codec,
        direction: "ASC"
      });
    },
    COLUMNS_DISTINCT_COUNT_TITLE_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("title")}`, spec_column.attributes.title.codec)}
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_column.attributes.title.codec) ?? spec_column.attributes.title.codec,
        direction: "DESC"
      });
    },
    COLUMNS_DISTINCT_COUNT_PROJECT_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("project_id")}`, spec_column.attributes.project_id.codec)}
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_column.attributes.project_id.codec) ?? spec_column.attributes.project_id.codec,
        direction: "ASC"
      });
    },
    COLUMNS_DISTINCT_COUNT_PROJECT_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("project_id")}`, spec_column.attributes.project_id.codec)}
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_column.attributes.project_id.codec) ?? spec_column.attributes.project_id.codec,
        direction: "DESC"
      });
    },
    COLUMNS_DISTINCT_COUNT_CREATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_column.attributes.created_at.codec)}
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_column.attributes.created_at.codec) ?? spec_column.attributes.created_at.codec,
        direction: "ASC"
      });
    },
    COLUMNS_DISTINCT_COUNT_CREATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_column.attributes.created_at.codec)}
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_column.attributes.created_at.codec) ?? spec_column.attributes.created_at.codec,
        direction: "DESC"
      });
    },
    COLUMNS_DISTINCT_COUNT_UPDATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_column.attributes.updated_at.codec)}
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_column.attributes.updated_at.codec) ?? spec_column.attributes.updated_at.codec,
        direction: "ASC"
      });
    },
    COLUMNS_DISTINCT_COUNT_UPDATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_columnPgResource.name));
      relation.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_columnPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_column.attributes.updated_at.codec)}
from ${pgResource_columnPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_column.attributes.updated_at.codec) ?? spec_column.attributes.updated_at.codec,
        direction: "DESC"
      });
    }
  },
  WorkspaceUserConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    },
    aggregates($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").single();
    },
    groupedAggregates: {
      plan($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate");
      },
      args: {
        groupBy(_$parent, $pgSelect, input) {
          return input.apply($pgSelect);
        },
        having(_$parent, $pgSelect, input) {
          return input.apply($pgSelect, queryBuilder => queryBuilder.havingBuilder());
        }
      }
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
  WorkspaceUserAggregates: {
    __assertStep: assertPgClassSingleStep,
    keys($pgSelectSingle) {
      const $groupDetails = $pgSelectSingle.getClassStep().getGroupDetails();
      return lambda([$groupDetails, $pgSelectSingle], ([groupDetails, item]) => {
        if (groupDetails.indicies.length === 0 || item == null) return null;else return groupDetails.indicies.map(({
          index
        }) => item[index]);
      });
    },
    distinctCount($pgSelectSingle) {
      return $pgSelectSingle;
    }
  },
  WorkspaceUserDistinctCountAggregates: {
    workspaceId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("workspace_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    userId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("user_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    createdAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("created_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    }
  },
  WorkspaceUserGroupBy: {
    WORKSPACE_ID($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("workspace_id")}`,
        codec: TYPES.uuid
      });
    },
    USER_ID($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("user_id")}`,
        codec: TYPES.uuid
      });
    },
    CREATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("created_at")}`,
        codec: TYPES.timestamptz
      });
    },
    CREATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    CREATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    }
  },
  WorkspaceUserHavingInput: {
    AND($where) {
      return $where;
    },
    OR($where) {
      return new PgOrFilter($where);
    },
    sum($having) {
      return $having;
    },
    distinctCount($having) {
      return $having;
    },
    min($having) {
      return $having;
    },
    max($having) {
      return $having;
    },
    average($having) {
      return $having;
    },
    stddevSample($having) {
      return $having;
    },
    stddevPopulation($having) {
      return $having;
    },
    varianceSample($having) {
      return $having;
    },
    variancePopulation($having) {
      return $having;
    }
  },
  WorkspaceUserHavingSumInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_workspaceUser.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceUserHavingDistinctCountInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_workspaceUser.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceUserHavingMinInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_workspaceUser.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceUserHavingMaxInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_workspaceUser.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceUserHavingAverageInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_workspaceUser.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceUserHavingStddevSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_workspaceUser.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceUserHavingStddevPopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_workspaceUser.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceUserHavingVarianceSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_workspaceUser.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceUserHavingVariancePopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_workspaceUser.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
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
    },
    createdAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "created_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
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
    },
    CREATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "ASC"
      });
    },
    CREATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "DESC"
      });
    }
  },
  ColumnConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    },
    aggregates($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").single();
    },
    groupedAggregates: {
      plan($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate");
      },
      args: {
        groupBy(_$parent, $pgSelect, input) {
          return input.apply($pgSelect);
        },
        having(_$parent, $pgSelect, input) {
          return input.apply($pgSelect, queryBuilder => queryBuilder.havingBuilder());
        }
      }
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
  ColumnAggregates: {
    __assertStep: assertPgClassSingleStep,
    keys($pgSelectSingle) {
      const $groupDetails = $pgSelectSingle.getClassStep().getGroupDetails();
      return lambda([$groupDetails, $pgSelectSingle], ([groupDetails, item]) => {
        if (groupDetails.indicies.length === 0 || item == null) return null;else return groupDetails.indicies.map(({
          index
        }) => item[index]);
      });
    },
    distinctCount($pgSelectSingle) {
      return $pgSelectSingle;
    }
  },
  ColumnDistinctCountAggregates: {
    rowId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    title($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("title")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.text);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    projectId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("project_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    createdAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("created_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    updatedAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("updated_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    }
  },
  ColumnGroupBy: {
    TITLE($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("title")}`,
        codec: TYPES.text
      });
    },
    PROJECT_ID($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("project_id")}`,
        codec: TYPES.uuid
      });
    },
    CREATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("created_at")}`,
        codec: TYPES.timestamptz
      });
    },
    CREATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    CREATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("updated_at")}`,
        codec: TYPES.timestamptz
      });
    },
    UPDATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    }
  },
  ColumnHavingInput: {
    AND($where) {
      return $where;
    },
    OR($where) {
      return new PgOrFilter($where);
    },
    sum($having) {
      return $having;
    },
    distinctCount($having) {
      return $having;
    },
    min($having) {
      return $having;
    },
    max($having) {
      return $having;
    },
    average($having) {
      return $having;
    },
    stddevSample($having) {
      return $having;
    },
    stddevPopulation($having) {
      return $having;
    },
    varianceSample($having) {
      return $having;
    },
    variancePopulation($having) {
      return $having;
    }
  },
  ColumnHavingSumInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_column.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_column.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ColumnHavingDistinctCountInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_column.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_column.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ColumnHavingMinInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_column.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_column.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ColumnHavingMaxInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_column.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_column.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ColumnHavingAverageInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_column.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_column.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ColumnHavingStddevSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_column.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_column.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ColumnHavingStddevPopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_column.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_column.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ColumnHavingVarianceSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_column.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_column.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  ColumnHavingVariancePopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_column.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_column.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
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
    title($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "title",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
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
    },
    createdAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "created_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    },
    updatedAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "updated_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
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
    TITLE_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "title",
        direction: "ASC"
      });
    },
    TITLE_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "title",
        direction: "DESC"
      });
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
    },
    CREATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "ASC"
      });
    },
    CREATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "DESC"
      });
    },
    UPDATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "ASC"
      });
    },
    UPDATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "DESC"
      });
    },
    TASKS_COUNT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "ASC"
      });
    },
    TASKS_COUNT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "DESC"
      });
    },
    TASKS_SUM_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    TASKS_SUM_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_ROW_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_task.attributes.id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.id.codec) ?? spec_task.attributes.id.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_ROW_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_task.attributes.id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.id.codec) ?? spec_task.attributes.id.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_CONTENT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("content")}`, spec_task.attributes.content.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.content.codec) ?? spec_task.attributes.content.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_CONTENT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("content")}`, spec_task.attributes.content.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.content.codec) ?? spec_task.attributes.content.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_DESCRIPTION_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("description")}`, spec_task.attributes.description.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.description.codec) ?? spec_task.attributes.description.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_DESCRIPTION_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("description")}`, spec_task.attributes.description.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.description.codec) ?? spec_task.attributes.description.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_PRIORITY_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("priority")}`, spec_task.attributes.priority.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.priority.codec) ?? spec_task.attributes.priority.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_PRIORITY_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("priority")}`, spec_task.attributes.priority.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.priority.codec) ?? spec_task.attributes.priority.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_AUTHOR_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("author_id")}`, spec_task.attributes.author_id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.author_id.codec) ?? spec_task.attributes.author_id.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_AUTHOR_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("author_id")}`, spec_task.attributes.author_id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.author_id.codec) ?? spec_task.attributes.author_id.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_COLUMN_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_id")}`, spec_task.attributes.column_id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.column_id.codec) ?? spec_task.attributes.column_id.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_COLUMN_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_id")}`, spec_task.attributes.column_id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.column_id.codec) ?? spec_task.attributes.column_id.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_LABELS_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("labels")}`, spec_task.attributes.labels.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.labels.codec) ?? spec_task.attributes.labels.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_LABELS_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("labels")}`, spec_task.attributes.labels.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.labels.codec) ?? spec_task.attributes.labels.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_DUE_DATE_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("due_date")}`, spec_task.attributes.due_date.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.due_date.codec) ?? spec_task.attributes.due_date.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_DUE_DATE_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("due_date")}`, spec_task.attributes.due_date.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.due_date.codec) ?? spec_task.attributes.due_date.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_CREATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_task.attributes.created_at.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.created_at.codec) ?? spec_task.attributes.created_at.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_CREATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_task.attributes.created_at.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.created_at.codec) ?? spec_task.attributes.created_at.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_UPDATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_task.attributes.updated_at.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.updated_at.codec) ?? spec_task.attributes.updated_at.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_UPDATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_task.attributes.updated_at.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.updated_at.codec) ?? spec_task.attributes.updated_at.codec,
        direction: "DESC"
      });
    },
    TASKS_DISTINCT_COUNT_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    TASKS_DISTINCT_COUNT_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    TASKS_MIN_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec2.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec2.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    TASKS_MIN_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec2.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec2.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    TASKS_MAX_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec3.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec3.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    TASKS_MAX_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec3.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec3.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    TASKS_AVERAGE_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec4.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec4.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    TASKS_AVERAGE_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec4.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec4.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    TASKS_STDDEV_SAMPLE_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec5.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec5.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    TASKS_STDDEV_SAMPLE_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec5.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec5.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    TASKS_STDDEV_POPULATION_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec6.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec6.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    TASKS_STDDEV_POPULATION_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec6.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec6.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    TASKS_VARIANCE_SAMPLE_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec7.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec7.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    TASKS_VARIANCE_SAMPLE_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec7.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec7.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    TASKS_VARIANCE_POPULATION_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec8.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec8.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    TASKS_VARIANCE_POPULATION_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation2.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation2.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec8.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec8.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    }
  },
  TaskConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    },
    aggregates($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").single();
    },
    groupedAggregates: {
      plan($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate");
      },
      args: {
        groupBy(_$parent, $pgSelect, input) {
          return input.apply($pgSelect);
        },
        having(_$parent, $pgSelect, input) {
          return input.apply($pgSelect, queryBuilder => queryBuilder.havingBuilder());
        }
      }
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
  TaskAggregates: {
    __assertStep: assertPgClassSingleStep,
    keys($pgSelectSingle) {
      const $groupDetails = $pgSelectSingle.getClassStep().getGroupDetails();
      return lambda([$groupDetails, $pgSelectSingle], ([groupDetails, item]) => {
        if (groupDetails.indicies.length === 0 || item == null) return null;else return groupDetails.indicies.map(({
          index
        }) => item[index]);
      });
    },
    sum($pgSelectSingle) {
      return $pgSelectSingle;
    },
    distinctCount($pgSelectSingle) {
      return $pgSelectSingle;
    },
    min($pgSelectSingle) {
      return $pgSelectSingle;
    },
    max($pgSelectSingle) {
      return $pgSelectSingle;
    },
    average($pgSelectSingle) {
      return $pgSelectSingle;
    },
    stddevSample($pgSelectSingle) {
      return $pgSelectSingle;
    },
    stddevPopulation($pgSelectSingle) {
      return $pgSelectSingle;
    },
    varianceSample($pgSelectSingle) {
      return $pgSelectSingle;
    },
    variancePopulation($pgSelectSingle) {
      return $pgSelectSingle;
    }
  },
  TaskSumAggregates: {
    columnIndex($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("column_index")}`,
        sqlAggregate = aggregateSpec.sqlAggregateWrap(sqlAttribute, TYPES.int);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    }
  },
  TaskDistinctCountAggregates: {
    rowId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    content($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("content")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.text);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    description($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("description")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.text);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    priority($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("priority")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.varchar);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    authorId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("author_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    columnId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("column_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    labels($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("labels")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.jsonb);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    dueDate($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("due_date")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    createdAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("created_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    updatedAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("updated_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    columnIndex($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("column_index")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.int);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    }
  },
  TaskMinAggregates: {
    columnIndex($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("column_index")}`,
        sqlAggregate = aggregateSpec2.sqlAggregateWrap(sqlAttribute, TYPES.int);
      return $pgSelectSingle.select(sqlAggregate, TYPES.int);
    }
  },
  TaskMaxAggregates: {
    columnIndex($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("column_index")}`,
        sqlAggregate = aggregateSpec3.sqlAggregateWrap(sqlAttribute, TYPES.int);
      return $pgSelectSingle.select(sqlAggregate, TYPES.int);
    }
  },
  TaskAverageAggregates: {
    columnIndex($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("column_index")}`,
        sqlAggregate = aggregateSpec4.sqlAggregateWrap(sqlAttribute, TYPES.int);
      return $pgSelectSingle.select(sqlAggregate, TYPES.numeric);
    }
  },
  TaskStddevSampleAggregates: {
    columnIndex($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("column_index")}`,
        sqlAggregate = aggregateSpec5.sqlAggregateWrap(sqlAttribute, TYPES.int);
      return $pgSelectSingle.select(sqlAggregate, TYPES.numeric);
    }
  },
  TaskStddevPopulationAggregates: {
    columnIndex($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("column_index")}`,
        sqlAggregate = aggregateSpec6.sqlAggregateWrap(sqlAttribute, TYPES.int);
      return $pgSelectSingle.select(sqlAggregate, TYPES.numeric);
    }
  },
  TaskVarianceSampleAggregates: {
    columnIndex($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("column_index")}`,
        sqlAggregate = aggregateSpec7.sqlAggregateWrap(sqlAttribute, TYPES.int);
      return $pgSelectSingle.select(sqlAggregate, TYPES.numeric);
    }
  },
  TaskVariancePopulationAggregates: {
    columnIndex($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("column_index")}`,
        sqlAggregate = aggregateSpec8.sqlAggregateWrap(sqlAttribute, TYPES.int);
      return $pgSelectSingle.select(sqlAggregate, TYPES.numeric);
    }
  },
  TaskGroupBy: {
    CONTENT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("content")}`,
        codec: TYPES.text
      });
    },
    DESCRIPTION($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("description")}`,
        codec: TYPES.text
      });
    },
    PRIORITY($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("priority")}`,
        codec: TYPES.varchar
      });
    },
    AUTHOR_ID($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("author_id")}`,
        codec: TYPES.uuid
      });
    },
    COLUMN_ID($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("column_id")}`,
        codec: TYPES.uuid
      });
    },
    LABELS($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("labels")}`,
        codec: TYPES.jsonb
      });
    },
    DUE_DATE($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("due_date")}`,
        codec: TYPES.timestamptz
      });
    },
    DUE_DATE_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("due_date")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    DUE_DATE_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("due_date")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    CREATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("created_at")}`,
        codec: TYPES.timestamptz
      });
    },
    CREATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    CREATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("updated_at")}`,
        codec: TYPES.timestamptz
      });
    },
    UPDATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    COLUMN_INDEX($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("column_index")}`,
        codec: TYPES.int
      });
    }
  },
  TaskHavingInput: {
    AND($where) {
      return $where;
    },
    OR($where) {
      return new PgOrFilter($where);
    },
    sum($having) {
      return $having;
    },
    distinctCount($having) {
      return $having;
    },
    min($having) {
      return $having;
    },
    max($having) {
      return $having;
    },
    average($having) {
      return $having;
    },
    stddevSample($having) {
      return $having;
    },
    stddevPopulation($having) {
      return $having;
    },
    varianceSample($having) {
      return $having;
    },
    variancePopulation($having) {
      return $having;
    }
  },
  TaskHavingSumInput: {
    dueDate($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("due_date")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_task.attributes.due_date.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_task.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_task.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    columnIndex($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("column_index")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_task.attributes.column_index.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  HavingIntFilter: {
    equalTo($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix7()} ${sqlValueWithCodec(input, TYPES.int)})`);
    },
    notEqualTo($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix8()} ${sqlValueWithCodec(input, TYPES.int)})`);
    },
    greaterThan($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix9()} ${sqlValueWithCodec(input, TYPES.int)})`);
    },
    greaterThanOrEqualTo($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix10()} ${sqlValueWithCodec(input, TYPES.int)})`);
    },
    lessThan($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix11()} ${sqlValueWithCodec(input, TYPES.int)})`);
    },
    lessThanOrEqualTo($booleanFilter, input) {
      if (input == null) return;
      $booleanFilter.having(sql`(${sql.parens($booleanFilter.expression)} ${infix12()} ${sqlValueWithCodec(input, TYPES.int)})`);
    }
  },
  TaskHavingDistinctCountInput: {
    dueDate($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("due_date")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_task.attributes.due_date.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_task.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_task.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    columnIndex($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("column_index")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_task.attributes.column_index.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  TaskHavingMinInput: {
    dueDate($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("due_date")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_task.attributes.due_date.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_task.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_task.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    columnIndex($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("column_index")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_task.attributes.column_index.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  TaskHavingMaxInput: {
    dueDate($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("due_date")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_task.attributes.due_date.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_task.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_task.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    columnIndex($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("column_index")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_task.attributes.column_index.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  TaskHavingAverageInput: {
    dueDate($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("due_date")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_task.attributes.due_date.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_task.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_task.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    columnIndex($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("column_index")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_task.attributes.column_index.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  TaskHavingStddevSampleInput: {
    dueDate($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("due_date")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_task.attributes.due_date.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_task.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_task.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    columnIndex($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("column_index")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_task.attributes.column_index.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  TaskHavingStddevPopulationInput: {
    dueDate($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("due_date")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_task.attributes.due_date.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_task.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_task.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    columnIndex($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("column_index")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_task.attributes.column_index.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  TaskHavingVarianceSampleInput: {
    dueDate($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("due_date")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_task.attributes.due_date.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_task.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_task.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    columnIndex($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("column_index")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_task.attributes.column_index.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  TaskHavingVariancePopulationInput: {
    dueDate($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("due_date")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_task.attributes.due_date.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_task.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_task.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    columnIndex($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("column_index")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_task.attributes.column_index.codec);
      return new PgBooleanFilter($having, aggregateExpression);
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
    content($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "content",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
        }
      });
    },
    description($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "description",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
        }
      });
    },
    priority($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "priority",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.varchar)}`;
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
    },
    columnId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "column_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    labels($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "labels",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.jsonb)}`;
        }
      });
    },
    dueDate($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "due_date",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    },
    createdAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "created_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    },
    updatedAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "updated_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    },
    columnIndex($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "column_index",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.int)}`;
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
    CONTENT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "content",
        direction: "ASC"
      });
    },
    CONTENT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "content",
        direction: "DESC"
      });
    },
    DESCRIPTION_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "description",
        direction: "ASC"
      });
    },
    DESCRIPTION_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "description",
        direction: "DESC"
      });
    },
    PRIORITY_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "priority",
        direction: "ASC"
      });
    },
    PRIORITY_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "priority",
        direction: "DESC"
      });
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
    },
    LABELS_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "labels",
        direction: "ASC"
      });
    },
    LABELS_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "labels",
        direction: "DESC"
      });
    },
    DUE_DATE_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "due_date",
        direction: "ASC"
      });
    },
    DUE_DATE_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "due_date",
        direction: "DESC"
      });
    },
    CREATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "ASC"
      });
    },
    CREATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "DESC"
      });
    },
    UPDATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "ASC"
      });
    },
    UPDATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "DESC"
      });
    },
    COLUMN_INDEX_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "column_index",
        direction: "ASC"
      });
    },
    COLUMN_INDEX_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "column_index",
        direction: "DESC"
      });
    },
    ASSIGNEES_COUNT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "ASC"
      });
    },
    ASSIGNEES_COUNT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_ROW_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_assignee.attributes.id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.id.codec) ?? spec_assignee.attributes.id.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_ROW_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_assignee.attributes.id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.id.codec) ?? spec_assignee.attributes.id.codec,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_USER_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("user_id")}`, spec_assignee.attributes.user_id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.user_id.codec) ?? spec_assignee.attributes.user_id.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_USER_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("user_id")}`, spec_assignee.attributes.user_id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.user_id.codec) ?? spec_assignee.attributes.user_id.codec,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_TASK_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("task_id")}`, spec_assignee.attributes.task_id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.task_id.codec) ?? spec_assignee.attributes.task_id.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_TASK_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("task_id")}`, spec_assignee.attributes.task_id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.task_id.codec) ?? spec_assignee.attributes.task_id.codec,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_CREATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_assignee.attributes.created_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.created_at.codec) ?? spec_assignee.attributes.created_at.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_CREATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_assignee.attributes.created_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.created_at.codec) ?? spec_assignee.attributes.created_at.codec,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_UPDATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_assignee.attributes.updated_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.updated_at.codec) ?? spec_assignee.attributes.updated_at.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_UPDATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_assignee.attributes.updated_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.updated_at.codec) ?? spec_assignee.attributes.updated_at.codec,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_DELETED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("deleted_at")}`, spec_assignee.attributes.deleted_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.deleted_at.codec) ?? spec_assignee.attributes.deleted_at.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_DELETED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation3.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation3.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("deleted_at")}`, spec_assignee.attributes.deleted_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.deleted_at.codec) ?? spec_assignee.attributes.deleted_at.codec,
        direction: "DESC"
      });
    },
    POSTS_COUNT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "ASC"
      });
    },
    POSTS_COUNT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "DESC"
      });
    },
    POSTS_DISTINCT_COUNT_ROW_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_post.attributes.id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.id.codec) ?? spec_post.attributes.id.codec,
        direction: "ASC"
      });
    },
    POSTS_DISTINCT_COUNT_ROW_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_post.attributes.id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.id.codec) ?? spec_post.attributes.id.codec,
        direction: "DESC"
      });
    },
    POSTS_DISTINCT_COUNT_TITLE_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("title")}`, spec_post.attributes.title.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.title.codec) ?? spec_post.attributes.title.codec,
        direction: "ASC"
      });
    },
    POSTS_DISTINCT_COUNT_TITLE_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("title")}`, spec_post.attributes.title.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.title.codec) ?? spec_post.attributes.title.codec,
        direction: "DESC"
      });
    },
    POSTS_DISTINCT_COUNT_DESCRIPTION_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("description")}`, spec_post.attributes.description.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.description.codec) ?? spec_post.attributes.description.codec,
        direction: "ASC"
      });
    },
    POSTS_DISTINCT_COUNT_DESCRIPTION_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("description")}`, spec_post.attributes.description.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.description.codec) ?? spec_post.attributes.description.codec,
        direction: "DESC"
      });
    },
    POSTS_DISTINCT_COUNT_AUTHOR_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("author_id")}`, spec_post.attributes.author_id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.author_id.codec) ?? spec_post.attributes.author_id.codec,
        direction: "ASC"
      });
    },
    POSTS_DISTINCT_COUNT_AUTHOR_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("author_id")}`, spec_post.attributes.author_id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.author_id.codec) ?? spec_post.attributes.author_id.codec,
        direction: "DESC"
      });
    },
    POSTS_DISTINCT_COUNT_TASK_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("task_id")}`, spec_post.attributes.task_id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.task_id.codec) ?? spec_post.attributes.task_id.codec,
        direction: "ASC"
      });
    },
    POSTS_DISTINCT_COUNT_TASK_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("task_id")}`, spec_post.attributes.task_id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.task_id.codec) ?? spec_post.attributes.task_id.codec,
        direction: "DESC"
      });
    },
    POSTS_DISTINCT_COUNT_CREATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_post.attributes.created_at.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.created_at.codec) ?? spec_post.attributes.created_at.codec,
        direction: "ASC"
      });
    },
    POSTS_DISTINCT_COUNT_CREATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_post.attributes.created_at.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.created_at.codec) ?? spec_post.attributes.created_at.codec,
        direction: "DESC"
      });
    },
    POSTS_DISTINCT_COUNT_UPDATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_post.attributes.updated_at.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.updated_at.codec) ?? spec_post.attributes.updated_at.codec,
        direction: "ASC"
      });
    },
    POSTS_DISTINCT_COUNT_UPDATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation4.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation4.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_post.attributes.updated_at.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.updated_at.codec) ?? spec_post.attributes.updated_at.codec,
        direction: "DESC"
      });
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
    },
    taskId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "task_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    createdAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "created_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    },
    updatedAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "updated_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    },
    deletedAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "deleted_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
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
    },
    TASK_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "task_id",
        direction: "ASC"
      });
    },
    TASK_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "task_id",
        direction: "DESC"
      });
    },
    CREATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "ASC"
      });
    },
    CREATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "DESC"
      });
    },
    UPDATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "ASC"
      });
    },
    UPDATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "DESC"
      });
    },
    DELETED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "deleted_at",
        direction: "ASC"
      });
    },
    DELETED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "deleted_at",
        direction: "DESC"
      });
    }
  },
  PostConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    },
    aggregates($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").single();
    },
    groupedAggregates: {
      plan($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate");
      },
      args: {
        groupBy(_$parent, $pgSelect, input) {
          return input.apply($pgSelect);
        },
        having(_$parent, $pgSelect, input) {
          return input.apply($pgSelect, queryBuilder => queryBuilder.havingBuilder());
        }
      }
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
    taskId($record) {
      return $record.get("task_id");
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
    },
    task($record) {
      return pgResource_taskPgResource.get({
        id: $record.get("task_id")
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
  PostAggregates: {
    __assertStep: assertPgClassSingleStep,
    keys($pgSelectSingle) {
      const $groupDetails = $pgSelectSingle.getClassStep().getGroupDetails();
      return lambda([$groupDetails, $pgSelectSingle], ([groupDetails, item]) => {
        if (groupDetails.indicies.length === 0 || item == null) return null;else return groupDetails.indicies.map(({
          index
        }) => item[index]);
      });
    },
    distinctCount($pgSelectSingle) {
      return $pgSelectSingle;
    }
  },
  PostDistinctCountAggregates: {
    rowId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    title($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("title")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.text);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    description($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("description")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.text);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    authorId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("author_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    taskId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("task_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    createdAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("created_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    updatedAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("updated_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    }
  },
  PostGroupBy: {
    TITLE($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("title")}`,
        codec: TYPES.text
      });
    },
    DESCRIPTION($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("description")}`,
        codec: TYPES.text
      });
    },
    AUTHOR_ID($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("author_id")}`,
        codec: TYPES.uuid
      });
    },
    TASK_ID($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("task_id")}`,
        codec: TYPES.uuid
      });
    },
    CREATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("created_at")}`,
        codec: TYPES.timestamptz
      });
    },
    CREATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    CREATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("updated_at")}`,
        codec: TYPES.timestamptz
      });
    },
    UPDATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    }
  },
  PostHavingInput: {
    AND($where) {
      return $where;
    },
    OR($where) {
      return new PgOrFilter($where);
    },
    sum($having) {
      return $having;
    },
    distinctCount($having) {
      return $having;
    },
    min($having) {
      return $having;
    },
    max($having) {
      return $having;
    },
    average($having) {
      return $having;
    },
    stddevSample($having) {
      return $having;
    },
    stddevPopulation($having) {
      return $having;
    },
    varianceSample($having) {
      return $having;
    },
    variancePopulation($having) {
      return $having;
    }
  },
  PostHavingSumInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_post.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_post.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  PostHavingDistinctCountInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_post.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_post.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  PostHavingMinInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_post.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_post.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  PostHavingMaxInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_post.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_post.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  PostHavingAverageInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_post.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_post.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  PostHavingStddevSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_post.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_post.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  PostHavingStddevPopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_post.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_post.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  PostHavingVarianceSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_post.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_post.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  PostHavingVariancePopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_post.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_post.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
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
    title($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "title",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
        }
      });
    },
    description($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "description",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
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
    },
    taskId($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "task_id",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.uuid)}`;
        }
      });
    },
    createdAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "created_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    },
    updatedAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "updated_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
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
    TITLE_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "title",
        direction: "ASC"
      });
    },
    TITLE_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "title",
        direction: "DESC"
      });
    },
    DESCRIPTION_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "description",
        direction: "ASC"
      });
    },
    DESCRIPTION_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "description",
        direction: "DESC"
      });
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
    },
    TASK_ID_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "task_id",
        direction: "ASC"
      });
    },
    TASK_ID_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "task_id",
        direction: "DESC"
      });
    },
    CREATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "ASC"
      });
    },
    CREATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "DESC"
      });
    },
    UPDATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "ASC"
      });
    },
    UPDATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "DESC"
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
  AssigneeAggregates: {
    __assertStep: assertPgClassSingleStep,
    keys($pgSelectSingle) {
      const $groupDetails = $pgSelectSingle.getClassStep().getGroupDetails();
      return lambda([$groupDetails, $pgSelectSingle], ([groupDetails, item]) => {
        if (groupDetails.indicies.length === 0 || item == null) return null;else return groupDetails.indicies.map(({
          index
        }) => item[index]);
      });
    },
    distinctCount($pgSelectSingle) {
      return $pgSelectSingle;
    }
  },
  AssigneeDistinctCountAggregates: {
    rowId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    userId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("user_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    taskId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("task_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    createdAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("created_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    updatedAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("updated_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    deletedAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("deleted_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    }
  },
  AssigneeGroupBy: {
    USER_ID($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("user_id")}`,
        codec: TYPES.uuid
      });
    },
    TASK_ID($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("task_id")}`,
        codec: TYPES.uuid
      });
    },
    CREATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("created_at")}`,
        codec: TYPES.timestamptz
      });
    },
    CREATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    CREATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("updated_at")}`,
        codec: TYPES.timestamptz
      });
    },
    UPDATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    DELETED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("deleted_at")}`,
        codec: TYPES.timestamptz
      });
    },
    DELETED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("deleted_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    DELETED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("deleted_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    }
  },
  AssigneeHavingInput: {
    AND($where) {
      return $where;
    },
    OR($where) {
      return new PgOrFilter($where);
    },
    sum($having) {
      return $having;
    },
    distinctCount($having) {
      return $having;
    },
    min($having) {
      return $having;
    },
    max($having) {
      return $having;
    },
    average($having) {
      return $having;
    },
    stddevSample($having) {
      return $having;
    },
    stddevPopulation($having) {
      return $having;
    },
    varianceSample($having) {
      return $having;
    },
    variancePopulation($having) {
      return $having;
    }
  },
  AssigneeHavingSumInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    deletedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("deleted_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.deleted_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  AssigneeHavingDistinctCountInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    deletedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("deleted_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.deleted_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  AssigneeHavingMinInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    deletedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("deleted_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.deleted_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  AssigneeHavingMaxInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    deletedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("deleted_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.deleted_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  AssigneeHavingAverageInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    deletedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("deleted_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.deleted_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  AssigneeHavingStddevSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    deletedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("deleted_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.deleted_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  AssigneeHavingStddevPopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    deletedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("deleted_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.deleted_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  AssigneeHavingVarianceSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    deletedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("deleted_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.deleted_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  AssigneeHavingVariancePopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    deletedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("deleted_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_assignee.attributes.deleted_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    },
    aggregates($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").single();
    },
    groupedAggregates: {
      plan($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate");
      },
      args: {
        groupBy(_$parent, $pgSelect, input) {
          return input.apply($pgSelect);
        },
        having(_$parent, $pgSelect, input) {
          return input.apply($pgSelect, queryBuilder => queryBuilder.havingBuilder());
        }
      }
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
  WorkspaceAggregates: {
    __assertStep: assertPgClassSingleStep,
    keys($pgSelectSingle) {
      const $groupDetails = $pgSelectSingle.getClassStep().getGroupDetails();
      return lambda([$groupDetails, $pgSelectSingle], ([groupDetails, item]) => {
        if (groupDetails.indicies.length === 0 || item == null) return null;else return groupDetails.indicies.map(({
          index
        }) => item[index]);
      });
    },
    distinctCount($pgSelectSingle) {
      return $pgSelectSingle;
    }
  },
  WorkspaceDistinctCountAggregates: {
    rowId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    name($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("name")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.text);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    createdAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("created_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    updatedAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("updated_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    }
  },
  WorkspaceGroupBy: {
    NAME($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("name")}`,
        codec: TYPES.text
      });
    },
    CREATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("created_at")}`,
        codec: TYPES.timestamptz
      });
    },
    CREATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    CREATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("updated_at")}`,
        codec: TYPES.timestamptz
      });
    },
    UPDATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    }
  },
  WorkspaceHavingInput: {
    AND($where) {
      return $where;
    },
    OR($where) {
      return new PgOrFilter($where);
    },
    sum($having) {
      return $having;
    },
    distinctCount($having) {
      return $having;
    },
    min($having) {
      return $having;
    },
    max($having) {
      return $having;
    },
    average($having) {
      return $having;
    },
    stddevSample($having) {
      return $having;
    },
    stddevPopulation($having) {
      return $having;
    },
    varianceSample($having) {
      return $having;
    },
    variancePopulation($having) {
      return $having;
    }
  },
  WorkspaceHavingSumInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceHavingDistinctCountInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceHavingMinInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceHavingMaxInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceHavingAverageInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceHavingStddevSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceHavingStddevPopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceHavingVarianceSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  WorkspaceHavingVariancePopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_workspace.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
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
    },
    name($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "name",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
        }
      });
    },
    createdAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "created_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    },
    updatedAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "updated_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
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
    },
    NAME_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "name",
        direction: "ASC"
      });
    },
    NAME_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "name",
        direction: "DESC"
      });
    },
    CREATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "ASC"
      });
    },
    CREATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "DESC"
      });
    },
    UPDATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "ASC"
      });
    },
    UPDATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "DESC"
      });
    },
    PROJECTS_COUNT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "ASC"
      });
    },
    PROJECTS_COUNT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "DESC"
      });
    },
    PROJECTS_DISTINCT_COUNT_ROW_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_project.attributes.id.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.id.codec) ?? spec_project.attributes.id.codec,
        direction: "ASC"
      });
    },
    PROJECTS_DISTINCT_COUNT_ROW_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_project.attributes.id.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.id.codec) ?? spec_project.attributes.id.codec,
        direction: "DESC"
      });
    },
    PROJECTS_DISTINCT_COUNT_NAME_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("name")}`, spec_project.attributes.name.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.name.codec) ?? spec_project.attributes.name.codec,
        direction: "ASC"
      });
    },
    PROJECTS_DISTINCT_COUNT_NAME_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("name")}`, spec_project.attributes.name.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.name.codec) ?? spec_project.attributes.name.codec,
        direction: "DESC"
      });
    },
    PROJECTS_DISTINCT_COUNT_DESCRIPTION_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("description")}`, spec_project.attributes.description.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.description.codec) ?? spec_project.attributes.description.codec,
        direction: "ASC"
      });
    },
    PROJECTS_DISTINCT_COUNT_DESCRIPTION_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("description")}`, spec_project.attributes.description.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.description.codec) ?? spec_project.attributes.description.codec,
        direction: "DESC"
      });
    },
    PROJECTS_DISTINCT_COUNT_PREFIX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("prefix")}`, spec_project.attributes.prefix.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.prefix.codec) ?? spec_project.attributes.prefix.codec,
        direction: "ASC"
      });
    },
    PROJECTS_DISTINCT_COUNT_PREFIX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("prefix")}`, spec_project.attributes.prefix.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.prefix.codec) ?? spec_project.attributes.prefix.codec,
        direction: "DESC"
      });
    },
    PROJECTS_DISTINCT_COUNT_COLOR_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("color")}`, spec_project.attributes.color.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.color.codec) ?? spec_project.attributes.color.codec,
        direction: "ASC"
      });
    },
    PROJECTS_DISTINCT_COUNT_COLOR_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("color")}`, spec_project.attributes.color.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.color.codec) ?? spec_project.attributes.color.codec,
        direction: "DESC"
      });
    },
    PROJECTS_DISTINCT_COUNT_LABELS_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("labels")}`, spec_project.attributes.labels.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.labels.codec) ?? spec_project.attributes.labels.codec,
        direction: "ASC"
      });
    },
    PROJECTS_DISTINCT_COUNT_LABELS_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("labels")}`, spec_project.attributes.labels.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.labels.codec) ?? spec_project.attributes.labels.codec,
        direction: "DESC"
      });
    },
    PROJECTS_DISTINCT_COUNT_WORKSPACE_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("workspace_id")}`, spec_project.attributes.workspace_id.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.workspace_id.codec) ?? spec_project.attributes.workspace_id.codec,
        direction: "ASC"
      });
    },
    PROJECTS_DISTINCT_COUNT_WORKSPACE_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("workspace_id")}`, spec_project.attributes.workspace_id.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.workspace_id.codec) ?? spec_project.attributes.workspace_id.codec,
        direction: "DESC"
      });
    },
    PROJECTS_DISTINCT_COUNT_VIEW_MODE_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("view_mode")}`, spec_project.attributes.view_mode.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.view_mode.codec) ?? spec_project.attributes.view_mode.codec,
        direction: "ASC"
      });
    },
    PROJECTS_DISTINCT_COUNT_VIEW_MODE_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("view_mode")}`, spec_project.attributes.view_mode.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.view_mode.codec) ?? spec_project.attributes.view_mode.codec,
        direction: "DESC"
      });
    },
    PROJECTS_DISTINCT_COUNT_CREATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_project.attributes.created_at.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.created_at.codec) ?? spec_project.attributes.created_at.codec,
        direction: "ASC"
      });
    },
    PROJECTS_DISTINCT_COUNT_CREATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_project.attributes.created_at.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.created_at.codec) ?? spec_project.attributes.created_at.codec,
        direction: "DESC"
      });
    },
    PROJECTS_DISTINCT_COUNT_UPDATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_project.attributes.updated_at.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.updated_at.codec) ?? spec_project.attributes.updated_at.codec,
        direction: "ASC"
      });
    },
    PROJECTS_DISTINCT_COUNT_UPDATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_projectPgResource.name));
      relation5.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation5.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_projectPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_project.attributes.updated_at.codec)}
from ${pgResource_projectPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_project.attributes.updated_at.codec) ?? spec_project.attributes.updated_at.codec,
        direction: "DESC"
      });
    },
    WORKSPACE_USERS_COUNT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation6.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation6.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "ASC"
      });
    },
    WORKSPACE_USERS_COUNT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation6.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation6.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "DESC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_WORKSPACE_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation6.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation6.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("workspace_id")}`, spec_workspaceUser.attributes.workspace_id.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.workspace_id.codec) ?? spec_workspaceUser.attributes.workspace_id.codec,
        direction: "ASC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_WORKSPACE_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation6.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation6.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("workspace_id")}`, spec_workspaceUser.attributes.workspace_id.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.workspace_id.codec) ?? spec_workspaceUser.attributes.workspace_id.codec,
        direction: "DESC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_USER_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation6.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation6.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("user_id")}`, spec_workspaceUser.attributes.user_id.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.user_id.codec) ?? spec_workspaceUser.attributes.user_id.codec,
        direction: "ASC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_USER_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation6.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation6.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("user_id")}`, spec_workspaceUser.attributes.user_id.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.user_id.codec) ?? spec_workspaceUser.attributes.user_id.codec,
        direction: "DESC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_CREATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation6.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation6.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_workspaceUser.attributes.created_at.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.created_at.codec) ?? spec_workspaceUser.attributes.created_at.codec,
        direction: "ASC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_CREATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation6.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation6.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_workspaceUser.attributes.created_at.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.created_at.codec) ?? spec_workspaceUser.attributes.created_at.codec,
        direction: "DESC"
      });
    }
  },
  UserConnection: {
    __assertStep: ConnectionStep,
    totalCount($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").singleAsRecord().select(sql`count(*)`, TYPES.bigint, !1);
    },
    aggregates($connection) {
      return $connection.cloneSubplanWithoutPagination("aggregate").single();
    },
    groupedAggregates: {
      plan($connection) {
        return $connection.cloneSubplanWithoutPagination("aggregate");
      },
      args: {
        groupBy(_$parent, $pgSelect, input) {
          return input.apply($pgSelect);
        },
        having(_$parent, $pgSelect, input) {
          return input.apply($pgSelect, queryBuilder => queryBuilder.havingBuilder());
        }
      }
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
  UserAggregates: {
    __assertStep: assertPgClassSingleStep,
    keys($pgSelectSingle) {
      const $groupDetails = $pgSelectSingle.getClassStep().getGroupDetails();
      return lambda([$groupDetails, $pgSelectSingle], ([groupDetails, item]) => {
        if (groupDetails.indicies.length === 0 || item == null) return null;else return groupDetails.indicies.map(({
          index
        }) => item[index]);
      });
    },
    distinctCount($pgSelectSingle) {
      return $pgSelectSingle;
    }
  },
  UserDistinctCountAggregates: {
    rowId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    identityProviderId($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("identity_provider_id")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.uuid);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    name($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("name")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.text);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    avatarUrl($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("avatar_url")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.text);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    createdAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("created_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    },
    updatedAt($pgSelectSingle) {
      const sqlAttribute = sql.fragment`${$pgSelectSingle.getClassStep().alias}.${sql.identifier("updated_at")}`,
        sqlAggregate = spec.sqlAggregateWrap(sqlAttribute, TYPES.timestamptz);
      return $pgSelectSingle.select(sqlAggregate, TYPES.bigint);
    }
  },
  UserGroupBy: {
    NAME($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("name")}`,
        codec: TYPES.text
      });
    },
    AVATAR_URL($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("avatar_url")}`,
        codec: TYPES.text
      });
    },
    CREATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("created_at")}`,
        codec: TYPES.timestamptz
      });
    },
    CREATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    CREATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("created_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT($pgSelect) {
      $pgSelect.groupBy({
        fragment: sql.fragment`${$pgSelect.alias}.${sql.identifier("updated_at")}`,
        codec: TYPES.timestamptz
      });
    },
    UPDATED_AT_TRUNCATED_TO_HOUR($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec.sqlWrapCodec(TYPES.timestamptz)
      });
    },
    UPDATED_AT_TRUNCATED_TO_DAY($pgSelect) {
      $pgSelect.groupBy({
        fragment: aggregateGroupBySpec2.sqlWrap(sql`${$pgSelect.alias}.${sql.identifier("updated_at")}`),
        codec: aggregateGroupBySpec2.sqlWrapCodec(TYPES.timestamptz)
      });
    }
  },
  UserHavingInput: {
    AND($where) {
      return $where;
    },
    OR($where) {
      return new PgOrFilter($where);
    },
    sum($having) {
      return $having;
    },
    distinctCount($having) {
      return $having;
    },
    min($having) {
      return $having;
    },
    max($having) {
      return $having;
    },
    average($having) {
      return $having;
    },
    stddevSample($having) {
      return $having;
    },
    stddevPopulation($having) {
      return $having;
    },
    varianceSample($having) {
      return $having;
    },
    variancePopulation($having) {
      return $having;
    }
  },
  UserHavingSumInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_user.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec.sqlAggregateWrap(attributeExpression, spec_user.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  UserHavingDistinctCountInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_user.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = spec.sqlAggregateWrap(attributeExpression, spec_user.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  UserHavingMinInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_user.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec2.sqlAggregateWrap(attributeExpression, spec_user.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  UserHavingMaxInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_user.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec3.sqlAggregateWrap(attributeExpression, spec_user.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  UserHavingAverageInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_user.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec4.sqlAggregateWrap(attributeExpression, spec_user.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  UserHavingStddevSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_user.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec5.sqlAggregateWrap(attributeExpression, spec_user.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  UserHavingStddevPopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_user.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec6.sqlAggregateWrap(attributeExpression, spec_user.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  UserHavingVarianceSampleInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_user.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec7.sqlAggregateWrap(attributeExpression, spec_user.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    }
  },
  UserHavingVariancePopulationInput: {
    createdAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("created_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_user.attributes.created_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
    },
    updatedAt($having) {
      const attributeExpression = sql.fragment`${$having.alias}.${sql.identifier("updated_at")}`,
        aggregateExpression = aggregateSpec8.sqlAggregateWrap(attributeExpression, spec_user.attributes.updated_at.codec);
      return new PgBooleanFilter($having, aggregateExpression);
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
    },
    name($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "name",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
        }
      });
    },
    avatarUrl($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "avatar_url",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.text)}`;
        }
      });
    },
    createdAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "created_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
        }
      });
    },
    updatedAt($condition, val) {
      $condition.where({
        type: "attribute",
        attribute: "updated_at",
        callback(expression) {
          return val === null ? sql`${expression} is null` : sql`${expression} = ${sqlValueWithCodec(val, TYPES.timestamptz)}`;
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
    },
    NAME_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "name",
        direction: "ASC"
      });
    },
    NAME_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "name",
        direction: "DESC"
      });
    },
    AVATAR_URL_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "avatar_url",
        direction: "ASC"
      });
    },
    AVATAR_URL_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "avatar_url",
        direction: "DESC"
      });
    },
    CREATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "ASC"
      });
    },
    CREATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "created_at",
        direction: "DESC"
      });
    },
    UPDATED_AT_ASC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "ASC"
      });
    },
    UPDATED_AT_DESC(queryBuilder) {
      queryBuilder.orderBy({
        attribute: "updated_at",
        direction: "DESC"
      });
    },
    ASSIGNEES_COUNT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "ASC"
      });
    },
    ASSIGNEES_COUNT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_ROW_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_assignee.attributes.id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.id.codec) ?? spec_assignee.attributes.id.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_ROW_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_assignee.attributes.id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.id.codec) ?? spec_assignee.attributes.id.codec,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_USER_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("user_id")}`, spec_assignee.attributes.user_id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.user_id.codec) ?? spec_assignee.attributes.user_id.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_USER_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("user_id")}`, spec_assignee.attributes.user_id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.user_id.codec) ?? spec_assignee.attributes.user_id.codec,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_TASK_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("task_id")}`, spec_assignee.attributes.task_id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.task_id.codec) ?? spec_assignee.attributes.task_id.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_TASK_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("task_id")}`, spec_assignee.attributes.task_id.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.task_id.codec) ?? spec_assignee.attributes.task_id.codec,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_CREATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_assignee.attributes.created_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.created_at.codec) ?? spec_assignee.attributes.created_at.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_CREATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_assignee.attributes.created_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.created_at.codec) ?? spec_assignee.attributes.created_at.codec,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_UPDATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_assignee.attributes.updated_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.updated_at.codec) ?? spec_assignee.attributes.updated_at.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_UPDATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_assignee.attributes.updated_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.updated_at.codec) ?? spec_assignee.attributes.updated_at.codec,
        direction: "DESC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_DELETED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("deleted_at")}`, spec_assignee.attributes.deleted_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.deleted_at.codec) ?? spec_assignee.attributes.deleted_at.codec,
        direction: "ASC"
      });
    },
    ASSIGNEES_DISTINCT_COUNT_DELETED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_assigneePgResource.name));
      relation7.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation7.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_assigneePgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("deleted_at")}`, spec_assignee.attributes.deleted_at.codec)}
from ${pgResource_assigneePgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_assignee.attributes.deleted_at.codec) ?? spec_assignee.attributes.deleted_at.codec,
        direction: "DESC"
      });
    },
    AUTHORED_POSTS_COUNT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "ASC"
      });
    },
    AUTHORED_POSTS_COUNT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "DESC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_ROW_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_post.attributes.id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.id.codec) ?? spec_post.attributes.id.codec,
        direction: "ASC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_ROW_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_post.attributes.id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.id.codec) ?? spec_post.attributes.id.codec,
        direction: "DESC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_TITLE_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("title")}`, spec_post.attributes.title.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.title.codec) ?? spec_post.attributes.title.codec,
        direction: "ASC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_TITLE_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("title")}`, spec_post.attributes.title.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.title.codec) ?? spec_post.attributes.title.codec,
        direction: "DESC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_DESCRIPTION_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("description")}`, spec_post.attributes.description.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.description.codec) ?? spec_post.attributes.description.codec,
        direction: "ASC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_DESCRIPTION_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("description")}`, spec_post.attributes.description.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.description.codec) ?? spec_post.attributes.description.codec,
        direction: "DESC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_AUTHOR_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("author_id")}`, spec_post.attributes.author_id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.author_id.codec) ?? spec_post.attributes.author_id.codec,
        direction: "ASC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_AUTHOR_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("author_id")}`, spec_post.attributes.author_id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.author_id.codec) ?? spec_post.attributes.author_id.codec,
        direction: "DESC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_TASK_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("task_id")}`, spec_post.attributes.task_id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.task_id.codec) ?? spec_post.attributes.task_id.codec,
        direction: "ASC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_TASK_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("task_id")}`, spec_post.attributes.task_id.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.task_id.codec) ?? spec_post.attributes.task_id.codec,
        direction: "DESC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_CREATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_post.attributes.created_at.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.created_at.codec) ?? spec_post.attributes.created_at.codec,
        direction: "ASC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_CREATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_post.attributes.created_at.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.created_at.codec) ?? spec_post.attributes.created_at.codec,
        direction: "DESC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_UPDATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_post.attributes.updated_at.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.updated_at.codec) ?? spec_post.attributes.updated_at.codec,
        direction: "ASC"
      });
    },
    AUTHORED_POSTS_DISTINCT_COUNT_UPDATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_postPgResource.name));
      relation8.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation8.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_postPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_post.attributes.updated_at.codec)}
from ${pgResource_postPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_post.attributes.updated_at.codec) ?? spec_post.attributes.updated_at.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_COUNT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_COUNT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_SUM_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_SUM_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_ROW_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_task.attributes.id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.id.codec) ?? spec_task.attributes.id.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_ROW_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("id")}`, spec_task.attributes.id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.id.codec) ?? spec_task.attributes.id.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_CONTENT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("content")}`, spec_task.attributes.content.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.content.codec) ?? spec_task.attributes.content.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_CONTENT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("content")}`, spec_task.attributes.content.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.content.codec) ?? spec_task.attributes.content.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_DESCRIPTION_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("description")}`, spec_task.attributes.description.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.description.codec) ?? spec_task.attributes.description.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_DESCRIPTION_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("description")}`, spec_task.attributes.description.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.description.codec) ?? spec_task.attributes.description.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_PRIORITY_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("priority")}`, spec_task.attributes.priority.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.priority.codec) ?? spec_task.attributes.priority.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_PRIORITY_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("priority")}`, spec_task.attributes.priority.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.priority.codec) ?? spec_task.attributes.priority.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_AUTHOR_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("author_id")}`, spec_task.attributes.author_id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.author_id.codec) ?? spec_task.attributes.author_id.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_AUTHOR_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("author_id")}`, spec_task.attributes.author_id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.author_id.codec) ?? spec_task.attributes.author_id.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_COLUMN_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_id")}`, spec_task.attributes.column_id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.column_id.codec) ?? spec_task.attributes.column_id.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_COLUMN_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_id")}`, spec_task.attributes.column_id.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.column_id.codec) ?? spec_task.attributes.column_id.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_LABELS_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("labels")}`, spec_task.attributes.labels.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.labels.codec) ?? spec_task.attributes.labels.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_LABELS_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("labels")}`, spec_task.attributes.labels.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.labels.codec) ?? spec_task.attributes.labels.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_DUE_DATE_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("due_date")}`, spec_task.attributes.due_date.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.due_date.codec) ?? spec_task.attributes.due_date.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_DUE_DATE_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("due_date")}`, spec_task.attributes.due_date.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.due_date.codec) ?? spec_task.attributes.due_date.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_CREATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_task.attributes.created_at.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.created_at.codec) ?? spec_task.attributes.created_at.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_CREATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_task.attributes.created_at.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.created_at.codec) ?? spec_task.attributes.created_at.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_UPDATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_task.attributes.updated_at.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.updated_at.codec) ?? spec_task.attributes.updated_at.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_UPDATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("updated_at")}`, spec_task.attributes.updated_at.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.updated_at.codec) ?? spec_task.attributes.updated_at.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_DISTINCT_COUNT_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_MIN_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec2.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec2.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_MIN_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec2.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec2.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_MAX_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec3.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec3.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_MAX_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec3.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec3.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_AVERAGE_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec4.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec4.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_AVERAGE_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec4.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec4.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_STDDEV_SAMPLE_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec5.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec5.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_STDDEV_SAMPLE_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec5.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec5.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_STDDEV_POPULATION_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec6.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec6.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_STDDEV_POPULATION_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec6.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec6.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_VARIANCE_SAMPLE_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec7.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec7.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_VARIANCE_SAMPLE_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec7.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec7.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    AUTHORED_TASKS_VARIANCE_POPULATION_COLUMN_INDEX_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec8.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec8.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "ASC"
      });
    },
    AUTHORED_TASKS_VARIANCE_POPULATION_COLUMN_INDEX_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_taskPgResource.name));
      relation9.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation9.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_taskPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${aggregateSpec8.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("column_index")}`, spec_task.attributes.column_index.codec)}
from ${pgResource_taskPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: aggregateSpec8.pgTypeCodecModifier?.(spec_task.attributes.column_index.codec) ?? spec_task.attributes.column_index.codec,
        direction: "DESC"
      });
    },
    WORKSPACE_USERS_COUNT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation10.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation10.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "ASC"
      });
    },
    WORKSPACE_USERS_COUNT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation10.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation10.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`select count(*)
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.parens(sql.join(conditions.map(c => sql.parens(c)), " AND "))}`})`;
      $select.orderBy({
        fragment,
        codec: TYPES.bigint,
        direction: "DESC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_WORKSPACE_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation10.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation10.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("workspace_id")}`, spec_workspaceUser.attributes.workspace_id.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.workspace_id.codec) ?? spec_workspaceUser.attributes.workspace_id.codec,
        direction: "ASC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_WORKSPACE_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation10.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation10.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("workspace_id")}`, spec_workspaceUser.attributes.workspace_id.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.workspace_id.codec) ?? spec_workspaceUser.attributes.workspace_id.codec,
        direction: "DESC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_USER_ID_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation10.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation10.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("user_id")}`, spec_workspaceUser.attributes.user_id.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.user_id.codec) ?? spec_workspaceUser.attributes.user_id.codec,
        direction: "ASC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_USER_ID_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation10.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation10.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("user_id")}`, spec_workspaceUser.attributes.user_id.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.user_id.codec) ?? spec_workspaceUser.attributes.user_id.codec,
        direction: "DESC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_CREATED_AT_ASC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation10.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation10.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_workspaceUser.attributes.created_at.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.created_at.codec) ?? spec_workspaceUser.attributes.created_at.codec,
        direction: "ASC"
      });
    },
    WORKSPACE_USERS_DISTINCT_COUNT_CREATED_AT_DESC($select) {
      const foreignTableAlias = $select.alias,
        conditions = [],
        tableAlias = sql.identifier(Symbol(pgResource_workspace_userPgResource.name));
      relation10.localAttributes.forEach((localAttribute, i) => {
        const remoteAttribute = relation10.remoteAttributes[i];
        conditions.push(sql.fragment`${tableAlias}.${sql.identifier(remoteAttribute)} = ${foreignTableAlias}.${sql.identifier(localAttribute)}`);
      });
      if (typeof pgResource_workspace_userPgResource.from === "function") throw new Error("Function source unsupported");
      const fragment = sql`(${sql.indent`
select ${spec.sqlAggregateWrap(sql.fragment`${tableAlias}.${sql.identifier("created_at")}`, spec_workspaceUser.attributes.created_at.codec)}
from ${pgResource_workspace_userPgResource.from} ${tableAlias}
where ${sql.join(conditions.map(c => sql.parens(c)), " AND ")}`})`;
      $select.orderBy({
        fragment,
        codec: spec.pgTypeCodecModifier?.(spec_workspaceUser.attributes.created_at.codec) ?? spec_workspaceUser.attributes.created_at.codec,
        direction: "DESC"
      });
    }
  },
  Mutation: {
    __assertStep: __ValueStep,
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
    taskId(obj, val, {
      field,
      schema
    }) {
      obj.set("task_id", bakedInputRuntime(schema, field.type, val));
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
    },
    deletedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("deleted_at", bakedInputRuntime(schema, field.type, val));
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
    taskId(obj, val, {
      field,
      schema
    }) {
      obj.set("task_id", bakedInputRuntime(schema, field.type, val));
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
    authorId(obj, val, {
      field,
      schema
    }) {
      obj.set("author_id", bakedInputRuntime(schema, field.type, val));
    },
    columnId(obj, val, {
      field,
      schema
    }) {
      obj.set("column_id", bakedInputRuntime(schema, field.type, val));
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
    },
    columnIndex(obj, val, {
      field,
      schema
    }) {
      obj.set("column_index", bakedInputRuntime(schema, field.type, val));
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
    taskId(obj, val, {
      field,
      schema
    }) {
      obj.set("task_id", bakedInputRuntime(schema, field.type, val));
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
    },
    deletedAt(obj, val, {
      field,
      schema
    }) {
      obj.set("deleted_at", bakedInputRuntime(schema, field.type, val));
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
    taskId(obj, val, {
      field,
      schema
    }) {
      obj.set("task_id", bakedInputRuntime(schema, field.type, val));
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
    authorId(obj, val, {
      field,
      schema
    }) {
      obj.set("author_id", bakedInputRuntime(schema, field.type, val));
    },
    columnId(obj, val, {
      field,
      schema
    }) {
      obj.set("column_id", bakedInputRuntime(schema, field.type, val));
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
    },
    columnIndex(obj, val, {
      field,
      schema
    }) {
      obj.set("column_index", bakedInputRuntime(schema, field.type, val));
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