$files = @(
    "src\components\ArmeiroView.tsx",
    "src\components\ArmeiroProfileView.tsx",
    "src\components\BancoDadosView.tsx",
    "src\components\FlowSimulator.tsx"
)
foreach ($f in $files) {
    $c = Get-Content $f -Raw -Encoding UTF8
    $c = $c.Replace("activeArmeiroMatricula === '7317573'", "authenticatedPerfil === 'admin'")
    [System.IO.File]::WriteAllText((Resolve-Path $f).Path, $c, [System.Text.UTF8Encoding]::new($false))
    Write-Host "Updated: $f"
}
Write-Host "Concluido!"
