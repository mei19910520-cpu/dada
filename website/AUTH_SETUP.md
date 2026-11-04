# MAUYUAN × SONG MEI Supabase Auth
This feature is kept separate from the public queue form. index.html, app.js, config.js are unchanged.

## Pages
- `auth.html`: email/password sign in, sign up, password reset.
- `dashboard.html`: client-side redirect on failed `auth.getUser()`, shows only verified user's email; no confidential data is embedded in static assets.
- `supabase-config.js` uses the public publishable key, never a secret key.

## Deployment steps
1. Confirm Supabase project SONG MEI is ACTIVE and that Email provider is enabled.
2. In Supabase Dashboard > Authentication > URL Configuration, set Site URL to the real deployed site origin, and add **exact** deployed `/auth.html` and `/dashboard.html` URLs to Redirect URLs. Do not use wildcards for production.
3. Deploy the website folder over HTTPS. The site's existing public index page and queue handling are unchanged.
4. Test sign up (email confirmation, if enabled), sign in, logout, password reset, refresh, and unauthenticated dashboard redirect.
5. For actual protected private data, create RLS policies with auth.uid() ownership on relevant database tables. Static HTML files remain publicly downloadable even if a script redirects: this is not server-side route protection.
6. Do not put secrets, customer information, or admin-only API actions in static files.

## Smoke checks
- Anonymous /dashboard.html must redirect /auth.html and must not reveal private data.
- Authenticated /dashboard.html must show correct user email.
- Logout must redirect /auth.html and data must not persist visibly.
- /index.html and its Google Apps Script queue form must still work as before.
