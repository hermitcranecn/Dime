# Memory-lancedb + Ollama 配置指南

## 概述

本文档介绍如何在 OpenClaw 中配置 memory-lancedb 插件使用本地 Ollama 模型进行向量 embedding。

## 为什么需要自定义配置

memory-lancedb 插件默认使用 OpenAI 格式的 embedding API，但 Ollama 的 embedding 接口与 OpenAI 不兼容（Ollama 使用 `/api/embeddings` 而非 `/v1/embeddings`）。

## 配置步骤

### 1. 确保 Ollama 运行并安装模型

```bash
# 启动 Ollama
ollama serve

# 安装 embedding 模型
ollama pull nomic-embed-text
```

### 2. 修改 OpenClaw 配置

在 `~/.openclaw/openclaw.json` 中配置 memory-lancedb：

```json
{
  "plugins": {
    "entries": {
      "memory-lancedb": {
        "enabled": true,
        "config": {
          "embedding": {
            "provider": "ollama",
            "apiKey": "dummy",
            "model": "nomic-embed-text",
            "baseUrl": "http://localhost:11434"
          },
          "dbPath": "~/.openclaw/memory/lancedb",
          "autoCapture": true,
          "autoRecall": true
        }
      }
    }
  }
}
```

### 配置说明

| 字段        | 说明                                      |
| ----------- | ----------------------------------------- |
| provider    | 选择 embedding 服务：`openai` 或 `ollama` |
| model       | 向量模型名称                              |
| baseUrl     | Ollama 服务地址                           |
| apiKey      | OpenAI 需要 API Key，Ollama 可用 dummy    |
| autoCapture | 自动捕获重要信息                          |
| autoRecall  | 自动关联相关记忆                          |

### 支持的 Ollama 模型

| 模型              | 维度 |
| ----------------- | ---- |
| nomic-embed-text  | 768  |
| mxbai-embed-large | 1024 |
| bge-m3            | 1024 |
| bge-large         | 1024 |
| bge-small         | 384  |

## 中文触发词

已添加以下中文触发词，自动捕获包含这些关键词的内容：

- 记住、记一下
- 关键、关键信息
- 重要、非常重要
- 必须、必须要
- 主机厂、OEM、整车厂
- 老板、董事长、总经理
- 峰总、疯子

## 常见问题

### 1. Connection error

检查 Ollama 是否运行：

```bash
curl http://localhost:11434/api/tags
```

### 2. 向量维度不匹配

如果之前使用过其他模型，需要删除旧数据库：

```bash
rm -rf ~/.openclaw/memory/lancedb/
```

然后重启 Gateway。

### 3. 搜索结果为空

检查 minScore 阈值设置。L2 距离计算方式导致分数较低，建议设置为 0.001。

## 相关文件

- `extensions/memory-lancedb/config.ts` - 配置解析
- `extensions/memory-lancedb/index.ts` - 核心逻辑
- `extensions/memory-lancedb/openclaw.plugin.json` - 插件 schema
