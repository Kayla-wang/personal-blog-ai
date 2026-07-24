import { z } from 'zod';

export interface Entity { table: string; primary_key: string; }
export interface Dimension { expr: string; values?: string[]; type?: 'time'; }
export interface Measure {
  expr?: string;
  additivity?: 'full' | 'semi' | 'none';
  type?: 'ratio';
  numerator?: string;
  denominator?: string;
}
export interface SemanticModel {
  entities: Record<string, Entity>;
  dimensions: Record<string, Dimension>;
  measures: Record<string, Measure>;
  synonyms: Record<string, string[]>;
}

export const FilterSchema = z.object({
  field: z.string(),
  op: z.enum(['=', '!=', '>', '<', '>=', '<=', 'in']),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});
export type Filter = z.infer<typeof FilterSchema>;

export const SemanticQuerySchema = z.object({
  metric: z.string(),
  dimensions: z.array(z.string()),
  filters: z.array(FilterSchema),
  order: z.object({ by: z.string(), dir: z.enum(['asc', 'desc']) }).optional(),
  limit: z.number().int().positive().optional(),
});
export type SemanticQuery = z.infer<typeof SemanticQuerySchema>;
