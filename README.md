# It's a Date — Landing Page

Static landing page for **It's a Date**. The primary CTA sends iPhone users to the App Store, and the email form collects Android interest plus occasional product updates. Plain HTML/CSS/JS — no build step, no framework.

## Files

```
.
├── index.html   # Entire page
├── styles.css   # Design system + layout
├── script.js    # Form handler + inline validation
├── favicon.svg  # Heart-mark favicon
└── README.md
```

## Local preview

For a quick static preview:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

To test the form handler locally as a Cloudflare Pages Function:

```sh
npx wrangler pages dev .
```

## Deploy

- **Vercel / Netlify**: drag the folder, or `vercel --prod` / `netlify deploy --prod --dir=.`
- **GitHub Pages**: push to a repo, enable Pages on `main` branch root.
- **Cloudflare Pages**: connect repo, build command empty, output dir `.`

## Wiring up the email provider

The form in `script.js` posts to `/api/subscribe`. If you move away from the included Cloudflare Pages Function, replace `submitToProvider(payload)` with your own fetch target.

### Field shape sent to the provider

```json
{
  "first_name": "...",
  "email": "...",
  "platform": "ios" | "android",
  "note": "...",
  "submitted_at": "ISO timestamp"
}
```

### Suggested tag mapping

| Field value         | Tag                |
|---------------------|--------------------|
| `platform=ios`      | `platform_ios`     |
| `platform=android`  | `platform_android` |

### Kit (ConvertKit) example

```js
await fetch(`https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: KIT_API_KEY,
    email: payload.email,
    first_name: payload.first_name,
    fields: { note: payload.note },
    tags: [payload.platform === 'ios' ? TAG_IOS : TAG_ANDROID],
  }),
});
```

### Mailchimp example

Use the [Mailchimp embedded signup form action URL](https://mailchimp.com/help/host-your-own-signup-forms/) or the API. Map `platform` and `note` to merge fields or groups, and set tags via the Marketing API `/lists/{list_id}/members/{subscriber_hash}/tags`.

## Tweaking

- Brand color: change `--accent` in `styles.css`.
- Headline / copy: edit `index.html` directly.
- Sections: each `<section>` is independent.

## Notes

- Mobile-first, responsive down to ~360px.
- Dark mode follows system preference.
- Honors reduced-motion (no jarring animations).
- Form is keyboard accessible, semantic HTML, labelled inputs.
- Use `wrangler pages dev` when you need the local form submission path to work.
