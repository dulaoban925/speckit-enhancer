/**
 * enhancer.ts 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import {
  checkSpeckitAvailable,
  enhanceClaudeCommand,
  injectConstitutionConstraints,
} from '../../../../src/lib/project/enhancer.js';

// Mock dependencies
vi.mock('execa');
vi.mock('../../../../src/lib/fs.js');

describe('enhancer', () => {
  const mockProjectRoot = '/test/project';
  const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();
  });

  describe('checkSpeckitAvailable', () => {
    it('should return true when speckit CLI is available', async () => {
      const { execa } = await import('execa');
      vi.mocked(execa).mockResolvedValueOnce({
        stdout: '1.0.0',
        stderr: '',
      } as any);

      const result = await checkSpeckitAvailable();
      expect(result).toBe(true);
      expect(execa).toHaveBeenCalledWith('speckit', ['--version']);
    });

    it('should return false when speckit CLI is not available', async () => {
      const { execa } = await import('execa');
      vi.mocked(execa).mockRejectedValueOnce(new Error('Command not found'));

      const result = await checkSpeckitAvailable();
      expect(result).toBe(false);
    });
  });

  describe('enhanceClaudeCommand', () => {
    it('should enhance Claude command file successfully', async () => {
      const { fileExists, readProjectFile, atomicWriteFile } = await import(
        '../../../../src/lib/fs.js'
      );

      vi.mocked(fileExists).mockResolvedValueOnce(true);
      vi.mocked(readProjectFile).mockResolvedValueOnce(`
# Speckit Plan Command

## Outline

Content here...
`);
      vi.mocked(atomicWriteFile).mockResolvedValueOnce(undefined);

      const result = await enhanceClaudeCommand(mockProjectRoot);

      expect(result).toBe(true);
      expect(fileExists).toHaveBeenCalledWith(
        path.join(mockProjectRoot, '.claude/commands/speckit.plan.md')
      );
      expect(readProjectFile).toHaveBeenCalled();
      expect(atomicWriteFile).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('已修改 /speckit.plan 命令')
      );
    });

    it('should skip enhancement if file does not exist', async () => {
      const { fileExists } = await import('../../../../src/lib/fs.js');

      vi.mocked(fileExists).mockResolvedValueOnce(false);

      const result = await enhanceClaudeCommand(mockProjectRoot);

      expect(result).toBe(false);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('未找到')
      );
    });

    it('should skip enhancement if already enhanced', async () => {
      const { fileExists, readProjectFile } = await import(
        '../../../../src/lib/fs.js'
      );

      vi.mocked(fileExists).mockResolvedValueOnce(true);
      vi.mocked(readProjectFile).mockResolvedValueOnce(`
# Speckit Plan Command

## 自定义分支规则(可选)

Already enhanced...

## Outline

Content here...
`);

      const result = await enhanceClaudeCommand(mockProjectRoot);

      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('已经增强过')
      );
    });

    it('should include branch prefix in enhancement', async () => {
      const { fileExists, readProjectFile, atomicWriteFile } = await import(
        '../../../../src/lib/fs.js'
      );

      vi.mocked(fileExists).mockResolvedValueOnce(true);
      vi.mocked(readProjectFile).mockResolvedValueOnce(`
# Speckit Plan Command

## Outline

Content here...
`);

      let writtenContent = '';
      vi.mocked(atomicWriteFile).mockImplementation(async (path, content) => {
        writtenContent = content;
      });

      const result = await enhanceClaudeCommand(mockProjectRoot, 'feature/');

      expect(result).toBe(true);
      expect(writtenContent).toContain('默认分支前缀: `feature/`');
    });

    it('should handle errors gracefully', async () => {
      const { fileExists, readProjectFile } = await import(
        '../../../../src/lib/fs.js'
      );

      vi.mocked(fileExists).mockResolvedValueOnce(true);
      vi.mocked(readProjectFile).mockRejectedValueOnce(
        new Error('Read error')
      );

      const result = await enhanceClaudeCommand(mockProjectRoot);

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('增强 Claude 命令失败')
      );
    });
  });

  describe('injectConstitutionConstraints', () => {
    it('should inject constitution constraints successfully', async () => {
      const { fileExists, readProjectFile, atomicWriteFile } = await import(
        '../../../../src/lib/fs.js'
      );

      // Constitution file exists
      vi.mocked(fileExists)
        .mockResolvedValueOnce(true) // .specify/memory/constitution.md
        .mockResolvedValueOnce(true); // CLAUDE.md

      vi.mocked(readProjectFile).mockResolvedValueOnce(`
# Project Overview

Overview content...

## Project Architecture

Architecture content...
`);

      vi.mocked(atomicWriteFile).mockResolvedValueOnce(undefined);

      const result = await injectConstitutionConstraints(mockProjectRoot);

      expect(result).toBe(true);
      expect(atomicWriteFile).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('已在 CLAUDE.md 中注入宪章约束')
      );
    });

    it('should skip injection if constitution file does not exist', async () => {
      const { fileExists } = await import('../../../../src/lib/fs.js');

      // No constitution file exists
      vi.mocked(fileExists)
        .mockResolvedValueOnce(false) // .specify/memory/constitution.md
        .mockResolvedValueOnce(false); // constitution.md

      const result = await injectConstitutionConstraints(mockProjectRoot);

      expect(result).toBe(false);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('未找到宪章文件')
      );
    });

    it('should skip injection if CLAUDE.md does not exist', async () => {
      const { fileExists } = await import('../../../../src/lib/fs.js');

      // Constitution exists but CLAUDE.md does not
      vi.mocked(fileExists)
        .mockResolvedValueOnce(true) // .specify/memory/constitution.md
        .mockResolvedValueOnce(false); // CLAUDE.md

      const result = await injectConstitutionConstraints(mockProjectRoot);

      expect(result).toBe(false);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('未找到')
      );
    });

    it('should skip injection if already injected', async () => {
      const { fileExists, readProjectFile } = await import(
        '../../../../src/lib/fs.js'
      );

      vi.mocked(fileExists)
        .mockResolvedValueOnce(true) // .specify/memory/constitution.md
        .mockResolvedValueOnce(true); // CLAUDE.md

      vi.mocked(readProjectFile).mockResolvedValueOnce(`
# Project Overview

## Constitution Constraints

Already injected...

## Project Architecture

Architecture content...
`);

      const result = await injectConstitutionConstraints(mockProjectRoot);

      expect(result).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('已经注入宪章约束')
      );
    });

    it('should inject before Project Overview if Architecture not found', async () => {
      const { fileExists, readProjectFile, atomicWriteFile } = await import(
        '../../../../src/lib/fs.js'
      );

      vi.mocked(fileExists)
        .mockResolvedValueOnce(true) // .specify/memory/constitution.md
        .mockResolvedValueOnce(true); // CLAUDE.md

      vi.mocked(readProjectFile).mockResolvedValueOnce(`
# Project Overview

Overview content...

## Some Other Section

Other content...
`);

      let writtenContent = '';
      vi.mocked(atomicWriteFile).mockImplementation(async (path, content) => {
        writtenContent = content;
      });

      const result = await injectConstitutionConstraints(mockProjectRoot);

      expect(result).toBe(true);
      expect(writtenContent).toContain('## Constitution Constraints');
      expect(writtenContent).toContain('## Some Other Section');
    });

    it('should append to end if no sections found', async () => {
      const { fileExists, readProjectFile, atomicWriteFile } = await import(
        '../../../../src/lib/fs.js'
      );

      vi.mocked(fileExists)
        .mockResolvedValueOnce(true) // .specify/memory/constitution.md
        .mockResolvedValueOnce(true); // CLAUDE.md

      vi.mocked(readProjectFile).mockResolvedValueOnce(`
# Some Title

Some content without sections...
`);

      let writtenContent = '';
      vi.mocked(atomicWriteFile).mockImplementation(async (path, content) => {
        writtenContent = content;
      });

      const result = await injectConstitutionConstraints(mockProjectRoot);

      expect(result).toBe(true);
      expect(writtenContent).toContain('## Constitution Constraints');
    });

    it('should handle errors gracefully', async () => {
      const { fileExists, readProjectFile } = await import(
        '../../../../src/lib/fs.js'
      );

      vi.mocked(fileExists)
        .mockResolvedValueOnce(true) // .specify/memory/constitution.md
        .mockResolvedValueOnce(true); // CLAUDE.md

      vi.mocked(readProjectFile).mockRejectedValueOnce(
        new Error('Read error')
      );

      const result = await injectConstitutionConstraints(mockProjectRoot);

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('注入宪章约束失败')
      );
    });
  });
});
