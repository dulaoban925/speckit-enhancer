#!/bin/bash

# 构建脚本 - 用于发布前构建整个项目
# 使用方法: ./scripts/build.sh

set -e  # 遇到错误立即退出

echo "🚀 开始构建 Speckit Enhancer..."

# 1. 清理旧的构建文件
echo "📦 清理旧的构建文件..."
rm -rf cli/dist
rm -rf dashboard/dist

# 2. 构建 Dashboard (前端)
echo "🎨 构建 Dashboard..."
cd dashboard
npm run build:prod
cd ..

# 3. 复制 Dashboard 静态文件到 CLI
echo "📋 复制 Dashboard 静态文件到 CLI..."
mkdir -p cli/public
cp -r dashboard/dist/* cli/public/

# 4. 构建 CLI
echo "⚙️ 构建 CLI..."
cd cli
npm run build
cd ..

echo "✅ 构建完成！"
echo ""
echo "构建产物："
echo "  - cli/dist/        CLI 可执行文件"
echo "  - cli/public/      Dashboard 静态文件（已内嵌）"
echo ""
echo "发布命令："
echo "  cd cli && npm publish"
