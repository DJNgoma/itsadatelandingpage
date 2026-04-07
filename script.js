// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Form submit (dummy handler).
// To wire up Kit / Mailchimp later: replace `submitToProvider` with a fetch
// to your provider endpoint. Field name -> tag mapping:
//   first_name -> merge field FNAME
//   email      -> merge field EMAIL
//   platform=ios     -> tag platform_ios
//   platform=android -> tag platform_android
//   interest=beta    -> tag interest_beta
//   interest=launch  -> tag interest_launch
//   note             -> custom field NOTE
const form = document.getElementById('waitlist-form');
const success = document.getElementById('success');

// Submits to a Cloudflare Pages Function (functions/api/subscribe.js) which
// holds the Kit API key as a secret and applies fields + tags server-side.
async function submitToProvider(payload) {
  const res = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const payload = {
    first_name: (fd.get('first_name') || '').toString().trim(),
    email: (fd.get('email') || '').toString().trim(),
    platform: (fd.get('platform') || '').toString(),
    interest: fd.getAll('interest').map(String),
    note: (fd.get('note') || '').toString().trim(),
    submitted_at: new Date().toISOString(),
  };

  if (!payload.email || !/^\S+@\S+\.\S+$/.test(payload.email)) {
    alert('Please enter a valid email.');
    return;
  }
  if (!payload.platform) {
    alert('Please pick a platform.');
    return;
  }

  const submitBtn = form.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  try {
    await submitToProvider(payload);
    form.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    console.error(err);
    alert('Something went wrong. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Join the waitlist';
  }
});

// Smooth scroll for in-page anchors
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
