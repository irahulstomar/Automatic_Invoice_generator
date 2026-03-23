# AI Agent Invoice Automation

End-to-end workflow that turns a free-form Telegram message into a production-ready PDF invoice. The system uses a Telegram bot to receive the message, Gemini 2.5 Flash to parse it, deterministic Node logic to calculate GST totals, a React/Vite frontend to render the invoice, and Puppeteer to capture the HTML as an A4 PDF that is sent back to Telegram.

## Repository Layout
- `Frontend/` – React + Vite invoice renderer, Telegram bot + Express server, and supporting assets.
- `Dockerfile` & `docker-compose.yml` – Containerised deployment setup.
- `.env.example` – Template for required environment variables (see `Frontend/.env.example`).

## End-to-End Workflow
1. **Telegram intake** – Sales sends a plain-text invoice description to the bot built with `telegraf`.
2. **LLM extraction** – `@google/genai` (Gemini 2.5 Flash) converts the text into structured JSON that matches the schema in `server.js`.
3. **Deterministic math** – Node calculates GST (default 18 %), totals, and formatted currency strings to avoid hallucinated numbers.
4. **Data transfer** – The payload is base64-encoded and appended to the React app URL as `?data=<encoded>`.
5. **React rendering** – `src/App.tsx` decodes the payload, and `src/Invoice.tsx` applies it to the invoice template defined in `styles.css`.
6. **PDF generation** – `puppeteer` opens the running Vite dev server (or production build), applies `page.pdf()` with full-bleed margins, and saves the PDF to a buffer.
7. **Delivery** – The bot replies in Telegram with the generated PDF; errors are surfaced to the chat with actionable messages.

## Key Resources & Libraries
- **Telegram Bot API** via `telegraf` for message polling and replying with documents.
- **Google Gemini API** via `@google/genai` for structured extraction.
- **Express** for future-ready webhook hosting alongside the bot.
- **Puppeteer** for headless Chromium rendering to PDF.
- **React 19 + Vite 6** for the invoice UI shell.
- **Lucide Icons & Motion** (already installed) for future UI polish.
- **Better SQLite3** dependency placeholder for persistence in later iterations.

## Development Setup
1. **Install prerequisites**
   - Node.js 20+ and npm 10+
   - Chrome/Chromium dependencies (needed by Puppeteer)
   - A Telegram Bot token and Gemini API key
2. **Clone & install**
   ```bash
   cd Frontend
   npm install
   ```
3. **Configure environment**
   - Copy `Frontend/.env.example` to `.env` at the project root and fill in your keys:
     ```ini
     telegram_token=YOUR_TELEGRAM_BOT_TOKEN
     gemini_API=YOUR_GEMINI_API_KEY
     ```
4. **Run with Docker**
   ```bash
   docker-compose up --build
   ```
   Or run locally without Docker:
   ```bash
   # Terminal 1 – React renderer
   cd Frontend
   npm run dev

   # Terminal 2 – Bot + Express server
   cd Frontend
   node server.js
   ```
   Visit `http://localhost:3000/?data=...` to debug the invoice UI without Telegram.

## Customisation

All company-specific details live in `Frontend/src/Invoice.tsx`. Update the placeholders below with your own information.

### Company Info (line ~29)
```tsx
<h1>INVOICE</h1>
<p>Your Company Name, City</p>
<p><a href="https://www.yourwebsite.com">www.yourwebsite.com</a></p>
<p>GSTIN/UIN: YOUR_GSTIN_HERE</p>
<p>State Name : Your State, Code : 00</p>
<p>CIN: YOUR_CIN_HERE</p>
```

### Logo (line ~36)
Place your logo image in `Frontend/public/` and uncomment the `<img>` tag:
```tsx
<div className="logo-container">
    <img src="/your-logo.png" alt="Company Logo" className="invoice-logo" />
</div>
```

### Bank Details (line ~102)
```tsx
<p><strong>NAME:</strong> YOUR COMPANY NAME</p>
<p><strong>BANK NAME:</strong> YOUR BANK NAME</p>
<p><strong>A/C NO:</strong> YOUR_ACCOUNT_NUMBER</p>
<p><strong>BRANCH:</strong> YOUR BRANCH <strong>IFSC CODE:</strong> YOUR_IFSC_CODE</p>
<p><strong>CITY:</strong> YOUR CITY</p>
```

### GST Rate
The default GST rate (18%) is set in `Frontend/server.js` at line 91:
```js
const gst_rate = 18;
```

## Project Conventions
- `InvoiceData` schema in `src/Invoice.tsx` is the single source of truth for UI fields.
- Optional buyer fields are conditionally rendered, preserving layout when absent.
- Currency formatting uses `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` for consistency.
- GST logic is deterministic; never trust the LLM for totals.

## Scripts
- `npm run dev` – Start Vite dev server on port 3000.
- `npm run build` – Create a production build under `dist/`.
- `npm run preview` – Preview the production bundle locally.
- `npm run lint` – Type-check the project (uses `tsc --noEmit`).

## Deployment Notes
- **Docker** – Use `docker-compose up --build` to run the full stack in a container.
- Ensure Puppeteer has the necessary OS-level Chromium dependencies in your deployment environment.
- Keep the React build reachable so Puppeteer can load it to render PDFs.

## Troubleshooting
- _“Failed to parse invoice data”_ – Ensure the `?data` param is valid base64-encoded JSON that conforms to `InvoiceData`.
- _“Failed to generate PDF”_ – Confirm the React app is reachable at `http://localhost:3000` (or update `targetUrl` in `server.js`).
- _Empty Telegram replies_ – Verify `telegram_token` is correct and the bot is not already running elsewhere.

