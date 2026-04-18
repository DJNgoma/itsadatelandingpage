// Year
document.getElementById('year').textContent = new Date().getFullYear();

const releaseVersion = document.getElementById('release-version');
const releaseDate = document.getElementById('release-date');
const releaseNotes = document.getElementById('release-notes');
const releaseLink = document.getElementById('release-link');

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

function formatReleaseDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  return new Intl.DateTimeFormat(document.documentElement.lang || 'en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

function renderReleaseNotes(items) {
  if (!Array.isArray(items) || !items.length) return;

  releaseNotes.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    releaseNotes.appendChild(li);
  });
}

async function loadLatestRelease() {
  if (!releaseVersion || !releaseDate || !releaseNotes || !releaseLink) return;

  const fallbackDate = releaseDate.dataset.releaseDate;
  const formattedFallbackDate = formatReleaseDate(fallbackDate);
  if (formattedFallbackDate) releaseDate.textContent = formattedFallbackDate;

  try {
    const res = await fetch('/api/release');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.version) releaseVersion.textContent = data.version;

    const formattedDate = formatReleaseDate(data.releaseDate);
    if (formattedDate) {
      releaseDate.textContent = formattedDate;
      releaseDate.dateTime = data.releaseDate;
    }

    if (data.appStoreUrl) {
      releaseLink.href = data.appStoreUrl;
    }

    renderReleaseNotes(data.notes);
  } catch (err) {
    console.warn('Latest release metadata unavailable, using fallback content.', err);
  }
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

loadLatestRelease();
