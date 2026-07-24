import { describe, it, expect } from 'vitest';
import { loadModel } from './knowledge-base';
import { parse, buildPrompt } from './parser';
import type { LLMClient } from './llm';

const model = loadModel('semantic-model.yaml');
const mapping = { metrics: ['gmv'], dimensions: ['category'], values: [{ dimension: 'region', value: '华东' }] };

describe('parser', () => {
  it('parse 用注入的 llm 返回校验后的语义查询', async () => {
    const fake: LLMClient = {
      async generate() { return { metric: 'gmv', dimensions: ['category'], filters: [] } as any; },
    };
    const q = await parse('华东各品类销售额', mapping, model, { llm: fake });
    expect(q.metric).toBe('gmv');
    expect(q.dimensions).toEqual(['category']);
  });

  it('buildPrompt 注入 mapper 线索', () => {
    const p = buildPrompt('华东各品类销售额', mapping, model);
    expect(p).toContain('gmv');
    expect(p).toContain('category');
  });

  it('buildPrompt 注入上次错误用于重试', () => {
    const p = buildPrompt('x', mapping, model, {
      previousErrors: ['未知指标 "sales"'],
      previousQuery: { metric: 'sales', dimensions: [], filters: [] },
    });
    expect(p).toContain('未知指标');
    expect(p).toContain('请修正');
  });
});
