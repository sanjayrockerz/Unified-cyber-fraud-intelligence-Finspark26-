param(
  [Parameter(Mandatory=$true)][string]$Backup,
  [string]$Destination = ".\finspark.db"
)

if (-not (Test-Path -LiteralPath $Backup)) { throw "Backup not found: $Backup" }
Copy-Item -LiteralPath $Backup -Destination $Destination -Force
Write-Output "SQLite database restored to $Destination"
