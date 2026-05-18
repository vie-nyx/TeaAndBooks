# Auth Setup and Troubleshooting

This document explains how authentication is wired in `TeaAndBooks`, which environment variables are required, and how to debug the most common signup, login, Google OAuth, and email verification issues.

## Auth Flow

### Frontend

- `entwined-web/src/pages/Auth.jsx`
  Handles signup, password login, Google login, and resend verification actions.
- `entwined-web/src/contexts/AuthContext.jsx`
  Stores the access token in `localStorage` and verifies the current session with the backend.
- `entwined-web/src/api/api.js`
  Attaches `Authorization: Bearer <token>` and refreshes expired access tokens with the refresh cookie.
- `entwined-web/src/main.jsx`
  Wraps the app with `GoogleOAuthProvider` using `VITE_GOOGLE_CLIENT_ID`.

### Backend

- `entwined-server/controllers/authController.js`
  Contains signup, login, Google login, token verification, password reset, and resend verification logic.
- `entwined-server/routes/authRoutes.js`
  Exposes the auth API routes under `/api/auth`.
- `entwined-server/middleware/authMiddleware.js`
  Protects routes by verifying the JWT access token.
- `entwined-server/utils/sendEmail.js`
  Sends verification and password reset emails through SMTP.

## Required Environment Variables

### Backend: `entwined-server/.env`

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_oauth_client_id

EMAIL_USER=your_smtp_username
EMAIL_PASS=your_smtp_password_or_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

Notes:

- `JWT_SECRET` is required for access tokens.
- `JWT_REFRESH_SECRET` is required for refresh tokens.
- `GOOGLE_CLIENT_ID` must match the frontend Google client ID.
- For Gmail SMTP, `EMAIL_PASS` must be an app password if 2-step verification is enabled.
- `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE` are optional. If omitted, the app falls back to Gmail SMTP defaults.

### Frontend: `entwined-web/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Important:

- `VITE_GOOGLE_CLIENT_ID` must match backend `GOOGLE_CLIENT_ID`.
- Restart the Vite dev server after changing `.env`.

## Auth API Routes

These routes are mounted under `/api/auth`.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/signup` | Create a new user |
| `POST` | `/login` | Login with email and password |
| `POST` | `/google` | Login with Google credential token |
| `GET` | `/verify` | Verify current access token |
| `GET` | `/verify-email/:token` | Verify email address |
| `POST` | `/resend-verification` | Resend verification email |
| `POST` | `/forgot-password` | Start password reset |
| `POST` | `/reset-password/:token` | Complete password reset |
| `POST` | `/refresh` | Refresh access token from cookie |
| `POST` | `/logout` | Clear refresh cookie |
| `POST` | `/logout-all` | Invalidate all sessions |

## Local Development Behavior

In local development, email delivery problems should not block you from testing auth:

- If signup cannot send the verification email, the backend auto-verifies the new user and returns a fallback success message.
- If resend verification fails locally, the backend auto-verifies the user.
- If forgot password email sending fails locally, the backend returns a `resetUrl` in the API response.

This fallback is meant for development only. In production, SMTP must be configured correctly.

## Common Errors

### `secretOrPrivateKey must have a value`

Cause:

- `JWT_SECRET` is missing from `entwined-server/.env`.

Fix:

1. Add `JWT_SECRET`.
2. Restart the backend server.

The backend now validates required env variables on startup in `entwined-server/server.js`.

### `Invalid login: 534-5.7.9 Application-specific password required`

Cause:

- Gmail rejected the SMTP login because `EMAIL_PASS` is a normal account password instead of an app password.

Fix:

1. Enable 2-Step Verification on the Gmail account.
2. Generate a Gmail app password.
3. Put that app password in `EMAIL_PASS`.
4. Restart the backend server.

Alternative:

- Use another SMTP provider and set `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE`.

### Google login fails even though the popup opens

Cause:

- Frontend `VITE_GOOGLE_CLIENT_ID` and backend `GOOGLE_CLIENT_ID` do not match.
- The Google OAuth client does not allow `http://localhost:5173` in authorized JavaScript origins.

Fix:

1. Make sure both env files use the same client ID.
2. In Google Cloud Console, add `http://localhost:5173` to authorized origins.
3. Restart frontend and backend after env changes.

### Password login works but session disappears on refresh

Cause:

- Missing `/api/auth/verify` route, invalid access token, or refresh-cookie issues.

Current status:

- `/api/auth/verify` is registered.
- Access tokens are stored in `localStorage`.
- Refresh tokens are stored in an HTTP-only cookie.

### Resend verification button fails

Cause:

- The frontend calls `/api/auth/resend-verification`.

Current status:

- That route now exists in `entwined-server/routes/authRoutes.js`.

## Setup Checklist

1. Install dependencies in both `entwined-server` and `entwined-web`.
2. Add backend and frontend `.env` files.
3. Make sure `JWT_SECRET` and `JWT_REFRESH_SECRET` are present.
4. Make sure `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` match exactly.
5. If using Gmail SMTP, replace the normal Gmail password with an app password.
6. Start the backend with `npm run dev`.
7. Start the frontend with `npm run dev`.

## Quick Verification Steps

1. Create a user with email and password.
2. Login with the same user.
3. Refresh the page and confirm the dashboard still loads.
4. Try Google login.
5. Try forgot password.

## Security Notes

- Do not commit real secrets to the repository.
- Rotate any secrets that were accidentally committed earlier.
- Prefer strong random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
- For production, use `secure: true` cookies behind HTTPS.