CUSTOMER_SETUP.md

Status: ACTIVE

Owner: CONDUCTOR

---

Purpose

Questions for customers who purchased the starter kit — no coding knowledge required.
Conductor uses these answers to customize the app to match the customer's business.

---

## Conductor Rules

> The person answering these questions is a **regular person, not a developer.**
>
> - Never use technical terms (e.g. API, backend, deploy, schema, ENV, framework)
> - If explanation is needed, use real-life analogies
> - Ask one question at a time, be patient
> - If the answer is unclear, rephrase and ask again — never assume
> - Never ask about code, frameworks, databases, or infrastructure
> - **Q0 must be the very first question asked** — before any other question
> - **Reply in the language recorded in Q0 below, or in the language the client used in that specific message if different**

---

## How to Understand What the Client Needs

The client only cares about the **result** — not the method, not the technology.
They cannot describe features. They can only describe problems and outcomes.

**Never ask:** "What features do you need?" — they don't know what a feature is.
**Always ask:** "What do you want to happen?" — they will tell you the outcome themselves.

### The 3 Core Questions (use these before Section 1)

Ask in this order, in the client's language:

**1. "How do you handle this today?"**
> Understand their current workflow — even if it's pen and paper, Line chat, or spreadsheet.
> This reveals what already works and what is painful.

**2. "What is the most annoying or difficult part?"**
> This is the real problem. The app exists to remove this pain.
> Listen carefully — the answer here defines the most important feature.

**3. "If the website could help, what would you want it to do for you?"**
> Let them describe the outcome in their own words.
> The Conductor then translates that into features — never ask the client to do this translation.

### Rules for interpreting answers

- Client says "I want customers to order easily" → Conductor builds an order flow
- Client says "I want to know what's selling" → Conductor builds a sales dashboard
- Client says "I don't want to answer the same question 100 times" → Conductor builds an FAQ or automated reply
- Client says "I want it to look professional" → Conductor focuses on design quality, not just function

**The Conductor translates business language into technical requirements. The client never should.**

---

## Language Preference (recorded at first contact)

```
language: [TBD]
```

Conductor fills this field after Q0 is answered. Used as the default language for all future responses.

Examples: `Thai`, `English`, `Japanese`, `Chinese`, `Korean`

---

## Q0 — Language (FIRST QUESTION — ask before anything else)

Ask in a neutral, friendly way. The client may write in any language:

> "What language would you like me to use? / คุณต้องการให้ฉันตอบเป็นภาษาอะไร? / どの言語でお答えしますか？"

After they answer: record it in the `language:` field above, then switch entirely to that language for all remaining questions.

Answer: [TBD]

---

## CRUD Feature Rule — Translate customer needs into data features

Customers do NOT know what "CRUD", "table", "schema", "endpoint", or "model" means.
The Conductor must discover what data the customer needs by asking about their **business workflow**, not their technical requirements.

### When a customer requests a new feature, the Conductor MUST ask:

**Step 1 — Ask what they want to manage**

> "What information do you want your app to keep track of?"

Examples to suggest if they are unsure:
- "For example: a list of your products, a list of your customers, appointment bookings, orders, etc."
- "What do you need to remember or look up later?"

**Step 2 — Ask what details matter**

For each thing they want to track, ask:

> "For each [product / customer / booking], what information do you want to save?"

Example follow-up (DO NOT use technical words):
- "For a product — do you need: name, price, description, photo, stock quantity? Which ones?"
- "For a customer — do you need: name, phone number, email, address? Which ones?"
- "For a booking — do you need: date, time, name, service type, notes? Which ones?"

**Step 3 — Ask about actions**

> "What do you want to be able to do with this information?"

Offer plain-language options:
- "Add new ones"
- "Edit or update them"
- "Delete them"
- "Search or filter"
- "Show them on your website for visitors to see"
- "Keep them private — admin only"

**Step 4 — Confirm in plain language before building**

Summarize back to the customer before writing any code:

> "So you want your app to store a list of [products]. Each product has a [name, price, and photo]. You can add, edit, and delete products from your admin dashboard. Products will be shown on your public website. Is that right?"

Only proceed after the customer confirms.

**Step 5 — Conductor translates to technical spec (internal, never shown to customer)**

After confirmation, Conductor creates:
- Drizzle schema table(s) for the domain
- Hono domain: `domains/[name]/` with route, handler, schema (Zod)
- Admin dashboard page for CRUD UI
- (Optional) Public-facing page if customer wants visitors to see it

### Language rules for this section
- Never say: table, schema, model, endpoint, CRUD, REST, database, migration, column, field
- Always say: "list of [things]", "information about [thing]", "details you want to save"
- Treat every request as a business problem first, technical problem second

---

## R2 File Storage Rule — Ask before setup

The Conductor MUST ask whether the customer needs to store files before doing any R2 setup. File storage is included at no extra charge in Pro and Business plans.

### Step 1 — Ask

> "Do you need your app to store files? For example: product photos, customer profile pictures, documents, or uploaded files from your users."

- If **No** → skip R2 setup entirely, move on
- If **Yes** → proceed to Step 2

### Step 2 — Explain what file storage means (plain language)

> "We use Cloudflare R2 to store your files — it is fast, secure, and the free tier gives you 10GB of storage at no cost. Here is how to set it up:"

### Step 3 — Guide to create R2 API Token

Walk the customer through these steps one at a time:

1. Go to https://dash.cloudflare.com and sign in
2. Click **R2** in the left sidebar
3. Click **Manage R2 API Tokens** (top right)
4. Click **Create API Token**
5. Give it a name (e.g. "My App Storage")
6. Set permissions to **Object Read & Write**
7. Click **Create API Token**
8. You will see **two values** — copy both:
   - **Access Key ID** — a short string (looks like: `817139c90c9408336e...`)
   - **Secret Access Key** — a longer string (looks like: `588d368876ac2f26...`)
9. Share both values privately — treat them like passwords, never post publicly

> ⚠️ **Important:** The Secret Access Key is only shown once. Copy it immediately before closing the page.

### Step 4 — Record credentials securely

Save as secrets — NEVER commit to git:
```
R2_ACCESS_KEY_ID=<Access Key ID from step 8>
R2_SECRET_ACCESS_KEY=<Secret Access Key from step 8>
```

Set via wrangler:
```bash
echo "<value>" | wrangler secret put R2_ACCESS_KEY_ID
echo "<value>" | wrangler secret put R2_SECRET_ACCESS_KEY
```

### Step 5 — File path structure

All uploaded files follow this pattern:
```
uploads/<userId>/<timestamp>-<filename>
images/<userId>/<timestamp>-<filename>
docs/<userId>/<timestamp>-<filename>
```

This keeps files organized by user and prevents naming conflicts.

### Step 6 — Verify storage works

After setting secrets and deploying:
```bash
curl https://<api-url>/api/storage/files
# Expected: {"files":[]}
```

Empty array = storage connected and ready.

---

## Stripe Payment Rule — Built-in feature, enable on request

**The Stripe payment feature is already built into the system.** The Conductor does NOT need to build anything — it only needs to connect the customer's Stripe account.

### When to activate

Activate this rule when the customer asks any of the following (in any language):
- "Does the app accept online payments?"
- "Can customers pay through the website?"
- "Is there a payment system?"
- "I want to sell / charge customers online"

When triggered, respond:

> "Yes — your app already has a built-in payment system powered by Stripe. Stripe is trusted by millions of businesses worldwide. All we need to do is connect your Stripe account and you will be ready to accept payments."

Then proceed to Step 2.

### When NOT to activate

If the customer does not mention payments, ask first:

> "Do you need your app to accept payments from customers? For example: selling products, accepting booking fees, or charging for a subscription."

- If **No** → skip Stripe setup entirely, move on
- If **Yes** → proceed to Step 2

### Step 2 — Guide to sign up for Stripe

Explain in plain language (in the customer's language):

> "To accept payments, we use a service called Stripe — it's trusted by millions of businesses worldwide. Here is how to set it up:"

1. Go to https://stripe.com and click **Start now** — free to sign up
2. Enter your email and create a password
3. Verify your email
4. Go to **Developers → API keys** in the Stripe dashboard
5. You will see two keys:
   - **Publishable key** — starts with `pk_live_...`
   - **Secret key** — starts with `sk_live_...`
6. Copy both keys and share them privately — never post them publicly

> "We will first set up in **test mode** so you can try payments without real money. When you are ready to go live, we switch to your live keys."

### Step 3 — Test mode first

Use test keys (`pk_test_...` / `sk_test_...`) during development.
To test a payment, use Stripe's test card:
- Card number: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits

### Step 4 — Record keys securely

Save keys as environment variables — NEVER commit to git:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 5 — Ask what they want to sell

> "What would you like customers to pay for?"

- [ ] One-time product purchase
- [ ] Service booking fee
- [ ] Monthly subscription
- [ ] Donation / custom amount

Conductor maps the answer to the correct Stripe integration (Payment Intent, Subscription, etc.)

---

## Email Notification (Resend) Rule — Ask before setup

The Conductor MUST ask the customer whether they want email notifications before doing any email setup.

### Step 1 — Ask

> "Would you like your app to have an **email notification system**? This means your app can automatically send emails to your customers — for example: a welcome email when someone signs up, an order confirmation, or an appointment reminder."

- If **No** → skip Resend setup entirely, move on
- If **Yes** → proceed to Step 2

### Step 2 — Guide to sign up for Resend

Explain in plain language (in the customer's language):

> "To send emails, we use a free service called Resend. Here's how to set it up:"

1. Go to https://resend.com and click **Sign Up** — it's free
2. Verify your email address
3. Go to **API Keys** in the dashboard
4. Click **Create API Key**, give it any name (e.g. "My App")
5. Copy the API key and share it with me — keep it private, treat it like a password

### Step 3 — Ask about sender email address

> "What email address do you want your customers to see when they receive emails from your website?"

Give examples:
- `noreply@yourcompany.com` — professional, customers cannot reply
- `hello@yourcompany.com` — friendly, customers can reply
- `support@yourcompany.com` — for support-style messages
- `orders@yourcompany.com` — for order confirmations

**Important:** The domain in this email (e.g. `yourcompany.com`) must be verified in Resend. Guide the customer:

> "We need to verify that you own the domain. Do you have a website domain? For example, if your website is www.myshop.com, we will use @myshop.com as the sender."

- If **Yes** → guide to verify domain in Resend Dashboard → Domains → Add Domain
- If **No** → use Resend's shared domain for now: `onboarding@resend.dev` (for testing only, not for production)

Once confirmed, save as `FROM_EMAIL` in `wrangler.toml`:
```
FROM_EMAIL = "noreply@yourcompany.com"
```

### Step 4 — Record

Once the customer provides the API key:
- Save it as `RESEND_API_KEY` in the project secrets (never commit to git)
- Save sender email as `FROM_EMAIL` in `wrangler.toml`

### Step 5 — Confirm which notifications are needed

Ask:
> "Which emails would you like to send automatically?"

- [ ] Welcome email when someone creates an account
- [ ] Password reset email
- [ ] Order / booking confirmation
- [ ] Custom notification (describe what you need)

---

## AI Editor (Claude) Rule — Ask before setup

The Conductor MUST ask the customer whether they want the browser-based AI editor before doing any Claude/Anthropic setup. This feature is NOT enabled by default.

### When to activate

Activate this rule when the customer asks any of the following (in any language):
- "Can I edit my website myself by chatting?"
- "I want to be able to change things without a developer"
- "Is there a way to update my site through chat / AI?"
- "Can I use AI to edit my website?"

When triggered, respond:

> "Yes — your app includes an AI editor. You can type what you want to change in plain language, and the AI will update your website files automatically. To use this feature, we need to connect your personal Claude AI account."

Then proceed to Step 2.

### When NOT to activate

If the customer does not ask about this feature, do NOT mention it or set it up. Never ask for an Anthropic API key unless the customer has explicitly chosen to use the AI editor.

### Step 2 — Explain what Claude AI is (plain language)

> "Claude is an AI assistant made by Anthropic. Your app will use Claude to read and edit your website files when you give it instructions. Each client uses their own Claude account — this keeps your content private and separate from everyone else."

### Step 3 — Guide to get an API key

Walk the customer through these steps one at a time (in their language):

1. Go to https://console.anthropic.com and sign in (or create a free account)
2. Click **API Keys** in the left sidebar
3. Click **Create Key**, give it any name (e.g. "My Website Editor")
4. Copy the key — it starts with `sk-ant-...`
5. Share it with me privately — treat it like a password, never post it publicly

> ⚠️ **Important:** This key will only be shown once. Copy it immediately before closing the page.

### Step 4 — Record securely

Save as a secret — NEVER commit to git:
```bash
wrangler secret put ANTHROPIC_API_KEY
# paste the key when prompted
```

### Step 5 — Confirm feature is ready

After the key is set and deployed, the AI editor will appear in the admin dashboard under **AI Editor**. The customer can start chatting to make changes to their website.

---

## Cloudflare (Wrangler) Login Rule — MANDATORY before any deploy

Before deploying anything for the customer, the Conductor MUST verify Cloudflare login.

### Step 1 — Check login status

```bash
wrangler whoami
```

- If output shows an email and account → **logged in, proceed**
- If output says "not logged in" or errors → **must login first**

### Step 2 — If not logged in

```bash
wrangler login
```

A browser window will open. The customer must:
1. Log in to their Cloudflare account (or sign up at https://cloudflare.com — it's free)
2. Click **Allow** to authorize Wrangler
3. Return to the terminal — it will confirm login automatically

### Step 3 — Verify after login

```bash
wrangler whoami
```

Must show the customer's email and Account ID before proceeding.

Do NOT run any `wrangler deploy` until this check passes.

---

## GitHub Onboarding Rule — MANDATORY before starting any work

Before the Conductor begins customizing the app, it MUST verify the customer has a GitHub account.

### Step 1 — Check

Ask the customer:

> "Do you have a GitHub account? GitHub is the place where your website's files will be stored — it's free to sign up."

### Step 2 — If customer has no GitHub account

Guide them step by step in their own language:

1. Go to https://github.com
2. Click **Sign up**
3. Enter email, create a password, choose a username
4. Verify email
5. Come back and share their GitHub username

Do NOT proceed to any customization until the customer confirms their GitHub username.

### Step 3 — Record

Once confirmed, save:

```
GitHub Username: [customer username]
```

in the customer's project file before continuing.

### Why this matters

The starter kit lives on GitHub. Without an account, the customer cannot:
- receive their customized app
- save changes
- deploy updates in the future

---

## Development Style Rule — Ask before starting any work

Before customizing anything, the Conductor MUST ask whether the customer edits files themselves. This determines which editing workflow to recommend.

### Step 1 — Ask

> "Do you use a code editor on your computer — for example VS Code — to open and edit files yourself?"

- If **Yes** → they are comfortable with local editing. Recommend Claude Code extension for VS Code (they can chat with AI directly in their editor).
- If **No / Not sure** → they are non-technical. Use the browser-based AI Editor only (admin dashboard chat interface).

### Step 2 — If Yes (has VS Code or similar)

> "Great — you can use the Claude Code extension inside VS Code to chat with AI and make changes directly. Would you like to use that instead of the browser editor?"

- If **Yes to VS Code + Claude Code** → guide to install the extension: open VS Code → Extensions → search "Claude Code" → Install
- If **Prefer browser editor** → use the admin dashboard AI Editor (no extra setup needed)

### Step 3 — Record

Save the customer's preferred editing method:

```
Editing Method: [VS Code + Claude Code / Browser AI Editor]
```

This determines which setup instructions to follow for future change requests.

---

## Section 1 — Your Business

Q1. What is the name of your business or website?

Answer: [TBD]

---

Q2. What does your business do? (Briefly describe what you sell or offer)

Examples: sell clothes online / freelance web design / massage clinic / restaurant / music lessons

Answer: [TBD]

---

Q3. Who are your customers?

Examples: teenagers / stay-at-home parents / business owners / students / general public

Answer: [TBD]

---

Q4. What is the main language of your website?

- [ ] Thai
- [ ] English
- [ ] Both Thai and English

Answer: [TBD]

---

## Section 2 — What You Need

Q5. What do you want your website to do? (Select all that apply)

- [ ] Show business info / portfolio
- [ ] Accept orders / sell products online
- [ ] Accept bookings / appointments
- [ ] Member system (login / register)
- [ ] Articles / blog / news
- [ ] Contact form / quote request
- [ ] Photo gallery
- [ ] Other

Answer: [TBD]

---

Q6. Do you need an admin panel to manage things yourself?

Examples: add/remove products, view orders, manage members

- [ ] Yes — I want to manage it myself through a dashboard
- [ ] No — I'd like the team to help manage it

Answer: [TBD]

---

Q7. Do you need to accept online payments?

- [ ] Yes — specify method: (e.g. credit card, PromptPay, QR Code)
- [ ] Not at this time

Answer: [TBD]

---

Q8. Do you need to send emails to your customers?

Examples: order confirmations, appointment reminders, newsletter

- [ ] Yes
- [ ] No

Answer: [TBD]

---

## Section 3 — Look and Feel

Q9. Do you already have a logo or brand assets?

- [ ] Yes — I will send the files
- [ ] No — I need help designing one
- [ ] Not needed

Answer: [TBD]

---

Q10. What are your brand colors?

Examples: blue, green, black, gold — or provide a hex code (#FF5733)

Answer: [TBD]

---

Q11. What style do you prefer?

- [ ] Clean / minimal
- [ ] Elegant / professional
- [ ] Bright / fun / playful
- [ ] Formal / corporate

Answer: [TBD]

---

Q12. Do you have any websites you like or want yours to look similar to?

Examples: "I like the Airbnb style — clean and simple" or "I want it like Shopee with orange and lots of products"

Answer: [TBD]

---

## Section 4 — Pages You Want

Q13. What pages do you want on your website?

Examples: Home, Products, About Us, Contact, Blog, Booking

Answer: [TBD]

---

Q14. What should each page contain?

Describe as you imagine it. Example: "The home page has a big image, a button, and a list of products"

Answer: [TBD]

---

Q15. Do you have any example websites or UI references you like?

Paste a link or describe it. Example: "I like the Airbnb layout" or "Something like Shopee but simpler"

Answer: [TBD]

---

## Section 5 — Timeline

Q16. When do you need this to be ready?

Examples: 2 weeks, 1 month, no rush

Answer: [TBD]

---

Q17. Is there any feature that must be ready first?

Examples: the ordering system must launch first / the home page needs to go live first

Answer: [TBD]

---

## Conductor Instructions

After the customer completes all questions:

1. Summarize the customer profile and app requirements
2. Map answers to stages in PIPELINE.md
3. Set feature priorities
4. Inform the customer what will be delivered in the first milestone
5. Log everything in DEV_LOG.md

---

Status

- [ ] Section 1 — Business: not answered
- [ ] Section 2 — Features: not answered
- [ ] Section 3 — Look and Feel: not answered
- [ ] Section 4 — Pages: not answered
- [ ] Section 5 — Timeline: not answered
- [ ] Conductor created app requirements: not done
