/**
 * init 命令集成测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInitCommand } from '../../../src/commands/project/init.js';

describe('init command integration', () => {
  let command: ReturnType<typeof createInitCommand>;

  beforeEach(() => {
    command = createInitCommand();
  });

  describe('command structure', () => {
    it('should create init command with correct name', () => {
      expect(command.name()).toBe('init');
    });

    it('should have correct description', () => {
      expect(command.description()).toBe('初始化增强版 Spec-Kit 项目');
    });

    it('should have project-path argument', () => {
      // @ts-expect-error - accessing private property for testing
      const args = command._args;
      expect(args).toHaveLength(1);
      expect(args[0].name()).toBe('project-path');
      expect(args[0].defaultValue).toBe('.');
    });

    it('should have verbose option', () => {
      const options = command.options;
      const verboseOption = options.find((opt) => opt.long === '--verbose');
      expect(verboseOption).toBeDefined();
      expect(verboseOption?.short).toBe('-v');
      expect(verboseOption?.description).toBe('显示详细的初始化步骤');
    });

    it('should have skip-speckit option', () => {
      const options = command.options;
      const skipOption = options.find((opt) => opt.long === '--skip-speckit');
      expect(skipOption).toBeDefined();
      expect(skipOption?.description).toBe('跳过 speckit init 调用(假设已初始化)');
    });

    it('should have skip-enhancement option', () => {
      const options = command.options;
      const skipOption = options.find((opt) => opt.long === '--skip-enhancement');
      expect(skipOption).toBeDefined();
      expect(skipOption?.description).toBe('仅运行 speckit init,跳过增强');
    });

    it('should have branch-prefix option', () => {
      const options = command.options;
      const branchOption = options.find((opt) => opt.long === '--branch-prefix');
      expect(branchOption).toBeDefined();
      expect(branchOption?.description).toBe('自定义分支前缀(如 "feature/")');
    });

    it('should have all 4 options defined', () => {
      expect(command.options).toHaveLength(4);
    });
  });

  describe('command action', () => {
    it('should have an action handler', () => {
      // Check that the command has an action registered
      // @ts-expect-error - accessing private property for testing
      expect(command._actionHandler).toBeDefined();
      // @ts-expect-error - accessing private property for testing
      expect(typeof command._actionHandler).toBe('function');
    });
  });

  describe('command help', () => {
    it('should generate help text', () => {
      const helpText = command.helpInformation();
      expect(helpText).toContain('init');
      expect(helpText).toContain('初始化增强版 Spec-Kit 项目');
      expect(helpText).toContain('--verbose');
      expect(helpText).toContain('--skip-speckit');
      expect(helpText).toContain('--skip-enhancement');
      expect(helpText).toContain('--branch-prefix');
    });
  });
});
