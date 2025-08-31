/**
 * 模拟AI服务 - 用于测试和演示
 * 当真实的魔搭社区API密钥不可用时使用
 */

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

// 删除不需要的MockAIResponse接口，使用具体的返回类型

/**
 * 模拟样式提取功能
 */
export async function mockExtractStyles(content: string, styleTypes?: string[]): Promise<{
  success: boolean;
  data?: {
    rules: Rule[];
    message: string;
  };
  error?: string;
}> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 1000));

  const mockRules = {
    headers: {
      id: `rule_headers_${Date.now()}`,
      type: "headers",
      name: "标题样式规则",
      description: "提取的标题格式规则",
      pattern: "# 标题使用单个#号，## 二级标题使用双#号",
      examples: ["# 主标题", "## 副标题"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    emphasis: {
      id: `rule_emphasis_${Date.now()}`,
      type: "emphasis",
      name: "强调样式规则", 
      description: "提取的文本强调规则",
      pattern: "**粗体文本** 和 *斜体文本*",
      examples: ["**重要内容**", "*强调内容*"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    lists: {
      id: `rule_lists_${Date.now()}`,
      type: "lists",
      name: "列表样式规则",
      description: "提取的列表格式规则", 
      pattern: "- 无序列表项\n1. 有序列表项",
      examples: ["- 项目一", "1. 第一项"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    code: {
      id: `rule_code_${Date.now()}`,
      type: "code",
      name: "代码样式规则",
      description: "提取的代码格式规则",
      pattern: "`内联代码` 和 ```代码块```",
      examples: ["`console.log()", "```javascript\ncode\n```"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };

  console.log('请求的样式类型:', styleTypes);
  const extractedRules = styleTypes && styleTypes.length > 0 
    ? (styleTypes || []).map(type => {
        const rule = mockRules[type as keyof typeof mockRules];
        console.log(`样式类型 ${type}:`, rule ? '找到' : '未找到');
        return rule;
      }).filter(Boolean)
    : Object.values(mockRules);
  console.log('提取的规则数量:', extractedRules.length);

  return {
    success: true,
    data: {
      rules: extractedRules,
      message: `成功提取了 ${extractedRules.length} 个样式规则`
    }
  };
}

/**
 * 模拟样式转换功能
 */
export async function mockConvertStyles(content: string, rules: Rule[], targetStyle?: string): Promise<{
  success: boolean;
  data?: {
    convertedContent: string;
    appliedRules: string[];
    message: string;
  };
  error?: string;
}> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 简单的模拟转换逻辑
  let convertedContent = content;
  
  if (targetStyle === 'academic') {
    convertedContent = content
      .replace(/# /g, '## ')  // 降级标题
      .replace(/\*\*(.*?)\*\*/g, '**$1**')  // 保持粗体
      .replace(/\*(.*?)\*/g, '_$1_');  // 斜体改为下划线
  } else if (targetStyle === 'casual') {
    convertedContent = content
      .replace(/## /g, '# ')  // 升级标题
      .replace(/\*\*(.*?)\*\*/g, '**$1** 👍')  // 粗体加表情
      .replace(/\*(.*?)\*/g, '*$1* ✨');  // 斜体加表情
  }

  const appliedRules = (rules || []).map(rule => rule.id || '');

  return {
    success: true,
    data: {
      convertedContent: convertedContent,
      appliedRules,
      message: `成功应用了 ${appliedRules.length} 个转换规则`
    }
  };
}

/**
 * 模拟连接测试
 */
export async function mockTestConnection(): Promise<{
  success: boolean;
  data?: {
    message: string;
  };
  error?: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    success: true,
    data: {
      message: '模拟AI服务连接成功'
    }
  };
}