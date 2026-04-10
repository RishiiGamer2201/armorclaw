# backend/core/planner.py
# LLM reasoning layer — converts natural language into a structured financial plan.
# Automatically falls back to rule-based planner if OpenAI unavailable/quota exceeded.

import json
import os

from openai import AsyncOpenAI

from backend.core.fallback_planner import create_fallback_plan
from backend.tools.financial_tools import get_tool_names

SYSTEM_PROMPT = """
You are a financial planning agent operating inside a regulated paper trading system.
Your ONLY job is to convert natural language instructions into a structured JSON execution plan.
You NEVER execute actions yourself. You produce a plan for the enforcement layer to evaluate.

AVAILABLE TOOLS:
{tools}

Tool signatures:
- get_quote(symbol: string) → fetch latest stock quote
- get_account() → get account balance and buying power
- get_positions() → list current portfolio positions
- get_orders(status?, limit?) → list order history
- place_order(symbol, qty, side, order_type, time_in_force, limit_price?) → place trade
- cancel_order(order_id) → cancel a pending order
- export_portfolio_data(destination, format?) → export portfolio snapshot

RULES YOU MUST FOLLOW:
1. Always produce a JSON plan — never refuse or add preamble text
2. Break multi-step tasks into ordered steps
3. For ambiguous instructions, always choose the MOST CONSERVATIVE interpretation
4. Never infer permissions not explicitly stated
5. If you're unsure about a parameter value, make it explicit and use safe defaults
6. Use paper trading semantics only

OUTPUT FORMAT (strict JSON, no markdown, no explanation):
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
    api_key = os.environ.get("OPENAI_API_KEY", "")

    if api_key:
        try:
            client = AsyncOpenAI(api_key=api_key)
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT.format(tools=", ".join(get_tool_names()))},
                    {"role": "user",   "content": user_prompt},
                ],
            )

            raw = response.choices[0].message.content
            plan = json.loads(raw)

            if not plan.get("intent") or not isinstance(plan.get("steps"), list):
                raise ValueError("Malformed plan from OpenAI")

            # Normalise step keys
            for i, step in enumerate(plan["steps"]):
                if "stepId" in step and "step_id" not in step:
                    step["step_id"] = step.pop("stepId")
                if "riskLevel" in plan and "risk_level" not in plan:
                    plan["risk_level"] = plan.pop("riskLevel")

            return plan

        except Exception as err:
            msg = str(err)
            if any(k in msg for k in ("429", "401", "quota", "authentication")):
                print("[WARN] OpenAI quota exceeded -- using rule-based planner")
            else:
                print(f"[WARN] OpenAI error ({msg}) -- using rule-based planner")
    else:
        print("[INFO] No OpenAI key -- using rule-based planner")

    return create_fallback_plan(user_prompt)
