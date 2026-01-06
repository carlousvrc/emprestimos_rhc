import datetime
try:
    import pytz
    print(f"pytz version: {pytz.VERSION}")
    tz = pytz.timezone('America/Sao_Paulo')
    print(f"Sao_Paulo tz: {tz}")
except Exception as e:
    print(f"pytz import error: {e}")

now = datetime.datetime.now()
utcnow = datetime.datetime.utcnow()
print(f"datetime.now(): {now}")
print(f"datetime.utcnow(): {utcnow}")

def to_brazil_time(dt):
    try:
        import pytz
        if dt is None: return datetime.datetime.now(pytz.timezone('America/Sao_Paulo'))
        
        # Se naivo, assume UTC
        if dt.tzinfo is None:
            dt = pytz.utc.localize(dt)
        return dt.astimezone(pytz.timezone('America/Sao_Paulo'))
    except Exception as e:
        print(f"Conversion logic error: {e}")
        # Fallback manual
        return dt - datetime.timedelta(hours=3)

print("--- Testing Conversion ---")
res = to_brazil_time(now)
print(f"Converted now ({now}): {res}")

res_utc = to_brazil_time(utcnow)
print(f"Converted utcnow ({utcnow}): {res_utc}")
