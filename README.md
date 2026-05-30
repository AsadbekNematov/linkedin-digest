This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Playwright Scraper

The main scrape flow now lives on the website itself. The dashboard calls a server-side Playwright route that opens LinkedIn in a persistent browser profile, scrolls the feed, collects posts, and sends them through the existing refresh API.

Run it with:

```bash
npm run scrape:playwright
```

Useful flags:

```bash
npm run scrape:playwright -- --count 20
npm run scrape:playwright -- --headless
npm run scrape:playwright -- --no-post
```

The first run may open a browser window and ask you to log in. The profile is stored in `.playwright-profile/` so later runs can reuse that session.

If you want Playwright to attach to an already-running Chrome instance, start Chrome with remote debugging enabled and set `PLAYWRIGHT_CDP_URL`, for example `http://127.0.0.1:9222`. Without that, the scraper launches its own Chrome profile for reliability.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
