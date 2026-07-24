import { describe, it, expect } from 'vitest';
import { scoreOne } from './eval';

const base = { sql: '', rows: [{ category: '家居', gmv: 100 }], attempts: 1 };

describe('scoreOne', () => {
  it('指标与检查都命中 → pass', () => {
    const r = scoreOne(
      { ...base, query: { metric: 'gmv', dimensions: ['category'], filters: [] } } as any,
      { question: 'x', metric: 'gmv', check: { field: 'category', value: '家居' } }
    );
    expect(r.pass).toBe(true);
  });

  it('指标不符 → fail', () => {
    const r = scoreOne(
      { ...base, query: { metric: 'order_count', dimensions: [], filters: [] } } as any,
      { question: 'x', metric: 'gmv' }
    );
    expect(r.pass).toBe(false);
    expect(r.reason).toContain('gmv');
  });

  it('检查值不符 → fail', () => {
    const r = scoreOne(
      { ...base, query: { metric: 'gmv', dimensions: ['category'], filters: [] } } as any,
      { question: 'x', metric: 'gmv', check: { field: 'category', value: '数码' } }
    );
    expect(r.pass).toBe(false);
  });
});
