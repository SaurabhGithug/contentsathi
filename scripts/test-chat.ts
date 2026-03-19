import { callSarvamChat } from "@/lib/ai/sarvam";

async function main() {
  const systemPrompt = `You are the Chief AI Officer (CAO). You talk like a highly intelligent, proactive, data-driven Chief of Staff in a fast-paced agency.`;
  try {
    const res = await callSarvamChat(systemPrompt, "Draft a 50-word social media post about luxury villas in Nagpur. Include emojis.", 1500);
    console.log("SUCCESS:", res);
  } catch (err: any) {
    console.error("FAIL:", err.message);
  }
}

main();
