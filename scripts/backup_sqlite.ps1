param(
  [string]$Source = ".\finspark.db",
  [string]$Destination = ".\backups\finspark-$(Get-Date -Format yyyyMMdd-HHmmss).db"
)

$destinationDirectory = Split-Path -Parent $Destination
New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
Copy-Item -LiteralPath $Source -Destination $Destination -Force
Write-Output "SQLite backup written to $Destination"
