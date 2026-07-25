const API_URL = (import.meta.env.VITE_BRAIN_API_URL || 'http://localhost:3001').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_BRAIN_API_KEY || '';

function headers() {
  return {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
  };
}

async function errorMessageFromResponse(res) {
  try {
    const body = await res.json();
    return body?.error?.message || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function checkHealth() {
  const res = await fetch(`${API_URL}/health`, { headers: headers() });
  if (!res.ok) throw new Error(await errorMessageFromResponse(res));
  return res.json();
}

export async function getProfile(userId) {
  try {
    const res = await fetch(`${API_URL}/profile?userId=${encodeURIComponent(userId)}`, { headers: headers() });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.profile ?? null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile) {
  try {
    const res = await fetch(`${API_URL}/profile`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(profile),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Insights Q&A: submits one answer, returns what Brain learned from it (structured
// profile field updates plus the freshly rewritten narrative).
export async function submitReflection(userId, questionId, question, answer) {
  const res = await fetch(`${API_URL}/profile/reflect`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ userId, questionId, question, answer }),
  });
  if (!res.ok) throw new Error(await errorMessageFromResponse(res));
  return res.json(); // { profileUpdates, narrative, profile }
}

export async function getReflectionAnswers(userId) {
  try {
    const res = await fetch(`${API_URL}/profile/reflect?userId=${encodeURIComponent(userId)}`, { headers: headers() });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.answers ?? [];
  } catch {
    return [];
  }
}

export async function listConversations(userId) {
  try {
    const res = await fetch(`${API_URL}/conversation?userId=${encodeURIComponent(userId)}`, { headers: headers() });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.threads ?? [];
  } catch {
    return [];
  }
}

export async function getThread(id) {
  try {
    const res = await fetch(`${API_URL}/conversation/${encodeURIComponent(id)}`, { headers: headers() });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.thread ?? null;
  } catch {
    return null;
  }
}

export async function startConversation(profile) {
  const res = await fetch(`${API_URL}/conversation/start`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) throw new Error(await errorMessageFromResponse(res));
  return res.json(); // { id, openingMessage }
}

// Parses one SSE event block ("event: x\ndata: y") into { event, data }.
function parseSseBlock(block) {
  let event = 'message';
  let data = '';
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  return { event, data };
}

// Streams a reply for `query` on an existing conversation thread via SSE.
// Calls onToken(token) as text streams in, onCitations(citations, model) once at
// the start of the response, and onDone()/onError(message) at the end.
export async function streamMessage(threadId, query, { onToken, onCitations, onDone, onError, signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}/conversation/${threadId}/stream`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ query }),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    onError?.('Could not reach the Brain service.');
    return;
  }

  if (!res.ok || !res.body) {
    onError?.(await errorMessageFromResponse(res));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';
    for (const block of blocks) {
      if (!block.trim()) continue;
      const { event, data } = parseSseBlock(block);
      if (!data) continue;
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }
      if (event === 'start') onCitations?.(parsed.citations, parsed.model);
      else if (event === 'token') onToken?.(parsed.token);
      else if (event === 'done') onDone?.();
      else if (event === 'error') onError?.(parsed.message);
    }
  }
}

export async function getGoals(userId) {
  try {
    const res = await fetch(`${API_URL}/goals?userId=${encodeURIComponent(userId)}`, { headers: headers() });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.goals ?? [];
  } catch {
    return [];
  }
}

export async function createGoal(userId, title, targetDate) {
  const res = await fetch(`${API_URL}/goals`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ userId, title, targetDate }),
  });
  if (!res.ok) throw new Error(await errorMessageFromResponse(res));
  return res.json();
}

export async function setGoalStatus(goalId, status) {
  const res = await fetch(`${API_URL}/goals/${encodeURIComponent(goalId)}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status }),
  });
  return res.ok;
}

// Requests spoken audio for `text`. Returns null (rather than throwing) when
// voice isn't configured on the backend (no HUGGINGFACE_API_TOKEN) or the
// request otherwise fails, so callers can just skip playback.
export async function fetchSpeech(text, format = 'mp3') {
  try {
    const res = await fetch(`${API_URL}/tts`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ text, format }),
    });
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}
