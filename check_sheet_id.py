
import sheets_handler
import gspread

def check_id():
    try:
        sh = sheets_handler.connect_to_sheets()
        if not sh:
            print("Falha conexão")
            return

        target_gid = 533520567
        print(f"🔎 Procurando aba com ID: {target_gid}")
        
        found = False
        for ws in sh.worksheets():
            if str(ws.id) == str(target_gid):
                print(f"FOUND_NAME:{ws.title}")
                return
        
        if not found:
            print("❌ ID não encontrado na planilha.")
            
    except Exception as e:
        print(e)

if __name__ == "__main__":
    check_id()
