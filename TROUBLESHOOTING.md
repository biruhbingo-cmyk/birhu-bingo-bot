# Troubleshooting: Bot Not Responding

## Step 1: Verify Your Deployment URL

Your bot endpoint should be at:
```
https://your-project-name.vercel.app/api/webhook
```

**Important:** The root URL (`/`) will show 404 - that's normal! The bot only works at `/api/webhook`.

## Step 2: Set Up the Webhook (CRITICAL!)

The bot won't respond until you tell Telegram where to send updates.

### Quick Method (Browser):

1. Get your deployment URL from Vercel (e.g., `https://biruhbingo-cmyk.vercel.app`)
2. Get your bot token from `.env` or Vercel environment variables
3. Visit this URL in your browser (replace the placeholders):

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-project.vercel.app/api/webhook
```

**Example:**
```
https://api.telegram.org/bot8276788640:AAHLiEsJLJN6BbDnjIWRZYcwYC4zsQwi2zg/setWebhook?url=https://biruhbingo-cmyk.vercel.app/api/webhook
```

You should see: `{"ok":true,"result":true,"description":"Webhook was set"}`

## Step 3: Verify Webhook is Set

Visit this URL to check:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

You should see your webhook URL in the response.

## Step 4: Check Environment Variables in Vercel

Make sure these are set in Vercel dashboard:
- `TELEGRAM_BOT_TOKEN` ✅
- `API_BASE_URL` ✅
- `CHANNEL_USERNAME` (optional)
- `FRONTEND_URL` (optional)
- `SUPPORT_USERNAMES` (optional)

## Step 5: Check Vercel Logs

1. Go to Vercel dashboard
2. Click on your project
3. Go to **Deployments** → Click latest deployment
4. Click **Functions** tab
5. Click on `api/webhook`
6. Check the **Logs** tab for errors

## Step 6: Test the Endpoint

Try accessing your webhook endpoint directly (it should return an error, but not 404):

```bash
curl -X POST https://your-project.vercel.app/api/webhook
```

If you get 404, the deployment might not be correct.
If you get 405 (Method not allowed), that's good - it means the endpoint exists!

## Common Issues:

### ❌ Bot still not responding after webhook setup:
- Check Vercel function logs for errors
- Verify `TELEGRAM_BOT_TOKEN` is correct in Vercel
- Make sure `API_BASE_URL` is accessible from Vercel
- Try removing and re-setting the webhook

### ❌ 404 on /api/webhook:
- Check `vercel.json` is in your repo
- Verify the `api/` folder exists with `webhook.ts`
- Redeploy the project

### ❌ 500 Internal Server Error:
- Check environment variables are set
- Check Vercel logs for specific error messages
- Verify your backend API is accessible

