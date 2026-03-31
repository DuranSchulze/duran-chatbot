import type { AIConfig, DatasetEntry } from '@duran-chatbot/config'

interface VisitorProfile {
  name: string
  email: string
}

export async function callGeminiAPI(
  message: string,
  ai: AIConfig,
  apiKey: string,
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${ai.model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: message }] }],
        systemInstruction: {
          parts: [{ text: ai.systemPrompt + datasetContext + visitorContext }],
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
