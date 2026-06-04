---
title: Python 异步编程（asyncio）
sidebar_position: 2
tags: [Python, asyncio, 异步]
---

# Python 异步编程（asyncio）

> 从 JS Promise 到 Python async/await

## 概述

前端开发者对异步编程不陌生。Python 的 asyncio 概念类似 JS 的 Promise，但实现机制不同。Agent 开发中，异步编程用于：

- 并发调用多个 LLM API
- 流式响应处理
- 并行执行多个 Tool

## 核心概念

### 1. async/await 基础

```python
import asyncio

# 定义异步函数
async def fetch_response(prompt: str) -> str:
    # await 等待异步操作完成
    response = await call_llm_api(prompt)
    return response

# 运行异步函数
result = asyncio.run(fetch_response("Hello"))
```

**与 JS 的对比**：

| 概念 | JavaScript | Python |
|------|------------|--------|
| 定义异步函数 | `async function` | `async def` |
| 等待 | `await promise` | `await coroutine` |
| 运行 | 自动（浏览器/Node） | `asyncio.run()` |
| 并发 | `Promise.all()` | `asyncio.gather()` |

### 2. 并发执行

```python
async def parallel_calls():
    # 类似 Promise.all()
    results = await asyncio.gather(
        call_api("prompt1"),
        call_api("prompt2"),
        call_api("prompt3"),
    )
    return results
```

### 3. 流式响应处理

{/* TODO: 补充实际的流式 API 调用代码 */}

```python
async def stream_response(prompt: str):
    async for chunk in client.chat.stream(prompt):
        yield chunk.content

# 使用
async for text in stream_response("Write a story"):
    print(text, end="", flush=True)
```

## 实践要点

### Agent 开发中的异步模式

```python
# 1. 并发调用多个工具
async def execute_tools(tools: list[Tool]) -> list[Result]:
    tasks = [tool.run() for tool in tools]
    return await asyncio.gather(*tasks)

# 2. 带超时的 API 调用
async def call_with_timeout(prompt: str, timeout: float = 30.0):
    try:
        return await asyncio.wait_for(
            call_api(prompt),
            timeout=timeout
        )
    except asyncio.TimeoutError:
        return "Request timed out"

# 3. 信号量控制并发数
semaphore = asyncio.Semaphore(5)  # 最多 5 个并发

async def rate_limited_call(prompt: str):
    async with semaphore:
        return await call_api(prompt)
```

### 常见陷阱

```python
# ❌ 错误：在同步函数中调用 await
def bad_function():
    result = await async_function()  # SyntaxError

# ✅ 正确：使用 asyncio.run()
def good_function():
    result = asyncio.run(async_function())

# ❌ 错误：顺序 await（失去并发优势）
async def sequential():
    a = await call_api("1")  # 等待完成
    b = await call_api("2")  # 再等待完成

# ✅ 正确：并发执行
async def concurrent():
    a, b = await asyncio.gather(
        call_api("1"),
        call_api("2")
    )
```

## 常见问题

### Q: 什么时候用同步，什么时候用异步？

- **I/O 密集型**（API 调用、文件读写）→ 异步
- **CPU 密集型**（数据处理、计算）→ 同步或多进程
- **简单脚本** → 同步即可，不必强求异步

### Q: LangChain 的异步支持？

```python
# LangChain 提供异步版本的方法
from langchain_openai import ChatOpenAI

llm = ChatOpenAI()
# 同步
response = llm.invoke("Hello")
# 异步
response = await llm.ainvoke("Hello")
```

## 学习资源

- [asyncio 官方文档](https://docs.python.org/3/library/asyncio.html)
- [Real Python - Async IO](https://realpython.com/async-io-python/)

---

{/* TODO: 补充实际项目中的异步代码示例 */}
