---
title: 流式响应处理
sidebar_position: 4
tags: [Streaming, SSE, 流式响应]
---

# 流式响应处理

> 实现丝滑的打字机效果

## 概述

AI 应用的流式响应能显著提升用户体验：用户不必等待完整响应，而是边生成边看到内容。

## 核心概念

### 1. 为什么需要流式

```
传统响应：
用户输入 → 等待 3-5 秒 → 一次性显示全部

流式响应：
用户输入 → 立即开始显示 → 逐字/逐句出现
```

### 2. 实现方式

| 方式 | 说明 | 适用场景 |
|------|------|----------|
| SSE | 服务器推送事件 | 单向流（推荐） |
| WebSocket | 双向连接 | 需要双向通信 |
| 长轮询 | 兼容方案 | 老旧环境 |

### 3. 数据流

```
OpenAI API (stream) 
    ↓
后端处理（拼接/解析）
    ↓
SSE 推送
    ↓
前端渲染
```

## 实践要点

### 后端实现（FastAPI）

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI

app = FastAPI()
client = AsyncOpenAI()

@app.post("/chat/stream")
async def chat_stream(message: str):
    async def generate():
        stream = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": message}],
            stream=True
        )
        
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                # SSE 格式：data: 内容\n\n
                yield f"data: {content}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

### 前端实现（React）

{/* TODO: 补充完整的前端流式组件 */}

```tsx
import { useState, useCallback } from 'react';

function ChatStream() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    setLoading(true);
    setResponse('');

    const res = await fetch('/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const content = line.slice(6);
          if (content !== '[DONE]') {
            setResponse(prev => prev + content);
          }
        }
      }
    }

    setLoading(false);
  }, []);

  return (
    <div>
      <div className="response">{response}</div>
      {loading && <span className="cursor">▌</span>}
    </div>
  );
}
```

### Vercel AI SDK（推荐）

```tsx
// 使用 Vercel AI SDK 简化流式处理
import { useChat } from 'ai/react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.role}: {m.content}
        </div>
      ))}
      
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>发送</button>
      </form>
    </div>
  );
}
```

### 错误处理

```python
@app.post("/chat/stream")
async def chat_stream_with_error_handling(message: str):
    async def generate():
        try:
            stream = await client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": message}],
                stream=True
            )
            
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield f"data: {content}\n\n"
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            # 发送错误信息
            yield f"data: [ERROR] {str(e)}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 中断支持

```python
from fastapi import Request

@app.post("/chat/stream")
async def chat_stream_with_abort(message: str, request: Request):
    async def generate():
        stream = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": message}],
            stream=True
        )
        
        async for chunk in stream:
            # 检查客户端是否断开
            if await request.is_disconnected():
                print("客户端断开，停止生成")
                break
                
            content = chunk.choices[0].delta.content
            if content:
                yield f"data: {content}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

## 常见问题

### Q: Nginx 代理后流式不工作？

需要关闭缓冲：

```nginx
location /chat/stream {
    proxy_pass http://127.0.0.1:8000;
    proxy_buffering off;
    proxy_cache off;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}
```

### Q: 如何实现打字机光标效果？

```css
.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}
```

### Q: 流式和普通响应如何切换？

```python
@app.post("/chat")
async def chat(message: str, stream: bool = False):
    if stream:
        return await chat_stream(message)
    else:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": message}]
        )
        return {"reply": response.choices[0].message.content}
```

## 学习资源

- [MDN Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

{/* TODO: 补充复杂流式场景（多轮对话、工具调用） */}
