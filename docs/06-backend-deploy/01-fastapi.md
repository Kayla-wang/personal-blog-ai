---
title: FastAPI（REST / WebSocket / SSE）
sidebar_position: 1
tags: [FastAPI, REST, SSE, WebSocket]
---

# FastAPI

> AI 应用后端的首选框架

## 概述

FastAPI 是 Python 最流行的 API 框架，天生支持异步，非常适合 AI 应用的后端开发。

## 核心概念

### 1. 为什么选 FastAPI

| 特性 | 说明 |
|------|------|
| 异步原生 | 完美支持 async/await |
| 自动文档 | Swagger UI / ReDoc |
| 类型验证 | Pydantic 集成 |
| 高性能 | 基于 Starlette |

### 2. AI 应用常用模式

```
REST API      → 简单请求/响应
SSE           → 流式输出（聊天）
WebSocket     → 双向实时通信
Background    → 长任务异步执行
```

## 实践要点

### 基础 REST API

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    model: str = "gpt-4o"

class ChatResponse(BaseModel):
    reply: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # 调用 LLM
    reply = await call_llm(request.message, request.model)
    return ChatResponse(reply=reply)
```

### SSE 流式响应

{/* TODO: 补充完整的流式聊天实现 */}

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI

app = FastAPI()
client = AsyncOpenAI()

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        stream = await client.chat.completions.create(
            model=request.model,
            messages=[{"role": "user", "content": request.message}],
            stream=True
        )
        
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                # SSE 格式
                yield f"data: {content}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

### 前端 SSE 接收

```typescript
// TypeScript/React
const response = await fetch('/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello' })
});

const reader = response.body?.getReader();
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
```

### WebSocket

```python
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # 接收消息
            data = await websocket.receive_text()
            
            # 流式响应
            async for chunk in stream_llm_response(data):
                await websocket.send_text(chunk)
            
            # 发送完成标记
            await websocket.send_text("[DONE]")
            
    except WebSocketDisconnect:
        print("客户端断开连接")
```

### 后台任务

```python
from fastapi import BackgroundTasks

@app.post("/generate-report")
async def generate_report(
    topic: str,
    background_tasks: BackgroundTasks
):
    task_id = create_task_id()
    
    # 添加后台任务
    background_tasks.add_task(
        long_running_report_generation,
        task_id,
        topic
    )
    
    return {"task_id": task_id, "status": "processing"}

@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    status = get_task_status_from_db(task_id)
    return status
```

### 完整项目结构

```
my_ai_api/
├── main.py           # FastAPI 入口
├── routes/
│   ├── chat.py       # 聊天 API
│   ├── rag.py        # RAG API
│   └── tasks.py      # 任务管理
├── services/
│   ├── llm.py        # LLM 调用封装
│   └── vectorstore.py
├── models/
│   └── schemas.py    # Pydantic 模型
└── utils/
    └── auth.py       # 认证中间件
```

## 常见问题

### Q: SSE 和 WebSocket 怎么选？

| 场景 | 推荐 |
|------|------|
| 纯流式输出 | SSE（更简单） |
| 需要双向通信 | WebSocket |
| 需要重连机制 | SSE（浏览器自动重连） |

### Q: 如何处理超时？

```python
from fastapi import HTTPException
import asyncio

@app.post("/chat")
async def chat_with_timeout(request: ChatRequest):
    try:
        result = await asyncio.wait_for(
            call_llm(request.message),
            timeout=30.0
        )
        return {"reply": result}
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="请求超时")
```

### Q: 如何限流？

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/chat")
@limiter.limit("10/minute")  # 每分钟 10 次
async def chat(request: ChatRequest):
    pass
```

## 学习资源

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [FastAPI 最佳实践](https://github.com/zhanymkanov/fastapi-best-practices)

---

{/* TODO: 补充生产级 API 配置 */}
