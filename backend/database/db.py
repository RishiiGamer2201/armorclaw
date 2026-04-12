import sqlite3
import os
from contextlib import contextmanager
import random
import time

DB_PATH = os.path.join(os.path.dirname(__file__), "finance.db")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.commit()
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        # Accounts Table
        cursor.execute('''CREATE TABLE IF NOT EXISTS accounts (
            account_id TEXT PRIMARY KEY,
            balance REAL,
            status TEXT
        )''')
        
        # Approved Vendors Table
        cursor.execute('''CREATE TABLE IF NOT EXISTS approved_vendors (
            vendor_name TEXT PRIMARY KEY,
            iban TEXT
        )''')
        
        # Transactions Table (for auditing and AML)
        cursor.execute('''CREATE TABLE IF NOT EXISTS transactions (
            tx_id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT,
            amount REAL,
            recipient TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )''')
        
        # Credit Cards Table
        cursor.execute('''CREATE TABLE IF NOT EXISTS corporate_cards (
            card_number TEXT PRIMARY KEY,
            employee_email TEXT,
            credit_limit REAL
        )''')
        
        # Crypto Wallets
        cursor.execute('''CREATE TABLE IF NOT EXISTS crypto_balances (
            asset TEXT PRIMARY KEY,
            balance REAL
        )''')
        
        # Employees (for Payroll)
        cursor.execute('''CREATE TABLE IF NOT EXISTS employees (
            emp_id TEXT PRIMARY KEY,
            department TEXT,
            salary REAL
        )''')
        
        # Seed test data if database is fresh
        cursor.execute('SELECT COUNT(*) FROM accounts')
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO accounts (account_id, balance, status) VALUES ('MAIN-001', 250000.0, 'ACTIVE')")
            cursor.execute("INSERT INTO approved_vendors (vendor_name, iban) VALUES ('STRIPE PAYMENTS', 'US12STRIPE998')")
            cursor.execute("INSERT INTO approved_vendors (vendor_name, iban) VALUES ('AWS CLOUD', 'US44AMZN777')")
            cursor.execute("INSERT INTO crypto_balances (asset, balance) VALUES ('USDC', 50000.0)")
            cursor.execute("INSERT INTO crypto_balances (asset, balance) VALUES ('ETH', 12.5)")
            cursor.execute("INSERT INTO employees (emp_id, department, salary) VALUES ('E1', 'ENGINEERING', 8000.0)")
            cursor.execute("INSERT INTO employees (emp_id, department, salary) VALUES ('E2', 'ENGINEERING', 7500.0)")
            cursor.execute("INSERT INTO employees (emp_id, department, salary) VALUES ('E3', 'MARKETING', 5000.0)")
            
            # Seed some fake transaction history for AML tests
            for _ in range(5):
                cursor.execute("""
                    INSERT INTO transactions (account_id, amount, recipient) 
                    VALUES ('MAIN-001', 9900.0, 'OFFSHORE-001')
                """)

init_db()
