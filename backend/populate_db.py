import pandas as pd
from urllib.parse import urlparse
from deta import Deta
from datetime import datetime
import os

# Make connection to Deta databases

deta = Deta('')
db = deta.Base("claims-db")
data = pd.read_csv("claims.csv")

for idx, row in enumerate(data.to_numpy()):
    try:
        # Save claim
        timestamp = datetime.utcnow().strftime('%Y-%m-%d.%H:%M:%S')
        write_result = db.put(
            data = {
                "category": row[0],
                "source": row[1],
                "claim_text": row[2],
                "save_date": timestamp
            },
            key = str(idx),
        )
    except Exception as e:
        print("Error: "+str(e))
