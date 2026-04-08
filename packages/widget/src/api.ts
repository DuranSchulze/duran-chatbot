import type {
  AIConfig,
  DatasetEntry,
  PersonaConfig,
  ServiceEntry,
} from '@duran-chatbot/config'

interface VisitorProfile {
  name: string
  email: string
}

function buildPersonaInstruction(persona: PersonaConfig): string {
  if (!persona.enabled) {
    return ''
  }

  const sections = [
    persona.personaName ? `Reference voice: ${persona.personaName}` : '',
    persona.roleOrRelationship ? `Role or relationship: ${persona.roleOrRelationship}` : '',
    persona.tone ? `Tone: ${persona.tone}` : '',
    persona.writingStyle ? `Writing style: ${persona.writingStyle}` : '',
    persona.signaturePhrases ? `Signature phrases: ${persona.signaturePhrases}` : '',
    persona.dos ? `Do: ${persona.dos}` : '',
    persona.donts ? `Don't: ${persona.donts}` : '',
    persona.audienceNotes ? `Audience notes: ${persona.audienceNotes}` : '',
  ].filter(Boolean)

  if (sections.length === 0) {
    return ''
  }

  return `\n\nPersona voice guidance:\nReflect this person's tone, phrasing, and communication style without claiming to literally be them. Keep all existing business, legal, and safety guardrails intact.\n${sections.join('\n')}`
}

function buildServicesInstruction(services: ServiceEntry[]): string {
  if (services.length === 0) {
    return ''
  }

  const entries = services
    .map((service) => {
      const parts = [
        `Service: ${service.name}`,
        `Keywords: ${service.keywords.join(', ')}`,
        `Price guidance: ${service.price}`,
        `Process: ${service.process}`,
        service.notes ? `Notes: ${service.notes}` : '',
        `Next step: ${service.cta}`,
      ].filter(Boolean)

      return parts.join('\n')
    })
    .join('\n\n')

  return `\n\nServices knowledge base:\nUse these service entries when users ask about pricing, process, what is included, or next steps. Answer like a helpful sales assistant: explain the process clearly, use the stored price text faithfully, treat pricing as indicative or estimated unless the service details make it clearly fixed, avoid inventing prices that are not present, and guide the user toward the recommended next step when relevant.\n\n${entries}`
}

export async function callGeminiAPI(
  message: string,
  ai: AIConfig,
  persona: PersonaConfig,
  apiKey: string,
  services: ServiceEntry[],
  dataset: DatasetEntry[],
  visitorProfile?: VisitorProfile,
): Promise<string> {
  const datasetContext =
    dataset.length > 0
      ? `\n\nKnowledge base:\n${dataset.map((e) => `${e.title}: ${e.content}`).join('\n\n')}`
      : ''
  const visitorContext = visitorProfile
    ? `\n\nVisitor details:\nName: ${visitorProfile.name}\nEmail: ${visitorProfile.email}`
    : ''
  const personaContext = buildPersonaInstruction(persona)
  const servicesContext = buildServicesInstruction(services)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${ai.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: message }] }],
        systemInstruction: {
          parts: [{ text: ai.systemPrompt + personaContext + servicesContext + datasetContext + visitorContext }],
        },
        generationConfig: {
          temperature: ai.temperature,
          maxOutputTokens: ai.maxTokens,
        },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response received'
}
