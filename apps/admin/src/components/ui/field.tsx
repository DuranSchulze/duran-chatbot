import type { HTMLAttributes, LabelHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

export function Field({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2.5", className)} {...props} />
}

export function FieldGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-4 md:grid-cols-2", className)} {...props} />
}

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />
}

export function FieldDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs leading-5 text-muted-foreground", className)} {...props} />
}

export function FieldRow({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between gap-4", className)} {...props} />
}
