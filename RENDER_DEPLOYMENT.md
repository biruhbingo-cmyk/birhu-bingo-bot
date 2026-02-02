# Render Deployment Guide

Render is actually **simpler** than Vercel for Telegram bots because:
- ✅ No webhook setup needed (uses polling mode)
- ✅ Always-on service (no cold starts)
- ✅ Easier deployment process
- ✅ Free tier available

## Step 1: Push to GitHub

Make sure your code is pushed to GitHub/GitLab/Bitbucket.

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Verify your email

## Step 3: Create New Web Service

1. Click **"New +"** button
2. Select **"Web Service"**
3. Connect your repository (GitHub/GitLab/Bitbucket)
4. Select your repository

## Step 4: Configure Service

### Basic Settings:
- **Name**: `biruh-bingo-bot` (or any name you like)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (or `./` if needed)
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Free` (or upgrade if needed)

### Environment Variables:

Click **"Advanced"** → **"Add Environment Variable"** and add:

**Required:**
- `TELEGRAM_BOT_TOKEN` = `your_bot_token_here`
- `API_BASE_URL` = `your_backend_api_url`

**Optional:**
- `CHANNEL_USERNAME` = `your_channel_username`
- `FRONTEND_URL` = `your_frontend_url`
- `SUPPORT_USERNAMES` = `username1,username2`
- `NODE_ENV` = `production`

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (usually 2-5 minutes)
3. You'll see build logs in real-time

## Step 6: Verify Bot is Running

1. Check the **Logs** tab in Render dashboard
2. You should see: `✅ Telegram bot initialized (mode: polling)`
3. You should see: `✅ Telegram bot is running`

## Step 7: Test Your Bot

1. Open Telegram
2. Find your bot
3. Send `/start`
4. Bot should respond immediately! 🎉

## That's It!

No webhook setup needed! The bot uses **polling mode** which means it continuously checks Telegram for new messages.

---

## Troubleshooting

### Bot Not Responding

1. **Check Render Logs**: Go to your service → **Logs** tab
2. **Check Environment Variables**: Make sure `TELEGRAM_BOT_TOKEN` is set correctly
3. **Check Build Logs**: Look for any build errors
4. **Verify API_BASE_URL**: Make sure your backend is accessible

### Service Keeps Restarting

- Check logs for errors
- Verify all required environment variables are set
- Check if your backend API is accessible

### Build Fails

- Check that `package.json` has correct `build` and `start` scripts
- Verify Node.js version compatibility
- Check build logs for specific errors

---

## Render vs Vercel Comparison

| Feature | Render | Vercel |
|---------|--------|--------|
| **Setup Complexity** | ⭐ Simple | ⭐⭐ Requires webhook |
| **Cold Starts** | ❌ None (always-on) | ✅ Possible |
| **Webhook Setup** | ❌ Not needed | ✅ Required |
| **Free Tier** | ✅ Yes | ✅ Yes |
| **Best For** | Always-on bots | Serverless webhooks |

**For Telegram bots, Render is recommended!** 🚀

