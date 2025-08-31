import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Wand2, Settings, History, CheckCircle, AlertCircle } from 'lucide-react';
import { healthCheck } from '../services/api';

const Home: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverInfo, setServerInfo] = useState<any>(null);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await healthCheck();
      setServerStatus('online');
      setServerInfo(response);
    } catch (error) {
      setServerStatus('offline');
      console.error('服务器连接失败:', error);
    }
  };

  const features = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: '样式提取',
      description: '从Markdown文本中智能提取样式规则和格式模式',
      link: '/extract',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: <Wand2 className="w-8 h-8" />,
      title: '样式转换',
      description: '根据提取的规则将新文本转换为相应的样式格式',
      link: '/convert',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: '规则管理',
      description: '管理和编辑样式规则，创建自定义规则集',
      link: '/rules',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      icon: <History className="w-8 h-8" />,
      title: '转换历史',
      description: '查看和管理历史转换记录，快速重用之前的操作',
      link: '/history',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Markdown自动排版智能体
              </h1>
              <p className="mt-2 text-gray-600">
                基于大语言模型的智能Markdown样式提取与转换工具
              </p>
            </div>
            
            {/* 服务器状态指示器 */}
            <div className="flex items-center space-x-2">
              {serverStatus === 'checking' && (
                <div className="flex items-center text-yellow-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                  <span className="text-sm">检查服务状态...</span>
                </div>
              )}
              {serverStatus === 'online' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">服务正常</span>
                </div>
              )}
              {serverStatus === 'offline' && (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">服务离线</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 功能介绍 */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            智能化Markdown处理解决方案
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            利用先进的大语言模型技术，自动识别和提取Markdown文档的样式规则，
            并能够将这些规则应用到新的文本内容中，实现高效的文档格式化和样式统一。
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group block"
            >
              <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 h-full border border-gray-100 hover:border-gray-200">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-white mb-4 ${feature.color} transition-colors duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* 使用流程 */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-16">
          <h3 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
            使用流程
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">样式提取</h4>
              <p className="text-gray-600 text-sm">
                上传或粘贴已格式化的Markdown文档，AI将自动分析并提取其中的样式规则
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">规则管理</h4>
              <p className="text-gray-600 text-sm">
                查看、编辑和组织提取的样式规则，创建适合不同场景的规则集
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">样式转换</h4>
              <p className="text-gray-600 text-sm">
                将新的文本内容应用已有的样式规则，快速生成格式统一的Markdown文档
              </p>
            </div>
          </div>
        </div>

        {/* 服务器信息 */}
        {serverInfo && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">服务信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">状态:</span>
                <span className="ml-2 text-green-600 font-medium">{serverInfo.status}</span>
              </div>
              <div>
                <span className="text-gray-500">版本:</span>
                <span className="ml-2 text-gray-900 font-medium">{serverInfo.version}</span>
              </div>
              <div>
                <span className="text-gray-500">最后更新:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {new Date(serverInfo.timestamp).toLocaleString('zh-CN')}
                </span>
              </div>
              <div>
                <button
                  onClick={checkServerStatus}
                  className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  刷新状态
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2024 Markdown自动排版智能体. 基于大语言模型技术构建.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;