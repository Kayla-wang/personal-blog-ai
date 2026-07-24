import type { KnowledgeBase } from './knowledge-base';

export interface MappingResult {
  metrics: string[];
  dimensions: string[];
  values: { dimension: string; value: string }[];
}

export function mapQuery(nl: string, kb: KnowledgeBase): MappingResult {
  const m = kb.model;
  const terms = new Set<string>();
  for (const name of Object.keys(m.measures)) terms.add(name);
  for (const name of Object.keys(m.dimensions)) terms.add(name);
  for (const aliases of Object.values(m.synonyms ?? {})) aliases.forEach((a) => terms.add(a));
  for (const def of Object.values(m.dimensions)) (def.values ?? []).forEach((v) => terms.add(v));

  const result: MappingResult = { metrics: [], dimensions: [], values: [] };
  for (const term of terms) {
    if (!nl.includes(term)) continue;
    const r = kb.resolveTerm(term);
    if (!r) continue;
    if (r.kind === 'metric' && !result.metrics.includes(r.name)) result.metrics.push(r.name);
    else if (r.kind === 'dimension' && !result.dimensions.includes(r.name)) result.dimensions.push(r.name);
    else if (r.kind === 'value' && r.dimension)
      result.values.push({ dimension: r.dimension, value: r.name });
  }
  return result;
}
