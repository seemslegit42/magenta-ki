import { aiRoutes } from "./ai";
import { dbRoutes } from "./db";
import { fsRoutes } from "./fs";
import { polarRoutes } from "./polar";
import { xiRoutes } from "./xi";

/** Assembled Bun.serve route map for the ΛΞVOS control plane. */
export const apiRoutes = {
  ...aiRoutes,
  ...polarRoutes,
  ...xiRoutes,
  ...dbRoutes,
  ...fsRoutes,
} as const;
