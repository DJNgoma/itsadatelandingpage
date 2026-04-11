// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Mailing-list form submit.
// The Cloudflare Pages Function stores subscribers in Kit and tags by platform:
//   first_name -> merge field FNAME
//   email      -> merge field EMAIL
//   platform=ios     -> tag platform_ios
//   platform=android -> tag platform_android
//   note             -> custom field NOTE
const form = document.getElementById('updates-form');
const success = document.getElementById('success');
const formMessage = document.getElementById('form-message');

function setFormMessage(message) {
  formMessage.hidden = !message;
  formMessage.textContent = message || '';
}

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
    note: (fd.get('note') || '').toString().trim(),
    submitted_at: new Date().toISOString(),
  };

  if (!payload.email || !/^\S+@\S+\.\S+$/.test(payload.email)) {
    setFormMessage('Enter a valid email address.');
    form.querySelector('input[name=email]').focus();
    return;
  }
  if (!payload.platform) {
    setFormMessage('Pick the platform you care about.');
    return;
  }

  setFormMessage('');
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
    setFormMessage('Something went wrong. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Get Email Updates';
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
