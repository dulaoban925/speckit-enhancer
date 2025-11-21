# CLI Contract: `serve`

## Command
```bash
speckit-ui serve [project-path] [options]
```

## Description
启动本地开发服务器,提供 Spec-Kit UI 的 Web 界面访问。

## Arguments

| Argument | Type | Required | Description | Default |
|----------|------|----------|-------------|---------|
| `project-path` | string | ❌ | 项目根目录路径 | 当前工作目录 (`.`) |

## Options

| Option | Alias | Type | Description | Default |
|--------|-------|------|-------------|---------|
| `--port` | `-p` | number | 服务端口 | `3000` |
| `--host` | `-h` | string | 服务主机 | `localhost` |
| `--no-open` | | boolean | 不自动打开浏览器 | `false` (会自动打开) |
| `--verbose` | `-v` | boolean | 详细日志输出 | `false` |
| `--json` | | boolean | JSON 格式输出 | `false` |

## Output

### Standard Output (默认)
```
✓ 项目验证成功: Spec-Kit UI (/path/to/project)
✓ 端口 3000 可用,服务已启动
→ 本地访问: http://localhost:3000
→ 按 Ctrl+C 停止服务
```

### Standard Output (端口冲突)
```
✗ 端口 3000 已被占用,尝试 3001...
✓ 端口 3001 可用,服务已启动
→ 本地访问: http://localhost:3001
→ 按 Ctrl+C 停止服务
```

### JSON Output (`--json`)
**成功响应**:
```json
{
  "success": true,
  "data": {
    "projectPath": "/absolute/path/to/project",
    "projectName": "Spec-Kit UI",
    "host": "localhost",
    "port": 3001,
    "url": "http://localhost:3001",
    "portChanged": true,
    "requestedPort": 3000
  },
  "message": "服务已启动"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PROJECT",
    "message": "项目目录无效: 缺少 .specify/ 或 specs/ 目录",
    "details": {
      "path": "/path/to/invalid/project",
      "checkedPaths": [
        "/path/to/invalid/project/.specify",
        "/path/to/invalid/project/specs"
      ]
    }
  }
}
```

## Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | 成功 | 服务成功启动 (通常不会退出,除非用户按 Ctrl+C) |
| `1` | 通用错误 | 文件系统错误、权限错误等 |
| `2` | 参数错误 | 无效的端口号、路径格式错误等 |
| `3` | 验证错误 | 项目目录无效、无法找到可用端口等 |

## Validation Rules

1. **项目路径验证**:
   - 路径必须存在且为目录
   - 必须包含 `.specify/` 或 `specs/` 目录之一
   - 路径不能包含 `..` 序列

2. **端口验证**:
   - 端口范围: 1024-65535
   - 自动尝试下一个端口 (最多 10 次)
   - 如果 10 次尝试后仍无可用端口,返回错误

3. **主机验证**:
   - 必须是有效的 hostname 或 IP 地址

## Error Scenarios

### 错误 1: 项目目录无效
**Input**:
```bash
speckit-ui serve /path/to/invalid/project
```

**Output**:
```
✗ 项目目录无效: 缺少 .specify/ 或 specs/ 目录
  检查路径: /path/to/invalid/project

提示: 请确保在包含 Spec-Kit 项目的目录中运行此命令。
有效的项目目录应包含以下之一:
  - .specify/ 目录 (宪章和配置)
  - specs/ 目录 (规格文档)
```

**Exit Code**: `3`

### 错误 2: 无法找到可用端口
**Input**:
```bash
speckit-ui serve --port 3000
```

**Output** (假设 3000-3009 全部被占用):
```
✗ 端口 3000 已被占用,尝试 3001...
✗ 端口 3001 已被占用,尝试 3002...
...
✗ 端口 3009 已被占用

错误: 无法找到可用端口 (尝试了 3000-3009)

建议:
  1. 使用 --port 指定其他端口范围 (如 --port 4000)
  2. 关闭占用端口的其他进程
```

**Exit Code**: `3`

### 错误 3: 权限不足
**Input**:
```bash
speckit-ui serve /root/restricted/project
```

**Output**:
```
✗ 权限错误: 无法访问项目目录
  路径: /root/restricted/project
  错误: EACCES: permission denied

提示: 请使用 sudo 或更改目录权限
```

**Exit Code**: `1`

## Examples

### 示例 1: 默认配置启动
```bash
speckit-ui serve
```
- 使用当前目录作为项目路径
- 端口 3000
- 自动打开浏览器

### 示例 2: 指定项目路径和端口
```bash
speckit-ui serve /path/to/project --port 8080
```
- 使用指定路径
- 端口 8080
- 自动打开浏览器

### 示例 3: 不打开浏览器,详细日志
```bash
speckit-ui serve --no-open --verbose
```
- 不自动打开浏览器
- 输出详细日志 (包括文件扫描、路由注册等)

### 示例 4: JSON 输出 (用于脚本)
```bash
speckit-ui serve --json
```
输出 JSON 格式,便于脚本解析

## Security Considerations

1. **路径遍历防护**:
   - 拒绝包含 `..` 序列的路径
   - 将所有路径解析为绝对路径并验证在允许范围内

2. **端口绑定安全**:
   - 默认仅绑定 localhost,不暴露到外网
   - 如果用户指定 `--host 0.0.0.0`,输出警告提示

3. **CORS 限制**:
   - 开发服务器默认仅允许 localhost 源
   - 不允许跨域访问 (除非明确配置)

## Implementation Notes

- 使用 Vite 的开发服务器提供前端资源
- 使用 Node.js `net` 模块检测端口可用性
- 使用 `fs.access()` 验证项目目录权限
- 使用 `open` 包打开浏览器 (支持跨平台)

---

**Contract Version**: 1.0
**Last Updated**: 2025-11-19
