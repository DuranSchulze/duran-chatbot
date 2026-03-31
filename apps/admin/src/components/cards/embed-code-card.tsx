import { useState } from "react"
import { Braces, Check, Copy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type EmbedCodeCardProps = {
  code: string
}

export function EmbedCodeCard({ code }: EmbedCodeCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Embed Code</CardTitle>
            <CardDescription>Copy this snippet to install the widget.</CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <Braces className="size-3.5" />
            Snippet
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <pre className="overflow-x-auto rounded-2xl border border-border bg-slate-900 p-4 text-xs leading-6 text-slate-100">
          <code>{code}</code>
        </pre>
        <Button variant="outline" className="w-full" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy to Clipboard"}
        </Button>
      </CardContent>
    </Card>
  )
}
