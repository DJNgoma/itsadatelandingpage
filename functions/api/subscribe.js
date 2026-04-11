// Cloudflare Pages Function — POST /api/subscribe
// Receives the mailing-list form, creates/updates a Kit subscriber with custom
// fields, subscribes them to the It's a Date form, and applies platform tags.
// The Kit API key is stored as the KIT_API_KEY secret on the
// Pages project (set with: wrangler pages secret put KIT_API_KEY --project-name itsadate).

const KIT_FORM_ID = 9299281;

const TAGS = {
  platform_ios: 18812055,
  platform_android: 18812056,
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function kit(env, path, init = {}) {
  const res = await fetch(`https://api.kit.com/v4${path}`, {
    ...init,
    headers: {
      'X-Kit-Api-Key': env.KIT_API_KEY,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    throw new Error(`Kit ${path} -> ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return body;
}

export async function onRequestPost({ request, env }) {
  if (!env.KIT_API_KEY) return json({ error: 'Missing KIT_API_KEY' }, 500);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const email = (payload.email || '').toString().trim();
  const first_name = (payload.first_name || '').toString().trim();
  const platform = (payload.platform || '').toString();
  const note = (payload.note || '').toString().trim();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Invalid email' }, 400);
  if (!['ios', 'android'].includes(platform)) return json({ error: 'Invalid platform' }, 400);

  try {
    // 1. Create/update subscriber with custom fields
    const subRes = await kit(env, '/subscribers', {
      method: 'POST',
      body: JSON.stringify({
        email_address: email,
        first_name: first_name || undefined,
        state: 'active',
        fields: {
          platform,
          note,
        },
      }),
    });
    const subscriber = subRes.subscriber || subRes;
    const subscriberId = subscriber.id;

    // 2. Subscribe to the It's a Date form
    await kit(env, `/forms/${KIT_FORM_ID}/subscribers/${subscriberId}`, {
      method: 'POST',
    });

    // 3. Apply the selected platform tag
    const tagIds = [TAGS[`platform_${platform}`]].filter(Boolean);
    await Promise.all(
      tagIds.map((tagId) =>
        kit(env, `/tags/${tagId}/subscribers/${subscriberId}`, { method: 'POST' })
      )
    );

    return json({ ok: true, subscriber_id: subscriberId });
  } catch (err) {
    return json({ error: err.message || 'Subscription failed' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
