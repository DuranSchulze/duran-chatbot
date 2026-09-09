import { Bot, BriefcaseBusiness, Database, Link2, Mail, MapPin, Palette, SlidersHorizontal, UserRound } from "lucide-react";

import { AIPanel } from "@/features/config-editor/panels/ai-panel";
import { AppearancePanel } from "@/features/config-editor/panels/appearance-panel";
import { BehaviorPanel } from "@/features/config-editor/panels/behavior-panel";
import { ContactPanel } from "@/features/config-editor/panels/contact-panel";
import { DatasetPanel } from "@/features/config-editor/panels/dataset-panel";
import { EmailPanel } from "@/features/config-editor/panels/email-panel";
import { PersonaPanel } from "@/features/config-editor/panels/persona-panel";
import { QuickLinksPanel } from "@/features/config-editor/panels/quick-links-panel";
import { ServicesPanel } from "@/features/config-editor/panels/services-panel";

import type { ConfigSectionDefinition, SectionBindings } from "./types";

export function getConfigSections(
  bindings: SectionBindings,
): ConfigSectionDefinition[] {
  return [
    {
      id: "appearance",
      label: "Appearance",
      description: "Brand, colors, type, and welcome message.",
      icon: Palette,
      render: () => (
        <AppearancePanel
          appearance={bindings.appearance}
          onChange={bindings.onAppearanceChange}
        />
      ),
    },
    {
      id: "ai",
      label: "AI Settings",
      description: "Model, prompt, and generation controls.",
      icon: Bot,
      render: () => <AIPanel ai={bindings.ai} onChange={bindings.onAIChange} />,
    },
    {
      id: "persona",
      label: "Persona",
      description: "Voice, tone, and communication style.",
      icon: UserRound,
      render: () => (
        <PersonaPanel
          persona={bindings.persona}
          onChange={bindings.onPersonaChange}
        />
      ),
    },
    {
      id: "links",
      label: "Action Menu",
      description: "Configurable task buttons inside the widget.",
      icon: Link2,
      render: () => (
        <QuickLinksPanel
          quickLinks={bindings.quickLinks}
          onChange={bindings.onQuickLinksChange}
        />
      ),
    },
    {
      id: "services",
      label: "Services",
      description:
        "Service offers the chatbot quotes for pricing, process, and next-step questions.",
      icon: BriefcaseBusiness,
      render: () => (
        <ServicesPanel
          services={bindings.services}
          onChange={bindings.onServicesChange}
        />
      ),
    },
    {
      id: "dataset",
      label: "Dataset",
      description:
        "Reference knowledge injected into the chatbot's prompt (guides, FAQs, policies).",
      icon: Database,
      render: () => (
        <DatasetPanel
          dataset={bindings.dataset}
          onChange={bindings.onDatasetChange}
        />
      ),
    },
    {
      id: "behavior",
      label: "Behavior",
      description: "Interaction rules and widget timing.",
      icon: SlidersHorizontal,
      render: () => (
        <BehaviorPanel
          behavior={bindings.behavior}
          onChange={bindings.onBehaviorChange}
        />
      ),
    },
    {
      id: "contact",
      label: "Contact & Location",
      description:
        "Single source of truth for address, phone, and hours — referenced by the AI everywhere.",
      icon: MapPin,
      render: () => (
        <ContactPanel
          appearance={bindings.appearance}
          onChange={bindings.onAppearanceChange}
        />
      ),
    },
    {
      id: "email",
      label: "Email",
      description: "Provider connection and notification emails in one place.",
      icon: Mail,
      render: () => (
        <EmailPanel
          profileSlug={bindings.profileSlug}
          behavior={bindings.behavior}
          onBehaviorChange={bindings.onBehaviorChange}
        />
      ),
    },
  ];
}
