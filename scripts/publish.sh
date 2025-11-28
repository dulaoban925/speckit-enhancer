#!/bin/bash

# Speckit Enhancer 一键发布脚本
# 使用方法:
#   ./scripts/publish.sh patch              # 补丁版本 (1.0.0 → 1.0.1)
#   ./scripts/publish.sh minor              # 次要版本 (1.0.0 → 1.1.0)
#   ./scripts/publish.sh major              # 主要版本 (1.0.0 → 2.0.0)
#   ./scripts/publish.sh 1.2.3              # 指定版本号
#   ./scripts/publish.sh patch --dry-run    # 测试运行（不实际发布）
#   ./scripts/publish.sh patch --skip-git   # 跳过 git 操作

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 辅助函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查参数
if [ -z "$1" ]; then
    log_error "缺少版本参数！"
    echo ""
    echo "使用方法:"
    echo "  ./scripts/publish.sh patch              # 补丁版本 (1.0.0 → 1.0.1)"
    echo "  ./scripts/publish.sh minor              # 次要版本 (1.0.0 → 1.1.0)"
    echo "  ./scripts/publish.sh major              # 主要版本 (1.0.0 → 2.0.0)"
    echo "  ./scripts/publish.sh 1.2.3              # 指定版本号"
    echo ""
    echo "可选参数:"
    echo "  --dry-run       测试运行（不实际发布）"
    echo "  --skip-git      跳过 git 操作"
    echo "  --skip-tests    跳过测试"
    echo "  --no-publish    只构建不发布"
    exit 1
fi

VERSION_TYPE=$1
DRY_RUN=false
SKIP_GIT=false
SKIP_TESTS=false
NO_PUBLISH=false

# 解析可选参数
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-git)
            SKIP_GIT=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --no-publish)
            NO_PUBLISH=true
            shift
            ;;
    esac
done

if [ "$DRY_RUN" = true ]; then
    log_warning "🧪 测试模式：不会实际发布到 npm"
fi

# 获取项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo ""
log_info "=================================================="
log_info "  Speckit Enhancer 一键发布脚本"
log_info "=================================================="
echo ""

# 步骤 1: 检查工作目录状态
log_info "步骤 1/8: 检查 Git 工作目录状态..."

if [ "$SKIP_GIT" = false ]; then
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "工作目录有未提交的更改！"
        git status --short
        echo ""
        read -p "是否继续？(y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "发布已取消"
            exit 1
        fi
    else
        log_success "工作目录干净"
    fi
else
    log_warning "跳过 Git 检查"
fi

# 步骤 2: 获取当前版本
log_info "步骤 2/8: 获取当前版本..."

CURRENT_VERSION=$(node -p "require('./cli/package.json').version")
log_info "当前版本: $CURRENT_VERSION"

# 步骤 3: 计算新版本
log_info "步骤 3/8: 计算新版本号..."

# 判断是否是指定版本号
if [[ "$VERSION_TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    NEW_VERSION=$VERSION_TYPE
else
    # 使用 npm version 计算新版本（不实际修改文件）
    cd cli
    NEW_VERSION=$(npm version --no-git-tag-version "$VERSION_TYPE" | tail -n 1)
    # 恢复原来的版本（临时计算）
    npm version --no-git-tag-version "$CURRENT_VERSION" > /dev/null 2>&1
    cd ..
    # 移除 v 前缀
    NEW_VERSION=${NEW_VERSION#v}
fi

log_success "新版本: $NEW_VERSION"
echo ""

# 步骤 4: 确认发布
if [ "$DRY_RUN" = false ]; then
    log_warning "即将发布版本: $CURRENT_VERSION → $NEW_VERSION"
    read -p "确认继续？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "发布已取消"
        exit 1
    fi
fi

# 步骤 5: 更新版本号
log_info "步骤 4/8: 更新版本号..."

# 更新 CLI package.json
log_info "更新 cli/package.json..."
cd cli
if [ "$SKIP_GIT" = true ]; then
    npm version --no-git-tag-version "$NEW_VERSION" > /dev/null
else
    npm version "$NEW_VERSION" > /dev/null
fi
cd ..

# 更新 Dashboard package.json（保持同步）
log_info "更新 dashboard/package.json..."
cd dashboard
npm version --no-git-tag-version "$NEW_VERSION" > /dev/null
cd ..

log_success "版本号已更新为: $NEW_VERSION"

# 步骤 6: 运行测试
if [ "$SKIP_TESTS" = false ]; then
    log_info "步骤 5/8: 运行测试..."

    log_info "测试 Dashboard..."
    cd dashboard
    npm run build > /dev/null 2>&1 || {
        log_error "Dashboard 构建失败！"
        exit 1
    }
    cd ..

    log_success "测试通过"
else
    log_warning "跳过测试"
fi

# 步骤 7: 构建项目
log_info "步骤 6/8: 构建项目..."

./scripts/build.sh

log_success "构建完成"

# 步骤 8: 验证构建产物
log_info "步骤 7/8: 验证构建产物..."

# 检查必需文件
if [ ! -f "cli/public/index.html" ]; then
    log_error "缺少 cli/public/index.html！"
    exit 1
fi

if [ ! -d "cli/public/assets" ]; then
    log_error "缺少 cli/public/assets/ 目录！"
    exit 1
fi

if [ ! -f "cli/dist/index.js" ]; then
    log_error "缺少 cli/dist/index.js！"
    exit 1
fi

# 显示文件大小统计
log_info "构建产物统计:"
echo "  - cli/dist:    $(du -sh cli/dist | cut -f1)"
echo "  - cli/public:  $(du -sh cli/public | cut -f1)"

log_success "构建产物验证通过"

# 步骤 9: 本地测试（可选）
log_info "步骤 8/8: 发布..."

if [ "$DRY_RUN" = true ]; then
    log_info "执行 dry-run 测试..."
    cd cli
    npm pack --dry-run
    cd ..
    log_success "Dry-run 测试完成"
elif [ "$NO_PUBLISH" = true ]; then
    log_warning "跳过发布（--no-publish 参数）"
else
    # 实际发布
    log_info "发布到 npm..."
    cd cli
    npm publish
    cd ..
    log_success "已发布到 npm: @superying/speckit-enhancer-cli@$NEW_VERSION"
fi

# 步骤 10: 推送代码和标签
if [ "$SKIP_GIT" = false ] && [ "$DRY_RUN" = false ]; then
    log_info "推送代码和标签到远程仓库..."

    # 添加 dashboard/package.json 的更改
    git add dashboard/package.json
    git commit --amend --no-edit

    git push origin $(git rev-parse --abbrev-ref HEAD)
    git push origin --tags

    log_success "代码和标签已推送"
else
    if [ "$SKIP_GIT" = true ]; then
        log_warning "跳过 Git 推送"
    fi
    if [ "$DRY_RUN" = true ]; then
        log_info "Dry-run 模式下不推送 Git"
    fi
fi

# 完成
echo ""
log_info "=================================================="
log_success "🎉 发布流程完成！"
log_info "=================================================="
echo ""

if [ "$DRY_RUN" = false ] && [ "$NO_PUBLISH" = false ]; then
    log_info "版本信息:"
    echo "  - 包名: @superying/speckit-enhancer-cli"
    echo "  - 版本: $NEW_VERSION"
    echo "  - 标签: v$NEW_VERSION"
    echo ""
    log_info "安装命令:"
    echo "  npm install -g @superying/speckit-enhancer-cli@$NEW_VERSION"
    echo ""
    log_info "验证命令:"
    echo "  ske --version"
    echo ""
    log_warning "注意: npm 同步可能需要几分钟"
fi

if [ "$DRY_RUN" = true ]; then
    log_warning "这是一次测试运行，未实际发布"
    echo ""
    log_info "要实际发布，运行:"
    echo "  ./scripts/publish.sh $VERSION_TYPE"
fi
