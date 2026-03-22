const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
}

export async function webSearch(
  query: string,
  numResults = 5,
): Promise<{ answer?: string; results: TavilyResult[] }> {
  if (!TAVILY_API_KEY) {
    return {
      answer: undefined,
      results: [
        {
          title: 'API key not configured',
          url: '',
          content:
            'Tavily API key is not set. Add TAVILY_API_KEY to the server .env file to enable web search.',
          score: 0,
        },
      ],
    };
  }

  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      max_results: Math.min(numResults, 10),
      include_answer: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as TavilyResponse;
  return {
    answer: data.answer,
    results: data.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
  };
}
