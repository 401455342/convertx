# ConvertX API - PowerShell 使用指南

## 快速开始

### 使用测试脚本（推荐）

1. **下载并运行测试脚本**：
```powershell
# 转换单个文件
.\test-api.ps1 -FilePath "C:\path\to\your\file.pdf" -ConvertTo "png" -Converter "imagemagick"

# 自定义服务器地址
.\test-api.ps1 -FilePath "C:\path\to\file.pdf" -ConvertTo "jpg" -BaseUrl "http://localhost:3000/api"
```

脚本会自动完成：上传 → 转换 → 监控进度 → 下载结果

---

## 手动使用 PowerShell 调用 API

### 方法1：使用 curl.exe（真正的 curl）

```powershell
# 上传文件
curl.exe -X POST http://localhost:3000/api/upload -F "file=@C:\path\to\file.pdf"

# 开始转换
curl.exe -X POST http://localhost:3000/api/convert/JOB_ID `
  -H "Content-Type: application/json" `
  -d '{\"convertTo\":\"png\",\"converter\":\"imagemagick\",\"fileNames\":[\"file.pdf\"]}'

# 查询进度
curl.exe http://localhost:3000/api/progress/JOB_ID

# 下载文件
curl.exe http://localhost:3000/api/download/JOB_ID/output.png -o output.png
```

### 方法2：使用 Invoke-RestMethod（PowerShell 原生）

#### 1. 上传文件

```powershell
# 单个文件
$file = Get-Item "C:\path\to\file.pdf"
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/upload" -Method Post -Form @{file = $file}
$jobId = $response.jobId
Write-Host "Job ID: $jobId"

# 多个文件
$files = @(
    Get-Item "C:\path\to\file1.pdf",
    Get-Item "C:\path\to\file2.jpg"
)
$form = @{file = $files}
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/upload" -Method Post -Form $form
```

#### 2. 开始转换

```powershell
$body = @{
    convertTo = "png"
    converter = "imagemagick"
    fileNames = @("file.pdf")
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/convert/$jobId" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

#### 3. 查询进度

```powershell
$progress = Invoke-RestMethod -Uri "http://localhost:3000/api/progress/$jobId"
Write-Host "进度: $($progress.progress)%"
Write-Host "状态: $($progress.status)"
Write-Host "完成: $($progress.completedFiles)/$($progress.totalFiles)"
```

#### 4. 下载文件

```powershell
# 下载单个文件
$fileName = "output.png"
Invoke-RestMethod `
    -Uri "http://localhost:3000/api/download/$jobId/$fileName" `
    -OutFile ".\$fileName"

# 下载打包文件
Invoke-RestMethod `
    -Uri "http://localhost:3000/api/download/$jobId/archive" `
    -OutFile ".\results.tar"
```

#### 5. 预览文件

```powershell
# 获取文件信息
$info = Invoke-RestMethod -Uri "http://localhost:3000/api/preview/$jobId/$fileName/info"
Write-Host "文件大小: $($info.size) bytes"
Write-Host "MIME类型: $($info.mimeType)"

# 预览图片（保存到本地）
Invoke-RestMethod `
    -Uri "http://localhost:3000/api/preview/$jobId/$fileName" `
    -OutFile ".\preview.png"
```

---

## 完整示例：端到端转换

```powershell
# ========================================
# ConvertX API 完整示例
# ========================================

$baseUrl = "http://localhost:3000/api"
$sourceFile = "C:\path\to\document.pdf"

Write-Host "开始转换流程..." -ForegroundColor Cyan

# 1. 上传
Write-Host "`n[1] 上传文件..."
$file = Get-Item $sourceFile
$uploadResult = Invoke-RestMethod -Uri "$baseUrl/upload" -Method Post -Form @{file = $file}
$jobId = $uploadResult.jobId
$fileNames = $uploadResult.files
Write-Host "Job ID: $jobId" -ForegroundColor Green

# 2. 转换
Write-Host "`n[2] 开始转换..."
$convertBody = @{
    convertTo = "png"
    converter = "imagemagick"
    fileNames = $fileNames
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/convert/$jobId" -Method Post -Body $convertBody -ContentType "application/json" | Out-Null

# 3. 监控进度
Write-Host "`n[3] 监控转换进度..."
do {
    Start-Sleep -Seconds 2
    $progress = Invoke-RestMethod -Uri "$baseUrl/progress/$jobId"
    Write-Host "  进度: $($progress.progress)% - 状态: $($progress.status)" -ForegroundColor Yellow
} while ($progress.status -ne "completed" -and $progress.status -ne "failed")

if ($progress.status -eq "failed") {
    Write-Host "转换失败!" -ForegroundColor Red
    exit 1
}

Write-Host "转换完成!" -ForegroundColor Green

# 4. 下载结果
Write-Host "`n[4] 下载文件..."
$outputFiles = $progress.files | Where-Object { $_.status -eq "completed" }
foreach ($file in $outputFiles) {
    $fileName = $file.outputFileName
    $outputPath = ".\downloads\$fileName"
    
    # 创建下载目录
    $downloadDir = Split-Path $outputPath -Parent
    if (-not (Test-Path $downloadDir)) {
        New-Item -ItemType Directory -Path $downloadDir -Force | Out-Null
    }
    
    # 下载文件
    $encodedFileName = [uri]::EscapeDataString($fileName)
    Invoke-RestMethod -Uri "$baseUrl/download/$jobId/$encodedFileName" -OutFile $outputPath
    Write-Host "  已下载: $fileName" -ForegroundColor Green
}

Write-Host "`n完成! 文件保存在 .\downloads\" -ForegroundColor Cyan
```

---

## 常见问题

### Q: 为什么 `curl` 命令不工作？

A: PowerShell 中的 `curl` 是 `Invoke-WebRequest` 的别名，不是真正的 curl。解决方法：
- 使用 `curl.exe` 明确调用真正的 curl
- 或使用 `Invoke-RestMethod`（PowerShell 原生命令）

### Q: 如何上传多个文件？

```powershell
$files = @(
    Get-Item "file1.pdf",
    Get-Item "file2.jpg",
    Get-Item "file3.png"
)

$response = Invoke-RestMethod `
    -Uri "http://localhost:3000/api/upload" `
    -Method Post `
    -Form @{file = $files}
```

### Q: 如何处理文件名中的特殊字符？

```powershell
# 使用 URI 编码
$fileName = "文件 名.png"
$encodedFileName = [uri]::EscapeDataString($fileName)
$url = "http://localhost:3000/api/download/$jobId/$encodedFileName"
```

### Q: 如何在脚本中处理错误？

```powershell
try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Form $form
    if ($response.success) {
        Write-Host "成功!" -ForegroundColor Green
    }
} catch {
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
    # 查看详细错误
    $_.Exception | Format-List -Force
}
```

---

## 支持的转换器

常见转换器和格式：

| 转换器 | 输入格式 | 输出格式 |
|--------|---------|---------|
| imagemagick | jpg, png, gif, bmp, tiff, webp | jpg, png, gif, bmp, tiff, webp, pdf |
| ffmpeg | mp4, avi, mkv, mov, mp3, wav | mp4, avi, mkv, webm, mp3, wav, ogg |
| pandoc | md, docx, html, rst | pdf, docx, html, md |
| libreoffice | docx, xlsx, pptx | pdf, odt, ods |

查看所有支持的转换器：
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/listConverters"
```

---

## 提示和技巧

### 1. 批量转换多个文件

```powershell
$files = Get-ChildItem "C:\path\to\folder\*.pdf"
foreach ($file in $files) {
    Write-Host "转换: $($file.Name)"
    # 上传并转换...
}
```

### 2. 将 jobId 保存到文件

```powershell
$jobId | Out-File "last-job-id.txt"
# 稍后读取
$jobId = Get-Content "last-job-id.txt"
```

### 3. 美化 JSON 输出

```powershell
$response = Invoke-RestMethod -Uri $url
$response | ConvertTo-Json -Depth 10 | Write-Host
```

### 4. 创建函数简化调用

```powershell
function Upload-File {
    param([string]$Path)
    $file = Get-Item $Path
    Invoke-RestMethod -Uri "http://localhost:3000/api/upload" -Method Post -Form @{file = $file}
}

function Get-Progress {
    param([string]$JobId)
    Invoke-RestMethod -Uri "http://localhost:3000/api/progress/$JobId"
}

# 使用
$result = Upload-File "document.pdf"
Get-Progress $result.jobId
```

---

## 更多信息

- 完整 API 文档: [API.md](./API.md)
- 测试脚本: [test-api.ps1](./test-api.ps1)
- 项目主页: https://github.com/C4illin/ConvertX
