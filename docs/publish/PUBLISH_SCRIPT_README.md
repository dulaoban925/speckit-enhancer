# 一键发布脚本使用指南

## 📦 快速使用

### 基本用法

```bash
# 补丁版本（Bug 修复）
./scripts/publish.sh patch

# 次要版本（新功能）
./scripts/publish.sh minor

# 主要版本（破坏性变更）
./scripts/publish.sh major

# 指定具体版本
./scripts/publish.sh 1.2.3
```

### 高级选项

```bash
# 测试运行（不实际发布）
./scripts/publish.sh patch --dry-run

# 跳过 Git 操作
./scripts/publish.sh patch --skip-git

# 跳过测试
./scripts/publish.sh patch --skip-tests

# 只构建不发布
./scripts/publish.sh patch --no-publish

# 组合使用
./scripts/publish.sh minor --dry-run --skip-tests
```

## 🔄 脚本流程

脚本会自动执行以下步骤：

1. **检查 Git 状态** - 确保工作目录干净
2. **获取当前版本** - 读取 `cli/package.json`
3. **计算新版本** - 根据参数计算新版本号
4. **确认发布** - 显示版本变更，等待用户确认
5. **更新版本号** - 同时更新 CLI 和 Dashboard 的版本
6. **运行测试** - 执行构建测试确保质量
7. **构建项目** - 执行 `./scripts/build.sh`
8. **验证产物** - 检查必需文件是否存在
9. **发布到 npm** - 执行 `npm publish`
10. **推送代码和标签** - 推送到远程仓库

## 📋 版本号规则

### 语义化版本（Semantic Versioning）

版本格式：`主版本.次版本.补丁版本` (例如：`1.2.3`)

| 类型 | 命令 | 变更示例 | 适用场景 |
|-----|------|---------|---------|
| **patch** | `./scripts/publish.sh patch` | `1.0.0` → `1.0.1` | Bug 修复、文档更新、性能优化 |
| **minor** | `./scripts/publish.sh minor` | `1.0.0` → `1.1.0` | 新增功能、向后兼容的改进 |
| **major** | `./scripts/publish.sh major` | `1.0.0` → `2.0.0` | 破坏性变更、API 重大调整 |
| **指定版本** | `./scripts/publish.sh 1.2.3` | 任意 → `1.2.3` | 手动指定版本号 |

## 🎯 使用场景

### 场景 1：修复了一个 Bug

```bash
# 1. 确保代码已提交
git add .
git commit -m "fix: 修复文件监听的类型错误"

# 2. 发布补丁版本
./scripts/publish.sh patch

# 版本变更: 1.0.6 → 1.0.7
```

### 场景 2：添加了新功能

```bash
# 1. 确保代码已提交
git add .
git commit -m "feat: 添加 Dashboard 统计面板"

# 2. 发布次要版本
./scripts/publish.sh minor

# 版本变更: 1.0.6 → 1.1.0
```

### 场景 3：重大 API 变更

```bash
# 1. 确保代码已提交
git add .
git commit -m "feat!: 重构 CLI 命令结构"

# 2. 发布主要版本
./scripts/publish.sh major

# 版本变更: 1.0.6 → 2.0.0
```

### 场景 4：测试发布流程

```bash
# 测试运行，不实际发布
./scripts/publish.sh patch --dry-run

# 查看会执行的操作，但不会：
# - 发布到 npm
# - 推送到 git
```

### 场景 5：只构建不发布

```bash
# 适用于准备发布但暂时不想上传到 npm
./scripts/publish.sh patch --no-publish

# 会执行：
# - 更新版本号
# - 构建项目
# - 验证构建产物

# 不会执行：
# - 发布到 npm
```

## ⚙️ 脚本工作原理

### 版本号更新

脚本会同时更新两个 `package.json`：

1. **cli/package.json** - 使用 `npm version` 命令（会创建 git tag）
2. **dashboard/package.json** - 使用 `--no-git-tag-version` 标志（不创建额外 tag）

```bash
# CLI 版本（会创建 tag）
cd cli && npm version 1.0.7

# Dashboard 版本（不创建 tag）
cd dashboard && npm version --no-git-tag-version 1.0.7
```

### Git 标签

脚本会自动创建格式为 `v1.0.7` 的 Git 标签，并推送到远程仓库。

### 构建流程

脚本内部调用 `./scripts/build.sh`，执行：

1. 清理旧构建文件
2. 构建 Dashboard → `dashboard/dist/`
3. 复制到 CLI → `cli/public/`
4. 构建 CLI → `cli/dist/`

### 构建产物验证

脚本会检查以下文件是否存在：

- ✅ `cli/public/index.html` - Dashboard 入口文件
- ✅ `cli/public/assets/` - Dashboard 静态资源
- ✅ `cli/dist/index.js` - CLI 入口文件

## 🚨 常见问题

### Q: 如果发布失败怎么办？

如果在 `npm publish` 阶段失败：

```bash
# 1. 检查是否已登录 npm
npm whoami

# 2. 如果未登录，先登录
cd cli && npm login

# 3. 手动发布
npm publish

# 4. 如果成功，手动推送 git
git push origin main
git push origin --tags
```

### Q: 如何撤销发布？

如果刚发布就发现问题：

```bash
# 1. 取消发布（仅在发布后 72 小时内有效）
npm unpublish @superying/speckit-enhancer-cli@1.0.7

# 2. 修复问题后重新发布
./scripts/publish.sh patch
```

**注意**：npm 不推荐撤销发布，最好的做法是快速发布一个修复版本。

### Q: 如何查看会发布哪些文件？

```bash
# 使用 dry-run 模式
cd cli
npm pack --dry-run

# 或者实际打包查看
npm pack
tar -tzf speckit-enhancer-cli-*.tgz
```

### Q: 版本号更新了但想回退？

如果还没发布到 npm：

```bash
# 1. 回退 Git 提交和标签
git reset --hard HEAD~1
git tag -d v1.0.7
git push origin --delete v1.0.7

# 2. 手动修改 package.json 版本号
# 编辑 cli/package.json 和 dashboard/package.json
```

### Q: 如何在 CI/CD 中使用这个脚本？

```bash
# GitHub Actions 示例
- name: Publish to npm
  run: |
    ./scripts/publish.sh patch --skip-git
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📊 发布检查清单

在发布前，确保：

- [ ] 所有代码已提交到 Git
- [ ] 本地测试通过（`npm run build` 无错误）
- [ ] 更新了 CHANGELOG.md（如果有）
- [ ] 版本号选择正确（patch/minor/major）
- [ ] 已登录 npm（`npm whoami` 检查）
- [ ] 网络连接正常

## 🔐 权限要求

### npm 权限

发布需要以下权限：

```bash
# 检查是否有发布权限
npm access ls-packages

# 检查包的访问权限
npm access ls-collaborators @superying/speckit-enhancer-cli
```

### Git 权限

需要有推送权限到远程仓库。

## 💡 最佳实践

### 1. 发布前测试

```bash
# 始终先进行 dry-run
./scripts/publish.sh patch --dry-run

# 检查输出是否符合预期
```

### 2. 使用正确的版本类型

- 🐛 Bug 修复 → `patch`
- ✨ 新功能 → `minor`
- 💥 破坏性变更 → `major`

### 3. 遵循 Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```bash
fix: 修复类型错误
feat: 添加新功能
feat!: 破坏性变更
docs: 更新文档
chore: 构建配置
```

### 4. 发布后验证

```bash
# 等待 npm 同步（通常 2-5 分钟）
npm view @superying/speckit-enhancer-cli version

# 全局安装测试
npm install -g @superying/speckit-enhancer-cli

# 验证版本
ske --version

# 测试功能
ske dashboard --help
```

## 📚 相关资源

- [PUBLISHING_GUIDE.md](../PUBLISHING_GUIDE.md) - 完整发布指南
- [快速发布参考](./QUICK_PUBLISH.md) - 常用命令速查表
- [使用示例](./USAGE_EXAMPLE.md) - 实际使用场景演示
- [build.sh](../../scripts/build.sh) - 构建脚本
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [npm 发布文档](https://docs.npmjs.com/cli/v8/commands/npm-publish)

---

**最后更新：** 2025-11-28
