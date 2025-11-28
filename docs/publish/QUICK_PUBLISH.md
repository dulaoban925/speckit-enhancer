# 快速发布参考

## 🚀 常用命令

```bash
# 📦 发布补丁版本（Bug 修复）
./scripts/publish.sh patch

# ✨ 发布次要版本（新功能）
./scripts/publish.sh minor

# 💥 发布主要版本（破坏性变更）
./scripts/publish.sh major

# 🧪 测试运行（推荐先测试）
./scripts/publish.sh patch --dry-run
```

## 📝 标准发布流程

```bash
# 1. 提交所有更改
git add .
git commit -m "feat: 添加新功能"

# 2. 测试发布流程
./scripts/publish.sh patch --dry-run

# 3. 实际发布
./scripts/publish.sh patch

# 4. 验证发布
npm view @superying/speckit-enhancer-cli version
```

## 🔍 脚本会做什么？

1. ✅ 检查 Git 状态
2. ✅ 更新版本号（CLI + Dashboard）
3. ✅ 运行构建测试
4. ✅ 构建整个项目
5. ✅ 验证构建产物
6. ✅ 发布到 npm
7. ✅ 推送代码和标签

## 💡 提示

- 首次发布需要先登录：`cd cli && npm login`
- 发布需要 2-5 分钟才能在 npm 上生效
- 使用 `--dry-run` 可以安全测试
- 详细文档见 [PUBLISH_SCRIPT_README.md](./PUBLISH_SCRIPT_README.md)
