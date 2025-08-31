/**
 * API服务层 - 与后端API通信
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// 规则类型定义
export interface Rule {
  id?: string;
  type: string;
  name?: string;
  pattern: string;
  description: string;
  examples: string[];
  createdAt?: string;
  updatedAt?: string;
}

// 规则集类型定义
export interface RuleSet {
  id: string;
  name: string;
  description: string;
  ruleIds: string[];
  createdAt: string;
  updatedAt: string;
}

// 转换历史类型定义
export interface ConversionHistory {
  id: string;
  originalContent: string;
  convertedContent: string;
  appliedRules: Rule[];
  timestamp: string;
  createdAt: string;
}

// 样式提取响应类型
export interface ExtractStylesResponse {
  success: boolean;
  rules: Rule[];
  message: string;
}

// 样式转换响应类型
export interface ConvertStylesResponse {
  success: boolean;
  convertedContent: string;
  appliedRules: Rule[];
  message: string;
}

// HTTP请求工具函数
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  // GET请求
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST请求
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT请求
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient();

// ==================== 样式提取API ====================

/**
 * 从Markdown文本中提取样式规则
 */
export const extractStyles = async (
  content: string,
  extractTypes?: string[]
): Promise<ExtractStylesResponse> => {
  return apiClient.post<ExtractStylesResponse>('/markdown/extract', {
    content,
    extractTypes,
  });
};

// ==================== 样式转换API ====================

/**
 * 根据规则转换文本样式
 */
export const convertStyles = async (
  content: string,
  ruleIds: string[],
  targetStyle?: string
): Promise<ConvertStylesResponse> => {
  return apiClient.post<ConvertStylesResponse>('/markdown/convert', {
    content,
    ruleIds,
    targetStyle,
  });
};

// ==================== 规则管理API ====================

/**
 * 获取所有规则
 */
export const getRules = async (): Promise<{ success: boolean; rules: Rule[]; message: string }> => {
  return apiClient.get<{ success: boolean; rules: Rule[]; message: string }>('/markdown/rules');
};

/**
 * 添加新规则
 */
export const addRule = async (rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
  success: boolean;
  rule: Rule;
  message: string;
}> => {
  return apiClient.post<{ success: boolean; rule: Rule; message: string }>('/markdown/rules', rule);
};

/**
 * 创建新规则
 */
export const createRule = async (rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rule> => {
  const response = await fetch(`${API_BASE_URL}/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rule),
  });
  if (!response.ok) {
    throw new Error('Failed to create rule');
  }
  return response.json();
};

/**
 * 更新规则
 */
export const updateRule = async (
  id: string,
  rule: Partial<Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; rule: Rule; message: string }> => {
  return apiClient.put<{ success: boolean; rule: Rule; message: string }>(`/markdown/rules/${id}`, rule);
};

/**
 * 删除规则
 */
export const deleteRule = async (id: string): Promise<{ success: boolean; message: string }> => {
  return apiClient.delete<{ success: boolean; message: string }>(`/markdown/rules/${id}`);
};

// ==================== 规则集管理API ====================

/**
 * 获取所有规则集
 */
export const getRuleSets = async (): Promise<{
  success: boolean;
  ruleSets: RuleSet[];
  message: string;
}> => {
  return apiClient.get<{ success: boolean; ruleSets: RuleSet[]; message: string }>('/markdown/rule-sets');
};

/**
 * 创建规则集
 */
export const createRuleSet = async (ruleSet: {
  name: string;
  description?: string;
  ruleIds: string[];
}): Promise<{ success: boolean; ruleSet: RuleSet; message: string }> => {
  return apiClient.post<{ success: boolean; ruleSet: RuleSet; message: string }>('/markdown/rule-sets', ruleSet);
};

// ==================== 转换历史API ====================

/**
 * 获取转换历史
 */
export const getHistory = async (): Promise<{
  success: boolean;
  history: ConversionHistory[];
  message: string;
}> => {
  return apiClient.get<{ success: boolean; history: ConversionHistory[]; message: string }>('/markdown/history');
};

export const deleteHistory = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/history/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete history');
  }
};

/**
 * 删除历史记录
 */
export const deleteHistoryRecord = async (id: string): Promise<{ success: boolean; message: string }> => {
  return apiClient.delete<{ success: boolean; message: string }>(`/markdown/history/${id}`);
};

/**
 * 清空所有历史记录
 */
export const clearHistory = async (): Promise<{ success: boolean; message: string }> => {
  return apiClient.delete<{ success: boolean; message: string }>('/markdown/history');
};

// ==================== 测试API ====================

/**
 * 测试AI服务连接
 */
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  return apiClient.get<{ success: boolean; message: string }>('/markdown/test');
};

/**
 * 健康检查
 */
export const healthCheck = async (): Promise<{
  status: string;
  message: string;
  timestamp: string;
  version: string;
}> => {
  return apiClient.get<{
    status: string;
    message: string;
    timestamp: string;
    version: string;
  }>('/health');
};

export default {
  extractStyles,
  convertStyles,
  getRules,
  addRule,
  updateRule,
  deleteRule,
  getRuleSets,
  createRuleSet,
  getHistory,
  deleteHistoryRecord,
  clearHistory,
  testConnection,
  healthCheck,
};