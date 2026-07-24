import type { SemanticQuery } from './types';
import { KnowledgeBase } from './knowledge-base';
import { mapQuery } from './mapper';
import { parse } from './parser';
import { correct } from './corrector';
import { translate } from './translator';
import { Executor } from './executor';
import type { LLMClient } from './llm';

export interface PipelineResult {
  query: SemanticQuery;
  sql: string;
  rows: Record<string, unknown>[];
  attempts: number;
}

export interface PipelineOptions {
  llm?: LLMClient;
  maxRetries?: number;
  log?: (msg: string) => void;
}

export class Pipeline {
  constructor(private kb: KnowledgeBase, private exec: Executor) {}

  async run(nl: string, opts: PipelineOptions = {}): Promise<PipelineResult> {
    const model = this.kb.model;
    const maxRetries = opts.maxRetries ?? 3;
    const log = opts.log ?? (() => {});

    log(`[Q] ${nl}`);
    const mapping = mapQuery(nl, this.kb);
    log(`[1] Mapper → ${JSON.stringify(mapping)}`);

    let previousQuery: SemanticQuery | undefined;
    let previousErrors: string[] | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const query = await parse(nl, mapping, model, { llm: opts.llm, previousQuery, previousErrors });
      log(`[2] Parser (第${attempt}次) → ${JSON.stringify(query)}`);

      const { ok, errors } = correct(query, model);
      log(`[3] Corrector → ${ok ? '✓ 通过' : '✗ ' + errors.join('; ')}`);
      if (!ok) { previousQuery = query; previousErrors = errors; continue; }

      const sql = translate(query, model);
      log(`[4] Translator → ${sql}`);
      const rows = this.exec.run(sql);
      log(`[5] Executor → ${rows.length} 行`);
      return { query, sql, rows, attempts: attempt };
    }
    throw new Error(`纠错 ${maxRetries} 次仍未通过校验: ${previousErrors?.join('; ')}`);
  }
}
