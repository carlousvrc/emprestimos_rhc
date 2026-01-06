import datetime
import pandas as pd
try:
    import pytz
except:
    pass

def to_brazil_time(dt):
    if dt is None: return datetime.datetime.now() - datetime.timedelta(hours=3)
    try:
        # Garante que seja datetime
        if isinstance(dt, str):
            dt = pd.to_datetime(dt).to_pydatetime()
            
        # Tenta usar pytz
        if dt.tzinfo is None:
            # Assume NAIVO = UTC
            try:
                dt = pytz.utc.localize(dt)
            except:
                pass
            
        try:
            return dt.astimezone(pytz.timezone('America/Sao_Paulo'))
        except:
             return dt - datetime.timedelta(hours=3)
    except Exception as e:
        # Fallback Se algo falhar, apenas subtrai 3h se for naive
        try:
            if dt.tzinfo is None:
                 return dt - datetime.timedelta(hours=3)
            else:
                 # Se for aware, converte pra -3 hardcoded
                 return dt.astimezone(datetime.timezone(datetime.timedelta(hours=-3)))
        except:
            return dt

now = datetime.datetime.now()
print(f"Now: {now}")
converted = to_brazil_time(now)
print(f"Converted: {converted}")
formatted = converted.strftime("%d/%m/%Y")
print(f"Formatted: '{formatted}'")

if ":" in formatted:
    print("FAIL: Time is still present!")
else:
    print("SUCCESS: Time removed.")
