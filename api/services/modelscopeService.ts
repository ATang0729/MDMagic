/**
 * 魔搭社区AI服务
 * 使用魔搭社区的API进行样式提取和转换
 */

import OpenAI from 'openai';

// 定义Rule接口，确保类型一致性
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

export interface ModelscopeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * 魔搭社区AI服务类
 */
export class ModelscopeService {
  private client: OpenAI;
  private model = 'Qwen/Qwen2.5-Coder-32B-Instruct';

  constructor() {
    const token = process.env.MODELSCOPE_ACCESS_TOKEN;
    
    if (!token || token === 'your_modelscope_access_token_here') {
      console.warn('MODELSCOPE_ACCESS_TOKEN 环境变量未配置或使用默认占位符，魔搭社区服务将不可用');
      this.client = null;
      return;
    }

    this.client = new OpenAI({
      apiKey: token,
      baseURL: 'https://api-inference.modelscope.cn/v1/'
    });

    console.log('魔搭社区API 初始化成功');
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<ModelscopeResponse> {
    if (!this.client) {
      return {
        success: false,
        error: 'MODELSCOPE_ACCESS_TOKEN 未配置'
      };
    }
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: '请回复"连接成功"'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      });

      return {
        success: true,
        data: {
          status: 'connected',
          message: response.choices[0]?.message?.content || '连接成功',
          model: this.model,
          version: '1.0.0'
        }
      };
    } catch (error) {
      console.error('魔搭社区API连接测试失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '连接失败'
      };
    }
  }

  /**
   * 样式提取
   */
  async extractStyles(content: string, styleTypes?: string[]): Promise<ModelscopeResponse> {
    if (!this.client) {
      return {
        success: false,
        error: 'MODELSCOPE_ACCESS_TOKEN 未配置'
      };
    }
    
    try {
      const prompt = this.buildExtractPrompt(content, styleTypes);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个Markdown样式分析专家，专门从文本中提取格式规则。必须严格返回JSON格式，禁止任何非JSON内容。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const result = response.choices[0]?.message?.content;
      
      if (!result) {
        throw new Error('API返回空结果');
      }

      // 解析JSON响应
      const parsedResult = this.parseExtractResponse(result);
      
      // 检查解析结果是否有效
      if (!parsedResult.rules || parsedResult.rules.length === 0) {
        throw new Error('JSON解析成功但未提取到有效规则');
      }
      
      return {
        success: true,
        ...parsedResult
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '样式提取失败';
      console.error('魔搭社区样式提取失败:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 样式转换
   */
  async convertStyles(content: string, rules: Rule[], targetStyle?: string): Promise<ModelscopeResponse> {
    if (!this.client) {
      return {
        success: false,
        error: 'MODELSCOPE_ACCESS_TOKEN 未配置'
      };
    }
    
    try {
      const prompt = this.buildConvertPrompt(content, rules, targetStyle);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个Markdown样式转换专家，根据给定规则转换文本格式。请严格按照JSON格式返回结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 3000,
        temperature: 0.2
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('API返回空结果');
      }

      // 解析JSON响应
      const parsedResult = this.parseConvertResponse(result);
      return {
        success: true,
        ...parsedResult
      };
    } catch (error) {
      console.error('魔搭社区样式转换失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '样式转换失败'
      };
    }
  }

  /**
   * 构建样式提取提示词
   */
  private buildExtractPrompt(content: string, styleTypes?: string[]): string {
    const typesText = styleTypes && styleTypes.length > 0 ? styleTypes.join(', ') : '所有可识别的样式类型';
    return `你是一个Markdown样式分析专家，专门从文本中提取格式规则。

重要要求：
1. 必须严格返回JSON格式
2. 禁止返回任何解释、说明或其他文字
3. 禁止使用markdown代码块包装
4. 禁止添加任何前缀或后缀
5. 响应必须以{开始，以}结束

分析以下Markdown文本，提取其中的样式规则：

${content}

需要提取的样式类型：${typesText}

返回格式（严格遵循）：
{
  "rules": [
    {
      "id": "rule_类型_时间戳",
      "type": "样式类型",
      "name": "规则名称",
      "description": "规则描述",
      "pattern": "样式模式",
      "examples": ["示例1", "示例2"],
      "createdAt": "ISO时间戳",
      "updatedAt": "ISO时间戳"
    }
  ],
  "summary": "提取结果摘要",
  "confidence": 0.95
}

警告：任何非JSON内容都将导致解析失败！只返回纯JSON对象！`;
  }

  /**
   * 构建样式转换提示词
   */
  private buildConvertPrompt(content: string, rules: Rule[], targetStyle?: string): string {
    const rulesText = rules.map(rule => 
      `- ${rule.name || rule.type}: ${rule.pattern} (${rule.description})`
    ).join('\n');

    return `请根据以下规则转换Markdown文本${targetStyle ? `为${targetStyle}风格` : ''}：

原始文本：
\`\`\`
${content}
\`\`\`

应用规则：
${rulesText}

请返回JSON格式的结果：
{
  "convertedContent": "转换后的文本",
  "appliedRules": [
    {
      "name": "规则名称",
      "applied": true,
      "description": "应用描述"
    }
  ],
  "summary": "转换结果摘要",
  "confidence": 0.9
}

只返回JSON，不要其他文字。`;
  }

  /**
   * 解析样式提取响应
   */
  private parseExtractResponse(response: string): any {
    try {
      // 清理响应字符串
      let cleanResponse = response.trim();
      
      // 移除可能的markdown代码块标记
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      
      // 尝试提取JSON部分
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        
        // 修复常见的JSON格式问题
        jsonStr = this.fixJsonString(jsonStr);
        
        const parsed = JSON.parse(jsonStr);
        
        // 确保规则有必要的字段
        if (parsed.rules && Array.isArray(parsed.rules)) {
          parsed.rules = parsed.rules.map((rule: any) => ({
            ...rule,
            id: rule.id || `rule_${rule.type}_${Date.now()}`,
            createdAt: rule.createdAt || new Date().toISOString(),
            updatedAt: rule.updatedAt || new Date().toISOString()
          }));
        }
        
        return parsed;
      }
      
      throw new Error('无法从响应中提取JSON内容');
    } catch (error) {
      console.error('解析提取响应失败:', error);
      console.error('原始响应:', response.substring(0, 1000) + (response.length > 1000 ? '...' : ''));
      // 重新抛出异常以触发重试机制
      throw error;
    }
  }

  /**
   * 解析样式转换响应
   */
  private parseConvertResponse(response: string): any {
    try {
      // 清理响应字符串
      let cleanResponse = response.trim();
      
      // 移除可能的markdown代码块标记
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      
      // 尝试提取JSON部分
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        
        // 修复常见的JSON格式问题
        jsonStr = this.fixJsonString(jsonStr);
        
        return JSON.parse(jsonStr);
      }
      
      throw new Error('无法解析JSON响应');
    } catch (error) {
      console.error('解析转换响应失败:', error);
      return {
        convertedContent: '',
        appliedRules: [],
        summary: '解析失败',
        confidence: 0
      };
    }
  }

  /**
   * 修复JSON字符串中的常见问题
   */
  private fixJsonString(jsonStr: string): string {
    // 修复常见的转义字符问题
    jsonStr = jsonStr
      // 修复单独的反斜杠
      .replace(/\\(?!["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '\\\\')
      // 修复未转义的双引号（在字符串值中）
      .replace(/"([^"]*?)(?<!\\)"([^"]*?)(?<!\\)"/g, (match, p1, p2) => {
        // 如果是键值对的格式，不修改
        if (p2.trim().startsWith(':')) {
          return match;
        }
        // 转义内部的双引号
        return `"${p1.replace(/"/g, '\\"')}"${p2.replace(/"/g, '\\"')}"`;
      })
      // 修复换行符
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      // 修复制表符
      .replace(/\t/g, '\\t');
    
    return jsonStr;
  }
}

// 导出单例实例
let modelscopeService: ModelscopeService | null = null;

export const getModelscopeService = (): ModelscopeService => {
  if (!modelscopeService) {
    modelscopeService = new ModelscopeService();
  }
  return modelscopeService;
};