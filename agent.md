# Project Guide and Scope Template

Use this file as the starting brief for projects in this folder. Fill in the project scope before significant implementation, then keep it accurate as decisions change. Project-specific instructions in a nested guide can add detail for that project.

## Project scope

- **Project name:** The Shop
- **Problem to solve:** Help people find and pass on useful pre-loved items to other people.
- **Target users:** People buying or selling second-hand items; location and age range are not defined.
- **Goals:** Browse listings, let Google-authenticated users publish listings, and notify buyer and seller by email when a buyer expresses interest.
- **Out of scope:** Payments, delivery, escrow, and automatic sale reservations.
- **Core requirements:** Responsive marketplace; search and category filters; create listing; Google sign-in; confirmation emails for listing creation and purchase inquiries; private service credentials; configurable third-party settings.
- **Success criteria:** Visitors can browse active listings. Authenticated users can publish listings and express interest in another user's listing. With Mailgun configured, both sides receive email. Without external credentials, the UI remains explorable and setup requirements are documented.
- **Technology and current state:** React/Vite frontend, Express/Node.js API, Supabase Auth and Postgres with row-level security, Google OAuth configured through Supabase and Google Cloud, Mailgun for action emails. Initial implementation is in this repository; external accounts and deployment are not configured.
- **Budget and operating limits:** Not defined. Use existing/free tiers where available; verify current service quotas and any charges before selecting deployment or scaling options.
- **Data and security:** Listing details are public. Authentication tokens are validated by the API; service-role and Mailgun secrets stay server-side. Seller email is not exposed to the browser. Apply row-level security to listing data. Do not commit `.env` or real user data.
- **Deployment target:** Not defined. Local development is documented; production deployment requires an approved host, domain, OAuth redirect configuration, and verified Mailgun sending domain.
- **Open questions:** Target launch country/cities, moderation and reporting, photo upload/storage, whether inquiries should reserve items, newsletter integration, deployment host, and expected usage are undecided. The MVP assumes NGN pricing and Lagos-style location text, URL-based photos, and buyer/seller email contact without reservations.

Before large or irreversible changes, confirm any unclear requirements that could materially affect architecture, cost, data safety, or deployment. For low-impact gaps, use the simplest reasonable assumption, state it, and avoid building beyond the requested scope.

External credentials are configured through environment variables listed in `.env.example`; never ask for or commit secret values. Read `README.md` for local setup and known MVP limits.

## Cost-effectiveness

- Prefer the simplest reliable solution that meets the requirements, using existing project tools and infrastructure before adding new services.
- Prefer free or low-cost options, open-source tools, and local development where practical; minimize paid dependencies, recurring subscriptions, hosting, and usage-based charges.
- Do not create or recommend a paid resource, subscription, or service that may incur charges without first explaining the likely costs and trade-offs and getting user approval.
- Check current prices, quotas, and free-tier limits before making cost-sensitive hosting or service recommendations; do not assume that a free tier is unlimited or permanent.
- Avoid unnecessary dependencies, always-on servers, background jobs, polling, external APIs, and compute-heavy designs. Use a more complex or expensive approach only when a concrete requirement justifies it.
- Never place secrets, credentials, private connection strings, or real user data in source control. Document required configuration without including secret values.

## Learning and collaboration

- Treat project work as an opportunity for the user to learn fundamentals, especially when the user is a beginner.
- At major checkpoints, briefly explain what changed, why it was needed, and the basic concept behind it. Define unfamiliar terms in plain language.
- Include a practical learning tip or a small, relevant resource suggestion with task handoffs; prefer free, beginner-friendly resources and official documentation when useful.
- Offer optional, clearly explained tasks the user can try, including what they will learn and step-by-step guidance. Do not make the user's participation a blocker.
- When recommending a technology, explain what problem it solves, why it fits, and the trade-offs in cost, complexity, and learning value before making major stack changes.

## Implementation and validation

- Inspect the existing project instructions and code before changing files. Preserve established conventions and working behavior unless the task calls for a change.
- Make focused changes that solve the root problem; avoid unrelated refactors and unnecessary complexity.
- Protect user data and existing work. Do not delete, overwrite, publish, commit, or push work unless the user requests or approves it.
- Validate changes with the narrowest relevant tests first, then run broader checks when useful. Report what passed, what could not be checked, and any remaining deployment steps.
- Keep this scope and the project-specific guide consistent with the code. Clearly label proposals as proposals until they are implemented and verified.
