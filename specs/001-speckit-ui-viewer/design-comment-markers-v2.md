# 评论标记实现方案 V2.0 - DOM 直接注入

**日期**: 2025-01-24
**版本**: 2.0
**状态**: 设计中

## 概述

本文档详细说明评论标记功能的重新设计方案。新方案采用 **DOM 直接注入** 方式,在 Markdown 渲染后直接修改 DOM 结构,将被评论的文本包裹在高亮 `<span>` 标签中。

## 问题分析

### V1.0 方案的问题

**实现方式**: 使用 fixed 定位的覆盖层来标记评论

**存在的问题**:
1. **性能问题**: 需要监听滚动事件并实时更新标记位置,在滚动时频繁触发重绘
2. **同步问题**: Range 对象可能失效,导致位置计算不准确,标记与文本位置不同步
3. **复杂度高**: 需要维护标记状态、监听多个事件、处理各种边界情况
4. **用户体验差**: 滚动时标记位置有延迟,不够流畅

## V2.0 方案设计

### 核心思路

**直接修改 DOM 结构**: 在 Markdown 渲染后,遍历 DOM 树查找被评论的文本,将其包裹在 `<span class="comment-highlight">` 标签中。

### 优势

1. ✅ **零性能开销**: 标记是 DOM 的一部分,自动跟随布局,无需监听滚动
2. ✅ **完美同步**: 标记与文本永远同步,不存在位置偏移
3. ✅ **实现简单**: 单向数据流,在渲染阶段一次性处理完成
4. ✅ **易于维护**: 清晰的职责分离,代码结构简单

### 技术架构

#### 架构图

```
DocumentView
│
├─ 预览模式 (Preview Mode)
│  │
│  ├─ Viewer Component
│  │  ├─ Markdown → HTML (marked.js)
│  │  ├─ 语法高亮 (prism.js)
│  │  └─ 评论标记注入 (CommentHighlighter)
│  │
│  ├─ CommentPanel
│  ├─ CommentForm
│  └─ TextSelection (创建新评论)
│
└─ 编辑模式 (Edit Mode)
   │
   ├─ Editor (左侧编辑器)
   ├─ Preview (右侧预览,无评论标记)
   └─ 保存/取消操作
```

#### 组件职责

**Viewer (预览模式)**:
- 渲染 Markdown 为 HTML
- 应用语法高亮
- 调用 CommentHighlighter 注入评论标记
- 处理文本选择创建评论

**CommentHighlighter (评论标记注入器)**:
- 遍历 DOM 树查找文本节点
- 定位评论锚点对应的文本
- 包裹文本为 `<span class="comment-highlight">`
- 绑定点击事件打开评论面板

**Editor + Preview (编辑模式)**:
- 左侧编辑 Markdown 源码
- 右侧实时预览渲染效果
- 不显示评论标记
- 不支持评论操作

### 实现细节

#### 1. DOM 节点结构

```html
<!-- 原始渲染的 HTML -->
<p>这是一段文本，其中包含被评论的内容。</p>

<!-- 注入评论标记后 -->
<p>这是一段文本，其中包含
  <span
    class="comment-highlight"
    data-comment-id="comment_1234567890_abc"
    data-status="open"
    title="点击查看/编辑评论"
  >被评论的内容</span>。
</p>
```

#### 2. CommentHighlighter 核心算法

##### 主流程

```typescript
class CommentHighlighter {
  /**
   * 注入评论标记到 DOM
   */
  static inject(
    containerElement: HTMLElement,
    comments: Comment[]
  ): void {
    // 1. 清除旧标记
    this.clearOldMarkers(containerElement)

    // 2. 遍历评论列表
    comments.forEach(comment => {
      this.injectSingleComment(containerElement, comment)
    })
  }

  /**
   * 注入单个评论标记
   */
  private static injectSingleComment(
    container: HTMLElement,
    comment: Comment
  ): void {
    const { textFragment, contextBefore, contextAfter } = comment.anchor

    // 1. 查找目标文本节点
    const textNode = this.findTextNode(
      container,
      textFragment,
      contextBefore,
      contextAfter
    )

    if (!textNode) {
      console.warn(`无法定位评论 ${comment.id} 的文本`)
      return
    }

    // 2. 创建高亮 span
    const span = this.createHighlightSpan(comment)

    // 3. 包裹文本
    this.wrapTextNode(textNode, textFragment, span)

    // 4. 绑定事件
    this.bindEvents(span, comment)
  }
}
```

##### 文本节点查找算法

```typescript
/**
 * 查找包含目标文本的文本节点
 *
 * 策略:
 * 1. 精确匹配 textFragment
 * 2. 使用 contextBefore/contextAfter 验证上下文
 * 3. 优先匹配最近的节点
 */
private static findTextNode(
  container: HTMLElement,
  targetText: string,
  contextBefore?: string,
  contextAfter?: string
): Text | null {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  )

  const candidates: Array<{ node: Text; score: number }> = []

  let node: Node | null
  while ((node = walker.nextNode())) {
    const textNode = node as Text
    const text = textNode.textContent || ''

    // 检查是否包含目标文本
    if (!text.includes(targetText)) continue

    // 计算匹配分数
    let score = 1

    // 验证上下文
    if (contextBefore) {
      const prevText = this.getPreviousText(textNode, 50)
      if (prevText.endsWith(contextBefore)) score += 2
    }

    if (contextAfter) {
      const nextText = this.getNextText(textNode, 50)
      if (nextText.startsWith(contextAfter)) score += 2
    }

    candidates.push({ node: textNode, score })
  }

  // 返回分数最高的候选节点
  if (candidates.length === 0) return null

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0].node
}

/**
 * 获取文本节点前面的文本
 */
private static getPreviousText(node: Text, maxLength: number): string {
  let text = ''
  let current: Node | null = node.previousSibling

  while (current && text.length < maxLength) {
    if (current.nodeType === Node.TEXT_NODE) {
      text = (current.textContent || '') + text
    }
    current = current.previousSibling
  }

  return text.slice(-maxLength)
}

/**
 * 获取文本节点后面的文本
 */
private static getNextText(node: Text, maxLength: number): string {
  let text = ''
  let current: Node | null = node.nextSibling

  while (current && text.length < maxLength) {
    if (current.nodeType === Node.TEXT_NODE) {
      text = text + (current.textContent || '')
    }
    current = current.nextSibling
  }

  return text.slice(0, maxLength)
}
```

##### 文本节点包裹算法

```typescript
/**
 * 将文本节点的指定部分包裹在 span 中
 */
private static wrapTextNode(
  textNode: Text,
  targetText: string,
  wrapElement: HTMLElement
): void {
  const text = textNode.textContent || ''
  const startIndex = text.indexOf(targetText)

  if (startIndex === -1) {
    console.error('无法在文本节点中找到目标文本')
    return
  }

  const endIndex = startIndex + targetText.length

  // 分割文本节点为三部分: before | target | after
  const beforeText = text.substring(0, startIndex)
  const afterText = text.substring(endIndex)

  const parent = textNode.parentNode
  if (!parent) return

  // 创建新节点
  const beforeNode = beforeText ? document.createTextNode(beforeText) : null
  const afterNode = afterText ? document.createTextNode(afterText) : null

  // 设置高亮 span 的内容
  wrapElement.textContent = targetText

  // 替换原节点
  if (beforeNode) parent.insertBefore(beforeNode, textNode)
  parent.insertBefore(wrapElement, textNode)
  if (afterNode) parent.insertBefore(afterNode, textNode)
  parent.removeChild(textNode)
}
```

##### 创建高亮 Span

```typescript
/**
 * 创建评论高亮 span 元素
 */
private static createHighlightSpan(comment: Comment): HTMLSpanElement {
  const span = document.createElement('span')

  span.className = 'comment-highlight'
  span.dataset.commentId = comment.id
  span.dataset.status = comment.status
  span.title = '点击查看/编辑评论'

  return span
}
```

##### 事件绑定

```typescript
/**
 * 绑定点击事件
 */
private static bindEvents(
  span: HTMLSpanElement,
  comment: Comment
): void {
  span.addEventListener('click', (e) => {
    e.stopPropagation()

    // 触发自定义事件,通知 React 组件打开评论面板
    const event = new CustomEvent('comment-marker-click', {
      detail: { commentId: comment.id },
      bubbles: true,
    })
    span.dispatchEvent(event)
  })
}
```

#### 3. Viewer 组件集成

```typescript
const Viewer: React.FC<ViewerProps> = ({ content, comments, onCommentClick }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // 1. 渲染 Markdown
    const html = MarkdownService.render(content)
    containerRef.current.innerHTML = html

    // 2. 应用语法高亮
    await applySyntaxHighlighting(containerRef.current)

    // 3. 注入评论标记
    if (comments.length > 0) {
      CommentHighlighter.inject(containerRef.current, comments)
    }

    // 4. 监听评论标记点击事件
    const handleCommentClick = (e: Event) => {
      const customEvent = e as CustomEvent
      const { commentId } = customEvent.detail
      onCommentClick?.(commentId)
    }

    containerRef.current.addEventListener('comment-marker-click', handleCommentClick)

    return () => {
      containerRef.current?.removeEventListener('comment-marker-click', handleCommentClick)
    }
  }, [content, comments, onCommentClick])

  return (
    <div
      ref={containerRef}
      className="markdown-body prose prose-invert max-w-none p-8"
    />
  )
}
```

#### 4. CSS 样式

```css
/* 评论高亮基础样式 */
.comment-highlight {
  background-color: rgba(255, 235, 59, 0.3);
  border-bottom: 2px solid #FFEB3B;
  padding: 1px 2px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 悬停效果 */
.comment-highlight:hover {
  background-color: rgba(255, 235, 59, 0.5);
  border-bottom-width: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 已解决的评论 */
.comment-highlight[data-status="resolved"] {
  background-color: rgba(76, 175, 80, 0.2);
  border-bottom-color: #4CAF50;
}

/* 已归档的评论 */
.comment-highlight[data-status="archived"] {
  background-color: rgba(158, 158, 158, 0.2);
  border-bottom-color: #9E9E9E;
  opacity: 0.6;
}

/* 深色模式适配 */
.dark .comment-highlight {
  background-color: rgba(255, 235, 59, 0.2);
}

.dark .comment-highlight:hover {
  background-color: rgba(255, 235, 59, 0.3);
}
```

### 模式切换设计

#### 预览模式 vs 编辑模式

```typescript
const DocumentView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview')

  return (
    <div>
      {/* 模式切换按钮 */}
      <button onClick={() => setViewMode(viewMode === 'preview' ? 'edit' : 'preview')}>
        {viewMode === 'preview' ? '编辑' : '预览'}
      </button>

      {viewMode === 'preview' ? (
        /* 预览模式: 支持评论 */
        <Viewer
          content={document.content}
          comments={comments}
          onCommentClick={handleCommentClick}
        />
      ) : (
        /* 编辑模式: 左侧编辑器 + 右侧预览 */
        <div className="grid grid-cols-2 gap-0">
          <Editor content={editContent} onChange={setEditContent} />
          <Preview content={editContent} />
        </div>
      )}
    </div>
  )
}
```

### 边界情况处理

#### 1. 跨标签文本

**问题**: 评论文本可能跨越多个 HTML 标签

```html
<!-- 原始 HTML -->
<p>这是<strong>跨标签</strong>的文本</p>

<!-- 评论文本: "跨标签的" -->
```

**解决方案**:
- 在查找时,合并相邻文本节点的内容
- 如果匹配成功,分别处理每个文本节点
- 创建多个 span 标签,保持原有 HTML 结构

#### 2. 重叠评论

**问题**: 多条评论可能引用相同或重叠的文本

**解决方案**:
- 按评论创建时间排序处理
- 后创建的评论标记嵌套在先创建的内部
- 使用不同的背景色叠加效果

```html
<span class="comment-highlight" data-comment-id="1">
  外层评论
  <span class="comment-highlight" data-comment-id="2">
    重叠部分
  </span>
  继续外层
</span>
```

#### 3. 文档编辑后重新定位

**问题**: 文档编辑保存后,文本位置可能变化

**解决方案**:
- 使用 `contextBefore` 和 `contextAfter` 进行上下文匹配
- 如果原位置找不到,在附近区域搜索(模糊匹配)
- 如果完全找不到,标记评论为"无法定位"状态

#### 4. 特殊字符

**问题**: 文本包含 HTML 实体或特殊字符

**解决方案**:
- 在查找前,对文本进行规范化(normalize)
- 统一处理 HTML 实体(如 `&nbsp;` → 空格)
- 处理 Unicode 字符

### 性能优化

#### 1. 批量处理

```typescript
// 批量注入所有评论,避免多次 DOM 操作
CommentHighlighter.inject(container, allComments)
```

#### 2. DocumentFragment

```typescript
// 使用 DocumentFragment 减少 reflow
const fragment = document.createDocumentFragment()
// ... 构建节点
parent.replaceChild(fragment, oldNode)
```

#### 3. 防抖

```typescript
// 文档内容变化时,防抖重新注入标记
const debouncedInject = debounce(() => {
  CommentHighlighter.inject(container, comments)
}, 300)
```

### 测试策略

#### 单元测试

```typescript
describe('CommentHighlighter', () => {
  it('应该正确查找文本节点', () => {
    const container = createMockDOM('<p>测试文本</p>')
    const node = CommentHighlighter.findTextNode(container, '测试')
    expect(node).not.toBeNull()
  })

  it('应该正确包裹文本节点', () => {
    const container = createMockDOM('<p>测试文本</p>')
    const node = container.querySelector('p')!.firstChild as Text
    const span = document.createElement('span')
    CommentHighlighter.wrapTextNode(node, '测试', span)
    expect(container.innerHTML).toBe('<p><span>测试</span>文本</p>')
  })

  it('应该处理跨标签文本', () => {
    const container = createMockDOM('<p>这是<strong>跨标签</strong>文本</p>')
    // ... 测试逻辑
  })
})
```

#### 集成测试

```typescript
describe('Viewer + CommentHighlighter', () => {
  it('应该在渲染后注入评论标记', async () => {
    const { container } = render(
      <Viewer content="# 标题\n测试内容" comments={mockComments} />
    )

    await waitFor(() => {
      const highlight = container.querySelector('.comment-highlight')
      expect(highlight).toBeInTheDocument()
    })
  })

  it('点击评论标记应该触发回调', async () => {
    const onCommentClick = jest.fn()
    const { container } = render(
      <Viewer
        content="测试内容"
        comments={mockComments}
        onCommentClick={onCommentClick}
      />
    )

    const highlight = await screen.findByText('测试')
    fireEvent.click(highlight)
    expect(onCommentClick).toHaveBeenCalledWith('comment_id')
  })
})
```

### 实现计划

#### Phase 1: 基础架构 (1-2 天)
- [ ] 创建 CommentHighlighter 类
- [ ] 实现基本的文本节点查找算法
- [ ] 实现文本节点包裹逻辑
- [ ] 添加 CSS 样式

#### Phase 2: Viewer 集成 (1 天)
- [ ] 修改 Viewer 组件,集成 CommentHighlighter
- [ ] 实现模式切换逻辑
- [ ] 处理评论标记点击事件

#### Phase 3: 上下文匹配 (1 天)
- [ ] 实现 contextBefore/contextAfter 匹配
- [ ] 提高文本定位准确性
- [ ] 处理文档编辑后重新定位

#### Phase 4: 边界情况 (1-2 天)
- [ ] 处理跨标签文本
- [ ] 处理重叠评论
- [ ] 处理特殊字符

#### Phase 5: 优化和测试 (1 天)
- [ ] 性能优化
- [ ] 单元测试
- [ ] 集成测试
- [ ] 文档更新

**预计总时间**: 5-7 天

## 风险评估

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| 跨标签文本难以处理 | 中 | 使用 TreeWalker 合并相邻文本节点 |
| 重叠评论渲染问题 | 低 | 使用嵌套 span 和不同颜色 |
| 文档编辑后定位失败 | 中 | 使用上下文匹配和模糊搜索 |
| 大文档性能问题 | 低 | 使用 DocumentFragment 批量操作 |

## 总结

新的 DOM 直接注入方案相比 V1.0 的覆盖层方案具有以下优势:

1. ✅ **性能更优**: 无需监听滚动,零额外开销
2. ✅ **实现更简单**: 单向数据流,职责清晰
3. ✅ **同步完美**: 标记与文本永远同步
4. ✅ **易于维护**: 代码结构清晰,易于扩展

建议采用此方案替换现有实现。
