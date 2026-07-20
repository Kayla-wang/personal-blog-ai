---
title: 观测性（日志 / 监控 / 告警）
sidebar_position: 5
tags: [观测性, 日志, 监控, 告警]
---

# 观测性

> 日志、监控、告警：让 AI 应用可观测

## 概述

生产环境的 AI 应用需要完整的观测体系，才能发现问题、定位原因、及时响应。

## 核心概念

### 1. 观测性三支柱

| 支柱 | 功能 | 工具 |
|------|------|------|
| 日志 | 记录事件详情 | ELK, Loki |
| 指标 | 数值型数据 | Prometheus, Grafana |
| 追踪 | 请求链路 | LangSmith, Jaeger |

### 2. AI 应用特有指标

```
业务指标：
- 任务完成率
- 用户满意度
- 功能使用分布

技术指标：
- API 延迟 (P50/P95/P99)
- Token 消耗
- 错误率

成本指标：
- 每日/每月 API 费用
- 每用户成本
- 每功能成本
```

## 实践要点

### 结构化日志

```python
import structlog
from datetime import datetime

# 配置结构化日志
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger()

# 记录 LLM 调用
def log_llm_call(
    model: str,
    prompt: str,
    response: str,
    latency_ms: float,
    tokens: dict
):
    logger.info(
        "llm_call",
        model=model,
        prompt_preview=prompt[:100],
        response_length=len(response),
        latency_ms=latency_ms,
        input_tokens=tokens["input"],
        output_tokens=tokens["output"],
        cost=calculate_cost(model, tokens)
    )

# 记录用户请求
def log_request(
    user_id: str,
    endpoint: str,
    status: str,
    latency_ms: float
):
    logger.info(
        "api_request",
        user_id=user_id,
        endpoint=endpoint,
        status=status,
        latency_ms=latency_ms
    )
```

### Prometheus 指标

{/* TODO: 补充完整的监控仪表盘配置 */}

```python
from prometheus_client import Counter, Histogram, Gauge

# 定义指标
REQUEST_COUNT = Counter(
    'ai_requests_total',
    'Total AI requests',
    ['endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'ai_request_latency_seconds',
    'Request latency',
    ['endpoint'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)

TOKEN_USAGE = Counter(
    'ai_tokens_total',
    'Total tokens used',
    ['model', 'type']  # type: input/output
)

ACTIVE_USERS = Gauge(
    'ai_active_users',
    'Currently active users'
)

# 使用
@app.post("/chat")
async def chat(request: Request):
    start = time.time()
    
    try:
        response = await process_chat(request)
        REQUEST_COUNT.labels(endpoint="/chat", status="success").inc()
        return response
    except Exception as e:
        REQUEST_COUNT.labels(endpoint="/chat", status="error").inc()
        raise
    finally:
        latency = time.time() - start
        REQUEST_LATENCY.labels(endpoint="/chat").observe(latency)
```

### FastAPI 中间件

```python
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
import time
import uuid

class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 生成请求 ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # 记录开始
        start_time = time.time()
        
        # 处理请求
        response = await call_next(request)
        
        # 记录指标
        latency = (time.time() - start_time) * 1000
        
        logger.info(
            "http_request",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            latency_ms=latency,
            user_agent=request.headers.get("user-agent")
        )
        
        # 添加响应头
        response.headers["X-Request-ID"] = request_id
        
        return response

app = FastAPI()
app.add_middleware(ObservabilityMiddleware)
```

### 告警规则

```yaml
# Prometheus 告警规则
groups:
  - name: ai-alerts
    rules:
      # 高错误率
      - alert: HighErrorRate
        expr: rate(ai_requests_total{status="error"}[5m]) / rate(ai_requests_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "错误率超过 10%"
      
      # 高延迟
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(ai_request_latency_seconds_bucket[5m])) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 延迟超过 5 秒"
      
      # 日成本超限
      - alert: DailyCostExceeded
        expr: sum(increase(ai_tokens_total[24h])) * 0.00001 > 100
        labels:
          severity: warning
        annotations:
          summary: "日 API 成本超过 $100"
```

### 健康检查

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def health_check():
    """基础健康检查"""
    return {"status": "healthy"}

@app.get("/health/ready")
async def readiness_check():
    """就绪检查：验证依赖服务"""
    checks = {}
    
    # 检查数据库
    try:
        await db.execute("SELECT 1")
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = str(e)
    
    # 检查 Redis
    try:
        await redis.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = str(e)
    
    # 检查 LLM API
    try:
        await call_llm("test", timeout=5)
        checks["llm_api"] = "ok"
    except Exception as e:
        checks["llm_api"] = str(e)
    
    all_ok = all(v == "ok" for v in checks.values())
    
    return {
        "status": "ready" if all_ok else "degraded",
        "checks": checks
    }
```

### 仪表盘设计

```
AI 应用仪表盘布局：

┌─────────────────────────────────────────────────────┐
│  概览：请求量、成功率、平均延迟、日成本            │
├─────────────────────┬───────────────────────────────┤
│  请求量趋势图       │  延迟分布 (P50/P95/P99)      │
├─────────────────────┼───────────────────────────────┤
│  错误率趋势         │  Token 消耗按模型分布        │
├─────────────────────┼───────────────────────────────┤
│  功能使用分布       │  用户满意度趋势               │
├─────────────────────┴───────────────────────────────┤
│  近期告警列表                                       │
└─────────────────────────────────────────────────────┘
```

## 常见问题

### Q: 日志量太大怎么办？

1. 采样记录（如 10%）
2. 只记录关键信息
3. 设置保留期限
4. 使用日志级别控制

### Q: 监控粒度怎么定？

- 业务指标：分钟级
- 技术指标：秒级/分钟级
- 成本指标：小时级/天级

### Q: 告警太多怎么办？

1. 调整阈值，减少噪音
2. 使用告警聚合
3. 设置告警分级
4. 定期 review 告警规则

## 学习资源

- [Prometheus 文档](https://prometheus.io/docs/)
- [Grafana 仪表盘](https://grafana.com/grafana/dashboards/)
- [OpenTelemetry](https://opentelemetry.io/)

---

{/* TODO: 补充完整的监控架构图 */}
