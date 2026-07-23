import sys

try:
    import openpyxl
except ImportError:
    print("ERRO: openpyxl nao esta instalado. Tentando usar outro metodo...")
    sys.exit(1)

try:
    wb = openpyxl.load_workbook(r"c:\Users\wagne\JR - Arquivos\SISTEMAS\gestão-de-reserva-de-armamento-pm\pasta de usuarios.xlsx")
    sheet = wb.active
    print(f"Planilha ativa: {sheet.title}")
    print(f"Dimensoes: {sheet.dimensions}")
    print("\n--- PRIMEIRAS 10 LINHAS ---")
    for idx, row in enumerate(sheet.iter_rows(max_row=10, values_only=True), 1):
        # Filtrar valores None e imprimir formatado
        print(f"Linha {idx}: {row}")
except Exception as e:
    print(f"Erro ao ler arquivo: {e}")
    sys.exit(2)
