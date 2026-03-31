/**
 * Chatbot configuration types shared between widget and admin
 */

export interface ChatbotConfig {
  /** Widget appearance settings */
  appearance: AppearanceConfig;
  /** AI system prompt and settings */
  ai: AIConfig;
  /** Quick links shown in chat */
  quickLinks: QuickLink[];
  /** Dataset/guides for prompt enhancement */
  dataset: DatasetEntry[];
  /** Widget behavior settings */
  behavior: BehaviorConfig;
}

export interface AppearanceConfig {
  /** Primary brand color (hex) */
  primaryColor: string;
  /** Accent/hover color (hex) */
  accentColor: string;
  /** Widget background color (hex) */
  backgroundColor: string;
  /** Text color (hex) */
  textColor: string;
  /** Widget position on screen */
  position: 'bottom-right' | 'bottom-left';
  /** Border radius in pixels */
  borderRadius: number;
  /** Company/logo name */
  companyName: string;
  /** Welcome message shown on open */
  welcomeMessage: string;
  /** Avatar URL (optional) */
  avatarUrl?: string;
}

export interface AIConfig {
  /** System prompt/instruction for the AI */
  systemPrompt: string;
  /** Model to use (e.g., 'gemini-2.5-flash') */
  model: string;
  /** Temperature (0-1) */
  temperature: number;
  /** Maximum tokens per response */
  maxTokens: number;
  /** Google API Key (can be overridden at embed time) */
  apiKey?: string;
}

export interface QuickLink {
  /** Unique ID */
  id: string;
  /** Display label */
  label: string;
  /** URL to open */
  url: string;
  /** Icon name (optional, from lucide icons) */
  icon?: string;
}

export interface DatasetEntry {
  /** Unique ID */
  id: string;
  /** Keywords that trigger this entry */
  keywords: string[];
  /** Title of the guide/entry */
  title: string;
  /** Content/response for this entry */
  content: string;
  /** Category for organization */
  category: string;
}

export interface BehaviorConfig {
  /** Auto-open widget after seconds (0 = disabled) */
  autoOpenDelay: number;
  /** Show timestamp on messages */
  showTimestamps: boolean;
  /** Enable copy button on AI messages */
  enableCopyButton: boolean;
  /** Enable quote request feature */
  enableQuoteRequest: boolean;
  /** Email for quote requests */
  quoteEmail?: string;
}

/** Widget embed configuration (runtime overrides) */
export interface WidgetEmbedConfig {
  /** Override API key */
  apiKey?: string;
  /** Override position */
  position?: 'bottom-right' | 'bottom-left';
  /** Override primary color */
  primaryColor?: string;
  /** Override company name */
  companyName?: string;
  /** User identification (optional) */
  user?: {
    name?: string;
    email?: string;
  };
}

/** Default configuration values */
export const defaultConfig: ChatbotConfig = {
  appearance: {
    primaryColor: '#004a99',
    accentColor: '#0056b3',
    backgroundColor: '#ffffff',
    textColor: '#212529',
    position: 'bottom-right',
    borderRadius: 12,
    companyName: 'AI Assistant',
    welcomeMessage: 'Hello! How can I help you today?',
  },
  ai: {
    systemPrompt: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses.',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
  },
  quickLinks: [],
  dataset: [],
  behavior: {
    autoOpenDelay: 0,
    showTimestamps: true,
    enableCopyButton: true,
    enableQuoteRequest: false,
  },
};

/** Validate partial config and merge with defaults */
export function mergeWithDefaults(partial: Partial<ChatbotConfig>): ChatbotConfig {
  return {
    appearance: { ...defaultConfig.appearance, ...partial.appearance },
    ai: { ...defaultConfig.ai, ...partial.ai },
    quickLinks: partial.quickLinks ?? defaultConfig.quickLinks,
    dataset: partial.dataset ?? defaultConfig.dataset,
    behavior: { ...defaultConfig.behavior, ...partial.behavior },
  };
}
