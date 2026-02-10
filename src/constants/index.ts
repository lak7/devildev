// ============================================================
// Polling Constants
// Used for architecture generation polling in project and dev pages
// ============================================================

/** Maximum number of polling attempts before timeout */
export const POLLING_MAX_ATTEMPTS = 120;

/** Duration of the initial polling phase in milliseconds (4 minutes) */
export const POLLING_INITIAL_PHASE_DURATION_MS = 4 * 60 * 1000;

/** Polling interval during the initial phase in milliseconds (15 seconds) */
export const POLLING_INITIAL_INTERVAL_MS = 15 * 1000;

/** Polling interval after the initial phase in milliseconds (5 seconds) */
export const POLLING_FINAL_INTERVAL_MS = 5 * 1000;

// ============================================================
// Debounce & Timeout Constants
// ============================================================

/** Debounce delay for saving component positions after dragging (ms) */
export const POSITION_SAVE_DEBOUNCE_MS = 500;

/** Delay before closing feedback dialog after successful submission (ms) */
export const FEEDBACK_SUCCESS_CLOSE_DELAY_MS = 2000;

/** Delay before resetting copy-to-clipboard feedback state (ms) */
export const COPY_FEEDBACK_RESET_DELAY_MS = 2000;

/** Scroll debounce delay for grid opacity calculation (ms) */
export const SCROLL_DEBOUNCE_DELAY_MS = 300;

// ============================================================
// SWR / Data Fetching Constants
// ============================================================

/** SWR deduplication interval in milliseconds (1 minute) */
export const SWR_DEDUPING_INTERVAL_MS = 60_000;

/** SWR auto-refresh interval in milliseconds (5 minutes) */
export const SWR_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/** Number of retry attempts on SWR fetch errors */
export const SWR_ERROR_RETRY_COUNT = 3;

/** Delay between SWR error retries in milliseconds */
export const SWR_ERROR_RETRY_INTERVAL_MS = 1000;

// ============================================================
// UI Layout Constants
// ============================================================

/** Maximum height of the auto-resizing chat textarea in pixels */
export const TEXTAREA_MAX_HEIGHT_PX = 180;

/** Minimum panel width percentage for resizable panels */
export const PANEL_MIN_WIDTH_PERCENT = 25;

/** Maximum panel width percentage for resizable panels */
export const PANEL_MAX_WIDTH_PERCENT = 75;

/** Mobile breakpoint width in pixels */
export const MOBILE_BREAKPOINT_PX = 768;

/** Indentation per tree depth level in pixels */
export const TREE_INDENT_PER_DEPTH_PX = 16;

/** Base padding for directory items in the tree view (px) */
export const TREE_DIRECTORY_PADDING_PX = 8;

/** Base padding for file items in the tree view (px) */
export const TREE_FILE_PADDING_PX = 24;

// ============================================================
// Chat & Content Truncation Constants
// ============================================================

/** Maximum character length for chat title preview */
export const CHAT_TITLE_PREVIEW_LENGTH = 20;

/** Maximum character length for initial message preview in chat title */
export const CHAT_TITLE_FROM_MESSAGE_LENGTH = 50;

/** Maximum number of prompts allowed per chat session */
export const MAX_PROMPTS_PER_CHAT = 3;

// ============================================================
// Database Query Constants
// ============================================================

/** Number of latest architecture versions to fetch per project */
export const LATEST_ARCHITECTURES_FETCH_LIMIT = 5;

// ============================================================
// LLM Context Window Constants
// ============================================================

/** Default maximum input tokens for LLM context window */
export const DEFAULT_MAX_INPUT_TOKENS = 8000;

/** Default maximum output tokens for LLM context window */
export const DEFAULT_MAX_OUTPUT_TOKENS = 2000;

/** Maximum input tokens for web search documentation generation */
export const WEB_SEARCH_MAX_INPUT_TOKENS = 12_000;

/** Maximum output tokens for web search documentation generation */
export const WEB_SEARCH_MAX_OUTPUT_TOKENS = 5000;

/** Minimum remaining tokens threshold to include a truncated message */
export const MIN_REMAINING_TOKENS_THRESHOLD = 100;

/** Character limit for aggressive fallback truncation */
export const FALLBACK_TRUNCATION_LENGTH = 1000;

/** Safety margin factor when truncating text to token limits (10% buffer) */
export const TOKEN_TRUNCATION_SAFETY_MARGIN = 0.9;

// ============================================================
// Database Connection Constants
// ============================================================

/** Maximum wait time for acquiring a database transaction (ms) */
export const DB_TRANSACTION_MAX_WAIT_MS = 15_000;

/** Maximum execution time for a database transaction (ms) */
export const DB_TRANSACTION_TIMEOUT_MS = 15_000;
