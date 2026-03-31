import { Input } from "@/components/ui/input"

type ColorInputProps = {
  value: string
  onChange: (value: string) => void
}

export function ColorInput({ value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-14 rounded-2xl border border-border bg-background p-1 shadow-sm"
      />
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
