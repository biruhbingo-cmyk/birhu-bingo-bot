# Vercel Deployment Guide

This guide will help you deploy your Telegram bot to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed (optional, for local deployment)
3. Your Telegram bot token
4. All required environment variables

## Step 1: Install Dependencies

Make sure you have all dependencies installed:

```bash
npm install
```

## Step 2: Set Up Environment Variables

You need to configure the following environment variables in Vercel:

### Required Variables:
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token from @BotFather
- `API_BASE_URL` - Your backend API base URL
- `CHANNEL_USERNAME` - Telegram channel username (optional)
- `FRONTEND_URL` - Frontend URL for instructions (optional)
- `SUPPORT_USERNAMES` - Comma-separated list of support usernames (optional)

### How to Add Environment Variables in Vercel:

1. Go to your project in Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with its value
4. Make sure to add them for **Production**, **Preview**, and **Development** environments

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click **Add New Project**
4. Import your repository
5. Vercel will automatically detect the configuration
6. Click **Deploy**

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

## Step 4: Set Up Webhook

After deployment, you need to configure Telegram to send updates to your Vercel webhook URL.

### Get Your Webhook URL

Your webhook URL will be:
```
https://your-project-name.vercel.app/api/webhook
```

Replace `your-project-name` with your actual Vercel project name.

### Set the Webhook

#### Option A: Using the Setup Script

1. Set the `WEBHOOK_URL` environment variable:
   ```bash
   export WEBHOOK_URL=https://your-project-name.vercel.app/api/webhook
   ```

2. Run the setup script:
   ```bash
   npm run setup-webhook
   ```

#### Option B: Using Telegram Bot API Directly

You can use curl or any HTTP client:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-project-name.vercel.app/api/webhook"}'
```

Replace:
- `<YOUR_BOT_TOKEN>` with your actual bot token
- `your-project-name` with your Vercel project name

#### Option C: Using Browser

Visit this URL in your browser (replace the placeholders):
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-project-name.vercel.app/api/webhook
```

### Verify Webhook

To verify your webhook is set correctly:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Or visit in browser:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

## Step 5: Test Your Bot

1. Open Telegram and find your bot
2. Send `/start` command
3. Verify that the bot responds correctly

## Troubleshooting

### Bot Not Responding

1. **Check Webhook Status**: Verify the webhook is set correctly using `getWebhookInfo`
2. **Check Vercel Logs**: Go to your Vercel project → **Deployments** → Click on a deployment → **Functions** → Check logs
3. **Check Environment Variables**: Ensure all required environment variables are set in Vercel
4. **Check API Base URL**: Make sure your backend API is accessible from Vercel

### Webhook Errors

- **404 Not Found**: Make sure the webhook URL is correct and the deployment was successful
- **500 Internal Server Error**: Check Vercel function logs for detailed error messages
- **Timeout**: Vercel serverless functions have a timeout limit. For long-running operations, consider using background jobs

### Local Development

For local development, the bot uses **polling mode** by default. This means:
- You don't need to set up a webhook locally
- The bot will continuously poll Telegram for updates
- Just run `npm run dev` and the bot will work

To test webhook mode locally, you can use:
- [ngrok](https://ngrok.com/) to create a tunnel to your local server
- Set `USE_WEBHOOK=1` environment variable
- Set `WEBHOOK_URL` to your ngrok URL

## Important Notes

1. **Serverless Functions**: Vercel uses serverless functions, which means:
   - Each request is handled independently
   - Cold starts may cause slight delays
   - State is not persisted between requests (use external storage for state)

2. **Function Timeout**: Vercel free tier has a 10-second timeout for serverless functions. Pro plan has 60 seconds.

3. **Environment Variables**: Make sure to add environment variables for all environments (Production, Preview, Development).

4. **HTTPS Required**: Telegram webhooks require HTTPS. Vercel provides this automatically.

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Telegram Bot API documentation
3. Verify all environment variables are set correctly
4. Ensure your backend API is accessible

