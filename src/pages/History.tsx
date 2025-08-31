import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Download, Trash2, Search, Filter, Eye, Copy, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { getHistory, deleteHistoryRecord, ConversionHistory } from '../services/api';

const History: React.FC = () => {
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ConversionHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<ConversionHistory | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, selectedDateRange]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const response = await getHistory();
      if (response.success) {
        setHistory(response.history);
      } else {
        setError('加载历史记录失败: ' + response.message);
      }
    } catch (error) {
      console.error('加载历史记录错误:', error);
      setError('网络错误，无法加载历史记录');
    } finally {
      setIsLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = history;

    // 按日期范围过滤
    if (selectedDateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (selectedDateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(item => new Date(item.timestamp) >= filterDate);
    }

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.originalContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.convertedContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.appliedRules.some(rule => 
          rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rule.type.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // 按时间倒序排列
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setFilteredHistory(filtered);
  };

  const handleDeleteHistory = async (historyId: string) => {
    if (!confirm('确定要删除这条历史记录吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await deleteHistoryRecord(historyId);
      if (response.success) {
        setSuccess('历史记录删除成功');
        loadHistory();
      } else {
        setError(response.message || '删除历史记录失败');
      }
    } catch (error) {
      console.error('删除历史记录错误:', error);
      setError('网络错误，无法删除历史记录');
    }
  };

  const downloadContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('已复制到剪贴板');
      setTimeout(() => setSuccess(null), 2000);
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
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
                <h1 className="text-2xl font-bold text-gray-900">转换历史</h1>
                <p className="text-gray-600">查看和管理历史转换记录</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              共 {filteredHistory.length} 条记录
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
                  placeholder="搜索转换内容或应用的规则..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">全部时间</option>
                <option value="today">今天</option>
                <option value="week">最近一周</option>
                <option value="month">最近一月</option>
              </select>
            </div>
          </div>
        </div>

        {/* 历史记录列表 */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Loader className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">加载历史记录中...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Clock className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {history.length === 0 ? '暂无转换历史' : '没有找到匹配的记录'}
            </h3>
            <p className="text-gray-600 mb-4">
              {history.length === 0 
                ? '还没有进行过任何转换操作'
                : '尝试调整搜索条件或时间范围'
              }
            </p>
            {history.length === 0 && (
              <Link
                to="/convert"
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                开始转换
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{formatDate(item.timestamp)}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {item.appliedRules.length} 条规则
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">原始内容</h4>
                        <div className="bg-gray-50 rounded p-3 text-sm text-gray-800">
                          <pre className="whitespace-pre-wrap font-mono">
                            {truncateText(item.originalContent)}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">转换结果</h4>
                        <div className="bg-green-50 rounded p-3 text-sm text-gray-800">
                          <pre className="whitespace-pre-wrap font-mono">
                            {truncateText(item.convertedContent)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setViewingItem(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(item.convertedContent)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="复制结果"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadContent(item.convertedContent, `converted-${item.id}.md`)}
                      className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                      title="下载结果"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="删除记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* 应用的规则 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">应用的规则</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.appliedRules.map((rule, index) => (
                      <span
                        key={rule.id}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        title={rule.description}
                      >
                        {rule.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 详情查看模态框 */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">转换详情</h2>
                <button
                  onClick={() => setViewingItem(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* 基本信息 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">转换时间:</span>
                    <span className="ml-2 text-gray-600">{new Date(viewingItem.timestamp).toLocaleString('zh-CN')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">应用规则:</span>
                    <span className="ml-2 text-gray-600">{viewingItem.appliedRules.length} 条</span>
                  </div>
                </div>
                
                {/* 内容对比 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">原始内容</h3>
                      <button
                        onClick={() => copyToClipboard(viewingItem.originalContent)}
                        className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        复制
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                        {viewingItem.originalContent}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">转换结果</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(viewingItem.convertedContent)}
                          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          复制
                        </button>
                        <button
                          onClick={() => downloadContent(viewingItem.convertedContent, `converted-${viewingItem.id}.md`)}
                          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          下载
                        </button>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                        {viewingItem.convertedContent}
                      </pre>
                    </div>
                  </div>
                </div>
                
                {/* 应用的规则详情 */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">应用的规则详情</h3>
                  <div className="space-y-3">
                    {viewingItem.appliedRules.map((rule, index) => (
                      <div key={rule.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {rule.type}
                          </span>
                          <span className="text-xs text-gray-500">#{index + 1}</span>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{rule.description}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                                <div className="text-xs text-gray-700">
                                  {rule.examples.map((example, idx) => (
                                    <div key={idx} className="mb-1 last:mb-0">
                                      <code className="break-all">{example}</code>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewingItem(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;