# CLI Contract: `list`

## Command
```bash
speckit-ui list [project-path] [options]
```

## Description
列出项目的完整文档结构,包括所有特性、节点和文档文件。

## Arguments

| Argument | Type | Required | Description | Default |
|----------|------|----------|-------------|---------|
| `project-path` | string | ❌ | 项目根目录路径 | 当前工作目录 (`.`) |

## Options

| Option | Alias | Type | Description | Default |
|--------|-------|------|-------------|---------|
| `--json` | | boolean | JSON 格式输出 | `false` |

## Output

### JSON Output (`--json`)
```json
{
  "success": true,
  "data": {
    "project": {
      "rootPath": "/absolute/path/to/project",
      "name": "Spec-Kit UI",
      "constitution": {
        "path": "/absolute/path/to/project/.specify/memory/constitution.md",
        "exists": true
      }
    },
    "features": [
      {
        "id": "001",
        "name": "speckit-ui-viewer",
        "displayName": "Spec-Kit UI Viewer",
        "status": "in-progress",
        "nodes": [
          {
            "name": "specification",
            "displayName": "规格",
            "icon": "📋",
            "documents": [
              {
                "name": "spec.md",
                "relativePath": "specs/001-speckit-ui-viewer/spec.md",
                "size": 15234,
                "lastModified": "2025-11-19T10:30:00.000Z"
              }
            ]
          },
          {
            "name": "plan",
            "displayName": "计划",
            "icon": "🗓️",
            "documents": [
              {
                "name": "plan.md",
                "relativePath": "specs/001-speckit-ui-viewer/plan.md",
                "size": 8567,
                "lastModified": "2025-11-19T11:00:00.000Z"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | 成功 | 列表生成成功 |
| `1` | 通用错误 | 文件系统错误等 |
| `3` | 验证错误 | 项目目录无效 |

---

**Contract Version**: 1.0
**Last Updated**: 2025-11-19
