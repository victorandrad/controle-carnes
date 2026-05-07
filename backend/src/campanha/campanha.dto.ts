import { z } from 'zod';

export const CriarCampanhaSchema = z.object({
  nome: z.string().min(1),
  premio: z.string().min(1),
  dataSorteio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valorCarne: z.number().positive(),
  numParcelas: z.number().int().positive(),
  maxCarnes: z.number().int().positive(),
});

export const AtualizarCampanhaSchema = CriarCampanhaSchema.partial().omit({
  valorCarne: true,
  numParcelas: true,
});

export type CriarCampanhaDto = z.infer<typeof CriarCampanhaSchema>;
export type AtualizarCampanhaDto = z.infer<typeof AtualizarCampanhaSchema>;
