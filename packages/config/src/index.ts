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
  /** Third-party messaging integrations */
  integrations: IntegrationsConfig;
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
  /** Street address of the company shown to visitors (e.g. for the AI to answer location questions) */
  companyAddress?: string;
  /** Public phone number(s) visitors can call */
  companyPhone?: string;
  /** Public support/inquiry email shown to visitors */
  companyEmail?: string;
  /** Office hours description (e.g. "Mon–Fri, 9:00 AM – 6:00 PM") */
  officeHours?: string;
  /** Website / contact-form URL to point visitors to for more details */
  contactUrl?: string;
  /** Google Maps / directions link to the office */
  mapUrl?: string;
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

/**
 * What happens when a visitor clicks an action button in the widget menu.
 * - `link`   → open a URL in a new tab (Contact Us, pricing page, …)
 * - `quote`  → open the Request-a-Quote card (emails the visitor, CCs sales)
 * - `prompt` → send a preset message to the AI so it answers inline
 */
export type QuickLinkActionType = 'link' | 'quote' | 'prompt';

export interface QuickLink {
  /** Unique ID */
  id: string;
  /** Display label */
  label: string;
  /** Action performed on click (defaults to 'link' for backward compatibility) */
  actionType?: QuickLinkActionType;
  /** URL to open — used when actionType is 'link' */
  url?: string;
  /** Preset message sent to the AI — used when actionType is 'prompt' */
  prompt?: string;
  /** Also surface this button as a call-to-action card after the AI answers */
  showAfterAnswer?: boolean;
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
  /** Render the widget expanded as soon as it mounts */
  openByDefault: boolean;
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
  /** Subject template for the visitor-facing "starter" quote email (To: visitor, CC: sales) */
  quoteStarterSubject?: string;
  /** Heading shown above the post-answer call-to-action card */
  ctaHeading?: string;
}

/** Per-channel settings for a messaging integration */
export interface IntegrationChannelConfig {
  /** Master toggle — when off, this channel receives no notifications */
  enabled: boolean;
}

/**
 * Third-party messaging integrations. Credentials are NOT stored here —
 * they live in the server environment (.env) and are read at runtime.
 */
export interface IntegrationsConfig {
  /** Viber bot — admin notifications when a visitor shares name/email */
  viber: IntegrationChannelConfig;
  /** WhatsApp (Meta Cloud API) — admin notifications when a visitor shares name/email */
  whatsapp: IntegrationChannelConfig;
  /** Telegram bot — admin notifications when a visitor shares name/email */
  telegram: IntegrationChannelConfig;
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
  /** Override whether this embed starts expanded */
  openByDefault?: boolean;
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
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    officeHours: '',
    contactUrl: '',
    mapUrl: '',
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
    openByDefault: true,
    autoOpenDelay: 0,
    showTimestamps: true,
    enableCopyButton: true,
    enableQuoteRequest: false,
    quoteNotifyTo: [],
    quoteNotifyCC: [],
    quoteEmailSubject: 'New Quote Request via Chatbot',
  },
  integrations: {
    viber: { enabled: false },
    whatsapp: { enabled: false },
    telegram: { enabled: false },
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
      openByDefault: partial.behavior?.openByDefault === undefined
        ? defaultConfig.behavior.openByDefault
        : partial.behavior.openByDefault === true,
      quoteNotifyTo: partial.behavior?.quoteNotifyTo ?? defaultConfig.behavior.quoteNotifyTo,
      quoteNotifyCC: partial.behavior?.quoteNotifyCC ?? defaultConfig.behavior.quoteNotifyCC,
    },
    integrations: {
      viber: { enabled: partial.integrations?.viber?.enabled === true },
      whatsapp: { enabled: partial.integrations?.whatsapp?.enabled === true },
      telegram: { enabled: partial.integrations?.telegram?.enabled === true },
    },
  };
}

// ─── Contact template variables ─────────────────────────────────────────────
// The Contact & Location tab is the single source of truth for company details.
// Anywhere these values are needed (AI system prompt, dataset entries, response
// footers, welcome message) they can be referenced as {{token}} and are replaced
// with the current Contact & Location values when the chatbot runs.

export interface TemplateVariable {
  /** The token usable in text, without braces (e.g. "address" → {{address}}) */
  token: string;
  /** Human-readable label shown in the admin UI */
  label: string;
  /** The AppearanceConfig field the value comes from */
  source: keyof AppearanceConfig;
}

export const CONTACT_TEMPLATE_VARIABLES: TemplateVariable[] = [
  { token: 'companyName', label: 'Company name', source: 'companyName' },
  { token: 'address', label: 'Office address', source: 'companyAddress' },
  { token: 'phone', label: 'Phone number(s)', source: 'companyPhone' },
  { token: 'email', label: 'Contact email', source: 'companyEmail' },
  { token: 'officeHours', label: 'Office hours', source: 'officeHours' },
  { token: 'contactUrl', label: 'Website / contact page', source: 'contactUrl' },
  { token: 'mapUrl', label: 'Map / directions link', source: 'mapUrl' },
];

/**
 * Replace {{token}} references with the matching Contact & Location values.
 * Whitespace inside the braces is tolerated ({{ address }}), unknown tokens are
 * left untouched, and tokens whose field is empty resolve to an empty string.
 */
export function interpolateTemplateVariables(
  text: string,
  appearance?: Partial<AppearanceConfig> | null,
): string {
  if (!text || !appearance) return text ?? '';
  return text.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (match, token: string) => {
    const variable = CONTACT_TEMPLATE_VARIABLES.find(
      (v) => v.token === token,
    );
    if (!variable) return match;
    const value = appearance[variable.source];
    return typeof value === 'string' ? value : '';
  });
}
export { formatRichMessage } from './format-message.js';
