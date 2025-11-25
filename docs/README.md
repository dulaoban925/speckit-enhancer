# 项目文档

本目录包含 Spec-Kit UI Viewer 项目的功能实现文档、技术设计和测试指南。

## 文档列表

### 评论系统 (Phase 6)

- **[implementation-summary.md](./implementation-summary.md)** - 评论系统实现完整总结
  - 实现日期：2025-11-24
  - 状态：Phase 6 完成
  - 包含：V2.0 DOM 注入方案、技术债务清理、性能优化、用户体验改进

- **[design-comment-markers-v2.md](./design-comment-markers-v2.md)** - 评论标记 V2.0 技术设计文档
  - DOM 注入方案详细设计
  - TreeWalker 文本节点遍历算法
  - MutationObserver 自动重新注入机制
  - 上下文匹配和智能重定位算法

### 搜索功能 (Phase 7)

- **[search-implementation-summary.md](./search-implementation-summary.md)** - 搜索功能实现完整总结（最新）
  - 实现日期：2025-11-25
  - 状态：Phase 7 完成
  - 包含：任务清单、技术栈、性能指标、用户体验改进、后续建议

- **[search-implementation-report.md](./search-implementation-report.md)** - 搜索功能初步实现报告
  - 实现日期：2025-11-24
  - 初期版本，已被 summary 文档取代

### 测试指南

- **[test-guide.md](./test-guide.md)** - 搜索功能快速测试指南
  - 包含：基础测试步骤、模糊搜索测试、跳转测试、控制台检查
  - 关键特性验证清单
  - 常见问题排查

## 文档用途

这些文档用于：

1. **实现记录**：记录功能实现的详细过程和技术决策
   - 评论系统：V2.0 DOM 注入方案的设计和实现
   - 搜索功能：Fuse.js + mark.js 的集成和优化

2. **技术设计**：保存架构设计和技术方案
   - DOM 注入 vs 覆盖层方案对比
   - TreeWalker 算法实现细节
   - MutationObserver 自动持久化机制

3. **测试参考**：提供功能测试的步骤和验收标准
   - 快速测试步骤
   - 验收标准检查清单
   - 常见问题排查指南

4. **团队协作**：帮助团队成员了解功能实现细节
   - 新成员快速上手
   - 代码审查参考
   - 技术分享材料

5. **问题排查**：遇到问题时参考的故障排除指南
   - 已知问题及解决方案
   - 性能优化记录
   - 用户反馈处理

## 文档组织

### 按功能模块

- **Phase 6 - 评论系统**：2 个文档（实现总结 + 技术设计）
- **Phase 7 - 搜索功能**：2 个文档（完整总结 + 初步报告）
- **测试指南**：1 个文档

### 按文档类型

- **实现总结**：`implementation-summary.md`, `search-implementation-summary.md`
- **技术设计**：`design-comment-markers-v2.md`
- **测试指南**：`test-guide.md`
- **初步报告**：`search-implementation-report.md`（已被 summary 取代）

## 相关资源

### 项目规格文档

- 功能规格：`../specs/001-speckit-ui-viewer/spec.md`
- 任务列表：`../specs/001-speckit-ui-viewer/tasks.md`（Phase 6 & 7 已完成）
- 实现计划：`../specs/001-speckit-ui-viewer/plan.md`
- 数据模型：`../specs/001-speckit-ui-viewer/data-model.md`
- API 合约：`../specs/001-speckit-ui-viewer/contracts/`

### 代码位置

**评论系统**：
- 前端组件：`dashboard/src/components/comment/`
- 评论服务：`dashboard/src/services/commentService.ts`
- 高亮服务：`dashboard/src/services/commentHighlighter.ts`
- CLI 命令：`cli/src/commands/comment.ts`

**搜索功能**：
- 搜索组件：`dashboard/src/components/common/Search.tsx`
- 搜索服务：`dashboard/src/services/searchService.ts`
- 搜索 Hook：`dashboard/src/hooks/useSearch.ts`
- 文档查看器：`dashboard/src/components/document/Viewer.tsx`（高亮逻辑）

## 维护说明

1. **新功能实现**：完成后应创建对应的实现总结文档
2. **重要设计决策**：应记录在技术设计文档中
3. **测试指南**：功能完成后更新或创建测试步骤
4. **文档更新**：保持 README.md 与实际文档同步

## 版本历史

- **2025-11-25**: 添加搜索功能实现文档（Phase 7）
- **2025-11-24**: 添加评论系统实现文档（Phase 6）
- **2025-11-25**: 统一文档到 docs/ 目录
