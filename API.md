# ConvertX RESTful API 文档

## 概述

ConvertX 提供了一套完整的 RESTful API 接口，用于文件上传、转换、进度查询、下载和预览等功能。

**Base URL**: `http://localhost:3000/api`

## 认证

**注意**: 当前 API 接口已禁用 JWT 认证，可以直接访问，无需提供认证令牌。所有请求将使用默认用户（ID: 1）。

---

## API 接口

### 1. 文件上传

**接口**: `POST /api/upload`

**描述**: 上传一个或多个文件，创建新的转换任务。

**请求头**:
```
Content-Type: multipart/form-data
```

**请求体**:
```
file: File | File[] (必填)
```

**响应示例**:
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": 1,
  "filesUploaded": 2,
  "files": ["document.pdf", "image.png"],
  "message": "Files uploaded successfully"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "Failed to upload files",
  "message": "Error details..."
}
```

**cURL 示例**:
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/file1.pdf" \
  -F "file=@/path/to/file2.png"
```

---

### 2. 开始文件转换

**接口**: `POST /api/convert/:jobId`

**描述**: 为指定的任务启动文件转换过程。

**URL 参数**:
- `jobId` (string, 必填): 上传文件时返回的任务 ID

**请求体**:
```json
{
  "convertTo": "png",
  "converter": "imagemagick",
  "fileNames": ["document.pdf", "image.jpg"]
}
```

**参数说明**:
- `convertTo` (string, 必填): 目标文件格式
- `converter` (string, 必填): 使用的转换器名称
- `fileNames` (array, 必填): 要转换的文件名列表

**响应示例**:
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Conversion started",
  "filesCount": 2
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "Job not found"
}
```

**cURL 示例**:
```bash
curl -X POST http://localhost:3000/api/convert/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "convertTo": "png",
    "converter": "imagemagick",
    "fileNames": ["document.pdf", "image.jpg"]
  }'
```

---

### 3. 查询转换进度

**接口**: `GET /api/progress/:jobId`

**描述**: 获取指定任务的转换进度和状态信息。

**URL 参数**:
- `jobId` (string, 必填): 任务 ID

**响应示例**:
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "progress": 50.0,
  "totalFiles": 2,
  "completedFiles": 1,
  "failedFiles": 0,
  "processingFiles": 1,
  "pendingFiles": 0,
  "dateCreated": "2024-01-15T10:30:00.000Z",
  "files": [
    {
      "fileName": "document.pdf",
      "outputFileName": "document.png",
      "status": "completed"
    },
    {
      "fileName": "image.jpg",
      "outputFileName": "image.png",
      "status": "processing"
    }
  ]
}
```

**状态说明**:
- `uploading`: 文件上传中
- `pending`: 等待转换
- `processing`: 转换中
- `completed`: 转换完成
- `failed`: 转换失败

**cURL 示例**:
```bash
curl -X GET http://localhost:3000/api/progress/550e8400-e29b-41d4-a716-446655440000
```

---

### 4. 下载转换后的文件

**接口**: `GET /api/download/:jobId/:fileName`

**描述**: 下载指定任务中的单个转换后的文件。

**URL 参数**:
- `jobId` (string, 必填): 任务 ID
- `fileName` (string, 必填): 文件名（URL 编码）

**响应**: 
- 成功: 返回文件流
- 失败: 返回 JSON 错误信息

**cURL 示例**:
```bash
curl -X GET http://localhost:3000/api/download/550e8400-e29b-41d4-a716-446655440000/document.png \
  -o document.png
```

---

### 5. 下载所有文件（打包）

**接口**: `GET /api/download/:jobId/archive`

**描述**: 下载指定任务中所有转换后的文件，打包为 tar 归档文件。

**URL 参数**:
- `jobId` (string, 必填): 任务 ID

**响应**: 
- 成功: 返回 tar 文件流
- 失败: 返回 JSON 错误信息

**cURL 示例**:
```bash
curl -X GET http://localhost:3000/api/download/550e8400-e29b-41d4-a716-446655440000/archive \
  -o converted_files.tar
```

---

### 6. 文件预览

**接口**: `GET /api/preview/:jobId/:fileName`

**描述**: 预览转换后的文件（支持图片、文本、PDF等）。

**URL 参数**:
- `jobId` (string, 必填): 任务 ID
- `fileName` (string, 必填): 文件名（URL 编码）

**支持的文件类型**:
- 图片: jpg, jpeg, png, gif, webp, svg, bmp, ico
- 文本: txt, md, json, xml, html, css, js, csv
- 文档: pdf

**响应**:
- 图片/PDF: 直接返回文件流
- 文本文件: 返回 JSON 格式
```json
{
  "success": true,
  "fileName": "document.txt",
  "mimeType": "text/plain",
  "content": "文件内容...",
  "size": 1024
}
```

**cURL 示例**:
```bash
# 预览图片
curl -X GET http://localhost:3000/api/preview/550e8400-e29b-41d4-a716-446655440000/image.png \
  -o preview.png

# 预览文本文件
curl -X GET http://localhost:3000/api/preview/550e8400-e29b-41d4-a716-446655440000/document.txt
```

---

### 7. 获取文件信息

**接口**: `GET /api/preview/:jobId/:fileName/info`

**描述**: 获取文件的元数据信息，不返回文件内容。

**URL 参数**:
- `jobId` (string, 必填): 任务 ID
- `fileName` (string, 必填): 文件名（URL 编码）

**响应示例**:
```json
{
  "success": true,
  "fileName": "document.png",
  "mimeType": "image/png",
  "size": 524288,
  "previewSupported": true,
  "lastModified": "2024-01-15T10:35:00.000Z"
}
```

**cURL 示例**:
```bash
curl -X GET http://localhost:3000/api/preview/550e8400-e29b-41d4-a716-446655440000/document.png/info
```

---

## 完整使用流程示例

### 1. 上传文件
```bash
RESPONSE=$(curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf" \
  -F "file=@image.jpg")

JOB_ID=$(echo $RESPONSE | jq -r '.jobId')
echo "Job ID: $JOB_ID"
```

### 2. 开始转换
```bash
curl -X POST http://localhost:3000/api/convert/$JOB_ID \
  -H "Content-Type: application/json" \
  -d '{
    "convertTo": "png",
    "converter": "imagemagick",
    "fileNames": ["document.pdf", "image.jpg"]
  }'
```

### 3. 查询进度
```bash
curl -X GET http://localhost:3000/api/progress/$JOB_ID
```

### 4. 下载结果
```bash
# 下载单个文件
curl -X GET http://localhost:3000/api/download/$JOB_ID/document.png \
  -o document.png

# 或下载所有文件（打包）
curl -X GET http://localhost:3000/api/download/$JOB_ID/archive \
  -o results.tar
```

### 5. 预览文件
```bash
# 在浏览器中预览
curl -X GET http://localhost:3000/api/preview/$JOB_ID/document.png \
  -o preview.png
```

---

## JavaScript/TypeScript 示例

### 使用 fetch API

```javascript
// 1. 上传文件
async function uploadFiles(files) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('file', file);
  });

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include' // 包含 cookies
  });

  return await response.json();
}

// 2. 开始转换
async function startConversion(jobId, convertTo, converter, fileNames) {
  const response = await fetch(`/api/convert/${jobId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      convertTo,
      converter,
      fileNames
    }),
    credentials: 'include'
  });

  return await response.json();
}

// 3. 查询进度
async function checkProgress(jobId) {
  const response = await fetch(`/api/progress/${jobId}`, {
    credentials: 'include'
  });

  return await response.json();
}

// 4. 下载文件
async function downloadFile(jobId, fileName) {
  const response = await fetch(`/api/download/${jobId}/${encodeURIComponent(fileName)}`, {
    credentials: 'include'
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
}

// 5. 预览文件
async function previewFile(jobId, fileName) {
  const response = await fetch(`/api/preview/${jobId}/${encodeURIComponent(fileName)}`, {
    credentials: 'include'
  });

  const contentType = response.headers.get('Content-Type');
  
  if (contentType.startsWith('image/')) {
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } else if (contentType === 'application/json') {
    return await response.json();
  }
}

// 完整流程示例
async function convertFiles(files, targetFormat, converter) {
  try {
    // 上传
    const uploadResult = await uploadFiles(files);
    console.log('Upload result:', uploadResult);
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error);
    }

    const jobId = uploadResult.jobId;
    const fileNames = uploadResult.files;

    // 开始转换
    const convertResult = await startConversion(jobId, targetFormat, converter, fileNames);
    console.log('Convert started:', convertResult);

    // 轮询进度
    const checkInterval = setInterval(async () => {
      const progress = await checkProgress(jobId);
      console.log('Progress:', progress);

      if (progress.status === 'completed') {
        clearInterval(checkInterval);
        console.log('Conversion completed!');
        
        // 下载结果
        for (const file of progress.files) {
          if (file.status === 'completed') {
            await downloadFile(jobId, file.outputFileName);
          }
        }
      } else if (progress.status === 'failed') {
        clearInterval(checkInterval);
        console.error('Conversion failed!');
      }
    }, 2000); // 每2秒查询一次

  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## Python 示例

```python
import requests
import time

BASE_URL = "http://localhost:3000/api"
session = requests.Session()

def upload_files(file_paths):
    """上传文件"""
    files = [('file', open(path, 'rb')) for path in file_paths]
    response = session.post(f"{BASE_URL}/upload", files=files)
    return response.json()

def start_conversion(job_id, convert_to, converter, file_names):
    """开始转换"""
    data = {
        'convertTo': convert_to,
        'converter': converter,
        'fileNames': file_names
    }
    response = session.post(f"{BASE_URL}/convert/{job_id}", json=data)
    return response.json()

def check_progress(job_id):
    """查询进度"""
    response = session.get(f"{BASE_URL}/progress/{job_id}")
    return response.json()

def download_file(job_id, file_name, output_path):
    """下载文件"""
    response = session.get(f"{BASE_URL}/download/{job_id}/{file_name}")
    with open(output_path, 'wb') as f:
        f.write(response.content)

def download_archive(job_id, output_path):
    """下载打包文件"""
    response = session.get(f"{BASE_URL}/download/{job_id}/archive")
    with open(output_path, 'wb') as f:
        f.write(response.content)

# 完整流程
def convert_files(file_paths, target_format, converter):
    # 1. 上传
    print("Uploading files...")
    upload_result = upload_files(file_paths)
    
    if not upload_result.get('success'):
        print(f"Upload failed: {upload_result.get('error')}")
        return
    
    job_id = upload_result['jobId']
    file_names = upload_result['files']
    print(f"Job ID: {job_id}")
    
    # 2. 开始转换
    print("Starting conversion...")
    convert_result = start_conversion(job_id, target_format, converter, file_names)
    print(f"Conversion started: {convert_result}")
    
    # 3. 轮询进度
    print("Checking progress...")
    while True:
        progress = check_progress(job_id)
        print(f"Progress: {progress['progress']}% ({progress['completedFiles']}/{progress['totalFiles']})")
        
        if progress['status'] == 'completed':
            print("Conversion completed!")
            break
        elif progress['status'] == 'failed':
            print("Conversion failed!")
            return
        
        time.sleep(2)
    
    # 4. 下载结果
    print("Downloading files...")
    download_archive(job_id, f"results_{job_id}.tar")
    print("Done!")

# 使用示例
if __name__ == '__main__':
    convert_files(
        ['document.pdf', 'image.jpg'],
        'png',
        'imagemagick'
    )
```

---

## 错误代码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 404 | 资源不找到（任务或文件不存在） |
| 500 | 服务器内部错误 |

---

## 注意事项

1. **认证**: 当前版本已移除 JWT 认证，所有请求使用默认用户（ID: 1）
2. **文件大小**: 注意服务器配置的最大文件大小限制
3. **转换器**: 确保使用正确的转换器名称和目标格式组合
4. **进度轮询**: 建议使用合理的轮询间隔（如2-5秒），避免频繁请求
5. **文件名编码**: URL 中的文件名需要进行 URL 编码
6. **异步处理**: 转换过程是异步的，需要通过进度接口查询状态
7. **任务清理**: 服务器会定期清理旧任务，请及时下载结果

---

## 支持的转换器

请查看原有的 `/listConverters` 接口或查看源码中的 converters 目录以获取完整的转换器列表和支持的格式。

常见转换器包括：
- `imagemagick` - 图片格式转换
- `ffmpeg` - 音视频格式转换
- `pandoc` - 文档格式转换
- `libreoffice` - Office 文档转换
- `inkscape` - 矢量图形转换
- 更多...

---

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 支持文件上传、转换、进度查询、下载和预览功能
