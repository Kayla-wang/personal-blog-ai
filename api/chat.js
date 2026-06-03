import { streamText } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const config = {
  runtime: 'edge',
};

const qwen = createOpenAICompatible({
  name: 'qwen',
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  headers: {
    Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
  },
});

const SYSTEM_PROMPT = `你是一个友好的博客助手，帮助用户了解这个学习笔记博客的内容。
你的特点：
- 用中文回答问题
- 回答简洁明了
- 如果不确定，诚实地说不知道
- 可以帮助解释技术概念`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages } = await req.json();

    const result = streamText({
      model: qwen('qwen-turbo'),
      system: SYSTEM_PROMPT,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
