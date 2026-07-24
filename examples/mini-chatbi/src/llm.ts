import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { z } from 'zod';

export interface LLMClient {
  generate<T>(prompt: string, schema: z.ZodType<T>): Promise<T>;
}

// 惰性创建 provider:调用时才读 env,确保 CLI 里 loadEnvFile 先执行
export const defaultLLM: LLMClient = {
  async generate(prompt, schema) {
    const provider = createOpenAI({
      baseURL: process.env.AI_BASE_URL,
      apiKey: process.env.AI_API_KEY,
    });
    const { object } = await generateObject({
      model: provider(process.env.AI_MODEL ?? 'qwen-plus'),
      schema,
      prompt,
    });
    return object;
  },
};
