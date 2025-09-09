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
  rules?: Rule[];
  convertedContent?: string;
  appliedRules?: any[];
  summary?: string;
  confidence?: number;
}

/**
 * 魔搭社区AI服务类
 */
export class ModelscopeService {
  private client: OpenAI;
  private model = process.env.MODELSCOPE_MODEL || "Qwen/Qwen3-30B-A3B-Instruct-2507";

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
      // console.log('model:', this.model);
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
        max_tokens: 20000,
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
        max_tokens: 30000,
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

警告：任何非JSON内容都将导致解析失败！只返回纯JSON对象！如果用户输入的 Markdown 文本如果本身不包含任何样式规则，则返回一个空的 JSON 对象。`;
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
      console.log('开始解析响应，原始长度:', response.length);
      
      // 清理响应字符串
      let cleanResponse = response.trim();
      console.log('清理后长度:', cleanResponse.length);
      
      // 移除可能的markdown代码块标记
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      console.log('移除代码块标记后长度:', cleanResponse.length);
      
      // 查找最后一个完整的JSON对象
      let jsonStr = '';
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      let jsonStart = -1;
      
      for (let i = 0; i < cleanResponse.length; i++) {
        const char = cleanResponse[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
        }
        
        if (!inString) {
          if (char === '{') {
            if (braceCount === 0) {
              jsonStart = i;
            }
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && jsonStart !== -1) {
              jsonStr = cleanResponse.substring(jsonStart, i + 1);
              break;
            }
          }
        }
      }
      
      if (!jsonStr) {
        // 如果没有找到完整的JSON，尝试原来的方法
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      if (jsonStr) {
        console.log('提取的JSON字符串前100字符:', jsonStr.substring(0, 100));
        console.log('JSON字符串长度:', jsonStr.length);
        
        // 检查JSON字符串的开头字符
        const firstChar = jsonStr.charCodeAt(0);
        console.log('JSON首字符:', jsonStr[0], '字符码:', firstChar);
        
        // 修复常见的JSON格式问题
        const originalJsonStr = jsonStr;
        jsonStr = this.fixJsonString(jsonStr);
        
        if (originalJsonStr !== jsonStr) {
          console.log('JSON字符串已修复，修复后前100字符:', jsonStr.substring(0, 100));
        }
        
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
        
        console.log('JSON解析成功，规则数量:', parsed.rules?.length || 0);
        return parsed;
      }
      
      throw new Error('无法从响应中提取JSON内容');
    } catch (error) {
      console.error('解析提取响应失败:', error);
      console.error('原始响应前500字符:', response.substring(0, 500));
      console.error('原始响应后500字符:', response.substring(Math.max(0, response.length - 500)));
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
   * 智能规则合并
   * 当创建新规则时，如果存在相同type的规则，则调用AI进行智能合并
   */
  async mergeRules(newRule: Rule, existingRules: Rule[]): Promise<ModelscopeResponse> {
    if (!this.client) {
      return {
        success: false,
        error: 'MODELSCOPE_ACCESS_TOKEN 未配置'
      };
    }
    
    try {
      console.log(`开始合并规则，新规则类型: ${newRule.type}，现有规则数量: ${existingRules.length}`);
      
      const prompt = this.buildMergePrompt(newRule, existingRules);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '你是一个Markdown规则合并专家，专门负责智能合并相同类型的规则。必须严格返回JSON格式，禁止任何非JSON内容。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
      });

      const result = response.choices[0]?.message?.content;
      
      if (!result) {
        throw new Error('API返回空结果');
      }

      // 解析JSON响应
      const parsedResult = this.parseMergeResponse(result);
      
      // 检查解析结果是否有效
      if (!parsedResult.mergedRule) {
        throw new Error('JSON解析成功但未获得合并后的规则');
      }
      
      // 确保合并后的规则有必要的字段
      const mergedRule = {
        ...parsedResult.mergedRule,
        id: newRule.id || `rule_${newRule.type}_${Date.now()}`,
        type: newRule.type,
        createdAt: existingRules[0]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log(`规则合并成功，合并后规则ID: ${mergedRule.id}`);
      
      return {
        success: true,
        data: {
          mergedRule,
          summary: parsedResult.summary || '规则合并完成',
          confidence: parsedResult.confidence || 0.9
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '规则合并失败';
      console.error('魔搭社区规则合并失败:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 构建规则合并提示词
   */
  private buildMergePrompt(newRule: Rule, existingRules: Rule[]): string {
    const existingRulesText = existingRules.map((rule, index) => 
      `现有规则${index + 1}:
` +
      `- 名称: ${rule.name || rule.type}
` +
      `- 描述: ${rule.description}
` +
      `- 模式: ${rule.pattern}
` +
      `- 示例: ${rule.examples.join(', ')}
`
    ).join('\n');

    return `你是一个Markdown规则合并专家，需要将新规则与现有的相同类型规则进行智能合并。

重要要求：
1. 必须严格返回JSON格式
2. 禁止返回任何解释、说明或其他文字
3. 禁止使用markdown代码块包装
4. 以新规则为准解决冲突
5. 智能合并pattern和examples，保留有价值的内容
6. 响应必须以{开始，以}结束

新规则：
- 名称: ${newRule.name || newRule.type}
- 描述: ${newRule.description}
- 模式: ${newRule.pattern}
- 示例: ${newRule.examples.join(', ')}

${existingRulesText}

合并策略：
1. 以新规则的name、description为准
2. 智能合并pattern，优先使用新规则的pattern，但可以扩展以兼容现有规则
3. 合并examples，去重并保留最有代表性的示例
4. 确保合并后的规则更加完善和准确

返回格式（严格遵循）：
{
  "mergedRule": {
    "name": "合并后的规则名称",
    "description": "合并后的规则描述",
    "pattern": "合并后的规则模式",
    "examples": ["合并后的示例1", "合并后的示例2"]
  },
  "summary": "合并结果摘要",
  "confidence": 0.95
}

警告：任何非JSON内容都将导致解析失败！只返回纯JSON对象！`;
  }

  /**
   * 解析规则合并响应
   */
  private parseMergeResponse(response: string): any {
    try {
      console.log('开始解析合并响应，原始长度:', response.length);
      
      // 清理响应字符串
      let cleanResponse = response.trim();
      
      // 移除可能的markdown代码块标记
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      
      // 查找完整的JSON对象
      let jsonStr = '';
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      let jsonStart = -1;
      
      for (let i = 0; i < cleanResponse.length; i++) {
        const char = cleanResponse[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
        }
        
        if (!inString) {
          if (char === '{') {
            if (braceCount === 0) {
              jsonStart = i;
            }
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && jsonStart !== -1) {
              jsonStr = cleanResponse.substring(jsonStart, i + 1);
              break;
            }
          }
        }
      }
      
      if (!jsonStr) {
        // 如果没有找到完整的JSON，尝试原来的方法
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }
      
      if (jsonStr) {
        console.log('提取的合并JSON字符串前100字符:', jsonStr.substring(0, 100));
        
        // 修复常见的JSON格式问题
        jsonStr = this.fixJsonString(jsonStr);
        
        const parsed = JSON.parse(jsonStr);
        console.log('合并JSON解析成功');
        return parsed;
      }
      
      throw new Error('无法从响应中提取JSON内容');
    } catch (error) {
      console.error('解析合并响应失败:', error);
      console.error('原始响应前500字符:', response.substring(0, 500));
      // 重新抛出异常
      throw error;
    }
  }

  /**
   * 修复JSON字符串中的常见问题
   */
  private fixJsonString(jsonStr: string): string {
    try {
      // 首先尝试直接解析，如果成功则返回原字符串
      JSON.parse(jsonStr);
      return jsonStr;
    } catch (error) {
      console.log('JSON解析失败，开始修复:', error.message);
      
      // 如果解析失败，进行深度清理
      let cleaned = jsonStr
        // 移除可能的BOM字符和其他不可见字符
        .replace(/^\uFEFF/, '')
        .replace(/^\u200B/, '') // 零宽空格
        .replace(/^\u00A0/, '') // 不间断空格
        // 移除开头和结尾的非JSON字符
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '')
        // 移除控制字符（除了\n, \r, \t）
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // 修复字符串值中的换行符和特殊字符
        .replace(/"([^"]*?)\n([^"]*?)"/g, '"$1\\n$2"')
        .replace(/"([^"]*?)\r([^"]*?)"/g, '"$1\\r$2"')
        .replace(/"([^"]*?)\t([^"]*?)"/g, '"$1\\t$2"')
        // 修复可能的尾随逗号
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      
      // 处理未终止的字符串问题
      cleaned = this.fixUnterminatedStrings(cleaned);
      
      // 确保字符串以{开头，以}结尾
      if (!cleaned.startsWith('{')) {
        const firstBrace = cleaned.indexOf('{');
        if (firstBrace !== -1) {
          cleaned = cleaned.substring(firstBrace);
        }
      }
      
      if (!cleaned.endsWith('}')) {
        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace !== -1) {
          cleaned = cleaned.substring(0, lastBrace + 1);
        }
      }
      
      console.log('修复后的JSON前100字符:', cleaned.substring(0, 100));
      return cleaned;
    }
  }

  /**
   * 修复未终止的字符串
   */
  private fixUnterminatedStrings(jsonStr: string): string {
    let result = '';
    let inString = false;
    let escapeNext = false;
    let lastQuoteIndex = -1;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        result += char;
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        if (inString) {
          // 结束字符串
          inString = false;
          result += char;
        } else {
          // 开始字符串
          inString = true;
          lastQuoteIndex = i;
          result += char;
        }
      } else {
        result += char;
      }
    }
    
    // 如果字符串没有正确结束，添加结束引号
    if (inString && lastQuoteIndex !== -1) {
      console.log('检测到未终止的字符串，在位置', lastQuoteIndex, '添加结束引号');
      result += '"';
    }
    
    return result;
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