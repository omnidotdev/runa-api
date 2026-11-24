import { generateLqip } from "@omnidotdev/providers/media-server";

/** Longest placeholder a project accepts, mirroring its lqip check constraints */
const MAX_LQIP_LENGTH = 4096;

/**
 * Make a blur-up placeholder for a project image. Best-effort: null when none
 * could be made, or when an extreme aspect ratio makes it longer than the
 * project's check constraints allow (so the client's patch never fails on it)
 * @param bytes - The uploaded image bytes
 */
export const makeProjectLqip = async (
  bytes: Buffer,
): Promise<string | null> => {
  const lqip = await generateLqip(bytes);

  return lqip && lqip.length <= MAX_LQIP_LENGTH ? lqip : null;
};
