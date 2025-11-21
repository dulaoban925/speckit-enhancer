# CLI Command Contracts

**Feature**: Spec-Kit UI Viewer
**Date**: 2025-11-19
**Phase**: 1 - Design & Contracts

## Overview

本目录包含 Spec-Kit UI CLI 的所有命令合约定义。每个命令都遵循统一的输入/输出格式,支持 JSON 输出,并提供清晰的错误处理机制。

---

## Command List

| Command | Description | Contract File |
|---------|-------------|---------------|
| `serve` | 启动本地开发服务器 | [serve.md](./serve.md) |
| `read` | 读取文件内容 | [read.md](./read.md) |
| `write` | 写入文件内容 | [write.md](./write.md) |
| `list` | 列出项目文档结构 | [list.md](./list.md) |
| `comment add` | 添加评论 | [comment-add.md](./comment-add.md) |
| `comment list` | 列出评论 | [comment-list.md](./comment-list.md) |
| `comment update` | 更新评论 | [comment-update.md](./comment-update.md) |
| `comment delete` | 删除评论 | [comment-delete.md](./comment-delete.md) |
| `watch` | 监听文件变化 | [watch.md](./watch.md) |

---

## Universal Conventions

### Exit Codes
- `0`: 成功
- `1`: 通用错误 (如文件不存在、权限错误)
- `2`: 参数错误 (如缺少必需参数、参数格式错误)
- `3`: 验证错误 (如项目目录无效、端口被占用)

### JSON Output Format
所有命令支持 `--json` 标志,输出统一的 JSON 格式:

**成功响应**:
```json
{
  "success": true,
  "data": { /* 命令特定数据 */ },
  "message": "操作成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { /* 可选的详细信息 */ }
  }
}
```

### Standard Error Codes
- `INVALID_PROJECT`: 无效的项目目录
- `FILE_NOT_FOUND`: 文件不存在
- `PERMISSION_DENIED`: 权限不足
- `PORT_IN_USE`: 端口被占用
- `VALIDATION_ERROR`: 输入验证失败
- `PATH_TRAVERSAL`: 路径遍历攻击检测
- `COMMAND_INJECTION`: 命令注入检测

### Security Considerations
1. **路径验证**: 所有文件路径必须在项目根目录内
2. **输入清理**: 拒绝包含 `..` 序列的路径
3. **参数数组**: CLI 命令使用参数数组而非字符串拼接,防止命令注入

---

## Command Interface Template

每个命令合约文档包含以下部分:

1. **Command**: 命令名称和语法
2. **Description**: 命令功能描述
3. **Arguments**: 位置参数
4. **Options**: 命名选项/标志
5. **Input Schema**: JSON Schema (如适用)
6. **Output**: 标准输出和 JSON 输出格式
7. **Exit Codes**: 特定于命令的退出码
8. **Examples**: 使用示例
9. **Security**: 安全考虑

---

## Next Steps

- ✅ 创建 contracts/ 目录结构
- ⏳ 定义每个 CLI 命令的详细合约
- ⏳ 生成 quickstart.md
- ⏳ 更新 Agent 上下文

---

**Contracts Directory Created**: 2025-11-19
