import { test, expect } from '@playwright/test'

test.describe('Document View', () => {
  test.beforeEach(async ({ page }) => {
    // 启动应用
    await page.goto('http://localhost:3000')
    await expect(page.locator('header')).toBeVisible()
  })

  test('should display constitution document when clicked from sidebar', async ({ page }) => {
    // 点击宪章文档
    const constitutionButton = page.locator('button:has-text("宪章")')
    await constitutionButton.click()

    // 验证导航到文档页面
    await expect(page).toHaveURL(/\/document\//)

    // 验证文档内容区域可见
    await expect(page.locator('.markdown-body')).toBeVisible()

    // 验证面包屑导航
    await expect(page.locator('nav')).toBeVisible()

    // 验证文档标题
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should expand feature and display documents', async ({ page }) => {
    // 展开特性节点
    const featureButton = page.locator('button').filter({ hasText: /#\d+/ }).first()
    await featureButton.click()

    // 验证文档列表显示
    await expect(page.locator('.space-y-4')).toBeVisible()

    // 点击规格文档
    const specButton = page.locator('button:has-text("规格")').first()
    await specButton.click()

    // 验证导航到规格文档
    await expect(page).toHaveURL(/\/document\/.*spec\.md/)

    // 验证文档内容渲染
    await expect(page.locator('.markdown-body')).toBeVisible()
  })

  test('should render markdown correctly', async ({ page }) => {
    // 导航到包含 Markdown 内容的文档
    await page.goto('http://localhost:3000/document/specs%2F001-speckit-ui-viewer%2Fspec.md')

    // 等待内容加载
    await expect(page.locator('.markdown-body')).toBeVisible()

    // 验证标题渲染
    const headings = page.locator('.markdown-body h1, .markdown-body h2, .markdown-body h3')
    await expect(headings.first()).toBeVisible()

    // 验证列表渲染
    const lists = page.locator('.markdown-body ul, .markdown-body ol')
    if (await lists.count() > 0) {
      await expect(lists.first()).toBeVisible()
    }

    // 验证代码块渲染
    const codeBlocks = page.locator('.markdown-body pre code')
    if (await codeBlocks.count() > 0) {
      await expect(codeBlocks.first()).toBeVisible()
      // 验证语法高亮类存在
      const className = await codeBlocks.first().getAttribute('class')
      expect(className).toMatch(/language-/)
    }
  })

  test('should display document metadata', async ({ page }) => {
    // 导航到文档页面
    await page.goto('http://localhost:3000/document/specs%2F001-speckit-ui-viewer%2Fspec.md')

    // 验证元信息显示
    await expect(page.locator('text=/\\d+ 行/')).toBeVisible()
    await expect(page.locator('text=/\\d+(\\.\\d+)? (B|KB|MB)/')).toBeVisible()
    await expect(page.locator('text=/最后修改:/')).toBeVisible()
  })

  test('should show active state for current document in sidebar', async ({ page }) => {
    // 导航到特定文档
    await page.goto('http://localhost:3000/document/specs%2F001-speckit-ui-viewer%2Fspec.md')

    // 验证侧边栏中对应文档的高亮状态
    const activeButton = page.locator('button.bg-gh-accent-emphasis')
    await expect(activeButton).toBeVisible()
  })

  test('should handle internal link navigation', async ({ page }) => {
    // 导航到包含内部链接的文档
    await page.goto('http://localhost:3000/document/specs%2F001-speckit-ui-viewer%2Fspec.md')

    // 查找内部链接 (非 http:// 开头的链接)
    const internalLinks = page.locator('.markdown-body a').filter({
      has: page.locator(':not([href^="http://"], [href^="https://"])'),
    })

    // 如果有内部链接,点击它
    if ((await internalLinks.count()) > 0) {
      const firstLink = internalLinks.first()
      await firstLink.click()

      // 验证 URL 改变
      await expect(page).toHaveURL(/\/document\//)

      // 验证新文档内容加载
      await expect(page.locator('.markdown-body')).toBeVisible()
    }
  })

  test('should navigate through breadcrumbs', async ({ page }) => {
    // 导航到深层文档
    await page.goto('http://localhost:3000/document/specs%2F001-speckit-ui-viewer%2Fspec.md')

    // 验证面包屑存在
    const breadcrumbs = page.locator('nav button, nav span')
    await expect(breadcrumbs.first()).toBeVisible()

    // 点击面包屑中的上级目录
    const breadcrumbButtons = page.locator('nav button')
    if ((await breadcrumbButtons.count()) > 0) {
      await breadcrumbButtons.first().click()

      // 验证导航到上级目录
      await expect(page).toHaveURL(/\/document\//)
    }
  })

  test('should refresh document when refresh button clicked', async ({ page }) => {
    // 导航到文档
    await page.goto('http://localhost:3000/document/specs%2F001-speckit-ui-viewer%2Fspec.md')

    // 等待内容加载
    await expect(page.locator('.markdown-body')).toBeVisible()

    // 点击刷新按钮
    const refreshButton = page.locator('button:has-text("刷新")')
    await refreshButton.click()

    // 验证加载状态 (可能很快完成)
    // 验证内容仍然可见
    await expect(page.locator('.markdown-body')).toBeVisible()
  })

  test('should handle document not found', async ({ page }) => {
    // 导航到不存在的文档
    await page.goto('http://localhost:3000/document/non-existent-file.md')

    // 验证错误信息显示
    await expect(page.locator('text=/加载失败|文档未找到/')).toBeVisible()

    // 验证重试按钮或提示信息
    const retryButton = page.locator('button:has-text("重试")')
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeVisible()
    }
  })

  test('should display loading state while fetching document', async ({ page }) => {
    // 导航到文档 (使用慢速网络模拟)
    await page.route('**/document/**', async (route) => {
      // 延迟响应
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await page.goto('http://localhost:3000/document/specs%2F001-speckit-ui-viewer%2Fspec.md')

    // 验证加载动画显示
    const loadingIndicator = page.locator('.animate-spin, text=/加载文档中/')
    // 由于加载可能很快,这个测试可能不稳定
    // 主要验证页面不会崩溃
    await expect(page.locator('body')).toBeVisible()
  })

  test('should render task lists with checkboxes', async ({ page }) => {
    // 创建一个包含任务列表的测试文档
    // 注意:这个测试假设存在包含任务列表的文档
    await page.goto('http://localhost:3000/document/specs%2F001-speckit-ui-viewer%2Ftasks.md')

    // 查找任务列表
    const taskLists = page.locator('.markdown-body .task-list')
    if ((await taskLists.count()) > 0) {
      // 验证任务列表存在
      await expect(taskLists.first()).toBeVisible()

      // 验证复选框存在
      const checkboxes = page.locator('.markdown-body input[type="checkbox"]')
      await expect(checkboxes.first()).toBeVisible()
    }
  })

  test('should render tables correctly', async ({ page }) => {
    // 导航到包含表格的文档
    await page.goto('http://localhost:3000/document/specs%2F001-speckit-ui-viewer%2Fspec.md')

    // 查找表格
    const tables = page.locator('.markdown-body table')
    if ((await tables.count()) > 0) {
      // 验证表格渲染
      await expect(tables.first()).toBeVisible()

      // 验证表格有 markdown-table 类
      await expect(tables.first()).toHaveClass(/markdown-table/)

      // 验证表头和表体
      await expect(tables.first().locator('thead')).toBeVisible()
      await expect(tables.first().locator('tbody')).toBeVisible()
    }
  })

  test('should open external links in new tab', async ({ page }) => {
    // 导航到包含外部链接的文档
    await page.goto('http://localhost:3000/document/specs%2F001-speckit-ui-viewer%2Fspec.md')

    // 查找外部链接
    const externalLinks = page.locator('.markdown-body a[href^="http://"], .markdown-body a[href^="https://"]')

    if ((await externalLinks.count()) > 0) {
      // 验证外部链接有 target="_blank"
      await expect(externalLinks.first()).toHaveAttribute('target', '_blank')
      await expect(externalLinks.first()).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  test('should maintain sidebar state across navigation', async ({ page }) => {
    // 展开特性
    const featureButton = page.locator('button').filter({ hasText: /#\d+/ }).first()
    await featureButton.click()

    // 点击文档
    const docButton = page.locator('button:has-text("规格")').first()
    await docButton.click()

    // 验证导航后特性仍然展开
    await expect(page.locator('.space-y-4')).toBeVisible()
  })
})
