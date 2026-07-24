import { SemanticQuerySchema, type SemanticQuery, type SemanticModel } from './types';
import type { MappingResult } from './mapper';
import { defaultLLM, type LLMClient } from './llm';

export interface ParseOptions {
  llm?: LLMClient;
  previousQuery?: SemanticQuery;
  previousErrors?: string[];
}

export function buildPrompt(
  nl: string,
  mapping: MappingResult,
  model: SemanticModel,
  opts: ParseOptions = {}
): string {
  const metrics = Object.keys(model.measures).join(', ');
  const dimensions = Object.keys(model.dimensions).join(', ');
  const hint =
    `指标=${mapping.metrics.join('/') || '无'}, ` +
    `维度=${mapping.dimensions.join('/') || '无'}, ` +
    `维度取值=${mapping.values.map((v) => `${v.dimension}:${v.value}`).join('/') || '无'}`;
  let p = `你是数据分析助手。把用户问题转成语义查询 JSON,只能使用下列词表。
可用指标: ${metrics}
可用维度: ${dimensions}
Schema Mapper 命中线索: ${hint}
用户问题: "${nl}"`;
  if (opts.previousErrors?.length) {
    p += `\n\n上一次生成的查询有以下错误,请修正后重新生成:\n` +
      opts.previousErrors.map((e) => `- ${e}`).join('\n') +
      `\n上次查询: ${JSON.stringify(opts.previousQuery)}`;
  }
  return p;
}

export async function parse(
  nl: string,
  mapping: MappingResult,
  model: SemanticModel,
  opts: ParseOptions = {}
): Promise<SemanticQuery> {
  const llm = opts.llm ?? defaultLLM;
  const raw = await llm.generate(buildPrompt(nl, mapping, model, opts), SemanticQuerySchema);
  return SemanticQuerySchema.parse(raw);
}
