"""
Alter tenant_service_tickets to match exact spec:
  Ticket Creation Date, Ticket No, Ticket Classification, Category,
  Issue Description, Ticket Status, Final Resolution Message,
  Final Resolution Date & Time, Charges Amount, Charges Description

Run once: python alter_tickets_table.py
"""
from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

try:
    # Add missing columns
    adds = [
        "ALTER TABLE tenant_service_tickets ADD COLUMN IF NOT EXISTS category VARCHAR(100)",
        "ALTER TABLE tenant_service_tickets ADD COLUMN IF NOT EXISTS issue_description TEXT",
        "ALTER TABLE tenant_service_tickets ADD COLUMN IF NOT EXISTS final_resolution_message TEXT",
        "ALTER TABLE tenant_service_tickets ADD COLUMN IF NOT EXISTS final_resolution_at TIMESTAMP",
        "ALTER TABLE tenant_service_tickets ADD COLUMN IF NOT EXISTS charges_amount NUMERIC(10,2)",
        "ALTER TABLE tenant_service_tickets ADD COLUMN IF NOT EXISTS charges_description TEXT",
    ]
    for sql in adds:
        db.execute(text(sql))
        col = sql.split("IF NOT EXISTS ")[1].split(" ")[0]
        print(f"  Added: {col}")

    # Rename subcategory -> category if subcategory exists but category doesn't have data
    # (subcategory data moves to category)
    try:
        db.execute(text(
            "UPDATE tenant_service_tickets SET category = subcategory WHERE category IS NULL AND subcategory IS NOT NULL"
        ))
        print("  Migrated subcategory data -> category")
    except Exception:
        pass

    # Drop columns no longer needed
    drops = ['subcategory', 'email_subject']
    for col in drops:
        try:
            db.execute(text(f'ALTER TABLE tenant_service_tickets DROP COLUMN IF EXISTS {col}'))
            print(f"  Dropped: {col}")
        except Exception as e:
            print(f"  Skip drop {col}: {e}")

    db.commit()

    # Show final schema
    result = db.execute(text(
        "SELECT column_name, data_type FROM information_schema.columns "
        "WHERE table_name = 'tenant_service_tickets' ORDER BY ordinal_position"
    ))
    print("\nFinal columns:")
    for row in result:
        print(f"  {row[0]:30s} {row[1]}")

except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
