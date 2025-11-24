# Nuxt.js 文件转换器页面使用说明

## 概述

这是一个基于 Nuxt.js 的文件格式转换页面，调用 ConvertX API 实现文件转换功能。

## 文件说明

### 1. 主组件文件
- **文件名**: `nuxt-page-file-converter.vue`
- **位置**: 放在你的 Nuxt.js 项目的 `pages` 目录下
- **路由**: 访问 `/file-converter` 即可

### 2. 国际化文件
- **中文**: `locales-zh.json`
- **英文**: `locales-en.json`
- **位置**: 合并到你项目的 `locales` 或 `lang` 目录下的对应文件中

## 功能特点

### ✅ 用户友好
- **智能格式选择**: 根据源格式自动推荐可转换的目标格式
- **自动转换器选择**: 用户只需选择格式，系统自动选择最佳转换工具
- **无需技术知识**: 小白用户也能轻松使用

### ✅ 完整的转换流程
1. **选择格式** - 选择源格式和目标格式
2. **上传文件** - 支持拖拽上传和批量上传
3. **转换进度** - 实时显示转换状态和进度
4. **下载结果** - 单个下载或打包下载

### ✅ 进度可视化
- 上传进度条
- 转换总体进度
- 每个文件的详细状态（等待中、转换中、已完成、失败）
- 文件列表实时更新

### ✅ 支持的格式

#### 文档格式
- PDF, DOC, DOCX, TXT, RTF, ODT, MD, HTML

#### 图片格式
- JPG, JPEG, PNG, GIF, BMP, WEBP, SVG, ICO, TIFF

#### 电子表格
- XLS, XLSX, CSV, ODS

#### 演示文稿
- PPT, PPTX, ODP

#### 音频格式
- MP3, WAV, OGG, FLAC, M4A, AAC

#### 视频格式
- MP4, AVI, MKV, MOV, WEBM, FLV, WMV

## 安装步骤

### 1. 将组件文件放入项目

```bash
# 假设你的 Nuxt.js 项目结构如下
your-nuxt-project/
├── pages/
│   └── file-converter.vue  # 将 nuxt-page-file-converter.vue 重命名并放这里
├── locales/
│   ├── zh.json  # 将 locales-zh.json 的内容合并到这里
│   └── en.json  # 将 locales-en.json 的内容合并到这里
```

### 2. 修改 API 地址

打开 `file-converter.vue`，修改第 230 行的 API 地址：

```javascript
data() {
  return {
    // 修改为你的 ConvertX API 地址
    apiBaseUrl: 'http://localhost:3000/api',  // 开发环境
    // apiBaseUrl: 'https://your-domain.com/api',  // 生产环境
    // ...
  }
}
```

### 3. 确保依赖已安装

这个组件使用了 Font Awesome 图标，确保已安装：

```bash
# 如果使用 npm
npm install @fortawesome/fontawesome-free

# 如果使用 yarn
yarn add @fortawesome/fontawesome-free

# 如果使用 pnpm
pnpm add @fortawesome/fontawesome-free
```

在 `nuxt.config.js` 中引入：

```javascript
export default {
  css: [
    '@fortawesome/fontawesome-free/css/all.css'
  ]
}
```

## 使用方法

### 基本使用

1. 启动 ConvertX 服务器：
```bash
cd ConvertX
bun run dev
```

2. 启动 Nuxt.js 项目：
```bash
cd your-nuxt-project
npm run dev
```

3. 访问页面：
```
http://localhost:3000/file-converter
```

### 转换流程示例

#### 例子 1: PDF 转 PNG
1. 在"选择格式"步骤，选择:
   - 源格式: PDF
   - 目标格式: PNG
2. 点击"下一步"
3. 拖拽或选择 PDF 文件
4. 点击"上传并开始转换"
5. 等待转换完成
6. 下载转换后的 PNG 文件

#### 例子 2: Word 转 PDF
1. 源格式: DOCX
2. 目标格式: PDF
3. 上传 Word 文件
4. 系统自动使用 LibreOffice 转换
5. 下载结果

## 自动转换器映射

系统会根据源格式和目标格式自动选择最佳转换器：

| 转换类型 | 使用的转换器 |
|---------|------------|
| 图片 → 图片 | ImageMagick |
| SVG → PNG/JPG | Inkscape |
| Office 文档 → PDF | LibreOffice |
| Markdown → HTML/PDF | Pandoc |
| 视频 → 视频 | FFmpeg |
| 音频 → 音频 | FFmpeg |

## 自定义配置

### 添加新的格式支持

在 `data()` 中添加新格式：

```javascript
formatGroups: [
  {
    name: '新格式分类',
    formats: ['format1', 'format2', 'format3']
  }
]
```

### 添加转换器映射

```javascript
conversionMap: {
  'newformat1->newformat2': 'converter-name',
  // ...
}
```

### 修改轮询间隔

修改进度查询频率（默认 2 秒）：

```javascript
startProgressPolling() {
  this.progressTimer = setInterval(async () => {
    await this.checkProgress();
  }, 5000); // 改为 5 秒
}
```

## API 接口说明

组件调用的 ConvertX API 接口：

### 1. 上传文件
```javascript
POST /api/upload
Content-Type: multipart/form-data
Body: FormData with files
```

### 2. 开始转换
```javascript
POST /api/convert/:jobId
Content-Type: application/json
Body: {
  convertTo: "png",
  converter: "imagemagick",
  fileNames: ["file.pdf"]
}
```

### 3. 查询进度
```javascript
GET /api/progress/:jobId
```

### 4. 下载文件
```javascript
GET /api/download/:jobId/:fileName
```

### 5. 打包下载
```javascript
GET /api/download/:jobId/archive
```

## 常见问题

### Q: 页面显示但无法上传？
A: 检查 ConvertX 服务器是否启动，API 地址是否正确。

### Q: 转换一直显示"转换中"？
A: 检查浏览器控制台是否有错误，ConvertX 服务器是否有安装对应的转换工具。

### Q: 如何支持更多格式？
A: 在 `formatGroups` 中添加新格式，并在 `conversionMap` 中添加对应的转换器映射。

### Q: 如何部署到生产环境？
A: 修改 `apiBaseUrl` 为生产环境的 API 地址，然后正常构建部署 Nuxt.js 项目。

## 生产环境配置

```javascript
// 在 nuxt.config.js 中配置环境变量
export default {
  publicRuntimeConfig: {
    convertxApiUrl: process.env.CONVERTX_API_URL || 'http://localhost:3000/api'
  }
}

// 在组件中使用
export default {
  data() {
    return {
      apiBaseUrl: this.$config.convertxApiUrl,
      // ...
    }
  }
}
```

然后在 `.env` 文件中：
```
CONVERTX_API_URL=https://your-api-domain.com/api
```

## 技术栈

- **Nuxt.js** - Vue.js 框架
- **Tailwind CSS** - 样式（假设你的项目使用）
- **Font Awesome** - 图标
- **Fetch API** - HTTP 请求
- **ConvertX API** - 后端转换服务

## 性能优化建议

1. **大文件上传**: 考虑添加文件大小限制
2. **批量转换**: 可以限制同时上传的文件数量
3. **错误处理**: 添加更详细的错误提示
4. **缓存**: 对转换结果进行缓存
5. **CDN**: 静态资源使用 CDN 加速

## 许可证

MIT License

## 支持

如有问题，请提交 Issue 或查看 ConvertX 项目文档。
