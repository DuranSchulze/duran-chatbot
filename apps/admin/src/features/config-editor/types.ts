import type { LucideIcon } from "lucide-react"
import type {
  AIConfig,
  AppearanceConfig,
  BehaviorConfig,
  DatasetEntry,
  IntegrationsConfig,
  PersonaConfig,
  QuickLink,
  ServiceEntry,
} from "@duran-chatbot/config"

export type ConfigSectionId = "appearance" | "ai" | "persona" | "links" | "services" | "dataset" | "behavior" | "email" | "integrations" | "contact" | "overview"

export type SidebarItem = {
  id: string
  label: string
  description: string
  icon: LucideIcon
}

export type ConfigSectionDefinition = {
  id: ConfigSectionId
  label: string
  description: string
  icon: LucideIcon
  render: () => React.ReactNode
}

export type SectionBindings = {
  profileSlug: string
  appearance: AppearanceConfig
  ai: AIConfig
  persona: PersonaConfig
  services: ServiceEntry[]
  quickLinks: QuickLink[]
  dataset: DatasetEntry[]
  behavior: BehaviorConfig
  integrations: IntegrationsConfig
  onAppearanceChange: (appearance: AppearanceConfig) => void
  onAIChange: (ai: AIConfig) => void
  onPersonaChange: (persona: PersonaConfig) => void
  onServicesChange: (services: ServiceEntry[]) => void
  onQuickLinksChange: (quickLinks: QuickLink[]) => void
  onDatasetChange: (dataset: DatasetEntry[]) => void
  onBehaviorChange: (behavior: BehaviorConfig) => void
  onIntegrationsChange: (integrations: IntegrationsConfig) => void
}
