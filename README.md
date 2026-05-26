# The Mixer — Site + Setup Guide

A single-page website for **The Mixer**, a monthly networking event for
senior-care professionals on the SF Peninsula. The signup form posts to
a Netlify Function which forwards new contacts to Brevo.

---

## Repo layout

```
the-mixer/
├── index.html              ← The whole site (paste-anywhere HTML/CSS/JS)
├── netlify.toml            ← Tells Netlify where the function lives
├── netlify/
│   └── functions/
│       └── signup.js       ← Receives form POST, adds contact to Brevo
└── README.md               ← This file
```

---

## First-time setup

### 1. Push these files to GitHub

1. Create a new repo at https://github.com — call it something like `the-mixer`.
2. Drag all four files (matching the folder structure above) straight into the GitHub web UI, or push them with `git`.

### 2. Connect the repo to Netlify

1. Sign in at https://app.netlify.com
2. **Add new site → Import an existing project → GitHub** and pick the repo.
3. Build settings: leave everything blank (Netlify reads `netlify.toml`).
4. Click **Deploy**.

Your site goes live at something like `https://random-name.netlify.app`. You can change the URL or point a custom domain later under **Domain settings**.

### 3. Set the Brevo environment variables

In the Netlify dashboard → **Site settings → Environment variables → Add a variable**:

| Key             | Value                                                  |
| --------------- | ------------------------------------------------------ |
| `BREVO_API_KEY` | Your Brevo API key (starts with `xkeysib-`)            |
| `BREVO_LIST_ID` | The numeric ID of the Brevo list to add signups to     |

**Where to find them in Brevo:**

- **API key** — Brevo dashboard → top-right profile menu → **SMTP & API** → **API Keys** tab → **Generate a new API key**. Copy the full string starting with `xkeysib-`.
- **List ID** — Brevo dashboard → **Contacts → Lists**. Create a list called e.g. "Mixer Attendees" if you don't have one. Click into the list — the number in the URL (`/contact/list/5`) is the ID.

> After adding env vars, **trigger a redeploy** (Deploys tab → "Trigger deploy → Deploy site"). Env vars are only read at deploy time.

### 4. (Optional) Add custom contact attributes in Brevo

The function passes several extra attributes from the form. Brevo will auto-create most of them, but if you want them to show up cleanly in Brevo's UI, go to **Contacts → Settings → Contact attributes** and add (all type "Text"):

`PROFESSION`, `COMPANY`, `PHONE`, `ADDRESS`, `LINKEDIN`, `FACEBOOK`, `INSTAGRAM`, `YOUTUBE`, `WEBSITE`, `SIGNUP_SRC`

(`FIRSTNAME`, `LASTNAME`, and `SMS` are Brevo defaults — no action needed.)

---

## Editing content

### Upcoming Mixers (Calendar page)

Open `index.html` and search for `MIXER_EVENTS`. Each entry looks like:

```js
'2026-7-1': { title: 'July Mixer', venue: 'TBA — Venue Coming Soon', url: '' },
```

To set a real venue:

1. Update the `venue` text to the venue name (e.g. `'Atria Park of San Mateo'`).
2. Paste the Google Maps URL into `url` (e.g. `'https://www.google.com/maps/place/...'`). The venue name will become a clickable link automatically.
3. Commit + push — Netlify redeploys on its own.

### Photos

Replace placeholder base64 images in `index.html` with real URLs (e.g. `https://yourdomain.com/photos/jan-mixer-1.jpg`).

---

## Testing the signup form

After deploying with env vars set:

1. Open the live site, fill out the form, submit.
2. Check Brevo → **Contacts** — the new contact should appear in your "Mixer Attendees" list within a few seconds.
3. If the submit button shows an error, check Netlify dashboard → **Functions → signup** to see the function logs.

---

## Costs

- **Netlify free tier**: 125,000 function invocations / month — far more than any monthly mixer will use.
- **Brevo free tier**: 300 emails / day, unlimited contacts.

So at this volume, the whole stack is $0/month.
