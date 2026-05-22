import type { AIConfig, DatasetEntry, PersonaConfig, ServiceEntry } from "@duran-chatbot/config"

function buildPersonaInstruction(persona: PersonaConfig): string {
  if (!persona.enabled) return ""
  const sections = [
    persona.personaName ? `Reference voice: ${persona.personaName}` : "",
    persona.roleOrRelationship ? `Role or relationship: ${persona.roleOrRelationship}` : "",
    persona.tone ? `Tone: ${persona.tone}` : "",
    persona.writingStyle ? `Writing style: ${persona.writingStyle}` : "",
    persona.signaturePhrases ? `Signature phrases: ${persona.signaturePhrases}` : "",
    persona.dos ? `Do: ${persona.dos}` : "",
    persona.donts ? `Don't: ${persona.donts}` : "",
    persona.audienceNotes ? `Audience notes: ${persona.audienceNotes}` : "",
  ].filter(Boolean)
  if (sections.length === 0) return ""
  return `\n\nPersona voice guidance:\nReflect this person's tone, phrasing, and communication style without claiming to literally be them. Keep all existing business, legal, and safety guardrails intact.\n${sections.join("\n")}`
}

function buildServicesInstruction(services: ServiceEntry[]): string {
  if (services.length === 0) return ""
  const entries = services
    .map((s) =>
      [
        `Service: ${s.name}`,
        `Keywords: ${s.keywords.join(", ")}`,
        `Price guidance: ${s.price}`,
        `Process: ${s.process}`,
        s.notes ? `Notes: ${s.notes}` : "",
        `Next step: ${s.cta}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")
  return `\n\nServices knowledge base:\nUse these service entries when users ask about pricing, process, what is included, or next steps.\n\n${entries}`
}

export async function callGemini(
  message: string,
  ai: AIConfig,
  persona: PersonaConfig,
  services: ServiceEntry[],
  dataset: DatasetEntry[],
): Promise<string> {
  if (!ai.apiKey) throw new Error("API key not configured")

  const datasetContext =
    dataset.length > 0
      ? `\n\nKnowledge base:\n${dataset.map((e) => `${e.title}: ${e.content}`).join("\n\n")}`
      : ""
  const personaContext = buildPersonaInstruction(persona)
  const servicesContext = buildServicesInstruction(services)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${ai.model}:generateContent?key=${ai.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: message }] }],
        systemInstruction: {
          parts: [{ text: ai.systemPrompt + personaContext + servicesContext + datasetContext }],
        },
        generationConfig: {
          temperature: ai.temperature,
          maxOutputTokens: ai.maxTokens,
        },
      }),
    },
  )

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(data.error?.message ?? `Gemini API error (${response.status})`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response received"
}
