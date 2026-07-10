---
title: 代码助手
sidebar_position: 1
tags: [代码助手, 开发工具]
---

# 代码助手

> 构建一个理解代码、辅助开发的智能助手

## 项目概述

### 功能范围

- **代码生成**：根据描述生成代码
- **代码审查**：发现潜在问题和改进点
- **Bug 修复**：定位并修复代码错误
- **文档生成**：自动生成代码文档
- **项目脚手架**：快速初始化项目结构

### 技术栈

- 后端：Node.js + Nest.js
- AI：LangChain.js + Claude/GPT-4
- 代码分析：tree-sitter（AST 解析）
- 向量数据库：Pinecone / Weaviate

## 架构设计

```
┌─────────────────────────────────────────────────┐
│                    代码助手                      │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │              Agent Core                  │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ Planner │ │ Executor│ │ Reviewer│   │   │
│  │  └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────┘   │
│                      │                          │
│  ┌─────────────────────────────────────────┐   │
│  │              Tools Layer                 │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │   │
│  │  │ Read │ │ Edit │ │ Search│ │  Run │   │   │
│  │  │ File │ │ File │ │ Code │ │ Test │   │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘   │   │
│  └─────────────────────────────────────────┘   │
│                      │                          │
│  ┌─────────────────────────────────────────┐   │
│  │            Knowledge Layer               │   │
│  │  ┌─────────────┐ ┌─────────────────┐    │   │
│  │  │ Code Index  │ │ Doc Embeddings  │    │   │
│  │  │ (AST + Vec) │ │ (API Docs)      │    │   │
│  │  └─────────────┘ └─────────────────┘    │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

## 核心功能

### 1. 代码理解

```typescript
// 代码索引服务
class CodeIndexer {
  private parser: Parser;
  private vectorStore: VectorStore;

  async indexFile(filePath: string) {
    const content = await fs.readFile(filePath, 'utf-8');
    const tree = this.parser.parse(content);
    
    // 提取函数、类等节点
    const nodes = extractNodes(tree.rootNode);
    
    // 生成嵌入并存储
    for (const node of nodes) {
      const embedding = await this.embed(node.text);
      await this.vectorStore.upsert({
        id: `${filePath}:${node.name}`,
        embedding,
        metadata: {
          filePath,
          name: node.name,
          type: node.type,
          startLine: node.startPosition.row,
          endLine: node.endPosition.row,
        },
      });
    }
  }

  async searchCode(query: string) {
    const results = await this.vectorStore.search(query, { topK: 10 });
    return results;
  }
}
```

### 2. 代码生成

```typescript
const codeGenerationTool = tool(
  async ({ description, language, context }) => {
    // 检索相关代码作为上下文
    const relevantCode = await codeIndexer.searchCode(description);
    
    const prompt = `
基于以下项目代码风格：
${relevantCode.map(c => c.text).join('\n---\n')}

请生成符合以下要求的 ${language} 代码：
${description}

要求：
1. 遵循项目现有的代码风格
2. 添加必要的类型注解
3. 包含错误处理
`;
    
    const response = await model.invoke(prompt);
    return response.content;
  },
  {
    name: 'generate_code',
    description: '根据描述生成代码',
    schema: z.object({
      description: z.string().describe('功能描述'),
      language: z.string().describe('编程语言'),
      context: z.string().optional().describe('额外上下文'),
    }),
  }
);
```

### 3. 代码审查

```typescript
const codeReviewTool = tool(
  async ({ filePath, diff }) => {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const prompt = `
请审查以下代码变更：

文件: ${filePath}
变更内容:
${diff}

完整文件内容:
${fileContent}

请从以下维度进行审查：
1. **Bug 风险**: 是否有潜在的逻辑错误或边界情况
2. **性能**: 是否有性能问题
3. **安全**: 是否有安全漏洞
4. **可读性**: 命名、结构是否清晰
5. **最佳实践**: 是否遵循语言/框架最佳实践

输出格式：
{
  "issues": [{ "severity": "high|medium|low", "line": number, "message": string }],
  "suggestions": [string],
  "approved": boolean
}
`;
    
    const response = await model.invoke(prompt);
    return JSON.parse(response.content);
  },
  {
    name: 'review_code',
    description: '审查代码变更',
    schema: z.object({
      filePath: z.string(),
      diff: z.string(),
    }),
  }
);
```

### 4. Bug 修复

```typescript
const fixBugTool = tool(
  async ({ errorMessage, stackTrace, filePath }) => {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // 分析错误
    const analysis = await model.invoke(`
分析以下错误：
错误信息: ${errorMessage}
堆栈: ${stackTrace}
文件内容: ${fileContent}

请：
1. 解释错误原因
2. 定位问题代码行
3. 提供修复方案
`);
    
    // 生成修复 diff
    const fix = await model.invoke(`
基于分析：${analysis.content}
生成修复代码的 diff。
`);
    
    return {
      analysis: analysis.content,
      fix: fix.content,
    };
  },
  {
    name: 'fix_bug',
    description: '分析并修复代码错误',
    schema: z.object({
      errorMessage: z.string(),
      stackTrace: z.string(),
      filePath: z.string(),
    }),
  }
);
```

## 上下文工程

### 代码上下文策略

```typescript
class ContextBuilder {
  // 获取相关代码上下文
  async buildContext(query: string, maxTokens: number = 8000) {
    const context: string[] = [];
    let tokenCount = 0;
    
    // 1. 语义搜索相关代码
    const semanticResults = await this.vectorStore.search(query);
    
    // 2. 获取引用/被引用关系
    const references = await this.getReferences(semanticResults);
    
    // 3. 按相关性排序
    const ranked = this.rankByRelevance([...semanticResults, ...references]);
    
    // 4. 填充上下文直到 token 上限
    for (const item of ranked) {
      const tokens = this.countTokens(item.content);
      if (tokenCount + tokens > maxTokens) break;
      
      context.push(this.formatCodeBlock(item));
      tokenCount += tokens;
    }
    
    return context.join('\n\n');
  }
}
```

## 实现步骤

1. **代码索引**：解析项目代码，构建索引
2. **工具开发**：实现读/写/搜索/执行工具
3. **Agent 编排**：使用 LangGraph 编排流程
4. **IDE 集成**：开发 VSCode 插件

## 进阶功能

- [ ] 支持多语言（Python、Go、Rust）
- [ ] 集成 Git 操作
- [ ] 自动化测试生成
- [ ] 代码迁移辅助
- [ ] 架构分析与建议
