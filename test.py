# test.py
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key or not api_key.startswith("sk-"):
    raise SystemExit("OPENAI_API_KEY missing/invalid. Check your .env (no quotes, no extra 'sk-').")

client = OpenAI(api_key=api_key, organization=os.getenv("OPENAI_ORG"))

try:
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant for InterlockGo."},
            {"role": "user", "content": "Say hello from InterlockGo!"}
        ]
    )
    print(r.choices[0].message.content)

except Exception as e:
    # Simple readable error print
    print("\n--- API ERROR ---")
    print(str(e))
    print("-----------------\n")
