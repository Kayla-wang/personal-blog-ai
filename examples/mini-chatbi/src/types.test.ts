import { describe, it, expect } from 'vitest';
import { SemanticQuerySchema } from './types';

describe('SemanticQuerySchema', () => {
  it('接受合法的语义查询', () => {
    const q = {
      metric: 'gmv',
      dimensions: ['category'],
      filters: [{ field: 'region', op: 'in', value: ['华东'] }],
      order: { by: 'gmv', dir: 'desc' },
      limit: 1,
    };
    expect(SemanticQuerySchema.parse(q)).toEqual(q);
  });

  it('缺少 metric 时报错', () => {
    expect(() => SemanticQuerySchema.parse({ dimensions: [], filters: [] })).toThrow();
  });

  it('order.dir 非法时报错', () => {
    expect(() =>
      SemanticQuerySchema.parse({ metric: 'gmv', dimensions: [], filters: [], order: { by: 'gmv', dir: 'up' } })
    ).toThrow();
  });
});
