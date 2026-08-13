$processNames = @('node','pwsh','powershell','cmd')

Get-Process | Where-Object { $_.ProcessName -in $processNames } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host 'All matching terminal processes were stopped.'
