import os
import sys
import json
import openpyxl

sys.stdout.reconfigure(encoding="utf-8")

def analyze_excel():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    excel_files = [f for f in os.listdir(data_dir) if f.endswith(".xlsx")]
    if not excel_files:
        raise FileNotFoundError("No se encontró el archivo Excel en /data")
    
    excel_path = os.path.join(data_dir, excel_files[0])
    print(f"Analizando archivo: {excel_path}\n")

    # Cargar libro con data_only=False para extraer fórmulas literales
    wb_formulas = openpyxl.load_workbook(excel_path, data_only=False)
    # Cargar también con data_only=True para comparar valores calculados en caché
    wb_values = openpyxl.load_workbook(excel_path, data_only=True)

    print("Hojas disponibles en el documento:", wb_formulas.sheetnames)
    target_sheets = ["HOMBRE Adulto & A. Mayor", "MUJER Adulto & A. Mayor"]

    report = {}

    for sheet_name in wb_formulas.sheetnames:
        ws_f = wb_formulas[sheet_name]
        ws_v = wb_values[sheet_name]
        print(f"\n{'='*70}")
        print(f"HOJA: {sheet_name} (Filas: {ws_f.max_row}, Columnas: {ws_f.max_column})")
        print(f"{'='*70}")

        sheet_data = []
        for row in range(1, ws_f.max_row + 1):
            row_items = []
            for col in range(1, ws_f.max_column + 1):
                val_f = ws_f.cell(row=row, column=col).value
                val_v = ws_v.cell(row=row, column=col).value
                coord = ws_f.cell(row=row, column=col).coordinate
                if val_f is not None:
                    is_formula = isinstance(val_f, str) and val_f.startswith("=")
                    entry = {
                        "coord": coord,
                        "content": str(val_f).strip(),
                        "is_formula": is_formula,
                        "cached_value": val_v
                    }
                    row_items.append(entry)
            if row_items:
                sheet_data.append({"row": row, "cells": row_items})
                # Imprimir resumen legible de la fila
                line_str = f"Fila {row:02d}: " + " | ".join(
                    [f"[{c['coord']}] {c['content']}" + (f" (val={c['cached_value']})" if c['is_formula'] else "") for c in row_items]
                )
                print(line_str)
        report[sheet_name] = sheet_data

    output_json = os.path.join(data_dir, "extracted_formulas.json")
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2, default=str)
    print(f"\nReporte JSON exportado exitosamente en: {output_json}")

if __name__ == "__main__":
    analyze_excel()
