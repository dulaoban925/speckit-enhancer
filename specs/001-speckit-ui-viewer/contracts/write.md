# CLI Contract: `write`

## Command
```bash
speckit-ui write <file-path> [options]
```

## Description
写入内容到指定文件,支持从 stdin 或 `--content` 参数接收内容。

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `file-path` | string | ✅ | 文件相对路径 (相对于项目根目录) |

## Options

| Option | Alias | Type | Description | Default |
|--------|-------|------|-------------|---------|
| `--content` | `-c` | string | 文件内容 (如不指定,从 stdin 读取) | - |
| `--json` | | boolean | JSON 格式输出 | `false` |
| `--create-dirs` | | boolean | 自动创建父目录 | `false` |

## Input

### Via stdin
```bash
echo "# New Content" | speckit-ui write specs/001-feature/spec.md
```

### Via --content
```bash
speckit-ui write specs/001-feature/spec.md --content "# New Content"
```

## Output

### JSON Output (`--json`)
**成功响应**:
```json
{
  "success": true,
  "data": {
    "path": "/absolute/path/to/project/specs/001-feature/spec.md",
    "relativePath": "specs/001-feature/spec.md",
    "bytesWritten": 1234,
    "lastModified": "2025-11-19T12:00:00.000Z"
  },
  "message": "文件写入成功"
}
```

**错误响应 (冲突)**:
```json
{
  "success": false,
  "error": {
    "code": "FILE_MODIFIED_EXTERNALLY",
    "message": "文件在写入前被外部程序修改",
    "details": {
      "path": "specs/001-feature/spec.md",
      "lastKnownModified": "2025-11-19T11:00:00.000Z",
      "currentModified": "2025-11-19T11:30:00.000Z"
    }
  }
}
```

## Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | 成功 | 文件写入成功 |
| `1` | 通用错误 | 权限错误、磁盘空间不足等 |
| `2` | 参数错误 | 缺少 file-path 参数或内容 |
| `3` | 验证错误 | 路径遍历检测、父目录不存在 |

## Security
- 拒绝包含 `..` 序列的路径
- 验证文件路径在项目根目录内
- 检测文件修改冲突 (比较 mtime)

---

**Contract Version**: 1.0
**Last Updated**: 2025-11-19
