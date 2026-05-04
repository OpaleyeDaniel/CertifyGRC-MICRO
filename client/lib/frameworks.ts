/**
 * @deprecated — Framework metadata now lives in the registry.
 *
 * Use `REGISTERED_FRAMEWORKS` / `getFrameworkById` from
 * `@/frameworks/registry` instead. This shim is kept only to avoid
 * breaking any legacy import sites — new code must NOT use it.
 */
export type { FrameworkModule as FrameworkDefinition } from "@/frameworks/types";
export type FrameworkId = string;
export {
  REGISTERED_FRAMEWORKS as FRAMEWORKS,
  getFrameworkById,
} from "@/frameworks/registry";
