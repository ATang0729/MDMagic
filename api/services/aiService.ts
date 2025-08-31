import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getModelscopeService, ModelscopeService } from './modelscopeService.js';

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

// 加载环境变量
dotenv.config();

// 魔搭社区API配置
const client = new OpenAI({
  apiKey: process.env.MODELSCOPE_ACCESS_TOKEN || 'your_modelscope_access_token_here',
  baseURL: process.env.MODELSCOPE_BASE_URL || 'https://api-inference.modelscope.cn/v1/'
});

const MODEL_NAME = process.env.MODELSCOPE_MODEL || 'Qwen/Qwen2.5-Coder-32B-Instruct';

// 样式提取提示词模板
const EXTRACT_PROMPT_TEMPLATE = `你是一个Markdown语法专家。请分析以下Markdown文本，提取出其中使用的各种样式对应的语法规则。

分析文本：
{content}

请按照以下格式返回JSON结果：
{
  "rules": [
    {
      "type": "样式类型（如heading、bold、italic等）",
      "pattern": "语法模式（用{text}表示文本内容）",
      "description": "样式描述",
      "examples": ["具体示例"]
    }
  ]
}

需要识别的样式类型包括但不限于：
- heading（标题）
- bold（加粗）
- italic（斜体）
- quote（引用）
- code（代码）
- link（链接）
- list（列表）
- table（表格）

请确保返回的是有效的JSON格式，不要包含任何其他文字说明。`;

// 样式转换提示词模板
const CONVERT_PROMPT_TEMPLATE = `你是一个Markdown格式转换专家。请根据提供的语法规则，将以下文本转换为对应的Markdown格式。

原始文本：
{content}

应用的语法规则：
{rules}

转换要求：
1. 保持文本的原始含义和结构
2. 根据规则将相应的文本片段转换为Markdown语法
3. 确保转换后的格式正确且美观
4. 如果文本中已有Markdown语法，请保持或优化

请直接返回转换后的Markdown文本，不需要额外说明。`;

// Rule接口已在文件顶部定义

export interface ExtractResponse {
  success: boolean;
  rules: Rule[];
  message: string;
}

export interface ConvertResponse {
  success: boolean;
  convertedContent: string;
  appliedRules: string[];
  message: string;
}

export class AIService {
  private static openai: OpenAI | null = null;
  private static modelscopeService: ModelscopeService | null = null;
  private static isInitialized = false;

  /**
   * 初始化AI服务
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 优先尝试魔搭社区服务
      try {
        this.modelscopeService = getModelscopeService();
        const testResult = await this.modelscopeService.testConnection();
        if (testResult.success) {
          console.log('魔搭社区API 连接成功');
          this.isInitialized = true;
          return;
        }
      } catch (error) {
        console.warn('魔搭社区API 初始化失败:', error);
        this.modelscopeService = null;
      }

      // 备用：尝试OpenAI服务
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        this.openai = new OpenAI({
          apiKey: apiKey
        });

        // 测试连接
        await this.testConnection();
        console.log('OpenAI API 连接成功');
      } else {
        console.warn('OPENAI_API_KEY 未设置');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('AI服务初始化失败:', error);
      console.log('将使用模拟AI服务');
      this.openai = null;
      this.modelscopeService = null;
      this.isInitialized = true;
    }
  }

  /**
   * 从Markdown文本中提取样式规则
   */
  static async extractStyles(content: string, extractTypes?: string[]): Promise<ExtractResponse> {
    await this.initialize();

    // 优先使用魔搭社区服务
    if (this.modelscopeService) {
      console.log('使用魔搭社区API进行样式提取');
      const result = await this.modelscopeService.extractStyles(content, extractTypes);
      if (result.success) {
        return {
          success: true,
          rules: result.rules || [],
          message: result.message || '提取成功'
        };
      } else {
        // 直接返回失败结果，不使用备用服务
        return {
          success: false,
          rules: [],
          message: result.error || '样式提取失败'
        };
      }
    }

    // 备用：使用OpenAI服务
    if (this.openai) {
      try {
        console.log('使用OpenAI进行样式提取');
        
        const prompt = EXTRACT_PROMPT_TEMPLATE.replace('{content}', content);
        
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的Markdown语法分析专家，擅长从文本中提取各种样式规则。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        });

        const result = response.choices[0]?.message?.content;
        if (!result) {
          throw new Error('AI服务返回空结果');
        }

        // 尝试解析JSON结果
        let parsedResult;
        try {
          parsedResult = JSON.parse(result);
        } catch (parseError) {
          // 如果直接解析失败，尝试提取JSON部分
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('无法解析AI返回的JSON结果');
          }
        }

        // 为规则添加ID和时间戳
        const rules: Rule[] = parsedResult.rules.map((rule: any, index: number) => ({
          id: `rule_${rule.type}_${Date.now()}_${index}`,
          ...rule,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        // 如果指定了提取类型，进行过滤
        const filteredRules = extractTypes && extractTypes.length > 0 
          ? rules.filter(rule => extractTypes.includes(rule.type))
          : rules;

        return {
          success: true,
          rules: filteredRules,
          message: `成功提取${filteredRules.length}个语法规则`
        };
      } catch (error) {
        console.error('OpenAI样式提取失败:', error);
        return {
          success: false,
          rules: [],
          message: error instanceof Error ? error.message : 'OpenAI样式提取失败'
        };
      }
    }

    // 如果没有可用的AI服务，直接返回失败
    return {
      success: false,
      rules: [],
      message: '没有可用的AI服务'
    };
  }

  /**
   * 根据规则转换文本样式
   */
  static async convertStyles(content: string, rules: Rule[], targetStyle?: string): Promise<ConvertResponse> {
    await this.initialize();

    // 优先使用魔搭社区服务
    if (this.modelscopeService) {
      try {
        console.log('使用魔搭社区API进行样式转换');
        const result = await this.modelscopeService.convertStyles(content, rules, targetStyle);
        if (result.success) {
          return {
            success: true,
            convertedContent: result.data?.convertedContent || '',
            appliedRules: result.data?.appliedRules || rules.map(rule => rule.id || ''),
            message: result.data?.message || '转换成功'
          };
        }
      } catch (error) {
        console.error('魔搭社区样式转换失败:', error);
        console.log('切换到备用服务');
      }
    }

    // 备用：使用OpenAI服务
    if (this.openai) {
      try {
        console.log('使用OpenAI进行样式转换');
        
        const rulesText = rules.map(rule => 
          `类型: ${rule.type}\n模式: ${rule.pattern}\n描述: ${rule.description}\n示例: ${rule.examples.join(', ')}`
        ).join('\n\n');

        const prompt = CONVERT_PROMPT_TEMPLATE
          .replace('{content}', content)
          .replace('{rules}', rulesText);

        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的Markdown格式转换专家，擅长根据规则转换文本样式。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 3000
        });

        const convertedContent = response.choices[0]?.message?.content;
        if (!convertedContent) {
          throw new Error('AI服务返回空结果');
        }

        return {
          success: true,
          convertedContent: convertedContent.trim(),
          appliedRules: rules.map(rule => rule.id || ''),
          message: '样式转换成功'
        };
      } catch (error) {
        console.error('OpenAI样式转换失败:', error);
        console.log('切换到模拟AI服务进行样式转换');
      }
    }

    // 如果没有可用的AI服务，直接返回失败
    return {
      success: false,
      convertedContent: '',
      appliedRules: [],
      message: '没有可用的AI服务'
    };
  }

  /**
   * 测试AI服务连接
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    await this.initialize();
    
    // 优先使用魔搭社区服务
    if (this.modelscopeService) {
      try {
        const result = await this.modelscopeService.testConnection();
        if (result.success) {
          return {
            success: true,
            message: result.data?.message || '魔搭社区API连接成功'
          };
        }
      } catch (error) {
        console.error('魔搭社区连接测试失败:', error);
      }
    }

    // 备用：使用OpenAI服务
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: '请回复"连接成功"'
            }
          ],
          max_tokens: 10
        });

        const result = response.choices[0]?.message?.content;
        return {
          success: true,
          message: `OpenAI API连接成功: ${result}`
        };
      } catch (error) {
        console.error('OpenAI连接测试失败:', error);
      }
    }

    // 如果没有可用的AI服务，直接返回失败
    return {
      success: false,
      message: '没有可用的AI服务'
    };
  }
}