import pickle
import os
import datetime
import pytz

db_path = os.path.join("dados", "cumulative_db.pkl")

print(f"Checking {db_path}...")
if os.path.exists(db_path):
    try:
        with open(db_path, "rb") as f:
            data = pickle.load(f)
        
        last_update = data.get('last_update')
        print(f"last_update type: {type(last_update)}")
        print(f"last_update value: {last_update}")
        print(f"tzinfo: {last_update.tzinfo if hasattr(last_update, 'tzinfo') else 'N/A'}")
        
        # Test my helper logic
        dt = last_update
        result = None
        try:
            if dt is None: 
                result = "None -> Now (SP)"
            else:
                if dt.tzinfo is None:
                    dt = pytz.utc.localize(dt)
                result = dt.astimezone(pytz.timezone('America/Sao_Paulo'))
            print(f"Converted result: {result}")
        except Exception as e:
            print(f"Conversion error: {e}")
            
    except Exception as e:
        print(f"Error loading pickle: {e}")
else:
    print("File not found.")

daily_path = os.path.join("dados", "resultado_diario.pkl")
print(f"Checking {daily_path}...")
if os.path.exists(daily_path):
    try:
        with open(daily_path, "rb") as f:
            data = pickle.load(f)
        meta = data.get('metadata', {})
        proc = meta.get('data_processamento')
        print(f"daily data_processamento type: {type(proc)}")
        print(f"daily value: {proc}")
    except Exception as e:
        print(f"Error daily: {e}")
