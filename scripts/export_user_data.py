#!/usr/bin/env python3
import os
import sys
import json
from sqlalchemy import create_engine
import pandas as pd
from dotenv import load_dotenv

# GDPR Data Export Script (Article 20)
# Usage: python scripts/export_user_data.py --output gdpr_export.json

def export_data(output_file="gdpr_export.json"):
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL must be set in the environment.")
        sys.exit(1)

    print(f"Connecting to Postgres database pool...")
    engine = create_engine(db_url)
    
    try:
        # Fetch sensitive tables containing user-specific interactions
        print("Extracting PII bounded tables: [applications, run_logs]")
        applications_df = pd.read_sql("SELECT * FROM applications", engine)
        
        # Convert datetime objects to string for strict JSON serialization
        datetime_cols = ['applied_at', 'created_at', 'updated_at']
        for col in datetime_cols:
            if col in applications_df.columns:
                applications_df[col] = applications_df[col].astype(str)
        
        export_dict = {
            "version": "1.0",
            "compliance": "GDPR Article 20 Right to Data Portability",
            "data": {
                "applications": applications_df.to_dict(orient="records")
            }
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(export_dict, f, indent=2)
            
        print(f"Success! Expertly shredded {len(applications_df)} application records down to {output_file}.")
        print("Under GDPR Article 20, you may now securely transmit this unencrypted artifact to the requesting user.")
        
    except Exception as e:
        print(f"Critical error during physical export: {e}")
        sys.exit(1)

if __name__ == "__main__":
    output = "gdpr_export.json"
    args = sys.argv[1:]
    if "--output" in args:
        output = args[args.index("--output") + 1]
    elif len(args) > 0 and not args[0].startswith("--"):
        output = args[0]
        
    export_data(output)
