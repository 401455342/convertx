# ConvertX API 测试脚本 (PowerShell)
# 使用方法: .\test-api.ps1 -FilePath "C:\path\to\your\file.pdf" -ConvertTo "png" -Converter "imagemagick"

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [string]$ConvertTo = "png",
    
    [Parameter(Mandatory=$false)]
    [string]$Converter = "imagemagick",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000/api"
)

Write-Host "=== ConvertX API 测试 ===" -ForegroundColor Cyan

# 检查文件是否存在
if (-not (Test-Path $FilePath)) {
    Write-Host "错误: 文件不存在: $FilePath" -ForegroundColor Red
    exit 1
}

$file = Get-Item $FilePath
Write-Host "文件: $($file.Name)" -ForegroundColor Green

# 1. 上传文件
Write-Host "`n[1/5] 上传文件..." -ForegroundColor Yellow
try {
    $uploadUri = "$BaseUrl/upload"
    $form = @{
        file = $file
    }
    
    $uploadResponse = Invoke-RestMethod -Uri $uploadUri -Method Post -Form $form
    Write-Host "✓ 上传成功!" -ForegroundColor Green
    Write-Host "  Job ID: $($uploadResponse.jobId)" -ForegroundColor Cyan
    Write-Host "  文件数: $($uploadResponse.filesUploaded)" -ForegroundColor Cyan
    
    $jobId = $uploadResponse.jobId
    $fileNames = $uploadResponse.files
} catch {
    Write-Host "✗ 上传失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 开始转换
Write-Host "`n[2/5] 开始转换..." -ForegroundColor Yellow
try {
    $convertUri = "$BaseUrl/convert/$jobId"
    $convertBody = @{
        convertTo = $ConvertTo
        converter = $Converter
        fileNames = $fileNames
    } | ConvertTo-Json
    
    $convertResponse = Invoke-RestMethod -Uri $convertUri -Method Post -Body $convertBody -ContentType "application/json"
    Write-Host "✓ 转换已启动!" -ForegroundColor Green
    Write-Host "  状态: $($convertResponse.status)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ 转换失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. 查询进度
Write-Host "`n[3/5] 查询转换进度..." -ForegroundColor Yellow
$maxRetries = 60
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    try {
        $progressUri = "$BaseUrl/progress/$jobId"
        $progressResponse = Invoke-RestMethod -Uri $progressUri -Method Get
        
        $status = $progressResponse.status
        $progress = $progressResponse.progress
        $completed = $progressResponse.completedFiles
        $total = $progressResponse.totalFiles
        
        Write-Host "  进度: $progress% ($completed/$total) - 状态: $status" -ForegroundColor Cyan
        
        if ($status -eq "completed") {
            Write-Host "✓ 转换完成!" -ForegroundColor Green
            break
        } elseif ($status -eq "failed") {
            Write-Host "✗ 转换失败!" -ForegroundColor Red
            exit 1
        }
        
        Start-Sleep -Seconds 2
        $retryCount++
    } catch {
        Write-Host "✗ 查询进度失败: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

if ($retryCount -ge $maxRetries) {
    Write-Host "✗ 超时: 转换时间过长" -ForegroundColor Red
    exit 1
}

# 4. 获取转换后的文件列表
Write-Host "`n[4/5] 获取转换文件列表..." -ForegroundColor Yellow
$progressResponse = Invoke-RestMethod -Uri "$BaseUrl/progress/$jobId" -Method Get
$outputFiles = $progressResponse.files | Where-Object { $_.status -eq "completed" }

Write-Host "✓ 找到 $($outputFiles.Count) 个转换后的文件" -ForegroundColor Green
foreach ($file in $outputFiles) {
    Write-Host "  - $($file.outputFileName)" -ForegroundColor Cyan
}

# 5. 下载文件
Write-Host "`n[5/5] 下载转换后的文件..." -ForegroundColor Yellow
$downloadDir = ".\downloads"
if (-not (Test-Path $downloadDir)) {
    New-Item -ItemType Directory -Path $downloadDir | Out-Null
}

foreach ($file in $outputFiles) {
    try {
        $fileName = $file.outputFileName
        $downloadUri = "$BaseUrl/download/$jobId/$([uri]::EscapeDataString($fileName))"
        $outputPath = Join-Path $downloadDir $fileName
        
        Invoke-RestMethod -Uri $downloadUri -Method Get -OutFile $outputPath
        Write-Host "  ✓ 已下载: $fileName" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ 下载失败: $fileName - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== 完成! ===" -ForegroundColor Cyan
Write-Host "文件已保存到: $downloadDir" -ForegroundColor Green
