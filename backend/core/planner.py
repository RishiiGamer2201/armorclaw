# backend/core/planner.py
# LLM reasoning layer — converts natural language into a structured financial plan.
import json
import os
from google import genai
from google.genai import types

from backend.core.fallback_planner import create_fallback_plan
from backend.tools.financial_tools import get_tool_names

SYSTEM_PROMPT = """
You are a highly secure financial & universal banking agent operating inside a zero-trust environment.
Your ONLY job is to convert natural language instructions into a structured JSON execution plan.
You NEVER execute actions yourself. You produce a plan for the enforcement layer to evaluate.

AVAILABLE TOOLS:
{tools}

Legacy Alpaca Tools:
- get_quote(symbol) 
- get_account() 
- get_positions() 
- get_orders(status, limit) 
- place_order(symbol, qty, side, order_type, time_in_force, limit_price)
- cancel_order(order_id)
- export_portfolio_data(destination)

Universal Banking Tools:
- process_wire_transfer(amount: float, recipient_iban: str, swift_code: str) → Wire money
- analyze_cheque_image(image_url: str) → Scan cheque for fraud and amounts
- analyze_vendor_invoice(invoice_image_url: str) → Extract vendor and match against DB
- issue_corporate_card(employee_email: str, credit_limit: float) → Generate valid card
- verify_kyc_document(document_url: str) → Extract ID details for KYC
- detect_money_laundering(account_id: str) → DB scan for structuring anomalies
- lock_compromised_funds(account_id: str, reason: str) → Freeze DB account to block wiring
- process_crypto_swap(from_asset: str, to_asset: str, amount: float) → Swap crypto balances
- request_loan_approval(amount: float, monthly_income: float, existing_debt: float, credit_score: int) → DTI algorithm
- audit_transaction_anomalies(account_id: str) → Check spending deviations

RULES YOU MUST FOLLOW:
1. Always produce a JSON plan — never refuse or add preamble text
2. Break multi-step tasks into ordered steps
3. Never infer permissions not explicitly stated. Use safe defaults.

OUTPUT FORMAT (strict JSON):
{{
  "intent": "one-sentence description of what the user wants to accomplish",
  "risk_level": "low | medium | high",
  "steps": [
    {{
      "step_id": 1,
      "tool": "tool_name",
      "args": {{ ...tool arguments }},
      "rationale": "why this step is needed"
    }}
  ]
}}
""".strip()


async def create_plan(user_prompt: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyBoNWYGUMrSRXdm5iGDfiaEAHzWYcuFDi8")

    if api_key:
        try:
            client = genai.Client(api_key=api_key)
            
            prompt_with_tools = SYSTEM_PROMPT.format(tools=", ".join(get_tool_names()))
            
            # Use gemini-2.5-flash for rapid planning
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    {"role": "user", "parts": [
                        {"text": prompt_with_tools + "\n\nUSER COMMAND: " + user_prompt}
                    ]}
                ]
            )

            raw = response.text.strip()
            if raw.startswith("```json"):
                raw = raw[7:-3]
            elif raw.startswith("```"):
                raw = raw[3:-3]
                
            plan = json.loads(raw)

            if not plan.get("intent") or not isinstance(plan.get("steps"), list):
                raise ValueError("Malformed plan from Gemini")

            # Normalise step keys
            for i, step in enumerate(plan["steps"]):
                if "stepId" in step and "step_id" not in step:
                    step["step_id"] = step.pop("stepId")
                if "riskLevel" in plan and "risk_level" not in plan:
                    plan["risk_level"] = plan.pop("riskLevel")

            return plan

        except Exception as err:
            print(f"[WARN] Gemini error ({str(err)}) -- checking fallback")
            
    print("[INFO] Fallback rule-based planner activated")
    return create_fallback_plan(user_prompt)
