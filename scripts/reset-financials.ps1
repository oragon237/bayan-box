<#
.SYNOPSIS
    Safe runner for the HABI financial transaction reset.

.DESCRIPTION
    Wraps scripts/reset-financials.sql.

    * Default behaviour is a DRY RUN: the SQL runs inside a transaction that is
      rolled back, so you see exactly what would change and nothing is saved.
    * -Apply takes a pg_dump backup into scripts\backups\ FIRST, then commits.
    * -NoBackup skips the dump (not recommended).
    * -Restore <file> replays a previously taken backup instead of resetting.

    The reset clears orders, parcels, bookings, ledger entries, affiliate
    commissions/cash-outs, rider COD remittances, loyalty points, redemptions
    and transaction-generated notifications. All dummy accounts, wallets,
    products, images, reviews, hubs and config rows are preserved (enforced by
    an in-script PRESERVE GUARD that aborts if any of them loses a row).

.EXAMPLE
    .\scripts\reset-financials.ps1
    Dry run - prints the full before/after report, changes nothing.

.EXAMPLE
    .\scripts\reset-financials.ps1 -Apply
    Backs up the database, then commits the reset.

.EXAMPLE
    .\scripts\reset-financials.ps1 -Restore scripts\backups\bayanbox_20260901_150000.sql
    Rebuilds the database from a backup.
#>
[CmdletBinding()]
param(
    # Actually commit the reset. Without this switch nothing is saved.
    [switch]$Apply,

    # Skip the automatic pg_dump safety copy.
    [switch]$NoBackup,

    # Path to a .sql dump produced by this script; restores it instead of resetting.
    [string]$Restore,

    [string]$Database = 'bayanbox',
    [string]$Username = 'postgres'
)

$ErrorActionPreference = 'Continue'
$sqlFile   = Join-Path $PSScriptRoot 'reset-financials.sql'
$backupDir = Join-Path $PSScriptRoot 'backups'

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host 'psql not found on PATH - install PostgreSQL client tools or add them to PATH.' -ForegroundColor Red
    exit 2
}
if (-not (Test-Path $sqlFile)) {
    Write-Host "Missing SQL script: $sqlFile" -ForegroundColor Red
    exit 2
}

$psqlArgs = @('-v', 'ON_ERROR_STOP=1', '-U', $Username, '-d', $Database)

# ---------------------------------------------------------------- restore path
if ($Restore) {
    if (-not (Test-Path $Restore)) { Write-Host "Backup not found: $Restore" -ForegroundColor Red; exit 2 }
    Write-Host "Restoring $Database from $Restore ..." -ForegroundColor Yellow
    # Drop + recreate so the dump lands in a clean database.
    & psql -U $Username -d postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$Database' AND pid <> pg_backend_pid();" 2>&1 | Out-Null
    & psql -U $Username -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $Database WITH (FORCE);" 2>&1 | Out-Null
    & psql -U $Username -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $Database;" 2>&1 | Out-Null
    & psql -U $Username -d $Database -v ON_ERROR_STOP=1 -f $Restore 2>&1 | ForEach-Object { "$_" }
    if ($LASTEXITCODE -ne 0) { Write-Host 'Restore FAILED.' -ForegroundColor Red; exit 1 }
    Write-Host 'Restore complete.' -ForegroundColor Green
    exit 0
}

# ---------------------------------------------------------------- reset path
$mode = if ($Apply) { 'APPLY (will commit)' } else { 'DRY RUN (rolls back)' }
Write-Host ''
Write-Host '==================================================================' -ForegroundColor Cyan
Write-Host " HABI financial transaction reset" -ForegroundColor Cyan
Write-Host " database : $Database" -ForegroundColor Cyan
Write-Host " mode     : $mode" -ForegroundColor Cyan
Write-Host '==================================================================' -ForegroundColor Cyan
Write-Host ''

if ($Apply -and -not $NoBackup) {
    if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
        Write-Host 'pg_dump not found on PATH. Use -NoBackup only if you accept the risk.' -ForegroundColor Red
        exit 2
    }
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    $stamp  = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backup = Join-Path $backupDir "${Database}_${stamp}.sql"
    Write-Host "Backing up $Database -> $backup ..." -ForegroundColor Yellow
    & pg_dump -U $Username -d $Database -f $backup 2>&1 | ForEach-Object { "$_" }
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $backup)) {
        Write-Host 'Backup FAILED - aborting without touching anything.' -ForegroundColor Red
        exit 1
    }
    $sizeKB = [math]::Round((Get-Item $backup).Length / 1KB, 1)
    Write-Host "Backup OK ($sizeKB KB). To undo: .\scripts\reset-financials.ps1 -Restore `"$backup`"" -ForegroundColor Green
    Write-Host ''
}

$log = Join-Path $env:TEMP "habi_financial_reset_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

if ($Apply) {
    & psql @psqlArgs -v 'apply=on' -f $sqlFile 2>&1 | Tee-Object -FilePath $log | ForEach-Object { "$_" }
} else {
    & psql @psqlArgs -f $sqlFile 2>&1 | Tee-Object -FilePath $log | ForEach-Object { "$_" }
}
$code = $LASTEXITCODE

Write-Host ''
if ($code -eq 0) {
    if ($Apply) {
        Write-Host 'RESET COMMITTED - all financial history cleared, accounts intact.' -ForegroundColor Green
    } else {
        Write-Host 'DRY RUN COMPLETE - nothing was changed. Re-run with -Apply to commit.' -ForegroundColor Green
    }
} else {
    Write-Host "RESET ABORTED (exit $code) - the transaction rolled back, nothing was changed." -ForegroundColor Red
    Write-Host "A guard probably failed, or a statement errored. Full log: $log" -ForegroundColor Red
}
exit $code
