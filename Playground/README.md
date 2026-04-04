# Hotelinn Lagos Wi-Fi Onboarding System

Hotelinn Lagos Wi-Fi Onboarding System is a production-grade guest onboarding portal built with Node.js, Express, MongoDB, and a mobile-first frontend. Guests scan a QR code, submit their details, and receive Wi-Fi credentials through a branded experience. Hotel staff can monitor guest sign-ins from an admin dashboard.

## Features

- Guest onboarding flow for QR-based Wi-Fi access
- Persistent MongoDB storage with Mongoose
- Clean Express architecture with models, controllers, routes, and middleware
- Validation and sanitization for guest input
- Rate-limited API endpoints
- Mobile-first branded landing page
- Admin dashboard with guest list and analytics
- Environment-based configuration for deployment

## Project structure

```text
.
├── .env.example
├── README.md
├── package.json
├── public
│   ├── admin.html
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── server
│   ├── config
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers
│   │   ├── connectController.js
│   │   └── userController.js
│   ├── middleware
│   │   ├── adminAuth.js
│   │   ├── asyncHandler.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   ├── validateRequest.js
│   │   └── validators.js
│   ├── models
│   │   └── User.js
│   └── routes
│       ├── connectRoutes.js
│       └── userRoutes.js
└── server.js
```

## Environment variables

Create a `.env` file in the project root using `.env.example` as a guide.

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Port for the Express server. Defaults to `3000`. |
| `NODE_ENV` | No | `development` or `production`. |
| `TRUST_PROXY` | No | Proxy trust setting for Express. Defaults to `1`. |
| `MONGODB_URI` | Yes | MongoDB connection string. |
| `HOTEL_NAME` | No | Hotel brand name shown in responses. |
| `WIFI_SSID` | Yes | Wi-Fi network name sent after successful guest signup. |
| `WIFI_PASSWORD` | Yes | Wi-Fi password sent after successful guest signup. |
| `RECEPTION_EXTENSION` | No | Support contact label shown in the success state. |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limiting window in milliseconds. |
| `CONNECT_RATE_LIMIT_MAX` | No | Max signup attempts per IP within the window. |
| `USERS_RATE_LIMIT_MAX` | No | Max admin reads per IP within the window. |
| `DEFAULT_USERS_PAGE_SIZE` | No | Default number of guest records returned per admin request. |
| `MAX_USERS_PAGE_SIZE` | No | Upper bound for admin page size requests. |
| `ADMIN_ACCESS_KEY` | No | Shared key required for `/api/users` in production and recommended in all environments. |

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- MongoDB local instance or hosted MongoDB Atlas cluster

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and set your real MongoDB URI and Wi-Fi credentials.

3. Start the application:

   ```bash
   npm start
   ```

4. Open the guest portal:

   [http://localhost:3000](http://localhost:3000)

5. Open the admin dashboard:

   [http://localhost:3000/admin](http://localhost:3000/admin)

## API endpoints

### `POST /api/connect`

Stores a guest record and returns Wi-Fi credentials.

Request body:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "device": "iPhone | iOS | Safari"
}
```

### `GET /api/users`

Returns paginated guest records sorted by most recent first.

Query parameters:

- `page`: Page number starting from `1`
- `limit`: Number of records to return per page

If `ADMIN_ACCESS_KEY` is configured, send it in the `x-admin-key` header.

## QR flow

1. Guest scans hotel QR code.
2. QR code opens the landing page URL.
3. Guest enters name and email.
4. Frontend submits the form to `POST /api/connect`.
5. Backend stores the guest in MongoDB.
6. Success screen reveals the Wi-Fi credentials and connection steps.

## Deployment notes

- Use a managed MongoDB instance such as MongoDB Atlas in production.
- Set all secrets through your hosting platform's environment variables.
- Keep `ADMIN_ACCESS_KEY` enabled in production to protect the admin endpoint.
- Run behind HTTPS so guest details and Wi-Fi credentials stay encrypted in transit.
- The server refuses to boot in production when `ADMIN_ACCESS_KEY` is not configured.
- Suitable for deployment on Render, Railway, Fly.io, DigitalOcean App Platform, or any Node-ready VPS.

## Validation

After installing dependencies, run:

```bash
npm run check
```
