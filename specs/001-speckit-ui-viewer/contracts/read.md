# CLI Contract: `read`

## Command
```bash
speckit-ui read <file-path> [options]
```

## Description
读取指定文件的内容,返回文件元数据和内容。

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `file-path` | string | ✅ | 文件相对路径 (相对于项目根目录) |

## Options

| Option | Alias | Type | Description | Default |
|--------|-------|------|-------------|---------|
| `--json` | | boolean | JSON 格式输出 | `false` |
| `--with-comments` | `-c` | boolean | 包含关联的评论 | `false` |

## Output

### JSON Output (`--json`)
**成功响应**:
```json
{
  "success": true,
  "data": {
    "path": "/absolute/path/to/project/specs/001-feature/spec.md",
    "relativePath": "specs/001-feature/spec.md",
    "name": "spec.md",
    "content": "# Feature Specification\n\n...",
    "lastModified": "2025-11-19T10:30:00.000Z",
    "size": 15234,
    "lineCount": 345,
    "comments": []
  }
}
```

**With Comments (`--with-comments`)**:
```json
{
  "success": true,
  "data": {
    "path": "/absolute/path/to/project/specs/001-feature/spec.md",
    "relativePath": "specs/001-feature/spec.md",
    "name": "spec.md",
    "content": "# Feature Specification\n\n...",
    "lastModified": "2025-11-19T10:30:00.000Z",
    "size": 15234,
    "lineCount": 345,
    "comments": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "anchor": {
          "startLine": 42,
          "endLine": 42,
          "textFragment": "系统必须在没有传统后端服务器的情况下运行"
        },
        "content": "这个设计很好",
        "author": "张三",
        "createdAt": "2025-11-19T10:30:00.000Z",
        "status": "open"
      }
    ]
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "文件不存在: specs/001-feature/missing.md",
    "details": {
      "path": "specs/001-feature/missing.md",
      "absolutePath": "/absolute/path/to/project/specs/001-feature/missing.md"
    }
  }
}
```

## Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | 成功 | 文件读取成功 |
| `1` | 通用错误 | 文件不存在、权限错误等 |
| `2` | 参数错误 | 缺少 file-path 参数 |
| `3` | 验证错误 | 路径遍历检测、文件不在项目目录内 |

## Security
- 拒绝包含 `..` 序列的路径
- 验证文件路径在项目根目录内

---

**Contract Version**: 1.0
**Last Updated**: 2025-11-19
