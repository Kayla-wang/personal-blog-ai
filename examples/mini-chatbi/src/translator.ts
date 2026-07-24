import type { SemanticQuery, SemanticModel, Filter } from './types';

function metricExpr(name: string, model: SemanticModel): string {
  const m = model.measures[name];
  if (!m) throw new Error(`unknown metric: ${name}`);
  if (m.type === 'ratio') return `(${m.numerator}) * 1.0 / (${m.denominator})`;
  return m.expr!;
}

function dimExpr(name: string, model: SemanticModel): string {
  return model.dimensions[name]?.expr ?? name;
}

function quote(v: string | number): string {
  return typeof v === 'number' ? String(v) : `'${v}'`;
}

function filterSql(f: Filter, model: SemanticModel): string {
  const col = dimExpr(f.field, model);
  if (f.op === 'in' && Array.isArray(f.value)) {
    return `${col} IN (${f.value.map(quote).join(', ')})`;
  }
  return `${col} ${f.op} ${quote(f.value as string | number)}`;
}

export function translate(q: SemanticQuery, model: SemanticModel): string {
  const table = Object.values(model.entities)[0].table;
  const dims = q.dimensions.map((d) => `${dimExpr(d, model)} AS ${d}`);
  const select = [...dims, `${metricExpr(q.metric, model)} AS ${q.metric}`].join(', ');
  let sql = `SELECT ${select} FROM ${table}`;
  if (q.filters.length) sql += ` WHERE ${q.filters.map((f) => filterSql(f, model)).join(' AND ')}`;
  if (q.dimensions.length) sql += ` GROUP BY ${q.dimensions.map((d) => dimExpr(d, model)).join(', ')}`;
  if (q.order) sql += ` ORDER BY ${q.order.by} ${q.order.dir.toUpperCase()}`;
  if (q.limit) sql += ` LIMIT ${q.limit}`;
  return sql;
}
