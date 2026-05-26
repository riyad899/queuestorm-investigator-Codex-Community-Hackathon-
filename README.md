# QuickLearner API

Backend API project built with **Node.js**, **TypeScript**, **Express**, **Prisma**, and **Better Auth**.

## Tech Stack

- Node.js + TypeScript
- Express 5
- Prisma ORM + PostgreSQL
- Better Auth
- ESLint

## Project Structure

```text
.
├── prisma/
│   └── Schema/
├── src/
│   ├── app/
│   │   ├── lib/
│   │   ├── module/
│   │   │   ├── Auth/
│   │   │   ├── instructor/
│   │   │   └── speciality/
│   │   ├── routes/
│   │   └── shared/
│   ├── config/
│   ├── generated/
│   └── middleware/
├── prisma.config.ts
├── tsconfig.json
└── package.json
```

## Prerequisites

- Node.js (LTS recommended)
- npm
- PostgreSQL connection string (`DATABASE_URL`)

## Environment Variables

Create a `.env` file in the project root and add:

```env
NODE_ENV=development
PORT=8000
DATABASE_URL="postgres://username:password@host:5432/dbname?sslmode=require"
BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:8000
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:3000
BETTER_AUTH_SESSION_EXPIRES_IN=30d
BETTER_AUTH_SEASSION_UPDATE_AGE=24h
EMAIL_SENDER_SMTP_USER=your_smtp_user
EMAIL_SENDER_SMTP_PASS=your_smtp_pass
EMAIL_SENDER_SMTP_HOST=your_smtp_host
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_FROM=no-reply@example.com
Google_Client_ID=your_google_client_id
Google_Client_Secret=your_google_client_secret
Google_callbackURL=http://localhost:8000/api/auth/callback/google
```

## Install & Run

```bash
npm install
npm run generate
npm run dev
```

Server starts using `src/server.ts` and mounts API routes under `/api/v1`.

## Available Scripts

- `npm run dev` – Run development server with `tsx watch`
- `npm run build` – Compile TypeScript to `dist/`
- `npm start` – Run production build from `dist/server.js`
- `npm run lint` – Lint `src/`
- `npm run generate` – Generate Prisma client
- `npm run migrate` – Run `prisma migrate dev`
- `npm run studio` – Open Prisma Studio

## Prisma Workflow

```bash
npx prisma migrate dev --name init
npm run generate
npm run studio
```

If `prisma` is not installed globally, always use `npx prisma ...`.

## Deploying to Render

This project is ready to deploy on Render as a Node.js web service.

1. Create a new Render **Web Service** from this repository.
2. Use these build settings:
	- **Build command:** `npm ci && npm run build`
	- **Start command:** `npm start`
3. Add the required environment variables in Render.
	- Render sets `PORT` automatically, so do not add it manually.
	- Set `NODE_ENV=production`.
	- Set `DATABASE_URL` to your Render PostgreSQL connection string or another hosted Postgres URL.
	- Set `BETTER_AUTH_URL` to your public Render service URL, for example `https://your-service.onrender.com`.
	- Set `FRONTEND_URL` to your deployed frontend URL.
	- Add the remaining secrets from the environment variable list above.
4. If you are using Google login or SMTP, add those credentials before the first deploy.

Optional `render.yaml` is included in the repository so you can deploy with Render Blueprints.

## Deploying to Vercel

This project can also be deployed manually to Vercel as a serverless Node.js API.

1. Import the repository into Vercel as a new project.
2. Leave the framework preset as `Other` if Vercel does not auto-detect it.
3. Use the default build command, or set it to `npm run vercel-build`.
4. Set the required environment variables in Vercel.
	- `DATABASE_URL`
	- `BETTER_AUTH_SECRET`
	- `ACCESS_TOKEN_SECRET`
	- `REFRESH_TOKEN_SECRET`
	- `ACCESS_TOKEN_EXPIRES_IN`
	- `REFRESH_TOKEN_EXPIRES_IN`
	- `BETTER_AUTH_SESSION_EXPIRES_IN`
	- `BETTER_AUTH_SEASSION_UPDATE_AGE`
	- `BETTER_AUTH_URL` should be your Vercel backend URL if you want to override the automatic fallback.
	- `FRONTEND_URL` should be your deployed frontend URL.
5. Deploy the project. The API will be served through the serverless handler in `api/index.ts`.

## API Routes

Base URL: `http://localhost:<PORT>/api/v1`

### Auth

- `POST /auth/regsiter`
- `POST /auth/login`

### Speciality

- `POST /spaciality`
- `GET /spaciality`
- `DELETE /spaciality/:id`

### Instructor

- `POST /instructor/create-doctor`

## Notes

- Route and file naming currently use `spaciality`/`regsiter` spellings in code; keep requests aligned with existing routes unless you refactor.
- There is also a direct route in `src/server.ts`: `POST /specialities`.

## Build for Production

```bash
npm run build
npm start
```
