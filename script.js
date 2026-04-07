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

// Wired to Kit (ConvertKit) form: https://app.kit.com/forms/designers/9299281/edit
// In Kit: add custom fields `platform`, `interest`, `note` to the form, then map them
// to tags via Automations → "Subscribers added to a form" → "Add tag if field equals":
//   platform == ios     -> tag platform_ios
//   platform == android -> tag platform_android
//   interest contains beta   -> tag interest_beta
//   interest contains launch -> tag interest_launch
const KIT_FORM_ID = '9299281';
const KIT_ENDPOINT = `https://app.kit.com/forms/${KIT_FORM_ID}/subscriptions`;

async function submitToProvider(payload) {
  const body = new URLSearchParams();
  body.append('email_address', payload.email);
  if (payload.first_name) body.append('first_name', payload.first_name);
  body.append('fields[platform]', payload.platform);
  body.append('fields[interest]', payload.interest.join(','));
  if (payload.note) body.append('fields[note]', payload.note);

  // Kit's public subscriptions endpoint doesn't return CORS headers, so we use
  // no-cors and trust that a non-throwing fetch means the POST landed.
  await fetch(KIT_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  return { ok: true };
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
