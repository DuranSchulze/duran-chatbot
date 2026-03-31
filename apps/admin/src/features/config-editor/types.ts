import type { LucideIcon } from "lucide-react"
import type {
  AIConfig,
  AppearanceConfig,
  BehaviorConfig,
  DatasetEntry,
  QuickLink,
} from "@duran-chatbot/config"

export type ConfigSectionId = "appearance" | "ai" | "links" | "dataset" | "behavior"

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
  appearance: AppearanceConfig
  ai: AIConfig
  quickLinks: QuickLink[]
  dataset: DatasetEntry[]
  behavior: BehaviorConfig
  onAppearanceChange: (appearance: AppearanceConfig) => void
  onAIChange: (ai: AIConfig) => void
  onQuickLinksChange: (quickLinks: QuickLink[]) => void
  onDatasetChange: (dataset: DatasetEntry[]) => void
  onBehaviorChange: (behavior: BehaviorConfig) => void
}
