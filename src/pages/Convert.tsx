import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Wand2, Download, Copy, AlertCircle, CheckCircle, Loader, Settings } from 'lucide-react';
import { convertStyles, getRules, Rule } from '../services/api';

const Convert: React.FC = () => {
  const [inputContent, setInputContent] = useState('');
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [targetStyle, setTargetStyle] = useState('');
  const [availableRules, setAvailableRules] = useState<Rule[]>([]);
  const [convertedContent, setConvertedContent] = useState('');
  const [appliedRules, setAppliedRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setIsLoadingRules(true);
      const response = await getRules();
      if (response.success) {
        setAvailableRules(response.rules);
      } else {
        setError('加载规则失败: ' + response.message);
      }
    } catch (error) {
      console.error('加载规则错误:', error);
      setError('网络错误，无法加载规则');
    } finally {
      setIsLoadingRules(false);
    }
  };

  const handleRuleSelection = (ruleId: string) => {
    setSelectedRuleIds(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleSelectAllRules = () => {
    if (selectedRuleIds.length === availableRules.length) {
      setSelectedRuleIds([]);
    } else {
      setSelectedRuleIds(availableRules.map(rule => rule.id));
    }
  };

  const handleConvert = async () => {
    if (!inputContent.trim()) {
      setError('请输入要转换的文本内容');
      return;
    }

    if (selectedRuleIds.length === 0) {
      setError('请至少选择一条样式规则');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await convertStyles(inputContent, selectedRuleIds, targetStyle);
      
      if (response.success) {
        setConvertedContent(response.convertedContent);
        setAppliedRules(response.appliedRules);
        setSuccess(`成功应用了 ${response.appliedRules.length} 条样式规则`);
      } else {
        setError(response.message || '样式转换失败');
      }
    } catch (error) {
      console.error('样式转换错误:', error);
      setError('网络错误，请检查服务器连接');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInputContent(content);
      };
      reader.readAsText(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('已复制到剪贴板');
      setTimeout(() => setSuccess(null), 2000);
    });
  };

  const downloadResult = () => {
    const blob = new Blob([convertedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-content-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const groupedRules = availableRules.reduce((acc, rule) => {
    if (!acc[rule.type]) {
      acc[rule.type] = [];
    }
    acc[rule.type].push(rule);
    return acc;
  }, {} as Record<string, Rule[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回首页
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">样式转换</h1>
              <p className="text-gray-600">根据样式规则转换文本格式</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 输入区域 */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-green-600" />
                输入内容
              </h2>
              
              {/* 文件上传 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上传文本文件
                </label>
                <div className="flex items-center">
                  <input
                    type="file"
                    accept=".md,.markdown,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    选择文件
                  </label>
                </div>
              </div>

              {/* 文本输入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  或直接输入内容
                </label>
                <textarea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder="请输入要转换的文本内容..."
                  className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                />
              </div>

              {/* 目标样式 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标样式描述 (可选)
                </label>
                <input
                  type="text"
                  value={targetStyle}
                  onChange={(e) => setTargetStyle(e.target.value)}
                  placeholder="例如: 技术文档风格、学术论文格式等"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
            </div>

            {/* 规则选择 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-green-600" />
                  选择规则
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={loadRules}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    刷新
                  </button>
                  <button
                    onClick={handleSelectAllRules}
                    className="text-sm text-green-600 hover:text-green-800 transition-colors"
                  >
                    {selectedRuleIds.length === availableRules.length ? '取消全选' : '全选'}
                  </button>
                </div>
              </div>

              {isLoadingRules ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-green-600" />
                  <span className="ml-2 text-gray-600">加载规则中...</span>
                </div>
              ) : availableRules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">暂无可用规则</p>
                  <Link
                    to="/extract"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    去提取规则
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {Object.entries(groupedRules).map(([type, rules]) => (
                    <div key={type}>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">{type}</h4>
                      <div className="space-y-2 ml-4">
                        {rules.map((rule) => (
                          <label key={rule.id} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedRuleIds.includes(rule.id)}
                              onChange={() => handleRuleSelection(rule.id)}
                              className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{rule.description}</div>
                              <div className="text-xs text-gray-500 font-mono">{rule.pattern}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 转换按钮 */}
            <button
              onClick={handleConvert}
              disabled={isLoading || !inputContent.trim() || selectedRuleIds.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  正在转换...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  开始转换
                </>
              )}
            </button>
          </div>

          {/* 结果区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 状态消息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-700">{success}</span>
              </div>
            )}

            {/* 转换结果 */}
            {convertedContent && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    转换结果
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(convertedContent)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </button>
                    <button
                      onClick={downloadResult}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      下载
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                    {convertedContent}
                  </pre>
                </div>
              </div>
            )}

            {/* 应用的规则 */}
            {appliedRules.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  应用的规则 ({appliedRules.length} 条)
                </h3>
                <div className="space-y-3">
                  {appliedRules.map((rule, index) => (
                    <div key={rule.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {rule.type}
                        </span>
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">{rule.description}</h4>
                      <div className="bg-gray-50 rounded p-2 mt-1">
                        <code className="text-xs text-gray-700">{rule.pattern}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 空状态 */}
            {!isLoading && !convertedContent && !error && (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <Wand2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">等待转换</h3>
                <p className="text-gray-600">
                  请输入要转换的内容，选择样式规则，然后点击"开始转换"按钮
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Convert;