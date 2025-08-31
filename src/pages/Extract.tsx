import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Wand2, Download, Copy, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { extractStyles, Rule } from '../services/api';

const Extract: React.FC = () => {
  const [inputContent, setInputContent] = useState('');
  const [extractTypes, setExtractTypes] = useState<string[]>(['heading', 'list', 'emphasis', 'code']);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedRules, setExtractedRules] = useState<Rule[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const availableTypes = [
    { id: 'heading', label: '标题样式', description: '提取各级标题的格式规则' },
    { id: 'list', label: '列表样式', description: '提取有序和无序列表的格式' },
    { id: 'emphasis', label: '强调样式', description: '提取粗体、斜体等强调格式' },
    { id: 'code', label: '代码样式', description: '提取代码块和行内代码格式' },
    { id: 'link', label: '链接样式', description: '提取链接的格式规则' },
    { id: 'table', label: '表格样式', description: '提取表格的格式规则' },
    { id: 'quote', label: '引用样式', description: '提取引用块的格式规则' },
  ];

  const handleExtractTypeChange = (typeId: string) => {
    setExtractTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleExtract = async (currentRetry: number = 0) => {
    if (!inputContent.trim()) return;

    const maxRetries = 3;
    const isFirstAttempt = currentRetry === 0;
    
    if (isFirstAttempt) {
      setIsLoading(true);
      setError('');
      setSuccess('');
      setRetryCount(0);
      setIsRetrying(false);
    } else {
      setIsRetrying(true);
      setRetryCount(currentRetry);
    }

    try {
      const response = await extractStyles(inputContent, extractTypes);
      
      if (response.success && response.rules) {
        setExtractedRules(response.rules);
        setSuccess(`成功提取${response.rules.length}个样式规则${currentRetry > 0 ? ` (重试${currentRetry}次后成功)` : ''}`);
        setIsLoading(false);
        setIsRetrying(false);
        setRetryCount(0);
      } else {
        throw new Error(response.message || '提取失败');
      }
    } catch (error) {
      console.error(`提取样式失败 (尝试 ${currentRetry + 1}/${maxRetries + 1}):`, error);
      
      if (currentRetry < maxRetries) {
        // 自动重试，延迟递增
        const delay = 1000 * (currentRetry + 1); // 1秒、2秒、3秒
        console.log(`将在${delay}ms后进行第${currentRetry + 1}次重试`);
        
        setTimeout(() => {
          handleExtract(currentRetry + 1);
        }, delay);
      } else {
        // 所有重试都失败了
        const errorMessage = error instanceof Error ? error.message : '网络错误或服务器异常';
        setError(`提取失败 (已重试${maxRetries}次): ${errorMessage}`);
        setIsLoading(false);
        setIsRetrying(false);
        setRetryCount(0);
      }
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

  const downloadRules = () => {
    const rulesJson = JSON.stringify(extractedRules, null, 2);
    const blob = new Blob([rulesJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-rules-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
              <h1 className="text-2xl font-bold text-gray-900">样式提取</h1>
              <p className="text-gray-600">从Markdown文本中智能提取样式规则</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 输入区域 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                输入Markdown内容
              </h2>
              
              {/* 文件上传 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  上传Markdown文件
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
                  placeholder="请输入或粘贴Markdown内容..."
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            </div>

            {/* 提取选项 */}
            {/* 提取选项已移除，使用默认的extractTypes */}

            {/* 提取按钮 */}
            <button
              onClick={() => handleExtract()}
              disabled={isLoading || !inputContent.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  {isRetrying ? `正在重试 (${retryCount}/3)...` : '正在分析...'}
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  开始提取样式
                </>
              )}
            </button>
            
            {/* 重试状态指示器 */}
            {isRetrying && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
                <Loader className="w-5 h-5 text-yellow-600 mr-2 animate-spin" />
                <span className="text-yellow-700">
                  第{retryCount}次重试中... (最多重试3次)
                </span>
              </div>
            )}
          </div>

          {/* 结果区域 */}
          <div className="space-y-6">
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

            {/* 提取结果 */}
            {extractedRules.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    提取结果 ({extractedRules.length} 条规则)
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(extractedRules, null, 2))}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      复制
                    </button>
                    <button
                      onClick={downloadRules}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      下载
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {extractedRules.map((rule, index) => (
                    <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {rule.type}
                        </span>
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{rule.description}</h4>
                      <div className="bg-gray-50 rounded p-2 mb-2">
                        <code className="text-sm text-gray-800">{rule.pattern}</code>
                      </div>
                      {rule.examples.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-500 mb-1 block">示例:</span>
                          <div className="space-y-1">
                            {rule.examples.map((example, exampleIndex) => (
                              <div key={exampleIndex} className="bg-gray-50 rounded p-2">
                                <code className="text-xs text-gray-700">{example}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to="/convert"
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    使用这些规则进行转换
                  </Link>
                </div>
              </div>
            )}

            {/* 空状态 */}
            {!isLoading && extractedRules.length === 0 && !error && (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">等待分析</h3>
                <p className="text-gray-600">
                  请输入Markdown内容并选择要提取的样式类型，然后点击"开始提取样式"按钮
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Extract;