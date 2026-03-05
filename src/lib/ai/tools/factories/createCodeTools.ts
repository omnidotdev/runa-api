/**
 * Factory for creating code execution tools.
 *
 * Read-only tools (readFile, listDirectory, searchCode) have no activity logging.
 * Write tools (writeFile, runCommand, commitChanges, createPullRequest) are logged
 * via logActivity() (fire-and-forget, same pattern as createWriteTools.ts).
 */

import { tool } from "ai";

import {
  commitChangesSchema,
  createPullRequestSchema,
  listDirectorySchema,
  readFileSchema,
  runCommandSchema,
  searchCodeSchema,
  writeFileSchema,
} from "../core/schemas";
import {
  COMMIT_CHANGES_DESCRIPTION,
  CREATE_PULL_REQUEST_DESCRIPTION,
  LIST_DIRECTORY_DESCRIPTION,
  READ_FILE_DESCRIPTION,
  RUN_COMMAND_DESCRIPTION,
  SEARCH_CODE_DESCRIPTION,
  WRITE_FILE_DESCRIPTION,
  executeCommitChanges,
  executeCreatePullRequest,
  executeListDirectory,
  executeReadFile,
  executeRunCommand,
  executeSearchCode,
  executeWriteFile,
} from "../definitions/code";
import { logActivity } from "../wrappers/withActivityLogging";

import type { ExecutionToolContext } from "../core/executionContext";

export function createCodeTools(ctx: ExecutionToolContext) {
  /** Log a failed tool execution for audit trail. */
  const logFailure = (toolName: string, input: unknown, error: unknown) => {
    logActivity({
      context: ctx,
      toolName,
      toolInput: input,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  };

  return {
    // ─────────────────────────────────────────
    // Read-only tools (no activity logging)
    // ─────────────────────────────────────────

    readFile: tool({
      description: READ_FILE_DESCRIPTION,
      inputSchema: readFileSchema,
      execute: async (input) => executeReadFile(input, ctx),
    }),

    listDirectory: tool({
      description: LIST_DIRECTORY_DESCRIPTION,
      inputSchema: listDirectorySchema,
      execute: async (input) => executeListDirectory(input, ctx),
    }),

    searchCode: tool({
      description: SEARCH_CODE_DESCRIPTION,
      inputSchema: searchCodeSchema,
      execute: async (input) => executeSearchCode(input, ctx),
    }),

    // ─────────────────────────────────────────
    // Write tools (with activity logging)
    // ─────────────────────────────────────────

    writeFile: tool({
      description: WRITE_FILE_DESCRIPTION,
      inputSchema: writeFileSchema,
      execute: async (input) => {
        try {
          const result = await executeWriteFile(input, ctx);

          logActivity({
            context: ctx,
            toolName: "writeFile",
            toolInput: { path: input.path },
            toolOutput: result,
            status: "completed",
            snapshotBefore: {
              operation: "write",
              entityType: "file",
            },
          });

          return result;
        } catch (error) {
          logFailure("writeFile", { path: input.path }, error);
          throw error;
        }
      },
    }),

    runCommand: tool({
      description: RUN_COMMAND_DESCRIPTION,
      inputSchema: runCommandSchema,
      execute: async (input) => {
        try {
          const result = await executeRunCommand(input, ctx);

          logActivity({
            context: ctx,
            toolName: "runCommand",
            toolInput: { command: input.command },
            toolOutput: {
              exitCode: result.exitCode,
              stdoutLength: result.stdout.length,
            },
            status: result.exitCode === 0 ? "completed" : "failed",
          });

          return result;
        } catch (error) {
          logFailure("runCommand", { command: input.command }, error);
          throw error;
        }
      },
    }),

    commitChanges: tool({
      description: COMMIT_CHANGES_DESCRIPTION,
      inputSchema: commitChangesSchema,
      execute: async (input) => {
        try {
          const result = await executeCommitChanges(input, ctx);

          logActivity({
            context: ctx,
            toolName: "commitChanges",
            toolInput: { message: input.message },
            toolOutput: result,
            status: "completed",
            snapshotBefore: {
              operation: "commit",
              entityType: "git",
            },
          });

          return result;
        } catch (error) {
          logFailure("commitChanges", { message: input.message }, error);
          throw error;
        }
      },
    }),

    createPullRequest: tool({
      description: CREATE_PULL_REQUEST_DESCRIPTION,
      inputSchema: createPullRequestSchema,
      execute: async (input) => {
        try {
          const result = await executeCreatePullRequest(input, ctx);

          logActivity({
            context: ctx,
            toolName: "createPullRequest",
            toolInput: { title: input.title },
            toolOutput: result,
            status: "completed",
            snapshotBefore: {
              operation: "create",
              entityType: "pull_request",
            },
          });

          return result;
        } catch (error) {
          logFailure("createPullRequest", { title: input.title }, error);
          throw error;
        }
      },
    }),
  };
}
