export interface GroundedSource {
  number: number
  title: string
  url: string
}

export interface GroundingMetadata {
  groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>
  groundingSupports?: Array<{
    segment?: { text?: string; endIndex?: number }
    groundingChunkIndices?: number[]
  }>
  searchEntryPoint?: { renderedContent?: string }
}

export function citeGroundedAnswer(text: string, metadata?: GroundingMetadata) {
  const chunks = metadata?.groundingChunks ?? []
  const sources = chunks.map((chunk, index) => ({
    number: index + 1,
    title: chunk.web?.title ?? "Web source",
    url: chunk.web?.uri ?? "",
  })).filter((source) => /^https?:\/\//i.test(source.url))
  const supports = metadata?.groundingSupports ?? []
  const insertions = new Map<number, Set<number>>()
  for (const support of supports) {
    const phrase = support.segment?.text
    if (!phrase) continue
    // Match the actual phrase, avoiding byte-offset/Unicode mismatches.
    const start = text.indexOf(phrase)
    if (start < 0 || text.indexOf(phrase, start + 1) !== -1) continue
    const end = start + phrase.length
    const numbers = insertions.get(end) ?? new Set<number>()
    for (const index of support.groundingChunkIndices ?? []) {
      if (sources.some((source) => source.number === index + 1)) numbers.add(index + 1)
    }
    insertions.set(end, numbers)
  }
  let cited = text
  for (const [end, numbers] of [...insertions].sort((a, b) => b[0] - a[0])) {
    const links = [...numbers].map((number) => {
      const source = sources.find((item) => item.number === number)!
      return `[${number}](<${source.url.replace(/[<>\s]/g, encodeURIComponent)}>)`
    }).join(", ")
    if (links) cited = cited.slice(0, end) + " " + links + cited.slice(end)
  }
  const answerText = cited
  if (sources.length) {
    cited += "\n\n### Sources\n" + sources.map((source) =>
      `- [${source.number}. ${source.title.replace(/[\[\]<>]/g, "")}](<${source.url.replace(/[<>\s]/g, encodeURIComponent)}>)`,
    ).join("\n")
  }
  return { text: cited, answerText, sources, sourceCount: sources.length, searchSuggestions: metadata?.searchEntryPoint?.renderedContent }
}
