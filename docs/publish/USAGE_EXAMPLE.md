# 发布脚本使用演示

## 📝 场景 1：修复了一个 Bug，发布补丁版本

### 步骤 1：提交代码

```bash
# 在项目根目录
cd /path/to/speckit-enhancer

# 提交修复
git add .
git commit -m "fix: 修复 dashboard 构建时的类型错误"
```

### 步骤 2：测试发布（推荐）

```bash
# 使用 dry-run 测试发布流程
./scripts/publish.sh patch --dry-run
```

**输出示例：**
```
ℹ️  ==================================================
ℹ️    Speckit Enhancer 一键发布脚本
ℹ️  ==================================================

ℹ️  步骤 1/8: 检查 Git 工作目录状态...
✅ 工作目录干净

ℹ️  步骤 2/8: 获取当前版本...
ℹ️  当前版本: 1.0.6

ℹ️  步骤 3/8: 计算新版本号...
✅ 新版本: 1.0.7

⚠️  即将发布版本: 1.0.6 → 1.0.7
确认继续？(y/N)
```

### 步骤 3：实际发布

```bash
# 确认无误后，实际发布
./scripts/publish.sh patch
```

**完整输出：**
```
ℹ️  ==================================================
ℹ️    Speckit Enhancer 一键发布脚本
ℹ️  ==================================================

ℹ️  步骤 1/8: 检查 Git 工作目录状态...
✅ 工作目录干净

ℹ️  步骤 2/8: 获取当前版本...
ℹ️  当前版本: 1.0.6

ℹ️  步骤 3/8: 计算新版本号...
✅ 新版本: 1.0.7

⚠️  即将发布版本: 1.0.6 → 1.0.7
确认继续？(y/N) y

ℹ️  步骤 4/8: 更新版本号...
ℹ️  更新 cli/package.json...
ℹ️  更新 dashboard/package.json...
✅ 版本号已更新为: 1.0.7

ℹ️  步骤 5/8: 运行测试...
ℹ️  测试 Dashboard...
✅ 测试通过

ℹ️  步骤 6/8: 构建项目...
🚀 开始构建 Speckit Enhancer...
📦 清理旧的构建文件...
🎨 构建 Dashboard...
📋 复制 Dashboard 静态文件到 CLI...
⚙️  构建 CLI...
✅ 构建完成！
✅ 构建完成

ℹ️  步骤 7/8: 验证构建产物...
ℹ️  构建产物统计:
  - cli/dist:    245K
  - cli/public:  1.2M
✅ 构建产物验证通过

ℹ️  步骤 8/8: 发布...
ℹ️  发布到 npm...
npm notice 📦  @superying/speckit-enhancer-cli@1.0.7
npm notice === Tarball Contents ===
npm notice 1.2kB  package.json
npm notice 3.4kB  README.md
npm notice 245kB  dist/
npm notice 1.2MB  public/
npm notice === Tarball Details ===
npm notice name:          @superying/speckit-enhancer-cli
npm notice version:       1.0.7
npm notice package size:  450kB
npm notice unpacked size: 1.5MB
npm notice total files:   127
✅ 已发布到 npm: @superying/speckit-enhancer-cli@1.0.7

ℹ️  推送代码和标签到远程仓库...
✅ 代码和标签已推送

ℹ️  ==================================================
✅ 🎉 发布流程完成！
ℹ️  ==================================================

ℹ️  版本信息:
  - 包名: @superying/speckit-enhancer-cli
  - 版本: 1.0.7
  - 标签: v1.0.7

ℹ️  安装命令:
  npm install -g @superying/speckit-enhancer-cli@1.0.7

ℹ️  验证命令:
  ske --version

⚠️  注意: npm 同步可能需要几分钟
```

### 步骤 4：验证发布

```bash
# 等待 2-5 分钟后
npm view @superying/speckit-enhancer-cli version
# 输出: 1.0.7

# 全局安装测试
npm install -g @superying/speckit-enhancer-cli

# 验证版本
ske --version
# 输出: 1.0.7

# 测试功能
ske dashboard --help
```

---

## 📝 场景 2：添加新功能，发布次要版本

```bash
# 1. 提交代码
git add .
git commit -m "feat: 添加 Dashboard 统计面板"

# 2. 发布次要版本
./scripts/publish.sh minor

# 版本变更: 1.0.7 → 1.1.0
```

---

## 📝 场景 3：破坏性变更，发布主要版本

```bash
# 1. 提交代码
git add .
git commit -m "feat!: 重构 CLI 命令结构（破坏性变更）"

# 2. 发布主要版本
./scripts/publish.sh major

# 版本变更: 1.1.0 → 2.0.0
```

---

## 📝 场景 4：指定具体版本号

```bash
# 直接指定版本号
./scripts/publish.sh 1.2.3

# 版本变更: 当前版本 → 1.2.3
```

---

## 📝 场景 5：只构建不发布（准备发布）

```bash
# 适用于想先验证构建，稍后再发布
./scripts/publish.sh patch --no-publish

# 会执行：
# ✅ 更新版本号
# ✅ 运行测试
# ✅ 构建项目
# ✅ 验证构建产物

# 不会执行：
# ❌ 发布到 npm
# ❌ 推送到 Git

# 稍后手动发布
cd cli
npm publish
cd ..
git push origin main
git push origin --tags
```

---

## 📝 场景 6：CI/CD 自动发布

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  push:
    branches: [main]
    paths:
      - 'cli/**'
      - 'dashboard/**'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: |
          npm install
          cd cli && npm install
          cd ../dashboard && npm install

      - name: Publish
        run: ./scripts/publish.sh patch --skip-git
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 🎯 最佳实践示例

### 发布前检查清单

```bash
# 1. 确保所有代码已提交
git status

# 2. 确保在主分支
git branch --show-current
# 应该输出: main 或 master

# 3. 拉取最新代码
git pull origin main

# 4. 运行测试
cd dashboard && npm test
cd ../cli && npm test

# 5. 测试发布流程
cd ..
./scripts/publish.sh patch --dry-run

# 6. 实际发布
./scripts/publish.sh patch
```

### 发布后验证

```bash
# 1. 检查 npm
npm view @superying/speckit-enhancer-cli version

# 2. 检查 Git 标签
git tag -l | tail -5

# 3. 检查远程仓库
git log origin/main -5 --oneline

# 4. 全局测试
npm install -g @superying/speckit-enhancer-cli
ske --version
ske dashboard --help
```

---

## ⚠️  常见问题处理

### 问题 1：发布失败 - npm 认证错误

```bash
# 错误信息
npm ERR! code ENEEDAUTH
npm ERR! need auth This command requires you to be logged in.

# 解决方案
cd cli
npm login
# 输入用户名、密码和邮箱

# 重新发布
cd ..
./scripts/publish.sh patch
```

### 问题 2：版本号已更新但发布失败

```bash
# 情况：版本号已经从 1.0.6 变成 1.0.7，但 npm publish 失败

# 不要重新运行脚本！
# 方案 1：手动发布
cd cli
npm publish
cd ..
git push origin main
git push origin --tags

# 方案 2：如果想回退版本号
git reset --hard HEAD~1
git tag -d v1.0.7
# 然后重新运行脚本
```

### 问题 3：构建失败

```bash
# 错误信息
❌ Dashboard 构建失败！

# 解决方案
# 1. 手动测试构建
cd dashboard
npm run build

# 2. 查看错误信息并修复
# 3. 提交修复
git add .
git commit -m "fix: 修复构建错误"

# 4. 重新发布
cd ..
./scripts/publish.sh patch
```

---

## 💡 高级技巧

### 技巧 1：同时发布多个包

```bash
# 如果项目包含多个包，可以扩展脚本
# 例如：同时发布 cli 和 dashboard

# 创建自定义脚本 publish-all.sh
#!/bin/bash
./scripts/publish.sh patch
cd dashboard
npm publish
cd ..
```

### 技巧 2：自动生成 CHANGELOG

```bash
# 在 publish.sh 中添加 CHANGELOG 生成
# 可以集成 conventional-changelog

npm install -g conventional-changelog-cli
conventional-changelog -p angular -i CHANGELOG.md -s
git add CHANGELOG.md
git commit --amend --no-edit
```

### 技巧 3：发布前运行 lint

```bash
# 在发布前检查代码质量
./scripts/publish.sh patch

# 修改脚本添加 lint 步骤：
# npm run lint
```

---

**最后更新：** 2025-11-28
