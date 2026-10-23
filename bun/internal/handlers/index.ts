import { aiRoutes } from "./ai";
import { polarRoutes } from "./polar";
import { xiRoutes } from "./xi";

/** Assembled Bun.serve route map for the ΛΞVOS control plane. */
export const apiRoutes = {
  ...aiRoutes,
  ...polarRoutes,
  ...xiRoutes,
} as const;
