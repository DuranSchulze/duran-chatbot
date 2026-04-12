/**
 * Chatbot configuration types shared between widget and admin
 */

export interface ChatbotConfig {
  /** Widget appearance settings */
  appearance: AppearanceConfig;
  /** AI system prompt and settings */
  ai: AIConfig;
  /** Persona and voice settings */
  persona: PersonaConfig;
  /** Structured service and pricing knowledge */
  services: ServiceEntry[];
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

export interface PersonaConfig {
  /** Enable persona-based voice guidance */
  enabled: boolean;
  /** Person or persona name */
  personaName: string;
  /** Role or relationship of the persona */
  roleOrRelationship: string;
  /** High-level tonal direction */
  tone: string;
  /** Writing style and structure guidance */
  writingStyle: string;
  /** Signature phrases or wording patterns */
  signaturePhrases: string;
  /** Positive instructions to follow */
  dos: string;
  /** Things to avoid in responses */
  donts: string;
  /** Notes about the intended audience */
  audienceNotes: string;
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

export interface ServiceEntry {
  /** Unique ID */
  id: string;
  /** Service name */
  name: string;
  /** Keywords that trigger this service */
  keywords: string[];
  /** Flexible pricing text */
  price: string;
  /** Process explanation */
  process: string;
  /** Sales notes, caveats, inclusions, exclusions */
  notes: string;
  /** Recommended next step or CTA */
  cta: string;
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
  /** Email for quote requests (legacy single address) */
  quoteEmail?: string;
  /** Primary recipients for internal quote notification emails */
  quoteNotifyTo: string[];
  /** CC recipients for internal quote notification emails */
  quoteNotifyCC: string[];
  /** Subject template for internal quote notification emails */
  quoteEmailSubject: string;
}

/** A chatbot profile wrapping a full config with metadata */
export interface ChatbotProfile {
  /** URL-safe slug used as the profile identifier */
  slug: string;
  /** Human-readable display name */
  name: string;
  /** Active or archived */
  status: 'active' | 'archived';
  /** ISO timestamp of creation */
  createdAt: string;
  /** Full chatbot config for this profile */
  config: ChatbotConfig;
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
  persona: {
    enabled: false,
    personaName: '',
    roleOrRelationship: '',
    tone: '',
    writingStyle: '',
    signaturePhrases: '',
    dos: '',
    donts: '',
    audienceNotes: '',
  },
  services: [],
  quickLinks: [],
  dataset: [],
  behavior: {
    autoOpenDelay: 0,
    showTimestamps: true,
    enableCopyButton: true,
    enableQuoteRequest: false,
    quoteNotifyTo: [],
    quoteNotifyCC: [],
    quoteEmailSubject: 'New Quote Request via Chatbot',
  },
};

/** Validate partial config and merge with defaults */
export function mergeWithDefaults(partial: Partial<ChatbotConfig>): ChatbotConfig {
  return {
    appearance: { ...defaultConfig.appearance, ...partial.appearance },
    ai: { ...defaultConfig.ai, ...partial.ai },
    persona: { ...defaultConfig.persona, ...partial.persona },
    services: partial.services ?? defaultConfig.services,
    quickLinks: partial.quickLinks ?? defaultConfig.quickLinks,
    dataset: partial.dataset ?? defaultConfig.dataset,
    behavior: {
      ...defaultConfig.behavior,
      ...partial.behavior,
      quoteNotifyTo: partial.behavior?.quoteNotifyTo ?? defaultConfig.behavior.quoteNotifyTo,
      quoteNotifyCC: partial.behavior?.quoteNotifyCC ?? defaultConfig.behavior.quoteNotifyCC,
    },
  };
}
