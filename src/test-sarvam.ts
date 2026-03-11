import { callSarvamJSON } from "./lib/sarvam";

async function main() {
  const systemPrompt = `You are a real estate expert. Return JSON ONLY matching this format:
{
  "market_insight": "test insight",
  "should_auto_launch": true
}
`;
  try {
    const res = await callSarvamJSON(systemPrompt, "Test prompt");
    console.log("SUCCESS:", res);
  } catch (err: any) {
    console.error("FAIL:", err.message);
  }
}

main();
