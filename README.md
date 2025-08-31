# MDMagic - AI驱动的Markdown样式转换工具

一个基于AI的智能Markdown样式转换和提取工具，支持自定义规则管理、智能样式转换和转换历史记录。

## 🚀 项目概述

MDMagic是一个现代化的Markdown样式处理工具，集成了魔搭社区的AI模型，为用户提供智能化的Markdown样式转换体验。无论是样式提取、格式转换还是规则管理，MDMagic都能为您提供高效、准确的解决方案。

## ✨ 主要功能

- 🤖 **AI驱动的样式转换** - 基于魔搭社区AI模型的智能样式转换
- 🔍 **智能样式提取** - 自动分析和提取Markdown文档的样式特征
- 📝 **自定义规则管理** - 创建、编辑和管理个性化的转换规则
- 📚 **转换历史记录** - 完整的转换历史追踪和管理
- 🔄 **规则智能合并** - AI辅助的规则冲突检测和智能合并
- 💾 **数据持久化** - 本地数据存储，保障数据安全

## 🛠️ 技术栈

### 前端
- **React 18** - 现代化的用户界面框架
- **TypeScript** - 类型安全的JavaScript超集
- **Vite** - 快速的前端构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **React Router** - 单页应用路由管理
- **Zustand** - 轻量级状态管理
- **Lucide React** - 现代化图标库

### 后端
- **Express.js** - Node.js Web应用框架
- **TypeScript** - 服务端类型安全
- **魔搭社区AI模型** - 智能样式处理引擎
- **CORS** - 跨域资源共享支持

## 📁 项目结构

```
MDMagic/
├── src/                    # 前端源码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── hooks/             # 自定义Hook
│   ├── services/          # API服务
│   └── lib/               # 工具函数
├── api/                   # 后端源码
│   ├── routes/            # API路由
│   ├── services/          # 业务服务
│   └── app.ts             # Express应用
├── data/                  # 数据存储
│   ├── rules.json         # 转换规则
│   └── conversion-history.json # 转换历史
└── public/                # 静态资源
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/ATang0729/MDMagic
   cd MDMagic
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   
   在项目根目录创建 `.env` 文件：
   ```env
   MODELSCOPE_ACCESS_TOKEN=your_modelscope_token_here
   ```
   
   > 💡 **获取魔搭社区访问令牌**：访问 [魔搭社区](https://modelscope.cn/) 注册账号并获取API访问令牌

4. **启动开发服务器**
   
   同时启动前端和后端：
   ```bash
   npm run dev
   ```
   
   或分别启动：
   ```bash
   # 启动前端开发服务器
   npm run client:dev
   
   # 启动后端开发服务器
   npm run server:dev
   ```

## 🌐 访问地址

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3001
- **API健康检查**: http://localhost:3001/api/health

## 📖 使用方法

### 样式转换
1. 访问前端应用的"样式转换"页面
2. 输入原始Markdown内容
3. 选择目标样式或自定义转换规则
4. 点击"转换"按钮获取结果

### 样式提取
1. 进入"样式提取"页面
2. 粘贴包含样式的Markdown文档
3. AI将自动分析并提取样式特征
4. 可将提取的样式保存为转换规则

### 规则管理
1. 在"规则管理"页面查看所有自定义规则
2. 创建新规则或编辑现有规则
3. 系统支持规则冲突检测和智能合并

### 历史记录
1. "转换历史"页面显示所有转换记录
2. 可查看转换详情、重新应用转换
3. 支持历史记录的搜索和筛选

## 🔌 API文档

### 核心接口

- `POST /api/markdown/convert` - 执行样式转换
- `POST /api/markdown/extract` - 提取样式特征
- `GET /api/markdown/rules` - 获取所有规则
- `POST /api/markdown/rules` - 创建新规则
- `PUT /api/markdown/rules/:id` - 更新规则
- `DELETE /api/markdown/rules/:id` - 删除规则
- `GET /api/markdown/history` - 获取转换历史

### 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

## 🛠️ 开发说明

### 可用脚本

- `npm run dev` - 同时启动前后端开发服务器
- `npm run client:dev` - 启动前端开发服务器
- `npm run server:dev` - 启动后端开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建
- `npm run lint` - 运行ESLint检查
- `npm run check` - TypeScript类型检查

### 代码规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint配置的代码规范
- 组件采用函数式组件 + Hooks模式
- API接口遵循RESTful设计原则

### 贡献指南

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 支持

如果您在使用过程中遇到问题或有改进建议，欢迎：

- 提交 [Issue](../../issues)
- 发起 [Pull Request](../../pulls)
- 联系项目维护者

---

**MDMagic** - 让Markdown样式转换更智能、更高效！ 🎉
