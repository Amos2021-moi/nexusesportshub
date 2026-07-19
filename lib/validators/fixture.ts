import { z } from "zod"

export const submitResultSchema = z.object({
  homeScore: z.number().min(0, "Score must be 0 or more").max(99, "Score cannot exceed 99"),
  awayScore: z.number().min(0, "Score must be 0 or more").max(99, "Score cannot exceed 99"),
  evidenceImage: z.string().optional().nullable(),
})

export const suggestTimeSchema = z.object({
  proposedTime: z.string().datetime("Invalid date format"),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
})

export type SubmitResultInput = z.infer<typeof submitResultSchema>
export type SuggestTimeInput = z.infer<typeof suggestTimeSchema>