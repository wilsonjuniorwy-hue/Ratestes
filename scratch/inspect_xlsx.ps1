$excelPath = "c:\Users\wagne\JR - Arquivos\SISTEMAS\gestão-de-reserva-de-armamento-pm\pasta de usuarios.xlsx"

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    $workbook = $excel.Workbooks.Open($excelPath)
    $sheet = $workbook.Sheets.Item(1)
    
    Write-Host "Planilha Ativa: $($sheet.Name)"
    Write-Host "--- CABEÇALHOS (Linha 1) ---"
    for ($col = 1; $col -le 15; $col++) {
        $val = $sheet.Cells.Item(1, $col).Text
        if ($val) {
            Write-Host "Col ${col}: $val"
        }
    }
    
    Write-Host "`n--- PRIMEIRAS 10 LINHAS DE DADOS ---"
    for ($row = 2; $row -le 11; $row++) {
        $rowVals = @()
        $hasData = $false
        for ($col = 1; $col -le 15; $col++) {
            $val = $sheet.Cells.Item($row, $col).Text
            if ($val) {
                $hasData = $true
            }
            $rowVals += $val
        }
        if ($hasData) {
            Write-Host "Linha ${row}: $($rowVals -join ' | ')"
        }
    }
    
    $workbook.Close($false)
    $excel.Quit()
} catch {
    Write-Error "Erro ao abrir ou ler o arquivo Excel: $_"
    if ($excel) {
        $excel.Quit()
    }
}
