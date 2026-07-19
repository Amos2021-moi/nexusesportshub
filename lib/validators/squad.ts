import { z } from "zod"

export const squadSchema = z.object({
  type: z.enum(["MAIN", "SEASONAL", "TOURNAMENT"]),
  screenshot: z.string().min(1, "Screenshot is required"),
  formation: z.string().min(1, "Formation is required"),
  teamStrength: z.number().min(1000, "Team strength must be at least 1000").max(4000, "Team strength cannot exceed 4000"),
  playstyle: z.string().optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
})

export type SquadInput = z.infer<typeof squadSchema>