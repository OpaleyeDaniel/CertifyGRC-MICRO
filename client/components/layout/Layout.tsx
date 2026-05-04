/**
 * Back-compat re-export.
 *
 * The old `Layout` is now `OmegaLayout`. Anything still importing
 * `Layout` from this path will keep working and get the Omega /
 * general-app shell.
 *
 * Framework workspaces should import `FrameworkLayout` directly from
 * `./FrameworkLayout` — never `Layout`.
 */
export { OmegaLayout as Layout } from "./OmegaLayout";
