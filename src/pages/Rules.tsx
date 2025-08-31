import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter, Download, Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { getRules, addRule, updateRule, deleteRule, Rule } from '../services/api';

const Rules: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [filteredRules, setFilteredRules] = useState<Rule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [newRule, setNewRule] = useState({
    type: '',
    description: '',
    pattern: '',
    examples: [] as string[]
  });

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    filterRules();
  }, [rules, searchTerm, selectedType]);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const response = await getRules();
      if (response.success) {
        setRules(response.rules);
      } else {
        setError('加载规则失败: ' + response.message);
      }
    } catch (error) {
      console.error('加载规则错误:', error);
      setError('网络错误，无法加载规则');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRules = () => {
    let filtered = rules;

    // 按类型过滤
    if (selectedType !== 'all') {
      filtered = filtered.filter(rule => rule.type === selectedType);
    }

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(rule => 
        rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRules(filtered);
  };

  const handleCreateRule = async () => {
    if (!newRule.type || !newRule.description || !newRule.pattern) {
      setError('请填写所有必填字段');
      return;
    }

    try {
      const ruleToCreate = {
        ...newRule,
        examples: newRule.examples.length > 0 ? newRule.examples : ['示例']
      };
      const response = await addRule(ruleToCreate);
      if (response.success) {
        setSuccess('规则创建成功');
        setShowCreateModal(false);
        setNewRule({ type: '', description: '', pattern: '', examples: [] });
        loadRules();
      } else {
        setError(response.message || '创建规则失败');
      }
    } catch (error) {
      console.error('创建规则错误:', error);
      setError('网络错误，无法创建规则');
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRule || !editingRule.type || !editingRule.description || !editingRule.pattern) {
      setError('请填写所有必填字段');
      return;
    }

    try {
      const response = await updateRule(editingRule.id, editingRule);
      if (response.success) {
        setSuccess('规则更新成功');
        setEditingRule(null);
        loadRules();
      } else {
        setError(response.message || '更新规则失败');
      }
    } catch (error) {
      console.error('更新规则错误:', error);
      setError('网络错误，无法更新规则');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('确定要删除这条规则吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await deleteRule(ruleId);
      if (response.success) {
        setSuccess('规则删除成功');
        loadRules();
      } else {
        setError(response.message || '删除规则失败');
      }
    } catch (error) {
      console.error('删除规则错误:', error);
      setError('网络错误，无法删除规则');
    }
  };

  const exportRules = () => {
    const dataStr = JSON.stringify(filteredRules, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markdown-rules-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importRules = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedRules = JSON.parse(e.target?.result as string);
          if (Array.isArray(importedRules)) {
            // 这里可以添加批量导入的逻辑
            setSuccess(`准备导入 ${importedRules.length} 条规则`);
          } else {
            setError('文件格式不正确');
          }
        } catch (error) {
          setError('文件解析失败，请检查文件格式');
        }
      };
      reader.readAsText(file);
    }
  };

  const ruleTypes = [...new Set(rules.map(rule => rule.type))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                返回首页
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">规则管理</h1>
                <p className="text-gray-600">管理和编辑样式规则</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept=".json"
                onChange={importRules}
                className="hidden"
                id="import-rules"
              />
              <label
                htmlFor="import-rules"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                导入
              </label>
              <button
                onClick={exportRules}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                导出
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                新建规则
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 状态消息 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-700">{success}</span>
            <button 
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        )}

        {/* 搜索和过滤 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜索规则描述、模式或类型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">所有类型</option>
                {ruleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 规则列表 */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">加载规则中...</p>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Filter className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {rules.length === 0 ? '暂无规则' : '没有找到匹配的规则'}
            </h3>
            <p className="text-gray-600 mb-4">
              {rules.length === 0 
                ? '还没有创建任何规则，点击上方"新建规则"按钮开始创建'
                : '尝试调整搜索条件或过滤器'
              }
            </p>
            {rules.length === 0 && (
              <Link
                to="/extract"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                去提取规则
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRules.map((rule, index) => (
              <div key={rule.id || `rule-${index}`} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {rule.type}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {rule.description}
                </h3>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">模式</label>
                    <div className="bg-gray-50 rounded p-2 mt-1">
                      <code className="text-xs text-gray-700 break-all">{rule.pattern}</code>
                    </div>
                  </div>
                  
                  {rule.examples && rule.examples.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">示例</label>
                      <div className="bg-gray-50 rounded p-2 mt-1">
                        {rule.examples.map((example, idx) => (
                          <code key={idx} className="text-xs text-gray-700 break-all block">{example}</code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  创建时间: {new Date(rule.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 创建规则模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">创建新规则</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
                  <input
                    type="text"
                    value={newRule.type}
                    onChange={(e) => setNewRule({...newRule, type: e.target.value})}
                    placeholder="例如: heading, list, emphasis"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述 *</label>
                  <input
                    type="text"
                    value={newRule.description}
                    onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                    placeholder="规则的简短描述"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模式 *</label>
                  <textarea
                    value={newRule.pattern}
                    onChange={(e) => setNewRule({...newRule, pattern: e.target.value})}
                    placeholder="正则表达式或匹配模式"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">示例</label>
                  <textarea
                    value={newRule.examples.join('\n')}
                    onChange={(e) => setNewRule({...newRule, examples: e.target.value.split('\n').filter(ex => ex.trim())})}
                    placeholder="每行一个示例"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRule({ type: '', description: '', pattern: '', examples: [] });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateRule}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  创建规则
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑规则模态框 */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">编辑规则</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
                  <input
                    type="text"
                    value={editingRule.type}
                    onChange={(e) => setEditingRule({...editingRule, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述 *</label>
                  <input
                    type="text"
                    value={editingRule.description}
                    onChange={(e) => setEditingRule({...editingRule, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模式 *</label>
                  <textarea
                    value={editingRule.pattern}
                    onChange={(e) => setEditingRule({...editingRule, pattern: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">示例</label>
                  <textarea
                    value={editingRule.examples?.join('\n') || ''}
                    onChange={(e) => setEditingRule({...editingRule, examples: e.target.value.split('\n').filter(ex => ex.trim())})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleUpdateRule}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  保存更改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rules;