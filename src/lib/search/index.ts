export { isSearchEnabled } from "lib/config/env.config";
export { initializeSearchIndexes, search } from "./client";
export {
  deleteCommentFromIndex,
  deleteProjectFromIndex,
  deleteTaskFromIndex,
  indexComment,
  indexProject,
  indexTask,
} from "./indexing";
