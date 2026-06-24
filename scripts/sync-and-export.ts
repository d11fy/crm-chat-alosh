import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { processCustomerAnalysis } from "../src/lib/queue";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
const apiUrl = process.env.EVOLUTION_API_URL;
const apiKey = process.env.EVOLUTION_API_API_KEY;
const instanceName = "alosh";

if (!apiUrl || !apiKey) {
  console.error("❌ Error: EVOLUTION_API_URL or EVOLUTION_API_API_KEY is missing in .env");
  process.exit(1);
}

// Ensure no trailing slash
const cleanApiUrl = apiUrl.replace(/\/$/, "");

async function main() {
  try {
    console.log("🚀 Starting Sync and Export process...");

    // ==========================================
    // STEP 1: Fetch and Export Contacts to CSV
    // ==========================================
    console.log("📥 Fetching all contacts from Evolution API...");
    const contactsResponse = await axios.post(
      `${cleanApiUrl}/chat/findContacts/${instanceName}`,
      {},
      { headers: { apikey: apiKey } }
    );

    const contacts = contactsResponse.data || [];
    console.log(`✅ Found ${contacts.length} contacts.`);

    // Extract numbers only
    const phoneNumbers: string[] = [];
    contacts.forEach((contact: any) => {
      const jid = contact.remoteJid || contact.id || "";
      const number = jid.split("@")[0];
      // Keep only digits
      const cleanNumber = number.replace(/\D/g, "");
      if (cleanNumber && !phoneNumbers.includes(cleanNumber)) {
        phoneNumbers.push(cleanNumber);
      }
    });

    // Write to contacts.csv (one number per line)
    const csvContent = "Phone Number\n" + phoneNumbers.join("\n");
    const csvPath = path.join(process.cwd(), "contacts.csv");
    fs.writeFileSync(csvPath, csvContent, "utf8");
    console.log(`💾 Contacts exported successfully to: ${csvPath} (${phoneNumbers.length} unique numbers)`);

    // ==========================================
    // STEP 2: Fetch and Import Recent Active Chats & Messages
    // ==========================================
    console.log("\n📥 Fetching active chats...");
    const chatsResponse = await axios.post(
      `${cleanApiUrl}/chat/findChats/${instanceName}`,
      {},
      { headers: { apikey: apiKey } }
    );

    const chats = chatsResponse.data || [];
    // Filter out groups, broadcast channels, etc.
    const directChats = chats.filter((chat: any) => {
      const jid = chat.remoteJid || "";
      return jid && !jid.endsWith("@g.us") && !jid.endsWith("@broadcast") && !jid.endsWith("@newsletter");
    });

    console.log(`✅ Found ${directChats.length} active direct chats.`);
    
    // Take top 40 most recently active chats to sync and run AI on (to be cost and performance efficient)
    const chatsToImport = directChats.slice(0, 40);
    console.log(`🔄 Syncing top ${chatsToImport.length} most recent active chats...`);

    for (let i = 0; i < chatsToImport.length; i++) {
      const chat = chatsToImport[i];
      const remoteJid = chat.remoteJid;
      const phone = remoteJid.split("@")[0];
      const name = chat.pushName || `عميل ${phone.substring(phone.length - 4)}`;
      
      console.log(`\n[${i + 1}/${chatsToImport.length}] Syncing: ${name} (${phone})...`);

      // 1. Create or Find Customer
      let customer = await prisma.customer.findUnique({
        where: { phone }
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            phone,
            name,
            status: "New Lead",
            leadScore: 0,
            purchaseProbability: 0,
          }
        });
        
        // Create memory
        await prisma.customerMemory.create({
          data: {
            customerId: customer.id,
            summary: "تم استيراد المحادثة التاريخية للعميل.",
            lastAiUpdate: new Date(0)
          }
        });
      }

      // 2. Fetch Messages for this Chat
      try {
        const msgsResponse = await axios.post(
          `${cleanApiUrl}/chat/findMessages/${instanceName}`,
          {
            where: {
              key: {
                remoteJid: remoteJid
              }
            },
            limit: 15
          },
          { headers: { apikey: apiKey } }
        );

        // Access the records array inside response (it matches the PowerShell response structure)
        const msgRecords = msgsResponse.data?.messages?.records || msgsResponse.data?.records || msgsResponse.data || [];
        
        console.log(`   Fetched ${msgRecords.length} messages.`);

        // Store messages in database (most recent are usually returned first, so we reverse to insert chronologically)
        const sortedRecords = [...msgRecords].reverse();
        
        for (const record of sortedRecords) {
          const id = record.key?.id;
          if (!id) continue;

          // Check if message already exists
          const existingMsg = await prisma.message.findUnique({
            where: { id }
          });

          if (existingMsg) continue;

          const fromMe = record.key.fromMe === true;
          const direction = fromMe ? "OUT" : "IN";
          const rawType = record.messageType || "conversation";
          
          let messageType = "text";
          let content = "";

          const msgContent = record.message || {};
          if (rawType === "conversation" || rawType === "extendedTextMessage") {
            messageType = "text";
            content = msgContent.conversation || msgContent.extendedTextMessage?.text || "";
          } else if (rawType === "imageMessage") {
            messageType = "image";
            content = msgContent.imageMessage?.caption || "صورة";
          } else if (rawType === "audioMessage") {
            messageType = "audio";
            content = "[رسالة صوتية]";
          } else if (rawType === "documentMessage" || rawType === "documentWithCaptionMessage") {
            messageType = "document";
            const doc = msgContent.documentMessage || msgContent.documentWithCaptionMessage?.message?.documentMessage || {};
            content = doc.fileName || doc.caption || "مستند";
          } else {
            messageType = "text";
            content = `[رسالة من نوع: ${rawType}]`;
          }

          // Ensure content is not empty
          if (!content) content = "...";

          const timestamp = record.messageTimestamp 
            ? new Date(record.messageTimestamp * 1000) 
            : new Date();

          await prisma.message.create({
            data: {
              id,
              customerId: customer.id,
              direction,
              messageType,
              content,
              timestamp
            }
          });
        }

        // 3. Trigger AI Analysis for this Customer
        console.log(`   Running AI analysis...`);
        await processCustomerAnalysis(customer.id);

      } catch (err: any) {
        console.error(`   ❌ Failed to sync messages for ${phone}:`, err.message);
      }
    }

    console.log("\n✨ Sync and Export completed successfully!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Process failed:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

main();
