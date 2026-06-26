import { z } from "zod"

export const grantSchema = z.object({
  type: z.enum(["RSU", "NSO", "ISO", "ESPP"]),
  symbol: z.string().min(1, "Symbol is required").max(10).optional(),
  shares: z
    .number({ invalid_type_error: "Shares must be a number" })
    .int("Shares must be a whole number")
    .positive("Shares must be greater than 0")
    .max(10_000_000, "Shares seem unrealistically large"),
  strike: z
    .number({ invalid_type_error: "Strike price must be a number" })
    .min(0, "Strike price cannot be negative")
    .nullable()
    .optional(),
  grantDate: z
    .string()
    .min(1, "Grant date is required")
    .refine((d) => !isNaN(Date.parse(d)), "Grant date must be a valid date"),
  vestDate: z
    .string()
    .min(1, "Vest date is required")
    .refine((d) => !isNaN(Date.parse(d)), "Vest date must be a valid date"),
  fmvAtVest: z
    .number()
    .min(0, "FMV cannot be negative")
    .nullable()
    .optional(),
}).superRefine((data, ctx) => {
  // Vest date must be on or after grant date
  if (data.grantDate && data.vestDate) {
    if (new Date(data.vestDate) < new Date(data.grantDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vest date must be on or after grant date",
        path: ["vestDate"],
      })
    }
  }

  // Options require a strike price
  if ((data.type === "NSO" || data.type === "ISO") && !data.strike && data.strike !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Strike price is required for options",
      path: ["strike"],
    })
  }

  // Strike price should not exceed FMV for ISO (409A violation indicator)
  if (data.type === "ISO" && data.strike && data.fmvAtVest && data.strike > data.fmvAtVest) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "ISO strike price above FMV may indicate a 409A issue — please verify",
      path: ["strike"],
    })
  }
})

export type GrantFormValues = z.infer<typeof grantSchema>

export function validateGrant(data: unknown): { success: true; data: GrantFormValues } | { success: false; errors: Record<string, string> } {
  const result = grantSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors: Record<string, string> = {}
  result.error.errors.forEach((e) => {
    const key = e.path.join(".")
    errors[key] = e.message
  })
  return { success: false, errors }
}
