export { application, routeMap, setupCommand, version } from "./app.js";
export { applyPlan, type ApplyHooks, type ApplyResult } from "./application.js";
export { discoverRepository, type CommandRunner } from "./discovery.js";
export { folderDefinitions } from "./model.js";
export type {
  AnyConcernPreference,
  AnyFolderDefinition,
  AnyPlannedConcern,
  AnyRenderedConcern,
  ConcernId,
  ConcernPreference,
  ConcernValues,
  FolderDefinition,
  PlannedConcern,
  RepositoryDiscovery,
  RenderedConcern,
  SetupPlan,
  SetupPreferences,
} from "./model.js";
export { buildSetupPlan, formatPlan, resolveDestination } from "./planning.js";
export { collectPreferences, SetupCancelledError, type PromptDriver } from "./prompts.js";
export { renderConcern, renderIndex, renderIndexEntries, renderPlan, type IndexEntry, type TemplateLoader } from "./rendering.js";
export { NonInteractiveSetupError, runSetup, type SetupDependencies, type SetupFlags } from "./setup.js";
