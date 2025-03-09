# Kenz Store Backend

This is the backend for Kenz Store, an e commerce website for electronics. Visit

the website at https://www.kenzstore.faheem-mb.com

[Frontend Repo](https://github.com/Faheem-T/kenzStoreFrontend)

## Technologies Used

- Express.js
- Docker
- Zod
- Nodemailer
- mongoose
- jsonwebtoken

## Steps to run

Since this project has been dockerized it is very easy to run it

### Set environment variables

These will be the environment variables that you need to set in your

.env file:

```
FRONTEND_URL
DEV_FRONTEND_URL

PORT
NODE_ENV
DEV_MONGO_URI
MONGO_URI

JWT_REFRESH_SECRET
JWT_ACCESS_SECRET

JWT_ADMIN_REFRESH_SECRET
JWT_ADMIN_ACCESS_SECRET

JWT_FORGOT_PASS_SECRET

NODE_MAILER_HOST
NODE_MAILER_PORT
NODE_MAILER_GMAIL
NODE_MAILER_GMAIL_APP_PASSWORD

RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET

GOOGLE_CLIENT_ID
```


### Development mode

```bash
docker compose up api-dev --build
```

### Production mode

```bash
docker compose up api-prod --build
```
