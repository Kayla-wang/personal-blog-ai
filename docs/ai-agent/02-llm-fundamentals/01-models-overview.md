---
title: 主流大模型概览
sidebar_position: 1
tags: [LLM, GPT, Claude, 模型]
---

# 主流大模型概览

> 了解 GPT-4o、Claude、Gemini、Qwen、DeepSeek 的特点与选择

## 概述

选择合适的 LLM 是 Agent 开发的第一步。不同模型在能力、成本、速度上各有特点，需要根据场景权衡。

## 核心概念

### 1. 主流模型对比

| 模型 | 厂商 | 优势 | 适用场景 |
|------|------|------|----------|
| GPT-4o | OpenAI | 综合能力强、多模态 | 通用 Agent、复杂推理 |
| Claude 3.5 | Anthropic | 长上下文、代码能力 | 代码生成、文档处理 |
| Gemini Pro | Google | 多模态、推理链 | 多模态应用 |
| Qwen | 阿里 | 中文优化、国内合规 | 国内业务 |
| DeepSeek | DeepSeek | 性价比高、推理强 | 成本敏感场景 |

### 2. 模型规格

{/* TODO: 补充最新模型规格 */}

```
GPT-4o
├── 上下文窗口：128K tokens
├── 输入价格：$2.5 / 1M tokens
├── 输出价格：$10 / 1M tokens
└── 特点：速度快、多模态

Claude 3.5 Sonnet
├── 上下文窗口：200K tokens
├── 输入价格：$3 / 1M tokens
├── 输出价格：$15 / 1M tokens
└── 特点：长文本、代码优秀

DeepSeek V3
├── 上下文窗口：64K tokens
├── 价格：极低（约 GPT 的 1/10）
└── 特点：开源、性价比高
```

### 3. 能力维度

- **推理能力**：复杂问题分析、多步推理
- **代码能力**：代码生成、调试、解释
- **指令遵循**：按要求格式输出
- **知识广度**：各领域知识覆盖
- **多模态**：图像理解、生成
- **中文能力**：中文理解和生成质量

## 实践要点

### 模型选择决策树

```
你的应用场景是什么？
│
├── 需要国内合规部署？
│   └── 是 → Qwen / 百度文心 / 混元
│
├── 成本敏感？
│   └── 是 → DeepSeek / Qwen（较便宜）
│
├── 需要处理长文档？
│   └── 是 → Claude（200K 上下文）
│
├── 需要多模态？
│   └── 是 → GPT-4o / Gemini
│
└── 通用场景
    └── GPT-4o / Claude（按需选择）
```

### 多模型策略

```python
# 根据任务复杂度选择模型
def select_model(task_complexity: str) -> str:
    if task_complexity == "simple":
        return "gpt-4o-mini"  # 便宜快速
    elif task_complexity == "complex":
        return "gpt-4o"  # 能力强
    else:
        return "deepseek-chat"  # 性价比
```

## 常见问题

### Q: 开发阶段用什么模型？

**建议**：开发用便宜模型（gpt-4o-mini / deepseek），上线前切换到强模型测试

### Q: 国内业务必须用国产模型吗？

取决于数据敏感度和合规要求。一般 ToB 业务建议用国内模型（阿里百炼、百度千帆）

### Q: 如何评估模型适不适合我的场景？

1. 准备 20-50 个典型 Case
2. 用不同模型跑一遍
3. 对比准确率、延迟、成本

## 学习资源

- [OpenAI Models](https://platform.openai.com/docs/models)
- [Anthropic Claude](https://docs.anthropic.com/)
- [阿里云百炼](https://bailian.console.aliyun.com/)

---

{/* TODO: 补充实际模型对比测试结果 */}
