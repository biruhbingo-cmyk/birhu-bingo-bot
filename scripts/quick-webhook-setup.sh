#!/bin/bash

# Quick Webhook Setup Script
# Usage: ./scripts/quick-webhook-setup.sh <DEPLOYMENT_URL> <BOT_TOKEN>

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "❌ Usage: ./scripts/quick-webhook-setup.sh <DEPLOYMENT_URL> <BOT_TOKEN>"
  echo "   Example: ./scripts/quick-webhook-setup.sh https://biruhbingo-cmyk.vercel.app 8276788640:AAHLiEsJLJN6BbDnjIWRZYcwYC4zsQwi2zg"
  exit 1
fi

DEPLOYMENT_URL=$1
BOT_TOKEN=$2
WEBHOOK_URL="${DEPLOYMENT_URL}/api/webhook"

echo "🔧 Setting up webhook..."
echo "📍 Webhook URL: $WEBHOOK_URL"
echo ""

# Set webhook
RESPONSE=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}")

echo "📤 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Get webhook info
echo "🔍 Verifying webhook..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")

echo "📋 Webhook Info:"
echo "$WEBHOOK_INFO" | jq '.' 2>/dev/null || echo "$WEBHOOK_INFO"

