/** Decode SSE frames independently of network chunk and UTF-8 boundaries. */
export async function readGeminiStream(body: ReadableStream<Uint8Array>, receive: (payload: unknown) => void) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  const dispatch = (frame: string) => {
    const data = frame.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n")
    if (data && data !== "[DONE]") receive(JSON.parse(data))
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      let boundary: RegExpExecArray | null
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        dispatch(buffer.slice(0, boundary.index))
        buffer = buffer.slice(boundary.index + boundary[0].length)
      }
      if (done) {
        if (buffer.trim()) dispatch(buffer)
        break
      }
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
