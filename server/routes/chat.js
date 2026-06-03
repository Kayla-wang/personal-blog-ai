import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';
import { Router } from 'express';

const router = Router();

const provider = createOpenAICompatible({
  name: process.env.AI_PROVIDER || 'openai',
  baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: process.env.AI_API_KEY,
});

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const result = streamText({
      model: provider(process.env.AI_MODEL || 'gpt-3.5-turbo'),
      messages,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of result.textStream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
