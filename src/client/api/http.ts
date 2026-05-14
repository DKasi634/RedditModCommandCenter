export async function apiFetch<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    let message = body;

    try {
      const parsed = JSON.parse(body) as { error?: string };
      message = parsed.error ?? body;
    } catch {
      // Fall back to the raw response body.
    }

    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
