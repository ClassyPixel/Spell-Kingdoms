# Simple HTTP server for Arcane Card Kingdom
# Run this script, then the game opens automatically at http://localhost:8080

$port = 8080
$root = $PSScriptRoot
$url  = "http://localhost:$port/"

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($url)
$listener.Start()

Write-Host ""
Write-Host "  Arcane Card Kingdom server running at $url"
Write-Host "  Press Ctrl+C to stop."
Write-Host ""

# Open browser
Start-Process "http://localhost:$port/index.html"

$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.gif'  = 'image/gif'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.wav'  = 'audio/wav'
  '.mp3'  = 'audio/mpeg'
  '.ogg'  = 'audio/ogg'
}

while ($listener.IsListening) {
  $ctx  = $listener.GetContext()
  $req  = $ctx.Request
  $resp = $ctx.Response

  $localPath = $req.Url.LocalPath.TrimStart('/')
  if ($localPath -eq '' -or $localPath -eq '/') { $localPath = 'index.html' }

  $filePath = Join-Path $root $localPath

  if (Test-Path $filePath -PathType Leaf) {
    $ext         = [System.IO.Path]::GetExtension($filePath).ToLower()
    $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }
    $bytes       = [System.IO.File]::ReadAllBytes($filePath)

    $resp.StatusCode  = 200
    $resp.ContentType = $contentType
    $resp.ContentLength64 = $bytes.Length
    $resp.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $resp.StatusCode = 404
    $msg  = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $localPath")
    $resp.ContentType = 'text/plain'
    $resp.ContentLength64 = $msg.Length
    $resp.OutputStream.Write($msg, 0, $msg.Length)
  }

  $resp.OutputStream.Close()
}
