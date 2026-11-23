import { isProductionDataMode } from "./config.mjs";
import { createLocalProvider } from "./providers/local.mjs";
import { createSupabaseProvider } from "./providers/supabase.mjs";

export function createContentProvider({ root, mode } = {}) {
  const selected = mode || (isProductionDataMode() ? "production" : "local");
  if (selected === "production") return createSupabaseProvider();
  if (selected === "local") return createLocalProvider(root);
  throw new Error(`Unknown CMS data mode: ${selected}`);
}
