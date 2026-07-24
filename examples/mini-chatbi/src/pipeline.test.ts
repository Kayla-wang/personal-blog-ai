import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadModel, KnowledgeBase } from './knowledge-base';
import { seed } from '../seed';
import { Executor } from './executor';
import { Pipeline } from './pipeline';
import type { LLMClient } from './llm';

const DB = 'test-pipeline.db';
let kb: KnowledgeBase;
let exec: Executor;
beforeAll(() => { seed(DB); kb = new KnowledgeBase(loadModel('semantic-model.yaml')); exec = new Executor(DB); });
afterAll(() => exec.close());

describe('Pipeline', () => {
  it('校验失败后重试并最终成功', async () => {
    let call = 0;
    const fake: LLMClient = {
      async generate() {
        call++;
        return (call === 1
          ? { metric: 'sales', dimensions: [], filters: [] }
          : { metric: 'gmv', dimensions: ['category'], filters: [], order: { by: 'gmv', dir: 'desc' }, limit: 1 }) as any;
      },
    };
    const r = await new Pipeline(kb, exec).run('各品类销售额最高', { llm: fake });
    expect(r.attempts).toBe(2);
    expect(r.rows[0].category).toBe('家居');
  });

  it('超过重试上限抛错', async () => {
    const fake: LLMClient = { async generate() { return { metric: 'sales', dimensions: [], filters: [] } as any; } };
    await expect(
      new Pipeline(kb, exec).run('x', { llm: fake, maxRetries: 2 })
    ).rejects.toThrow('纠错');
  });
});
