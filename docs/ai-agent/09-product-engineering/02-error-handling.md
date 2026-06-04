---
title: 错误处理和降级策略
sidebar_position: 2
tags: [错误处理, 降级, 容错]
---

# 错误处理和降级策略

> 让 AI 应用在异常情况下也能体面运行

## 概述

AI 应用会面临各种错误：API 超时、模型幻觉、服务不可用。好的错误处理让用户感受到可靠性。

## 核心概念

### 1. 错误类型

| 类型 | 示例 | 影响 |
|------|------|------|
| API 错误 | 超时、限流、服务不可用 | 无法获取响应 |
| 模型错误 | 幻觉、格式错误、拒绝回答 | 输出不可用 |
| 业务错误 | 输入无效、权限不足 | 无法完成任务 |
| 系统错误 | 数据库故障、内存不足 | 服务中断 |

### 2. 处理策略

```
1. 重试：临时性错误
2. 降级：使用备用方案
3. 熔断：防止雪崩
4. 兜底：保证有响应
```

## 实践要点

### 重试机制

```python
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10)
)
async def call_llm_with_retry(prompt: str) -> str:
    return await call_llm(prompt)

# 手动实现带条件的重试
async def smart_retry(
    func,
    max_attempts: int = 3,
    retry_on: tuple = (TimeoutError, RateLimitError)
):
    last_error = None
    
    for attempt in range(max_attempts):
        try:
            return await func()
        except retry_on as e:
            last_error = e
            wait_time = 2 ** attempt
            print(f"重试 {attempt + 1}/{max_attempts}，等待 {wait_time}s")
            await asyncio.sleep(wait_time)
        except Exception as e:
            # 不可重试的错误，直接抛出
            raise
    
    raise last_error
```

### 模型降级

{/* TODO: 补充更复杂的降级策略 */}

```python
class LLMWithFallback:
    def __init__(self):
        self.primary_model = "gpt-4o"
        self.fallback_models = ["gpt-4o-mini", "claude-3-haiku"]
    
    async def call(self, prompt: str) -> str:
        # 尝试主模型
        try:
            return await call_llm(prompt, self.primary_model)
        except Exception as e:
            print(f"主模型失败: {e}")
        
        # 依次尝试降级模型
        for model in self.fallback_models:
            try:
                return await call_llm(prompt, model)
            except Exception as e:
                print(f"{model} 失败: {e}")
                continue
        
        # 所有模型都失败，返回兜底响应
        return self.get_fallback_response(prompt)
    
    def get_fallback_response(self, prompt: str) -> str:
        return "抱歉，服务暂时不可用。请稍后重试，或联系客服。"
```

### 熔断器

```python
from datetime import datetime, timedelta

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
    
    def can_execute(self) -> bool:
        if self.state == "closed":
            return True
        
        if self.state == "open":
            # 检查是否可以尝试恢复
            if datetime.now() - self.last_failure_time > timedelta(seconds=self.recovery_timeout):
                self.state = "half-open"
                return True
            return False
        
        return True  # half-open 允许一次尝试
    
    def record_success(self):
        self.failures = 0
        self.state = "closed"
    
    def record_failure(self):
        self.failures += 1
        self.last_failure_time = datetime.now()
        
        if self.failures >= self.failure_threshold:
            self.state = "open"
            print(f"熔断器开启，{self.recovery_timeout}s 后重试")

# 使用
breaker = CircuitBreaker()

async def protected_call(prompt: str) -> str:
    if not breaker.can_execute():
        return "服务暂时不可用，请稍后重试"
    
    try:
        result = await call_llm(prompt)
        breaker.record_success()
        return result
    except Exception as e:
        breaker.record_failure()
        raise
```

### 输出验证

```python
from pydantic import BaseModel, ValidationError

class ExpectedOutput(BaseModel):
    answer: str
    confidence: float
    sources: list[str]

async def call_with_validation(prompt: str, max_retries: int = 2) -> dict:
    for attempt in range(max_retries + 1):
        try:
            response = await call_llm(prompt)
            # 验证输出格式
            parsed = ExpectedOutput.model_validate_json(response)
            return parsed.model_dump()
        except ValidationError as e:
            if attempt < max_retries:
                # 告诉模型修复格式
                prompt = f"""
                上次输出格式错误：{e}
                
                请重新输出，严格遵循 JSON 格式：
                {{"answer": "...", "confidence": 0.0-1.0, "sources": [...]}}
                """
            else:
                # 返回降级响应
                return {
                    "answer": response,  # 原始文本
                    "confidence": 0.0,
                    "sources": [],
                    "validation_failed": True
                }
```

### 用户友好的错误信息

```python
ERROR_MESSAGES = {
    "rate_limit": "请求太频繁了，请稍等几秒再试",
    "timeout": "响应时间较长，正在努力处理中...",
    "invalid_input": "输入内容有些问题：{detail}",
    "service_unavailable": "服务暂时维护中，请稍后再来",
    "unknown": "出了点小问题，我们正在处理"
}

def get_user_error_message(error: Exception) -> str:
    if isinstance(error, RateLimitError):
        return ERROR_MESSAGES["rate_limit"]
    if isinstance(error, TimeoutError):
        return ERROR_MESSAGES["timeout"]
    if isinstance(error, ValidationError):
        return ERROR_MESSAGES["invalid_input"].format(detail=str(error))
    
    # 记录详细错误，但不暴露给用户
    log_error(error)
    return ERROR_MESSAGES["unknown"]
```

## 常见问题

### Q: 重试会不会让情况更糟？

可能。使用指数退避 + 抖动：

```python
wait_time = min(2 ** attempt + random.uniform(0, 1), 30)
```

### Q: 降级到弱模型用户会发现吗？

可能会。建议：
- 告知用户"使用了简化模式"
- 降级后限制复杂功能
- 监控降级率

### Q: 熔断器阈值怎么设？

根据业务容忍度：
- 失败阈值：5-10 次
- 恢复时间：30-120 秒
- 通过监控数据调优

## 学习资源

- [Circuit Breaker 模式](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Resilience4j 文档](https://resilience4j.readme.io/)

---

{/* TODO: 补充实际项目的错误处理架构 */}
