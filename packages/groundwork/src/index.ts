export { application, routeMap, setupCommand, version } from "./app.js";
export { applyPlan, type ApplyHooks, type ApplyResult } from "./application.js";
export { discoverRepository, type CommandRunner } from "./discovery.js";
export { folderDefinitions, forgeSectionKeys, trackerSectionKeys } from "./model.js";
export type {
  AnyConcernPreference,
  ArchitecturePreferences,
  ConcernId,
  DevelopmentPreferences,
  DomainPreferences,
  FolderDefinition,
  ForgeId,
  ForgeSelection,
  IndexExtras,
  PlannedConcern,
  ProfileId,
  RenderedConcern,
  RepositoryDiscovery,
  SetupMode,
  SetupPlan,
  SetupPreferences,
  SurveyItem,
  TrackerId,
  TrackerSelection,
  WorkflowPreferences,
} from "./model.js";
export { buildSetupPlan, formatPlan, resolveDestination } from "./planning.js";
export { collectPreferences, SetupCancelledError, type PromptDriver } from "./prompts.js";
export { renderConcern, renderIndex, renderIndexEntries, renderPlan, type IndexEntry, type TemplateLoader } from "./rendering.js";
export { NonInteractiveSetupError, runSetup, type SetupDependencies, type SetupFlags } from "./setup.js";
