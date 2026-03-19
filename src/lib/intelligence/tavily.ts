import { env } from "process";

const TAVILY_API_KEY = env.TAVILY_API_KEY || process.env.TAVILY_API_KEY;

export type TavilySearchResponse = {
  query: string;
  results: {
    title: string;
    url: string;
    content: string;
    score: number;
  }[];
  answer?: string;
};

/**
 * Searches the web using the Tavily API and returns a synthesized AI answer
 * alongside the raw search results (summarized page content).
 */
export async function searchWeb(
  query: string,
  searchDepth: "basic" | "advanced" = "basic",
  includeAnswer: boolean = true
): Promise<TavilySearchResponse> {
  if (!TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is missing from environment variables.");
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: searchDepth,
      include_answer: includeAnswer,
      max_results: 5,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Tavily API Error (${response.status}): ${errText}`);
  }

  return response.json();
}
