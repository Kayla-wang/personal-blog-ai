import type { SemanticQuery, SemanticModel } from './types';

export function correct(q: SemanticQuery, model: SemanticModel): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const measure = model.measures[q.metric];
  if (!measure) {
    errors.push(`未知指标 "${q.metric}",可选:${Object.keys(model.measures).join('/')}`);
  }
  for (const d of q.dimensions) {
    if (!model.dimensions[d]) {
      errors.push(`未知维度 "${d}",可选:${Object.keys(model.dimensions).join('/')}`);
    }
  }
  for (const f of q.filters) {
    const dim = model.dimensions[f.field];
    if (!dim) { errors.push(`过滤字段 "${f.field}" 不是合法维度`); continue; }
    if (dim.values) {
      const vals = Array.isArray(f.value) ? f.value : [f.value];
      for (const v of vals) {
        if (!dim.values.includes(String(v))) {
          errors.push(`维度 "${f.field}" 不存在取值 "${v}",合法取值:${dim.values.join('/')}`);
        }
      }
    }
  }
  if (measure?.additivity === 'none' && q.dimensions.length > 1) {
    errors.push(`指标 "${q.metric}" 不可加,不支持按多个维度(${q.dimensions.join(',')})同时拆分`);
  }
  return { ok: errors.length === 0, errors };
}
