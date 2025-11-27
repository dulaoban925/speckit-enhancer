import { existsSync } from "fs";
import path from "path";
import { FileSystemService } from "../services/fileSystem.js";

/**
 * 项目模型
 * 表示一个 Spec-Kit 项目
 */
export interface Project {
  rootPath: string;
  name: string;
  hasConstitution: boolean;
  features: Feature[];
}

export interface Feature {
  id: string;
  name: string;
  path: string;
}

/**
 * 项目操作类
 */
export class ProjectModel {
  /**
   * 验证并加载项目
   */
  static loadProject(projectPath: string): {
    success: boolean;
    data?: Project;
    error?: string;
  } {
    try {
      const rootPath = path.resolve(projectPath);

      // 检查 .specify 目录
      const specifyDir = path.join(rootPath, ".specify");
      if (!existsSync(specifyDir)) {
        return {
          success: false,
          error: "无效的 Spec-Kit 项目: 缺少 .specify/ 目录",
        };
      }

      // 检查宪章文件
      const constitutionPath = path.join(
        specifyDir,
        "memory",
        "constitution.md"
      );
      const hasConstitution = existsSync(constitutionPath);

      // 扫描特性目录
      const specsDir = path.join(rootPath, "specs");
      let features: Feature[] = [];

      if (existsSync(specsDir)) {
        const listResult = FileSystemService.listDirectory(specsDir);
        if (listResult.success && listResult.data) {
          features = listResult.data
            .filter((entry) => entry.isDirectory && /^\d{3}-/.test(entry.name))
            .map((entry) => {
              const match = entry.name.match(/^(\d{3})-(.+)$/);
              return {
                id: entry.name, // Use full directory name as ID (e.g., "002-feature-dashboard")
                name: match?.[2] || entry.name,
                path: path.join(specsDir, entry.name),
              };
            })
            .sort((a, b) => a.id.localeCompare(b.id));
        }
      }

      return {
        success: true,
        data: {
          rootPath,
          name: "Speckit Enhancer", // 项目名称
          hasConstitution,
          features,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `加载项目失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }
}
