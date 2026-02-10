// ============================================================
// Project Limits - Free Tier
// ============================================================

/** Maximum number of projects a free-tier user can create */
export const maxNumberOfProjectsFree = 1;

/** Maximum project size in characters for free-tier users */
export const maxProjectSizeFree = 25_000;

/** Maximum number of chats per project for free-tier users */
export const maxNumberOfProjectChatsFree = 3;

// ============================================================
// Project Limits - Pro Tier
// ============================================================

/** Maximum number of projects a pro-tier user can create */
export const maxNumberOfProjectsPro = 15;

/** Maximum project size in characters for pro-tier users */
export const maxProjectSizePro = 100_000;

/** Maximum number of chats per project for pro-tier users */
export const maxNumberOfProjectChatsPro = 100;

// ============================================================
// Architecture Regeneration Limits - Free Tier
// ============================================================

/** Maximum number of files changed allowed per regeneration for free-tier users */
export const maxFilesChangedFree = 50;

/** Maximum number of lines changed allowed per regeneration for free-tier users */
export const maxLinesChangedFree = 5_000;

/** Maximum number of architecture regenerations for free-tier users */
export const maxFreeArchitectureRegenerations = 5;

// ============================================================
// Architecture Regeneration Limits - Pro Tier
// ============================================================

/** Maximum number of files changed allowed per regeneration for pro-tier users */
export const maxFilesChangedPro = 300;

/** Maximum number of lines changed allowed per regeneration for pro-tier users */
export const maxLinesChangedPro = 50_000;

// ============================================================
// Chat Limits - Free Tier
// ============================================================

/** Maximum number of chats for free-tier users */
export const maxFreeChats = 3;

/** Maximum total characters across all messages in a chat for free-tier users */
export const maxChatCharactersLimitFree = 20_000;

// ============================================================
// Chat Limits - Pro Tier
// ============================================================

/** Maximum number of chats for pro-tier users */
export const maxProChats = 100;

/** Maximum total characters across all messages in a chat for pro-tier users */
export const maxChatCharactersLimitPro = 100_000;
