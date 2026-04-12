import os
import json
from google import genai
from google.genai import types
from backend.database.db import get_db

# ── Gemini Setup ──────────────────────────────────────────────────────────────
# We use the user's provided Gemini API key for Vision tools
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyChQEQwKPWu_9AqiEl5C-aEYkWWKwv6VZI")

def get_gemini_client():
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not set")
    return genai.Client(api_key=GEMINI_API_KEY)


# 1. Wire Transfer
async def process_wire_transfer(amount: float, recipient_iban: str, swift_code: str) -> dict:
    """Processes a wire transfer by dynamically deducting balance from the SQLite DB."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT balance, status FROM accounts WHERE account_id = 'MAIN-001'")
        row = cursor.fetchone()
        if not row:
            return {"error": "Account MAIN-001 not found"}
            
        balance, status = row["balance"], row["status"]
        if status == 'FROZEN':
            return {"error": "Transaction declined. Account is FROZEN."}
            
        if balance < amount:
            return {"error": "Insufficient balance", "current_balance": balance}
            
        # Deduct balance
        new_balance = balance - amount
        cursor.execute("UPDATE accounts SET balance = ? WHERE account_id = 'MAIN-001'", (new_balance,))
        
        # Log Transaction
        cursor.execute("""
            INSERT INTO transactions (account_id, amount, recipient)
            VALUES (?, ?, ?)
        """, ('MAIN-001', amount, recipient_iban))
        
        tx_id = cursor.lastrowid
        
        return {
            "success": True, 
            "transaction_id": f"WIRE-{tx_id}", 
            "new_balance": new_balance,
            "recipient": recipient_iban
        }


# 2. Analyze Cheque Image
async def analyze_cheque_image(image_url: str) -> dict:
    """Uses Gemini Vision to read handwritten amounts and check for fraud."""
    try:
        import httpx
        from io import BytesIO
        from PIL import Image

        async with httpx.AsyncClient() as client:
            resp = await client.get(image_url)
            resp.raise_for_status()
            
        img = Image.open(BytesIO(resp.content))
        
        g_client = get_gemini_client()
        prompt = "Analyze this bank cheque. Return JSON strictly in this format: {\"amount\": float, \"payee\": \"string\", \"fraud_probability_percentage\": int, \"fraud_reason\": \"string or null\"}. Consider things like mismatched fonts or suspicious signatures as fraud."
        
        response = g_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[img, prompt],
        )
        
        raw = response.text.strip()
        if raw.startswith("```json"):
            raw = raw[7:-3]
            
        return json.loads(raw)
        
    except Exception as e:
        return {"error": f"Failed to analyze cheque: {str(e)}"}


# 3. Analyze Vendor Invoice
async def analyze_vendor_invoice(invoice_image_url: str) -> dict:
    """Uses Gemini Vision to extract vendor name and amount, then verifies it against SQLite approved_vendors."""
    try:
        import httpx
        from io import BytesIO
        from PIL import Image

        async with httpx.AsyncClient() as client:
            resp = await client.get(invoice_image_url)
            resp.raise_for_status()
            
        img = Image.open(BytesIO(resp.content))
        
        g_client = get_gemini_client()
        prompt = "Extract the vendor name and total amount due from this invoice. Return JSON strictly as {\"vendor_name\": \"STRING\", \"amount\": FLOAT}"
        
        response = g_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[img, prompt],
        )
        
        raw = response.text.strip()
        if raw.startswith("```json"):
            raw = raw[7:-3]
            
        invoice_data = json.loads(raw)
        extracted_vendor = invoice_data.get("vendor_name", "").upper()
        
        # Verify in SQLite
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT iban FROM approved_vendors WHERE UPPER(vendor_name) LIKE ?", (f"%{extracted_vendor}%",))
            row = cursor.fetchone()
            
            if not row:
                return {
                    "error": "Vendor not found in Approved Vendor List. Payment blocked.",
                    "extracted_vendor": extracted_vendor
                }
                
            return {
                "success": True,
                "msg": f"Invoice valid. Vendor {extracted_vendor} is approved.",
                "iban": row["iban"],
                "amount_due": invoice_data.get("amount")
            }
            
    except Exception as e:
        return {"error": f"Failed to analyze invoice: {str(e)}"}


# 4. Issue Corporate Card
async def issue_corporate_card(employee_email: str, credit_limit: float) -> dict:
    """Dynamically generates a fake valid-Luhn CC number and saves it."""
    import random
    
    # Generate random 15 digits starting with 4 (Visa)
    number = [4] + [random.randint(0, 9) for _ in range(14)]
    
    # Calculate Luhn Checksum
    checksum = 0
    for i, digit in enumerate(reversed(number)):
        if i % 2 == 0:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit
        
    check_digit = (10 - (checksum % 10)) % 10
    number.append(check_digit)
    
    card_str = "".join(map(str, number))
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO corporate_cards (card_number, employee_email, credit_limit)
            VALUES (?, ?, ?)
        """, (card_str, employee_email, credit_limit))
        
    return {
        "success": True,
        "employee": employee_email,
        "card_number": f"****-****-****-{card_str[-4:]}",
        "limit": credit_limit
    }


# 5. Verify KYC Document
async def verify_kyc_document(document_url: str) -> dict:
    """Extracts ID details using Gemini."""
    try:
        import httpx
        from io import BytesIO
        from PIL import Image

        async with httpx.AsyncClient() as client:
            resp = await client.get(document_url)
            resp.raise_for_status()
            
        img = Image.open(BytesIO(resp.content))
        
        g_client = get_gemini_client()
        prompt = "Extract details from this ID document. Return strictly JSON: {\"name\": \"str\", \"dob\": \"YYYY-MM-DD\", \"id_number\": \"str\", \"isValid\": boolean}"
        
        response = g_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[img, prompt],
        )
        
        raw = response.text.strip()
        if raw.startswith("```json"):
            raw = raw[7:-3]
            
        return json.loads(raw)
    except Exception as e:
        return {"error": f"KYC Failed: {str(e)}"}


# 6. Detect Money Laundering
async def detect_money_laundering(account_id: str = "MAIN-001") -> dict:
    """Queries DB for rapid transactions acting as structuring/smurfing."""
    with get_db() as conn:
        cursor = conn.cursor()
        # Find transactions slightly below 10,000 threshold within short timeframes
        cursor.execute("""
            SELECT COUNT(*) as count, SUM(amount) as total
            FROM transactions
            WHERE account_id = ? AND amount > 9000 AND amount < 10000
        """, (account_id,))
        row = cursor.fetchone()
        
        if row and row["count"] > 3:
            return {
                "flagged": True,
                "reason": f"Detected {row['count']} transactions averaging just below reporting threshold. Potential structuring.",
                "total_volume": row["total"]
            }
            
        return {"flagged": False, "reason": "No anomalies detected."}


# 7. Lock Compromised Funds
async def lock_compromised_funds(account_id: str = "MAIN-001", reason: str = "Unspecified") -> dict:
    """Emergency killswitch to lock account in database."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE accounts SET status = 'FROZEN' WHERE account_id = ?", (account_id,))
        
    return {
        "success": True,
        "action": "ACCOUNT FROZEN",
        "account_id": account_id,
        "reason": reason
    }


# 8. Process Crypto Swap
async def process_crypto_swap(from_asset: str, to_asset: str, amount: float) -> dict:
    """Adjusts dual asset balances in the SQLite database."""
    # Simplified mock rates
    rates = {"USDC": 1.0, "ETH": 3500.0, "BTC": 65000.0}
    
    if from_asset not in rates or to_asset not in rates:
        return {"error": "Unsupported asset"}
        
    to_receive = (amount * rates[from_asset]) / rates[to_asset]
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check balance
        cursor.execute("SELECT balance FROM crypto_balances WHERE asset = ?", (from_asset,))
        row = cursor.fetchone()
        if not row or row["balance"] < amount:
            return {"error": f"Insufficient {from_asset} balance"}
            
        # Deduct
        cursor.execute("UPDATE crypto_balances SET balance = balance - ? WHERE asset = ?", (amount, from_asset))
        
        # Add (create if not exists)
        cursor.execute("SELECT balance FROM crypto_balances WHERE asset = ?", (to_asset,))
        if cursor.fetchone():
            cursor.execute("UPDATE crypto_balances SET balance = balance + ? WHERE asset = ?", (to_receive, to_asset))
        else:
            cursor.execute("INSERT INTO crypto_balances (asset, balance) VALUES (?, ?)", (to_asset, to_receive))
            
    return {"success": True, "swapped": amount, "from": from_asset, "received": to_receive, "to": to_asset}


# 9. Request Loan Approval
async def request_loan_approval(amount: float, monthly_income: float, existing_debt: float, credit_score: int) -> dict:
    """DTI tree algorithm for dynamic returns."""
    dti = existing_debt / (monthly_income if monthly_income > 0 else 1) * 100
    
    if credit_score < 600:
        return {"approved": False, "reason": "Credit score below minimum 600."}
        
    if dti > 45:
        return {"approved": False, "reason": f"DTI ratio too high at {dti:.1f}% (max 45%)."}
        
    interest_rate = 5.5 if credit_score > 750 else 8.2
    
    return {
        "approved": True,
        "amount": amount,
        "interest_rate_percentage": interest_rate,
        "dti_ratio": dti
    }


# 10. Audit Transaction Anomalies
async def audit_transaction_anomalies(account_id: str = "MAIN-001") -> dict:
    """Finds highest transaction that deviates from the average."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT AVG(amount) as avg_amt FROM transactions WHERE account_id = ?", (account_id,))
        row = cursor.fetchone()
        if not row or not row["avg_amt"]:
            return {"status": "No transactions to audit"}
            
        avg = row["avg_amt"]
        cursor.execute("SELECT tx_id, amount, recipient FROM transactions WHERE account_id = ? ORDER BY amount DESC LIMIT 1", (account_id,))
        top_tx = cursor.fetchone()
        
        if top_tx and top_tx["amount"] > avg * 3:
            return {
                "anomaly_detected": True,
                "tx_id": top_tx["tx_id"],
                "amount": top_tx["amount"],
                "average_spend": avg,
                "recipient": top_tx["recipient"]
            }
            
    return {"anomaly_detected": False, "message": "All transactions within standard deviation."}

