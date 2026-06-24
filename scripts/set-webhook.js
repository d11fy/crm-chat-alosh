const axios = require('axios');
require('dotenv').config();

const apiUrl = process.env.EVOLUTION_API_URL;
const apiKey = process.env.EVOLUTION_API_API_KEY;
const webhookToken = process.env.WEBHOOK_TOKEN || 'crm_secure_token_999';

const vercelUrl = process.argv[2];

if (!vercelUrl) {
  console.error('❌ Error: Please provide your Vercel URL as an argument.');
  console.log('Example: node scripts/set-webhook.js https://my-crm-app.vercel.app');
  process.exit(1);
}

if (!apiUrl || !apiKey) {
  console.error('❌ Error: EVOLUTION_API_URL or EVOLUTION_API_API_KEY is missing in .env');
  process.exit(1);
}

// Clean URL: ensure no trailing slash
const cleanVercelUrl = vercelUrl.replace(/\/$/, "");
const targetWebhookUrl = `${cleanVercelUrl}/api/webhook/evolution?token=${webhookToken}`;

async function setWebhook() {
  try {
    console.log(`Connecting to Evolution API at: ${apiUrl}`);
    console.log(`Setting webhook URL for instance "alosh" to: ${targetWebhookUrl}`);

    const response = await axios.post(
      `${apiUrl}/webhook/set/alosh`,
      {
        webhook: {
          enabled: true,
          url: targetWebhookUrl,
          byEvents: false,
          base64: true,
          events: [
            "MESSAGES_UPSERT",
            "MESSAGES_UPDATE"
          ]
        }
      },
      {
        headers: {
          apikey: apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data) {
      console.log('✅ Webhook configured successfully!');
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.log('⚠️ Webhook configuration returned empty response.');
    }
  } catch (error) {
    console.error('❌ Failed to set webhook:', error.response ? error.response.data : error.message);
  }
}

setWebhook();
