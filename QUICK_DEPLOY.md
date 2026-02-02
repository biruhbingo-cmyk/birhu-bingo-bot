# Quick Vercel Deployment Guide

## Step 1: Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 2: Deploy via Vercel Dashboard

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"Add New..."** → **"Project"**
4. Select your repository
5. Click **"Import"**

## Step 3: Configure Environment Variables

Before deploying, click **"Environment Variables"** and add:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
API_BASE_URL=your_api_url_here
CHANNEL_USERNAME=your_channel_username (optional)
FRONTEND_URL=your_frontend_url (optional)
SUPPORT_USERNAMES=username1,username2 (optional)
```

## Step 4: Deploy

Click **"Deploy"** button. Wait for deployment to complete.

## Step 5: Set Up Webhook

After deployment completes, you'll get a URL like: `https://your-project.vercel.app`

### Set the webhook:

**Option A: Quick Browser Method**
Visit this URL (replace with your values):
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-project.vercel.app/api/webhook
```

**Option B: Using Script**
```bash
export WEBHOOK_URL=https://your-project.vercel.app/api/webhook
npm run setup-webhook
```

## Step 6: Test

Send `/start` to your bot on Telegram. It should respond!

---

## Alternative: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

