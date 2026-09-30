# The Shop

A small peer-to-peer marketplace MVP. It provides a responsive listings page, category and text search, Google sign-in, listing creation, a guest checkout basket, account-gated additional basket items and saved finds, and email confirmations for listing and buyer inquiry actions. It does not take payment or arrange delivery.

## Run locally

1. Install Node.js 20.19+ or 22.12+ and run `npm install` in this folder.
2. Copy `.env.example` to `.env` and fill in the Supabase project URL and keys.
3. In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql).
4. In Supabase Authentication → Providers, enable Google and add your Google OAuth client ID and secret. Add `http://localhost:5173` as a redirect URL in the Supabase auth URL configuration. Use the Supabase callback URL shown in its Google provider settings as an authorized redirect URI in Google Cloud.
5. Fill in the server-only Supabase service role key. Add Mailgun API key, sending domain, and verified sender address to enable emails. Keep these values in `.env` only.
6. Run `npm run dev`; Vite serves the site at `http://localhost:5173` and the API at `http://localhost:3001`.

Without Supabase browser settings, the frontend shows sample items so the layout can be explored; listing creation and sign-in need real credentials. Mailgun is optional while building. Without it, the site can display listings but action emails are unavailable.

## Configuration

See `.env.example` for the complete list. Use the Supabase project root URL (for example, `https://<project-ref>.supabase.co`) for both Supabase URL settings; do not append `/rest/v1`, `/auth/v1`, or a dashboard path. `VITE_` values are public browser configuration; never put the Supabase service role key or Mailgun API key in a `VITE_` variable. Configure allowed OAuth redirect URLs for each deployed domain. Set `APP_URL` to the public site origin before deployment.

## Data and trust

- Supabase Auth supplies Google OAuth identity. The browser only uses the public anon key and row-level security.
- The Express API validates each bearer token with Supabase Auth before sending email. The service role key stays server-side.
- Listings are public; seller contact email is not stored in the listing table or sent to the browser. For an inquiry, the server looks up the seller and emails buyer and seller directly.
- No payment details are collected. Buyers and sellers arrange payment and handover directly; use public meeting places and safe payment practices.
- A guest can put one listing in a temporary checkout basket. Signing in unlocks adding more listings and viewing saved finds. Signed-in baskets and saved listing IDs are kept in that browser's local storage, scoped to the account; they are not synced across devices.
- Sample listing photos are remote Unsplash URLs. Sellers can provide a photo URL; managed image uploads are not included in this MVP.

## Current limits

- An inquiry notifies both parties but does not reserve or mark a listing sold.
- Favorites are kept in browser memory only. Newsletter form is a visual interaction and does not subscribe an address.
- No image upload, moderation dashboard, report flow, rate limiting, or deployment environment is configured yet.
- Configure OAuth credentials and email sending domain in the external service dashboards before a live launch; never commit those secrets.
