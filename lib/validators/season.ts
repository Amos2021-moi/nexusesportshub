import { z } from "zod"

export const createSeasonSchema = z.object({
  name: z.string().min(3, "Season name must be at least 3 characters").max(50),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  isActive: z.boolean().optional(),
})

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>