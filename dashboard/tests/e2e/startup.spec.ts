import { test, expect } from '@playwright/test'

test.describe('启动和访问 UI 服务', () => {
  test('应该成功加载首页', async ({ page }) => {
    // 访问首页
    await page.goto('/')

    // 验证页面标题
    await expect(page).toHaveTitle(/Spec-Kit UI Viewer/)

    // 验证主标题存在
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Spec-Kit UI')
  })

  test('应该显示 Header 组件', async ({ page }) => {
    await page.goto('/')

    // 验证 Header 存在
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // 验证侧边栏切换按钮存在
    const sidebarToggle = page.locator('button[aria-label*="侧边栏"]').first()
    await expect(sidebarToggle).toBeVisible()
  })

  test('应该显示 Sidebar 组件', async ({ page }) => {
    await page.goto('/')

    // 验证侧边栏存在
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // 验证侧边栏标题
    const sidebarTitle = sidebar.locator('h2')
    await expect(sidebarTitle).toContainText('项目文档')
  })

  test('应该能够切换侧边栏', async ({ page }) => {
    await page.goto('/')

    // 查找侧边栏
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // 点击切换按钮
    const toggleButton = page.locator('button[aria-label*="侧边栏"]').first()
    await toggleButton.click()

    // 验证侧边栏被隐藏
    await expect(sidebar).not.toBeVisible()

    // 再次点击切换按钮
    await toggleButton.click()

    // 验证侧边栏重新显示
    await expect(sidebar).toBeVisible()
  })

  test('应该显示加载状态或项目内容', async ({ page }) => {
    await page.goto('/')

    // 等待页面内容加载完成
    await page.waitForSelector('main')

    // 应该显示以下之一:
    // 1. 加载中状态
    // 2. 错误状态
    // 3. 项目内容
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()

    // 检查是否有任何内容显示
    const hasLoadingState = await page.locator('text=正在加载').count() > 0
    const hasErrorState = await page.locator('text=加载失败').count() > 0
    const hasProjectContent = await page.locator('text=特性列表').count() > 0

    expect(hasLoadingState || hasErrorState || hasProjectContent).toBeTruthy()
  })

  test('应该在加载失败时显示友好的错误提示', async ({ page }) => {
    // 注意: 这个测试假设 CLI 服务未启动,会显示错误
    await page.goto('/')

    // 等待一段时间让加载完成
    await page.waitForTimeout(2000)

    // 检查是否显示错误信息或项目内容
    const hasError = await page.locator('text=加载失败').count() > 0
    const hasProject = await page.locator('text=特性列表').count() > 0

    // 如果显示错误,验证错误提示的完整性
    if (hasError) {
      // 验证错误标题
      await expect(page.locator('text=加载失败')).toBeVisible()

      // 验证提示信息存在
      await expect(page.locator('text=可能的原因')).toBeVisible()
      await expect(page.locator('text=speckit-ui serve')).toBeVisible()
    }

    // 至少应该显示其中之一
    expect(hasError || hasProject).toBeTruthy()
  })

  test('应该响应式适配不同屏幕尺寸', async ({ page }) => {
    // 测试桌面尺寸
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await expect(page.locator('main')).toBeVisible()

    // 测试平板尺寸
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('main')).toBeVisible()

    // 测试手机尺寸
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('main')).toBeVisible()
  })

  test('应该使用暗色主题', async ({ page }) => {
    await page.goto('/')

    // 验证 HTML 元素有 dark 类
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)

    // 验证背景色为暗色
    const body = page.locator('body')
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })

    // 验证是深色背景 (RGB 值较低)
    expect(bgColor).toMatch(/rgb\(1[0-3], 1[7-9], 2[0-3]\)/) // #0d1117 对应的 RGB
  })

  test('404 页面应该正常工作', async ({ page }) => {
    // 访问不存在的路径
    await page.goto('/this-page-does-not-exist')

    // 验证显示 404 内容
    await expect(page.locator('text=404')).toBeVisible()
    await expect(page.locator('text=页面未找到')).toBeVisible()

    // 验证返回首页链接存在
    const homeLink = page.locator('a[href="/"]')
    await expect(homeLink).toBeVisible()

    // 点击返回首页
    await homeLink.click()

    // 验证返回到首页
    await expect(page).toHaveURL('/')
  })
})
