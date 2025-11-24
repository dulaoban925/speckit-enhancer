import React, { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useBeforeUnload } from "react-router-dom";
import { useDocument } from "../hooks/useDocuments";
import { useFileWatch } from "../hooks/useFileWatch";
import { useComments } from "../hooks/useComments";
import { useTextSelection } from "../hooks/useTextSelection";
import { CLIService } from "../services/cliService";
import { CommentHighlighter } from "../services/commentHighlighter";
import Viewer from "../components/document/Viewer";
import Editor from "../components/document/Editor";
import Preview from "../components/document/Preview";
import { CommentPanel } from "../components/comment/Panel";
import { CommentForm } from "../components/comment/Form";
import Modal, { ModalButton } from "../components/common/Modal";
import type { CommentAnchor } from "../types";

// 简单的路径解析（纯函数，移到组件外部避免重复创建）
const resolvePath = (base: string, relative: string): string => {
  const baseParts = base.split("/").filter(Boolean);
  const relativeParts = relative.split("/").filter(Boolean);

  for (const part of relativeParts) {
    if (part === "..") {
      baseParts.pop();
    } else if (part !== ".") {
      baseParts.push(part);
    }
  }

  return baseParts.join("/");
};

const DocumentView: React.FC = () => {
  const params = useParams<{ "*": string }>();
  const path = params["*"];
  const navigate = useNavigate();
  const decodedPath = path ? decodeURIComponent(path) : undefined;
  const {
    document,
    loading,
    error,
    refreshDocument,
    updateMetadata,
    updateDocument,
  } = useDocument(decodedPath);

  // 从路径中提取 featureId
  // - specs/001-speckit-ui-viewer/spec.md -> "001"
  // - .specify/memory/constitution.md -> "system"
  // - 其他文档 -> 基于路径生成的 ID
  const featureId = React.useMemo(() => {
    if (!decodedPath) return "";

    // 尝试匹配 specs 目录下的功能分支编号
    const specsMatch = decodedPath.match(/specs\/(\d+)-/);
    if (specsMatch) {
      return specsMatch[1];
    }

    // 系统文档（.specify/memory/ 下的文档）使用 "system" 作为 featureId
    if (decodedPath.startsWith('.specify/memory/')) {
      return 'system';
    }

    // 其他文档：为了支持评论，生成一个基于路径的 ID
    // 例如: "README.md" -> "root"
    if (decodedPath === 'README.md' || !decodedPath.includes('/')) {
      return 'root';
    }

    // 默认返回空字符串（不支持评论）
    return "";
  }, [decodedPath]);

  // 编辑模式状态
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 评论相关状态
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [selectedAnchor, setSelectedAnchor] = useState<CommentAnchor | null>(
    null
  );
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // 冲突检测状态
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<{
    expectedMtime: number;
    actualMtime: number;
  } | null>(null);

  // 未保存提示状态
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

  // 评论管理 Hook (只在有 featureId 和 decodedPath 时启用)
  const commentsEnabled = !!featureId && !!decodedPath;
  const {
    comments,
    isLoading: isCommentsLoading,
    error: commentsError,
    addComment,
    updateComment,
    deleteComment,
    resolveComment,
    reopenComment,
    getStats,
  } = useComments({
    documentPath: decodedPath || "",
    featureId: featureId || "",
    autoLoad: commentsEnabled && !isEditing, // 非编辑模式下自动加载
  });

  // 文本选择 Hook (只在预览模式下启用)
  const { selection, clearSelection, createAnchorFromSelection } =
    useTextSelection({
      containerRef: viewerContainerRef,
      enabled: !isEditing && commentsEnabled,
      onSelectionChange: (newSelection) => {
        console.log('[DocumentView] onSelectionChange 回调触发:', {
          hasSelection: !!newSelection,
          hasDocument: !!document,
          text: newSelection?.text
        });

        // 文本选中后自动打开评论表单
        if (newSelection && document && document.content) {
          console.log('[DocumentView] 创建评论锚点...');
          // 传递 newSelection 给 createAnchorFromSelection，而不是依赖状态
          const anchor = createAnchorFromSelection(document.content, newSelection);
          console.log('[DocumentView] 锚点创建结果:', anchor);

          if (anchor) {
            console.log('[DocumentView] 设置锚点并打开表单');
            setSelectedAnchor(anchor);
            setShowCommentForm(true);
          } else {
            console.error('[DocumentView] 创建锚点失败');
          }
        }
      },
    });

  // 保存之前的评论 ID 和状态，用于检测变化类型
  const prevCommentsRef = useRef<Map<string, string>>(new Map());

  // 注入评论标记到 DOM (预览模式)
  useEffect(() => {
    if (!isEditing && commentsEnabled && viewerContainerRef.current && comments.length > 0) {
      const container = viewerContainerRef.current;
      let isInjecting = false; // 标志：是否正在注入标记
      let debounceTimer: NodeJS.Timeout | null = null;

      // 检测评论变化类型
      const currentCommentsMap = new Map(comments.map(c => [c.id, c.status]));
      const prevCommentsMap = prevCommentsRef.current;

      // 检查是否只是状态更新（评论 ID 没变，只是状态变了）
      const commentIds = new Set([...currentCommentsMap.keys()]);
      const prevCommentIds = new Set([...prevCommentsMap.keys()]);
      const idsMatch = commentIds.size === prevCommentIds.size &&
        [...commentIds].every(id => prevCommentIds.has(id));

      if (idsMatch && prevCommentsMap.size > 0) {
        // 只是状态更新，检查标记是否仍然存在
        console.log('[DocumentView] 检测到评论状态更新，只更新样式');

        // 检查 DOM 中是否有评论标记
        const existingMarkers = container.querySelectorAll('.comment-highlight');
        console.log(`[DocumentView] DOM 中现有标记数量: ${existingMarkers.length}`);

        if (existingMarkers.length === 0) {
          // 标记不存在，可能被清除了，需要重新注入
          console.log('[DocumentView] 标记已被清除，转为完整注入流程');
          prevCommentsRef.current = currentCommentsMap;
          // 不 return，继续执行下面的注入逻辑
        } else {
          // 标记存在，只更新样式
          comments.forEach(comment => {
            const prevStatus = prevCommentsMap.get(comment.id);
            if (prevStatus && prevStatus !== comment.status) {
              console.log(`[DocumentView] 更新评论 ${comment.id} 状态: ${prevStatus} -> ${comment.status}`);
              CommentHighlighter.updateMarkerStyle(container, comment.id, comment.status);
            }
          });

          // 更新引用
          prevCommentsRef.current = currentCommentsMap;
          return; // 不执行后续的重新注入逻辑
        }
      } else {
        // 有结构性变化（新增/删除评论），需要重新注入
        console.log('[DocumentView] 检测到评论结构变化，准备重新注入');
        prevCommentsRef.current = currentCommentsMap;
      }

      // 注入评论标记的函数
      const injectMarkers = () => {
        if (isInjecting) return; // 如果正在注入，跳过

        console.log('[DocumentView] 注入评论标记，评论数量:', comments.length);
        isInjecting = true;

        // 暂时断开观察器，避免触发自己
        observer.disconnect();

        // 先清除旧的标记
        CommentHighlighter.clear(container);
        // 注入新的标记
        CommentHighlighter.inject(container, comments);

        // 注入完成后，重新开始观察（延迟一点，确保所有 DOM 操作完成）
        setTimeout(() => {
          isInjecting = false;
          observer.observe(container, {
            childList: true,
            subtree: true,
          });
        }, 50);
      };

      // 初始注入（等待 Markdown 渲染完成）
      const timer = setTimeout(injectMarkers, 500);

      // 监听 DOM 变化，当 Viewer 重新渲染时重新注入标记
      const observer = new MutationObserver((mutations) => {
        // 如果正在注入标记，忽略这次变化
        if (isInjecting) return;

        // 检查是否有实质性的 DOM 变化（不只是属性变化）
        // 同时排除评论标记元素的变化
        const hasStructuralChanges = mutations.some(
          (mutation) =>
            mutation.type === 'childList' &&
            (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) &&
            // 排除评论标记相关的变化
            !Array.from(mutation.addedNodes).some((node) =>
              node instanceof HTMLElement && node.classList.contains('comment-highlight')
            ) &&
            !Array.from(mutation.removedNodes).some((node) =>
              node instanceof HTMLElement && node.classList.contains('comment-highlight')
            )
        );

        if (hasStructuralChanges) {
          console.log('[DocumentView] 检测到 DOM 结构变化，准备重新注入评论标记');

          // 使用防抖，避免频繁触发
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          debounceTimer = setTimeout(() => {
            console.log('[DocumentView] 执行重新注入');
            injectMarkers();
          }, 200);
        }
      });

      // 初始不观察，等初始注入完成后再开始观察
      // observer 会在 injectMarkers 中启动

      return () => {
        clearTimeout(timer);
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        observer.disconnect();
      };
    } else if (!isEditing && commentsEnabled && viewerContainerRef.current && comments.length === 0) {
      // 没有评论时清除所有标记
      CommentHighlighter.clear(viewerContainerRef.current);
    }
  }, [isEditing, commentsEnabled, comments, document?.content]);

  // 监听评论标记点击事件
  useEffect(() => {
    if (!viewerContainerRef.current) return;

    const handleCommentMarkerClick = (e: Event) => {
      const customEvent = e as CustomEvent<{ commentId: string }>;
      console.log('[DocumentView] 评论标记被点击:', customEvent.detail.commentId);
      setIsCommentPanelOpen(true);
      // TODO: 滚动到对应的评论
    };

    const container = viewerContainerRef.current;
    container.addEventListener('commentMarkerClick', handleCommentMarkerClick);

    return () => {
      container.removeEventListener('commentMarkerClick', handleCommentMarkerClick);
    };
  }, []);

  // 初始化编辑内容
  useEffect(() => {
    if (document && !isEditing) {
      setEditContent(document.content);
    }
  }, [document, isEditing]);

  // 文件监听 (检测外部修改)
  const fileWatcher = useFileWatch(decodedPath, {
    enabled: isEditing,
    onChange: (event) => {
      if (isEditing && hasUnsavedChanges) {
        // 文件被外部修改,显示冲突提示
        console.log("[FILEWATCH] 检测到文件变化，触发冲突提示");
        setConflictInfo({
          expectedMtime: document?.metadata.lastModified || 0,
          actualMtime: event.lastModified,
        });
        setShowConflictModal(true);
      }
    },
  });

  // 浏览器刷新/关闭时提示
  useBeforeUnload(
    useCallback(
      (e) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
          return (e.returnValue = "你有未保存的更改,确定要离开吗?");
        }
      },
      [hasUnsavedChanges]
    )
  );

  // 生成面包屑导航
  const breadcrumbs = React.useMemo(() => {
    if (!document) return [];

    const parts = document.relativePath.split("/");
    return parts.map((part, index) => ({
      name: part,
      isLast: index === parts.length - 1,
    }));
  }, [document]);

  // 处理文档内链接点击
  const handleLinkClick = useCallback((href: string) => {
    if (!document) return;

    // 相对路径处理
    if (href.startsWith("./") || href.startsWith("../")) {
      const currentDir = document.relativePath
        .split("/")
        .slice(0, -1)
        .join("/");
      const resolvedPath = resolvePath(currentDir, href);
      navigate(`/document/${encodeURIComponent(resolvedPath)}`);
    } else if (href.startsWith("/")) {
      // 绝对路径
      navigate(`/document/${encodeURIComponent(href.substring(1))}`);
    } else {
      // 同级文件
      const currentDir = document.relativePath
        .split("/")
        .slice(0, -1)
        .join("/");
      const resolvedPath = currentDir ? `${currentDir}/${href}` : href;
      navigate(`/document/${encodeURIComponent(resolvedPath)}`);
    }
  }, [document, navigate]);

  // 处理返回首页
  const handleHomeClick = () => {
    navigate("/");
  };

  // 处理编辑内容变化
  const handleContentChange = useCallback(
    (newContent: string) => {
      setEditContent(newContent);
      setHasUnsavedChanges(newContent !== document?.content);
    },
    [document]
  );

  // 切换编辑模式
  const handleToggleEdit = useCallback(() => {
    if (isEditing && hasUnsavedChanges) {
      // 有未保存更改,显示提示
      setShowUnsavedModal(true);
      setPendingNavigation("cancel");
    } else {
      setIsEditing(!isEditing);
      if (!isEditing && document) {
        setEditContent(document.content);
      }
      setHasUnsavedChanges(false);
    }
  }, [isEditing, hasUnsavedChanges, document]);

  // 保存文档
  const handleSave = useCallback(async () => {
    if (!document || !decodedPath) return;

    setIsSaving(true);

    try {
      // lastModified 已经是时间戳（毫秒）
      const expectedMtime = document.metadata.lastModified;

      const response = await CLIService.writeDocument(
        decodedPath,
        editContent,
        expectedMtime
      );

      console.log(
        "[FRONTEND] Write response:",
        JSON.stringify(response, null, 2)
      );
      console.log(
        "[FRONTEND] response.success:",
        response.success,
        "(类型:",
        typeof response.success,
        ")"
      );
      console.log("[FRONTEND] response.data:", response.data);
      console.log("[FRONTEND] response.error?.code:", response.error?.code);
      console.log(
        "[FRONTEND] 条件判断: response.success && response.data =",
        response.success && response.data
      );

      if (response.success && response.data) {
        console.log("[FRONTEND] ✅ 进入成功分支");
        console.log("[FRONTEND] 更新 content 和 lastModified");
        // 保存成功，同时更新内容和元数据
        setHasUnsavedChanges(false);
        updateDocument({
          content: editContent, // 更新为保存的内容
          metadata: {
            lastModified: response.data.lastModified, // 更新时间戳
          },
        });
        console.log("[FRONTEND] ✅ updateDocument 调用完成");

        // 重置文件监听器状态，避免把自己的保存操作当成外部修改
        console.log("[FRONTEND] 重置文件监听器");
        fileWatcher.reset();
        console.log("[FRONTEND] ✅ 保存流程完成");
      } else if (response.error?.code === "CONFLICT") {
        console.log("[FRONTEND] ❌ 进入冲突分支");
        // 冲突
        setConflictInfo({
          expectedMtime: expectedMtime,
          actualMtime: response.error.details?.actualMtime || Date.now(),
        });
        setShowConflictModal(true);
      } else {
        console.log("[FRONTEND] ❌ 进入错误分支");
        // 其他错误
        alert(`保存失败: ${response.error?.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert(
        `保存失败: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsSaving(false);
    }
  }, [document, decodedPath, editContent, updateDocument, fileWatcher]);

  // 处理冲突 - 强制保存
  const handleForceSave = useCallback(async () => {
    if (!decodedPath) return;

    setIsSaving(true);
    setShowConflictModal(false);

    try {
      const response = await CLIService.writeDocument(decodedPath, editContent);

      if (response.success && response.data) {
        setHasUnsavedChanges(false);
        setConflictInfo(null);
        updateDocument({
          content: editContent, // 更新为保存的内容
          metadata: {
            lastModified: response.data.lastModified, // 更新时间戳
          },
        });
        // 重置文件监听器
        fileWatcher.reset();
      } else {
        alert(`强制保存失败: ${response.error?.message || "未知错误"}`);
      }
    } catch (error) {
      console.error("强制保存失败:", error);
      alert(
        `强制保存失败: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsSaving(false);
    }
  }, [decodedPath, editContent, updateDocument, fileWatcher]);

  // 处理冲突 - 刷新重载
  const handleReload = useCallback(async () => {
    setShowConflictModal(false);
    setConflictInfo(null);
    await refreshDocument();
    setIsEditing(false);
    setHasUnsavedChanges(false);
  }, [refreshDocument]);

  // 处理未保存提示 - 放弃更改
  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
    setIsEditing(false);
    setHasUnsavedChanges(false);
    if (document) {
      setEditContent(document.content);
    }
  }, [document]);

  // 处理未保存提示 - 继续编辑
  const handleContinueEditing = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  }, []);

  // 处理评论提交
  const handleCommentSubmit = useCallback(
    async (content: string, author?: string) => {
      if (!selectedAnchor) {
        console.error('[DocumentView] 提交评论失败: selectedAnchor 为空');
        return;
      }

      console.log('[DocumentView] 提交评论, anchor:', selectedAnchor);
      console.log('[DocumentView] 评论内容:', content);
      console.log('[DocumentView] 作者:', author);

      const comment = await addComment({
        content,
        author: author || "Anonymous",
        anchor: selectedAnchor,
      });

      console.log('[DocumentView] 评论提交结果:', comment);

      if (comment) {
        console.log('[DocumentView] ✅ 评论提交成功');
        setShowCommentForm(false);
        setSelectedAnchor(null);
        clearSelection();
        // 自动打开评论面板显示新添加的评论
        setIsCommentPanelOpen(true);
      } else {
        console.error('[DocumentView] ❌ 评论提交失败');
      }
    },
    [selectedAnchor, addComment, clearSelection]
  );

  // 取消评论表单
  const handleCommentCancel = useCallback(() => {
    setShowCommentForm(false);
    setSelectedAnchor(null);
    clearSelection();
  }, [clearSelection]);

  // 切换评论面板
  const handleToggleCommentPanel = useCallback(() => {
    setIsCommentPanelOpen((prev) => !prev);
  }, []);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gh-canvas-default">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gh-accent-emphasis mx-auto mb-4"></div>
          <p className="text-gh-fg-muted">加载文档中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gh-canvas-default p-8">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 text-gh-danger-fg mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gh-danger-fg mb-2">
            加载失败
          </h2>
          <p className="text-gh-fg-muted mb-4">{error}</p>
          <button
            onClick={refreshDocument}
            className="px-4 py-2 bg-gh-btn-bg text-gh-btn-text rounded-md hover:bg-gh-btn-hover-bg transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // 文档未找到
  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gh-canvas-default p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gh-fg-default mb-2">
            文档未找到
          </h2>
          <p className="text-gh-fg-muted">请从侧边栏选择要查看的文档</p>
        </div>
      </div>
    );
  }

  // 正常渲染文档
  return (
    <div className="flex-1 flex flex-col bg-gh-canvas-default overflow-hidden">
      {/* 文档头部 */}
      <div className="border-b border-gh-border-default bg-gh-canvas-subtle">
        <div className="px-8 py-4">
          {/* 面包屑导航 */}
          <nav className="flex items-center gap-2 text-sm mb-3">
            {/* 首页按钮 */}
            <button
              onClick={handleHomeClick}
              className="text-gh-accent-fg hover:underline flex items-center gap-1"
              title="返回首页"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              首页
            </button>

            {/* 路径分隔符和路径部分 */}
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <svg
                  className="w-4 h-4 text-gh-fg-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {crumb.isLast ? (
                  <span className="text-gh-fg-default font-semibold">
                    {crumb.name}
                  </span>
                ) : (
                  <span className="text-gh-fg-muted">{crumb.name}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* 文档标题和元信息 */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gh-fg-default truncate">
                {document.displayName}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gh-fg-muted">
                <span>{document.metadata.lineCount} 行</span>
                <span>{formatFileSize(document.metadata.size)}</span>
                <span>
                  最后修改: {formatDate(document.metadata.lastModified)}
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2 ml-4">
              {!isEditing ? (
                <>
                  {commentsEnabled && (
                    <button
                      onClick={handleToggleCommentPanel}
                      className="px-3 py-2 text-sm bg-gh-btn-bg text-gh-btn-text rounded-md hover:bg-gh-btn-hover-bg transition-colors flex items-center gap-2"
                      title="查看评论"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                        />
                      </svg>
                      评论
                      {comments.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-gh-accent-emphasis text-white rounded-full">
                          {comments.length}
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleToggleEdit}
                    className="px-3 py-2 text-sm bg-gh-accent-emphasis text-white rounded-md hover:bg-gh-accent-emphasis/90 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    编辑
                  </button>
                  <button
                    onClick={refreshDocument}
                    className="px-3 py-2 text-sm bg-gh-btn-bg text-gh-btn-text rounded-md hover:bg-gh-btn-hover-bg transition-colors flex items-center gap-2"
                    title="刷新文档"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    刷新
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || isSaving}
                    className={`
                      px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2
                      ${
                        hasUnsavedChanges && !isSaving
                          ? "bg-gh-success-emphasis text-white hover:bg-gh-success-emphasis/90"
                          : "bg-gh-btn-bg text-gh-fg-muted cursor-not-allowed"
                      }
                    `}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        保存中...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                          />
                        </svg>
                        保存 {hasUnsavedChanges && "*"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleToggleEdit}
                    className="px-3 py-2 text-sm bg-gh-btn-bg text-gh-btn-text rounded-md hover:bg-gh-btn-hover-bg transition-colors"
                  >
                    取消
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 文档内容 */}
      {!isEditing ? (
        <div
          className="flex-1 overflow-y-auto relative"
          ref={viewerContainerRef}
        >
          <Viewer content={document.content} onLinkClick={handleLinkClick} />

          {/* 自定义文本高亮层（用于显示选中的文本） */}
          {selection && commentsEnabled && selection.rects && (
            <>
              {selection.rects.map((rect, index) => (
                <div
                  key={index}
                  className="fixed pointer-events-none z-20 transition-opacity duration-150"
                  style={{
                    left: `${rect.left}px`,
                    top: `${rect.top - 3}px`, // 向上偏移 3px
                    width: `${rect.width}px`,
                    height: `${rect.height + 6}px`, // 增加 6px 高度 (上下各 3px)
                    backgroundColor: "rgba(250, 219, 20, 0.4)", // #fadb14 40% 透明度
                  }}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-0">
          <Editor
            content={editContent}
            onChange={handleContentChange}
            onSave={handleSave}
          />
          <Preview content={editContent} onLinkClick={handleLinkClick} />
        </div>
      )}

      {/* 评论面板 */}
      {commentsEnabled && (
        <CommentPanel
          isOpen={isCommentPanelOpen}
          onClose={() => setIsCommentPanelOpen(false)}
          comments={comments}
          onAddComment={async (content, parentId) => {
            // 回复评论时，使用父评论的 anchor
            if (parentId) {
              const parentComment = comments.find((c) => c.id === parentId);
              if (parentComment && document) {
                await addComment({
                  content,
                  author: "Anonymous",
                  anchor: parentComment.anchor,
                  parentId,
                });
              }
            } else {
              console.warn("添加顶级评论请使用文本选择功能");
            }
          }}
          onEditComment={async (commentId, content) => {
            await updateComment(commentId, { content });
          }}
          onDeleteComment={async (commentId) => {
            await deleteComment(commentId);
          }}
          onResolveComment={async (commentId) => {
            await resolveComment(commentId);
          }}
          onReopenComment={async (commentId) => {
            await reopenComment(commentId);
          }}
          documentName={document?.displayName}
        />
      )}

      {/* 评论表单 Modal */}
      {showCommentForm && selectedAnchor && (
        <Modal
          isOpen={showCommentForm}
          onClose={handleCommentCancel}
          title="添加评论"
          size="md"
        >
          <CommentForm
            onSubmit={handleCommentSubmit}
            onCancel={handleCommentCancel}
            selectedText={selectedAnchor.textFragment}
          />
        </Modal>
      )}

      {/* 冲突提示 Modal */}
      <Modal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        title="文件冲突"
        size="md"
        buttons={[
          {
            label: "刷新并重载",
            onClick: handleReload,
            variant: "secondary",
          },
          {
            label: "强制保存",
            onClick: handleForceSave,
            variant: "danger",
            autoFocus: true,
          },
        ]}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-gh-attention-fg flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="font-semibold mb-2">文件已被外部修改</p>
              <p className="text-sm text-gh-fg-muted">
                该文件在编辑期间被外部程序修改。你可以选择:
              </p>
              <ul className="list-disc list-inside text-sm text-gh-fg-muted mt-2 space-y-1">
                <li>
                  <strong>刷新并重载</strong>: 放弃当前更改,加载最新版本
                </li>
                <li>
                  <strong>强制保存</strong>: 覆盖外部更改,保存当前内容
                </li>
              </ul>
              {conflictInfo && (
                <div className="mt-3 p-3 bg-gh-canvas-subtle rounded text-xs font-mono">
                  <div>
                    预期修改时间:{" "}
                    {new Date(conflictInfo.expectedMtime).toLocaleString(
                      "zh-CN"
                    )}
                  </div>
                  <div>
                    实际修改时间:{" "}
                    {new Date(conflictInfo.actualMtime).toLocaleString("zh-CN")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* 未保存提示 Modal */}
      <Modal
        isOpen={showUnsavedModal}
        onClose={handleContinueEditing}
        title="未保存的更改"
        size="sm"
        buttons={[
          {
            label: "继续编辑",
            onClick: handleContinueEditing,
            variant: "secondary",
          },
          {
            label: "放弃更改",
            onClick: handleDiscardChanges,
            variant: "danger",
            autoFocus: true,
          },
        ]}
      >
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-gh-attention-fg flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="font-semibold mb-2">你有未保存的更改</p>
            <p className="text-sm text-gh-fg-muted">
              如果离开编辑模式,你的更改将会丢失。确定要继续吗?
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentView;
