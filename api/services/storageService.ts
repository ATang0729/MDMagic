import fs from 'fs/promises';
import path from 'path';
import { Rule } from './aiService';

// 数据存储路径
const DATA_DIR = path.join(process.cwd(), 'data');
const RULES_FILE = path.join(DATA_DIR, 'rules.json');
const RULE_SETS_FILE = path.join(DATA_DIR, 'rule-sets.json');
const HISTORY_FILE = path.join(DATA_DIR, 'conversion-history.json');

export interface RuleSet {
  id: string;
  name: string;
  description: string;
  ruleIds: string[];
  createdAt: string;
}

export interface ConversionHistory {
  id: string;
  originalContent: string;
  convertedContent: string;
  appliedRuleIds: string[];
  createdAt: string;
}

export interface RulesData {
  rules: Rule[];
}

export interface RuleSetsData {
  ruleSets: RuleSet[];
}

export interface HistoryData {
  history: ConversionHistory[];
}

export class StorageService {
  /**
   * 初始化存储目录和文件
   */
  static async initialize(): Promise<void> {
    try {
      // 创建数据目录
      await fs.mkdir(DATA_DIR, { recursive: true });

      // 初始化规则文件
      if (!await this.fileExists(RULES_FILE)) {
        await this.saveRules([]);
      }

      // 初始化规则集文件
      if (!await this.fileExists(RULE_SETS_FILE)) {
        await this.saveRuleSets([]);
      }

      // 初始化历史文件
      if (!await this.fileExists(HISTORY_FILE)) {
        await this.saveHistory([]);
      }
    } catch (error) {
      console.error('存储服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查文件是否存在
   */
  private static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 读取JSON文件
   */
  private static async readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`读取文件失败 ${filePath}:`, error);
      return defaultValue;
    }
  }

  /**
   * 写入JSON文件
   */
  private static async writeJsonFile<T>(filePath: string, data: T): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`写入文件失败 ${filePath}:`, error);
      throw error;
    }
  }

  // ==================== 规则管理 ====================

  /**
   * 获取所有规则
   */
  static async getRules(): Promise<Rule[]> {
    const data = await this.readJsonFile<RulesData>(RULES_FILE, { rules: [] });
    return data.rules;
  }

  /**
   * 保存规则
   */
  static async saveRules(rules: Rule[]): Promise<void> {
    await this.writeJsonFile<RulesData>(RULES_FILE, { rules });
  }

  /**
   * 添加规则
   */
  static async addRules(newRules: Rule[]): Promise<Rule[]> {
    const existingRules = await this.getRules();
    const updatedRules = [...existingRules, ...newRules];
    await this.saveRules(updatedRules);
    return updatedRules;
  }

  /**
   * 根据ID获取规则
   */
  static async getRuleById(id: string): Promise<Rule | null> {
    const rules = await this.getRules();
    return rules.find(rule => rule.id === id) || null;
  }

  /**
   * 根据IDs获取规则
   */
  static async getRulesByIds(ids: string[]): Promise<Rule[]> {
    const rules = await this.getRules();
    return rules.filter(rule => rule.id && ids.includes(rule.id));
  }

  /**
   * 更新规则
   */
  static async updateRule(id: string, updatedRule: Partial<Rule>): Promise<Rule | null> {
    const rules = await this.getRules();
    const index = rules.findIndex(rule => rule.id === id);
    
    if (index === -1) {
      return null;
    }

    rules[index] = {
      ...rules[index],
      ...updatedRule,
      updatedAt: new Date().toISOString()
    };

    await this.saveRules(rules);
    return rules[index];
  }

  /**
   * 删除规则
   */
  static async deleteRule(id: string): Promise<boolean> {
    const rules = await this.getRules();
    const filteredRules = rules.filter(rule => rule.id !== id);
    
    if (filteredRules.length === rules.length) {
      return false; // 没有找到要删除的规则
    }

    await this.saveRules(filteredRules);
    return true;
  }

  // ==================== 规则集管理 ====================

  /**
   * 获取所有规则集
   */
  static async getRuleSets(): Promise<RuleSet[]> {
    const data = await this.readJsonFile<RuleSetsData>(RULE_SETS_FILE, { ruleSets: [] });
    return data.ruleSets;
  }

  /**
   * 保存规则集
   */
  static async saveRuleSets(ruleSets: RuleSet[]): Promise<void> {
    await this.writeJsonFile<RuleSetsData>(RULE_SETS_FILE, { ruleSets });
  }

  /**
   * 添加规则集
   */
  static async addRuleSet(ruleSet: Omit<RuleSet, 'id' | 'createdAt'>): Promise<RuleSet> {
    const ruleSets = await this.getRuleSets();
    const newRuleSet: RuleSet = {
      id: `set_${Date.now()}`,
      ...ruleSet,
      createdAt: new Date().toISOString()
    };
    
    ruleSets.push(newRuleSet);
    await this.saveRuleSets(ruleSets);
    return newRuleSet;
  }

  /**
   * 根据ID获取规则集
   */
  static async getRuleSetById(id: string): Promise<RuleSet | null> {
    const ruleSets = await this.getRuleSets();
    return ruleSets.find(set => set.id === id) || null;
  }

  /**
   * 更新规则集
   */
  static async updateRuleSet(id: string, updatedRuleSet: Partial<RuleSet>): Promise<RuleSet | null> {
    const ruleSets = await this.getRuleSets();
    const index = ruleSets.findIndex(set => set.id === id);
    
    if (index === -1) {
      return null;
    }

    ruleSets[index] = {
      ...ruleSets[index],
      ...updatedRuleSet
    };

    await this.saveRuleSets(ruleSets);
    return ruleSets[index];
  }

  /**
   * 删除规则集
   */
  static async deleteRuleSet(id: string): Promise<boolean> {
    const ruleSets = await this.getRuleSets();
    const filteredRuleSets = ruleSets.filter(set => set.id !== id);
    
    if (filteredRuleSets.length === ruleSets.length) {
      return false;
    }

    await this.saveRuleSets(filteredRuleSets);
    return true;
  }

  // ==================== 转换历史管理 ====================

  /**
   * 获取转换历史
   */
  static async getHistory(): Promise<ConversionHistory[]> {
    const data = await this.readJsonFile<HistoryData>(HISTORY_FILE, { history: [] });
    return data.history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * 保存转换历史
   */
  static async saveHistory(history: ConversionHistory[]): Promise<void> {
    await this.writeJsonFile<HistoryData>(HISTORY_FILE, { history });
  }

  /**
   * 添加转换历史记录
   */
  static async addHistoryRecord(record: Omit<ConversionHistory, 'id' | 'createdAt'>): Promise<ConversionHistory> {
    const history = await this.getHistory();
    const newRecord: ConversionHistory = {
      id: `conv_${Date.now()}`,
      ...record,
      createdAt: new Date().toISOString()
    };
    
    history.unshift(newRecord); // 添加到开头
    
    // 限制历史记录数量（保留最近100条）
    if (history.length > 100) {
      history.splice(100);
    }
    
    await this.saveHistory(history);
    return newRecord;
  }

  /**
   * 清空转换历史
   */
  static async clearHistory(): Promise<void> {
    await this.saveHistory([]);
  }

  /**
   * 根据ID删除历史记录
   */
  static async deleteHistoryRecord(id: string): Promise<boolean> {
    const history = await this.getHistory();
    const filteredHistory = history.filter(record => record.id !== id);
    
    if (filteredHistory.length === history.length) {
      return false;
    }

    await this.saveHistory(filteredHistory);
    return true;
  }
}