const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function getAISummary(tasks: Array<{title: string, completed: boolean}>) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch(`${API_URL}/analyze/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ tasks }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      return data.error || 'Unable to generate AI summary at this time.';
    }

    return data.summary || 'Unable to generate AI summary at this time.';
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return 'AI summary request timed out. Please try again.';
    }
    console.error('API Error:', error);
    return 'Unable to generate AI summary at this time.';
  }
} 