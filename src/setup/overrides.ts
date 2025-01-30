
import getModelServiceOverride from '@codingame/monaco-vscode-model-service-override'
import getNotificationServiceOverride from '@codingame/monaco-vscode-notifications-service-override'
import getDialogsServiceOverride from '@codingame/monaco-vscode-dialogs-service-override'
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override'
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override'
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override'
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override'
import getAuthenticationServiceOverride from '@codingame/monaco-vscode-authentication-service-override'
import getBannerServiceOverride from '@codingame/monaco-vscode-view-banner-service-override'
import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override'
import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override'
import getDebugServiceOverride from '@codingame/monaco-vscode-debug-service-override'
import getPreferencesServiceOverride from '@codingame/monaco-vscode-preferences-service-override'
import getSnippetServiceOverride from '@codingame/monaco-vscode-snippets-service-override'
import getOutputServiceOverride from '@codingame/monaco-vscode-output-service-override'
import getSearchServiceOverride from '@codingame/monaco-vscode-search-service-override'
import getMarkersServiceOverride from '@codingame/monaco-vscode-markers-service-override'
import getAccessibilityServiceOverride from '@codingame/monaco-vscode-accessibility-service-override'
import getLanguageDetectionWorkerServiceOverride from '@codingame/monaco-vscode-language-detection-worker-service-override'
import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override'
import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override'
import getLogServiceOverride from '@codingame/monaco-vscode-log-service-override'
import getWorkingCopyServiceOverride from '@codingame/monaco-vscode-working-copy-service-override'
import getTestingServiceOverride from '@codingame/monaco-vscode-testing-service-override'
import getChatServiceOverride from '@codingame/monaco-vscode-chat-service-override'
import getNotebookServiceOverride from '@codingame/monaco-vscode-notebook-service-override'
import getWelcomeServiceOverride from '@codingame/monaco-vscode-welcome-service-override'
import getWalkThroughServiceOverride from '@codingame/monaco-vscode-walkthrough-service-override'
import getUserDataSyncServiceOverride from '@codingame/monaco-vscode-user-data-sync-service-override'
import getUserDataProfileServiceOverride from '@codingame/monaco-vscode-user-data-profile-service-override'
import getAiServiceOverride from '@codingame/monaco-vscode-ai-service-override'
import getTaskServiceOverride from '@codingame/monaco-vscode-task-service-override'
import getOutlineServiceOverride from '@codingame/monaco-vscode-outline-service-override'
import getTimelineServiceOverride from '@codingame/monaco-vscode-timeline-service-override'
import getCommentsServiceOverride from '@codingame/monaco-vscode-comments-service-override'
import getEditSessionsServiceOverride from '@codingame/monaco-vscode-edit-sessions-service-override'
import getEmmetServiceOverride from '@codingame/monaco-vscode-emmet-service-override'
import getInteractiveServiceOverride from '@codingame/monaco-vscode-interactive-service-override'
import getIssueServiceOverride from '@codingame/monaco-vscode-issue-service-override'
import getMultiDiffEditorServiceOverride from '@codingame/monaco-vscode-multi-diff-editor-service-override'
import getPerformanceServiceOverride from '@codingame/monaco-vscode-performance-service-override'
import getRelauncherServiceOverride from '@codingame/monaco-vscode-relauncher-service-override'
import getShareServiceOverride from '@codingame/monaco-vscode-share-service-override'
import getSpeechServiceOverride from '@codingame/monaco-vscode-speech-service-override'
import getSurveyServiceOverride from '@codingame/monaco-vscode-survey-service-override'
import getUpdateServiceOverride from '@codingame/monaco-vscode-update-service-override'
import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override'
import getTreeSitterServiceOverride from '@codingame/monaco-vscode-treesitter-service-override'
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override'
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override'
import getWorkspaceTrustOverride from '@codingame/monaco-vscode-workspace-trust-service-override'

export const serviceOverrides = {
  ...getAuthenticationServiceOverride(),
  ...getLogServiceOverride(),
  ...getModelServiceOverride(),
  ...getNotificationServiceOverride(),
  ...getDialogsServiceOverride(),
  ...getConfigurationServiceOverride(),
  ...getKeybindingsServiceOverride(),
  ...getTextmateServiceOverride(),
  ...getTreeSitterServiceOverride(),
  ...getThemeServiceOverride(),
  ...getLanguagesServiceOverride(),
  ...getDebugServiceOverride(),
  ...getPreferencesServiceOverride(),
  ...getOutlineServiceOverride(),
  ...getTimelineServiceOverride(),
  ...getBannerServiceOverride(),
  ...getStatusBarServiceOverride(),
  ...getTitleBarServiceOverride(),
  ...getSnippetServiceOverride(),
  ...getOutputServiceOverride(),
  ...getSearchServiceOverride(),
  ...getMarkersServiceOverride(),
  ...getAccessibilityServiceOverride(),
  ...getLanguageDetectionWorkerServiceOverride(),
  ...getLifecycleServiceOverride(),
  ...getEnvironmentServiceOverride(),
  ...getWorkspaceTrustOverride(),
  ...getWorkingCopyServiceOverride(),
  ...getTestingServiceOverride(),
  ...getChatServiceOverride(),
  ...getNotebookServiceOverride(),
  ...getWelcomeServiceOverride(),
  ...getWalkThroughServiceOverride(),
  ...getUserDataProfileServiceOverride(),
  ...getUserDataSyncServiceOverride(),
  ...getAiServiceOverride(),
  ...getTaskServiceOverride(),
  ...getCommentsServiceOverride(),
  ...getEditSessionsServiceOverride(),
  ...getEmmetServiceOverride(),
  ...getInteractiveServiceOverride(),
  ...getIssueServiceOverride(),
  ...getMultiDiffEditorServiceOverride(),
  ...getPerformanceServiceOverride(),
  ...getRelauncherServiceOverride(),
  ...getShareServiceOverride(),
  ...getSpeechServiceOverride(),
  ...getSurveyServiceOverride(),
  ...getUpdateServiceOverride(),
  ...getExplorerServiceOverride(),
  ...getSecretStorageServiceOverride()
}