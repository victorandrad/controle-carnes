import { z } from 'zod';

export const VenderCarnesSchema = z.object({
  campanhaId: z.string().uuid(),
  participanteId: z.string().uuid(),
  numerosSorte: z.array(z.number().int().positive()).min(1),
});

export type VenderCarnesDto = z.infer<typeof VenderCarnesSchema>;
