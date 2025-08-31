import express from 'express';
import { getModelscopeService, Rule } from '../services/modelscopeService';
import { StorageService } from '../services/storageService';

const router = express.Router();

// ==================== 样式提取API ====================

/**
 * POST /api/markdown/extract
 * 从Markdown文本中提取样式规则
 */
router.post('/extract', async (req, res) => {
  try {
    const { content, styleTypes } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的Markdown内容'
      });
    }

    // 调用AI服务提取样式
    const modelscopeService = getModelscopeService();
    const result = await modelscopeService.extractStyles(content, styleTypes);

    if (result.success && result.rules && result.rules.length > 0) {
      // 保存提取的规则到本地存储
      await StorageService.addRules(result.rules);
    }

    res.json(result);
  } catch (error) {
    console.error('样式提取API错误:', error);
    res.status(500).json({
      success: false,
      rules: [],
      message: '服务器内部错误'
    });
  }
});

// ==================== 样式转换API ====================

/**
 * POST /api/markdown/convert
 * 根据规则转换文本样式
 */
router.post('/convert', async (req, res) => {
  try {
    const { content, ruleIds, targetStyle } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        message: '请提供有效的文本内容'
      });
    }

    if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请选择要应用的规则'
      });
    }

    // 获取指定的规则
    const rules = await StorageService.getRulesByIds(ruleIds);
    
    if (rules.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的规则'
      });
    }

    // 调用AI服务转换样式
    const modelscopeService = getModelscopeService();
    const result = await modelscopeService.convertStyles(content, rules, targetStyle);

    if (result.success) {
      // 保存转换历史
      await StorageService.addHistoryRecord({
        originalContent: content,
        convertedContent: result.convertedContent,
        appliedRuleIds: ruleIds
      });
    }

    res.json(result);
  } catch (error) {
    console.error('样式转换API错误:', error);
    res.status(500).json({
      success: false,
      convertedContent: req.body.content || '',
      appliedRules: [],
      message: '服务器内部错误'
    });
  }
});

// ==================== 规则管理API ====================

/**
 * GET /api/markdown/rules
 * 获取所有规则
 */
router.get('/rules', async (req, res) => {
  try {
    const rules = await StorageService.getRules();
    res.json({
      success: true,
      rules,
      message: '获取规则成功'
    });
  } catch (error) {
    console.error('获取规则API错误:', error);
    res.status(500).json({
      success: false,
      rules: [],
      message: '服务器内部错误'
    });
  }
});

/**
 * POST /api/markdown/rules
 * 添加新规则（支持智能合并）
 */
router.post('/rules', async (req, res) => {
  try {
    const { type, pattern, description, examples, name } = req.body;

    // 验证必填字段不能为空或空字符串
    if (!type || !pattern || !description || 
        type.trim() === '' || pattern.trim() === '' || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '请提供完整的规则信息（type, pattern, description不能为空）'
      });
    }

    // 验证name字段（如果提供的话）
    if (name && name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '规则名称不能为空字符串'
      });
    }

    // 检查是否存在相同type的规则
    const existingRules = await StorageService.getRules();
    const sameTypeRules = existingRules.filter(rule => rule.type === type);

    // 准备新规则数据（但不立即创建ID）
    const newRuleData = {
      type,
      name: name || `${type}规则`,
      pattern,
      description,
      examples: examples || []
    };

    let finalRule;
    let mergePerformed = false;

    // 如果存在相同type的规则，尝试智能合并
    if (sameTypeRules.length > 0) {
      try {
        console.log(`发现 ${sameTypeRules.length} 个相同类型(${type})的规则，开始智能合并...`);
        
        // 创建临时规则对象用于合并（不保存到数据库）
        const tempNewRule: Rule = {
          id: `temp_${Date.now()}`,
          ...newRuleData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const modelscopeService = getModelscopeService();
        const mergeResult = await modelscopeService.mergeRules(tempNewRule, sameTypeRules);
        
        if (mergeResult && mergeResult.success) {
          // 使用第一个现有规则的ID，保持其创建时间
          const targetRule = sameTypeRules[0];
          const mergedRule = mergeResult.data.mergedRule;
          finalRule = {
            ...mergedRule,
            id: targetRule.id,
            createdAt: targetRule.createdAt,
            updatedAt: new Date().toISOString()
          };
          
          // 删除其他相同type的规则
          for (let i = 1; i < sameTypeRules.length; i++) {
            await StorageService.deleteRule(sameTypeRules[i].id);
          }
          
          // 更新目标规则
          console.log('准备更新规则，finalRule内容:', JSON.stringify(finalRule, null, 2));
          console.log('mergedRule内容:', JSON.stringify(mergedRule, null, 2));
          console.log('finalRule.type:', finalRule.type);
          console.log('finalRule.name:', finalRule.name);
          const updateData = {
            type: finalRule.type,
            name: finalRule.name,
            pattern: finalRule.pattern,
            description: finalRule.description,
            examples: finalRule.examples
          };
          console.log('更新数据:', JSON.stringify(updateData, null, 2));
          await StorageService.updateRule(finalRule.id, updateData);
          
          mergePerformed = true;
          console.log(`智能合并完成，合并了 ${sameTypeRules.length} 个规则`);
        }
      } catch (mergeError) {
        console.error('智能合并失败，将直接添加新规则:', mergeError);
        // 合并失败时，继续添加新规则
      }
    }

    // 如果没有进行合并，则创建并添加新规则
    if (!mergePerformed) {
      finalRule = {
        id: `rule_${Date.now()}`,
        ...newRuleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await StorageService.addRules([finalRule]);
    }

    res.json({
      success: true,
      rule: finalRule,
      merged: mergePerformed,
      mergedCount: mergePerformed ? sameTypeRules.length : 0,
      message: mergePerformed ? 
        `规则智能合并成功，合并了 ${sameTypeRules.length} 个相同类型的规则` : 
        '规则添加成功'
    });
  } catch (error) {
    console.error('添加规则API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * PUT /api/markdown/rules/:id
 * 更新规则
 */
router.put('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, name, pattern, description, examples } = req.body;

    const updatedRule = await StorageService.updateRule(id, {
      type,
      name,
      pattern,
      description,
      examples
    });

    if (!updatedRule) {
      return res.status(404).json({
        success: false,
        message: '规则不存在'
      });
    }

    res.json({
      success: true,
      rule: updatedRule,
      message: '规则更新成功'
    });
  } catch (error) {
    console.error('更新规则API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * DELETE /api/markdown/rules/:id
 * 删除规则
 */
router.delete('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StorageService.deleteRule(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '规则不存在'
      });
    }

    res.json({
      success: true,
      message: '规则删除成功'
    });
  } catch (error) {
    console.error('删除规则API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// ==================== 规则集管理API ====================

/**
 * GET /api/markdown/rule-sets
 * 获取所有规则集
 */
router.get('/rule-sets', async (req, res) => {
  try {
    const ruleSets = await StorageService.getRuleSets();
    res.json({
      success: true,
      ruleSets,
      message: '获取规则集成功'
    });
  } catch (error) {
    console.error('获取规则集API错误:', error);
    res.status(500).json({
      success: false,
      ruleSets: [],
      message: '服务器内部错误'
    });
  }
});

/**
 * POST /api/markdown/rule-sets
 * 创建规则集
 */
router.post('/rule-sets', async (req, res) => {
  try {
    const { name, description, ruleIds } = req.body;

    if (!name || !ruleIds || !Array.isArray(ruleIds)) {
      return res.status(400).json({
        success: false,
        message: '请提供规则集名称和规则ID数组'
      });
    }

    const ruleSet = await StorageService.addRuleSet({
      name,
      description: description || '',
      ruleIds
    });

    res.json({
      success: true,
      ruleSet,
      message: '规则集创建成功'
    });
  } catch (error) {
    console.error('创建规则集API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// ==================== 转换历史API ====================

/**
 * GET /api/markdown/history
 * 获取转换历史
 */
router.get('/history', async (req, res) => {
  try {
    const history = await StorageService.getHistory();
    res.json({
      success: true,
      history,
      message: '获取历史记录成功'
    });
  } catch (error) {
    console.error('获取历史API错误:', error);
    res.status(500).json({
      success: false,
      history: [],
      message: '服务器内部错误'
    });
  }
});

/**
 * DELETE /api/markdown/history/:id
 * 删除历史记录
 */
router.delete('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StorageService.deleteHistoryRecord(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: '历史记录不存在'
      });
    }

    res.json({
      success: true,
      message: '历史记录删除成功'
    });
  } catch (error) {
    console.error('删除历史API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * DELETE /api/markdown/history
 * 清空所有历史记录
 */
router.delete('/history', async (req, res) => {
  try {
    await StorageService.clearHistory();
    res.json({
      success: true,
      message: '历史记录清空成功'
    });
  } catch (error) {
    console.error('清空历史API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// ==================== 测试API ====================

/**
 * GET /api/markdown/test
 * 测试AI服务连接
 */
router.get('/test', async (req, res) => {
  try {
    const modelscopeService = getModelscopeService();
    const result = await modelscopeService.testConnection();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.data?.message || '连接成功'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || '连接失败'
      });
    }
  } catch (error) {
    console.error('测试API错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;