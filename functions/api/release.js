const APP_ID = '6761782557';
const COUNTRY = 'za';
const LOOKUP_URL = `https://itunes.apple.com/lookup?id=${APP_ID}&country=${COUNTRY}`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function parseNotes(app) {
  const raw = (app.releaseNotes || '').trim();
  if (raw) {
    return raw
      .split(/\n+/)
      .map((line) => line.replace(/^[•*\-]\s*/, '').trim())
      .filter(Boolean);
  }

  if ((app.version || '').startsWith('1.0')) {
    return [
      'Initial App Store release with on-device calendar checks.',
      'Voice input, nearby alternatives, and one-tap sharing.',
    ];
  }

  return ['Latest App Store update is live.'];
}

export async function onRequestGet() {
  try {
    const res = await fetch(LOOKUP_URL, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      return json({ error: `Apple lookup returned HTTP ${res.status}` }, 502);
    }

    const payload = await res.json();
    const app = payload?.results?.[0];

    if (!app) {
      return json({ error: 'App not found in Apple lookup response' }, 404);
    }

    return json({
      version: app.version || null,
      releaseDate: app.currentVersionReleaseDate || app.releaseDate || null,
      notes: parseNotes(app),
      appStoreUrl: app.trackViewUrl || null,
      source: LOOKUP_URL,
    });
  } catch (err) {
    return json({ error: err.message || 'Failed to load latest release metadata' }, 500);
  }
}
