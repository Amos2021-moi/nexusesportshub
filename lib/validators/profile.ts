import { z } from "zod"

export const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50).optional(),
  class: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  favoriteClub: z.string().max(50).optional(),
  preferredFormation: z.string().optional(),
  preferredPlaystyle: z.string().optional(),
  whatsappNumber: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid WhatsApp number").optional().nullable(),
  whatsappVisible: z.boolean().optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>