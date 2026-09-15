import { Input } from "@/components/ui/input";

type ColorInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ColorInput({ value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-14 rounded-xl border border-border bg-card p-1 "
      />
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
