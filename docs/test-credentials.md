# Test Credentials

## Test Account (Clerk)

| Field    | Value                  |
|----------|------------------------|
| Name     | michael ec             |
| Email    | mecamangeg@gmail.com   |
| Password | my$ryde-uber1979       |

## Clerk Configuration

| Setting               | Value                                                              |
|-----------------------|--------------------------------------------------------------------|
| Publishable Key (test)| pk_test_cHJvdWQtb3NwcmV5LTkxLmNsZXJrLmFjY291bnRzLmRldiQ         |
| Frontend API          | https://proud-osprey-91.clerk.accounts.dev                         |
| Dashboard             | https://dashboard.clerk.com                                        |

## Required Clerk Setup

For the app to work on `ryde-uber-app.netlify.app`, the Netlify domain must be added
as an allowed origin in the Clerk dashboard under **Domains**.

## Backend API

| Setting       | Value                                                        |
|---------------|--------------------------------------------------------------|
| Cloud Run URL | https://ryde-api-775551928651.us-central1.run.app            |
| GCP Project   | robsky-ai                                                    |
| Region        | us-central1                                                  |
| Database      | Neon Postgres (neondb)                                       |

### Endpoints

| Method | Path                 | Description            |
|--------|----------------------|------------------------|
| GET    | /api/drivers         | List all drivers       |
| GET    | /api/rides/:userId   | Get rides for user     |
| POST   | /api/rides           | Create a ride          |
| POST   | /api/user            | Create/update user     |
| POST   | /api/payments/create | Create payment (stub)  |
| POST   | /api/payments/confirm| Confirm payment (stub) |

## Dev Bypass

Set `devBypassAuth: true` in `src/environments/environment.ts` to skip Clerk entirely.
The app uses a mock user (Dev User, dev@ryde.test) and mock data for rides/drivers/payments.
