---
title: A/B 测试
sidebar_position: 4
tags: [A/B测试, 实验, 评估]
---

# A/B 测试

> 数据驱动的决策：对比不同版本的效果

## 概述

A/B 测试让你用数据说话，对比不同 Prompt、模型、参数的效果，做出有依据的决策。

## 核心概念

### 1. A/B 测试流程

```
1. 定义目标指标
2. 设计实验组和对照组
3. 分配流量
4. 收集数据
5. 统计分析
6. 做出决策
```

### 2. 适用场景

| 场景 | 变量 |
|------|------|
| Prompt 优化 | 不同 System Prompt |
| 模型选择 | GPT-4 vs Claude |
| 参数调优 | Temperature 值 |
| 功能对比 | 有/无 RAG |

### 3. 关键指标

- 主指标：任务完成率、准确率
- 护栏指标：延迟、成本、错误率
- 用户指标：满意度、留存

## 实践要点

### 简单的 A/B 框架

```python
import random
import hashlib
from dataclasses import dataclass
from typing import Literal

@dataclass
class Experiment:
    name: str
    variants: dict[str, dict]
    traffic_split: dict[str, float]  # {"control": 0.5, "treatment": 0.5}

def get_variant(user_id: str, experiment: Experiment) -> str:
    """确定性地分配用户到实验组"""
    # 使用 hash 保证同一用户始终在同一组
    hash_input = f"{user_id}:{experiment.name}"
    hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
    bucket = (hash_value % 100) / 100
    
    cumulative = 0
    for variant, split in experiment.traffic_split.items():
        cumulative += split
        if bucket < cumulative:
            return variant
    
    return list(experiment.traffic_split.keys())[0]

# 定义实验
prompt_experiment = Experiment(
    name="system_prompt_v2",
    variants={
        "control": {"system_prompt": "你是一个助手。"},
        "treatment": {"system_prompt": "你是一个专业的AI助手，擅长简洁准确地回答问题。"}
    },
    traffic_split={"control": 0.5, "treatment": 0.5}
)

# 使用
def get_config(user_id: str) -> dict:
    variant = get_variant(user_id, prompt_experiment)
    return prompt_experiment.variants[variant]
```

### 数据收集

{/* TODO: 补充完整的数据收集实现 */}

```python
from datetime import datetime

def log_experiment_event(
    experiment_name: str,
    variant: str,
    user_id: str,
    metrics: dict
):
    """记录实验事件"""
    event = {
        "experiment": experiment_name,
        "variant": variant,
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        **metrics
    }
    
    # 写入数据库或日志
    save_event(event)

# 在 API 中使用
@app.post("/chat")
async def chat(request: ChatRequest):
    # 获取实验配置
    variant = get_variant(request.user_id, prompt_experiment)
    config = prompt_experiment.variants[variant]
    
    # 执行
    start = time.time()
    response = await call_llm(request.message, config["system_prompt"])
    latency = time.time() - start
    
    # 记录指标
    log_experiment_event(
        experiment_name="system_prompt_v2",
        variant=variant,
        user_id=request.user_id,
        metrics={
            "latency_ms": latency * 1000,
            "response_length": len(response),
        }
    )
    
    return {"reply": response}
```

### 统计分析

```python
import scipy.stats as stats
import numpy as np

def analyze_experiment(experiment_name: str) -> dict:
    """分析实验结果"""
    
    # 获取数据
    control_data = get_experiment_data(experiment_name, "control")
    treatment_data = get_experiment_data(experiment_name, "treatment")
    
    # 计算基础统计
    control_mean = np.mean(control_data["success_rate"])
    treatment_mean = np.mean(treatment_data["success_rate"])
    
    # t 检验
    t_stat, p_value = stats.ttest_ind(
        control_data["success_rate"],
        treatment_data["success_rate"]
    )
    
    # 效果量
    lift = (treatment_mean - control_mean) / control_mean * 100
    
    return {
        "control_mean": control_mean,
        "treatment_mean": treatment_mean,
        "lift": f"{lift:.2f}%",
        "p_value": p_value,
        "significant": p_value < 0.05,
        "sample_size": {
            "control": len(control_data),
            "treatment": len(treatment_data)
        }
    }
```

### 使用 LangSmith 实验

```python
from langsmith import Client

client = Client()

# 创建数据集
dataset = client.create_dataset("prompt_comparison")

# 添加测试用例
for case in test_cases:
    client.create_example(
        inputs={"question": case["question"]},
        outputs={"answer": case["expected"]},
        dataset_id=dataset.id
    )

# 运行实验
def run_variant_a(inputs: dict) -> dict:
    return {"answer": call_llm(inputs["question"], prompt_a)}

def run_variant_b(inputs: dict) -> dict:
    return {"answer": call_llm(inputs["question"], prompt_b)}

# 对比
results_a = client.run_on_dataset(dataset.id, run_variant_a)
results_b = client.run_on_dataset(dataset.id, run_variant_b)
```

### 多臂老虎机

```python
import numpy as np

class ThompsonSampling:
    """自动优化流量分配"""
    
    def __init__(self, variants: list[str]):
        self.variants = variants
        self.successes = {v: 1 for v in variants}
        self.failures = {v: 1 for v in variants}
    
    def select_variant(self) -> str:
        """基于后验分布选择变体"""
        samples = {}
        for variant in self.variants:
            samples[variant] = np.random.beta(
                self.successes[variant],
                self.failures[variant]
            )
        return max(samples, key=samples.get)
    
    def update(self, variant: str, success: bool):
        """更新统计"""
        if success:
            self.successes[variant] += 1
        else:
            self.failures[variant] += 1
```

## 常见问题

### Q: 需要多少样本量？

粗略估算：
- 检测 5% 的提升：每组约 1600 样本
- 检测 10% 的提升：每组约 400 样本
- 检测 20% 的提升：每组约 100 样本

### Q: 实验要跑多久？

- 至少收集足够样本量
- 覆盖完整周期（如一周）
- 避免特殊时期（节假日）

### Q: 多个实验同时跑会冲突吗？

使用分层实验设计，确保用户在不同实验中独立分组。

## 学习资源

- [A/B Testing 指南](https://www.optimizely.com/optimization-glossary/ab-testing/)
- [统计显著性计算器](https://www.evanmiller.org/ab-testing/)

---

{/* TODO: 补充实际 A/B 测试案例 */}
