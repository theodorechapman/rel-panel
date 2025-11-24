import { IMessageSDK } from '@photon-ai/imessage-kit';
import { getContactMap, getContactName } from './contacts';

// Singleton instance
let sdkInstance: IMessageSDK | null = null;

export function getSdk() {
  if (!sdkInstance) {
    sdkInstance = new IMessageSDK();
  }
  return sdkInstance;
}

export type ChatSummary = {
  chatId: string;
  displayName: string;
  lastMessageAt: Date;
  messageCount?: number; // We might need to fetch this separately or estimate
  unreadCount: number;
  isGroup: boolean;
};

export async function getGlobalStats() {
  const sdk = getSdk();
  const contactMap = await getContactMap();
  
  // Explicitly include own messages
  const messages = await sdk.getMessages({ 
    limit: 50000,
    excludeOwnMessages: false // Default is true in SDK
  }); 
  
  const allChats = await sdk.listChats();
  console.log(`[getGlobalStats] Found ${allChats.length} chats. Sample chatIds:`, allChats.slice(0, 3).map(c => c.chatId));

  const sent = messages.messages.filter(m => m.isFromMe).length;
  const received = messages.messages.length - sent;
  
  // Top contacts
  const contactCounts: Record<string, number> = {};
  messages.messages.forEach(m => {
    // Use chatId if available, otherwise sender
    // For sent messages, we need to ensure we attribute to the recipient/chat
    const id = m.chatId || m.sender;
    contactCounts[id] = (contactCounts[id] || 0) + 1;
  });
  
  const topContacts = Object.entries(contactCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, count]) => {
      const chat = allChats.find(c => c.chatId === id);
      let name = chat?.displayName || id;
      
      // Try to resolve name via contacts if it's just a phone number
      if (!chat?.displayName && id.includes('+')) {
          const resolvedName = getContactName(id, contactMap);
          if (resolvedName) name = resolvedName;
      }

      return {
        id,
        name,
        count
      };
    });

  // Activity by month (last 12 months)
  const activityByMonth: Record<string, { sent: number, received: number }> = {};
  messages.messages.forEach(m => {
    const month = m.date.toISOString().slice(0, 7); // YYYY-MM
    if (!activityByMonth[month]) activityByMonth[month] = { sent: 0, received: 0 };
    if (m.isFromMe) activityByMonth[month].sent++;
    else activityByMonth[month].received++;
  });
  
  const history = Object.entries(activityByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({ date, ...stats }));
  
  // Enrich recent chats with names
  const recentChats = allChats.slice(0, 20).map(chat => {
      let name = chat.displayName || chat.chatId;
      if (!chat.displayName) {
          // Extract handle from iMessage;+123... or use raw ID
          const handle = chat.chatId.includes(';') ? chat.chatId.split(';').pop()! : chat.chatId;
          const resolvedName = getContactName(handle, contactMap);
          if (resolvedName) name = resolvedName;
      }
      return { ...chat, displayName: name };
  });

  return {
    totalMessages: messages.total,
    sent,
    received,
    topContacts,
    history,
    recentChats
  };
}

export async function getChatDetails(chatId: string) {
  console.log(`[getChatDetails] Fetching details for chatId: "${chatId}"`);
  const sdk = getSdk();
  
  // Normalize chatId if it's an iMessage/SMS format to just the handle
  // The SDK documentation says it handles this, but let's try querying by the raw handle if the prefixed one fails.
  // Or better yet, try both.
  
  // Attempt 1: Use chatId as is
  let result = await sdk.getMessages({
    chatId,
    limit: 100000,
    excludeOwnMessages: false 
  });

  // Attempt 2: If 0 messages and chatId looks like "Service;Handle", try just "Handle"
  if (result.messages.length === 0 && chatId.includes(';')) {
     const handle = chatId.split(';').pop(); // Get the last part
     if (handle) {
         console.log(`[getChatDetails] No messages found for "${chatId}". Retrying with handle: "${handle}"`);
         const retryResult = await sdk.getMessages({
            chatId: handle,
            limit: 100000,
            excludeOwnMessages: false
         });
         if (retryResult.messages.length > 0) {
             result = retryResult;
             console.log(`[getChatDetails] Success with handle! Found ${result.messages.length} messages.`);
         }
     }
  }
  
  // Attempt 3: If still 0, try searching by sender (for DMs)
  if (result.messages.length === 0 && chatId.includes(';')) {
    const handle = chatId.split(';').pop();
    if (handle) {
         console.log(`[getChatDetails] Retrying by sender field: "${handle}"`);
         const senderResult = await sdk.getMessages({
            sender: handle,
            limit: 100000,
            excludeOwnMessages: false
         });
         if (senderResult.messages.length > 0) {
             result = senderResult;
             console.log(`[getChatDetails] Success by sender! Found ${result.messages.length} messages.`);
         }
    }
  }

  console.log(`[getChatDetails] Final count: ${result.messages.length} messages for chatId: "${chatId}"`);

  const messages = result.messages.slice().reverse(); // Oldest first

  // Basic stats
  const sent = messages.filter(m => m.isFromMe).length;
  const received = messages.length - sent;
  
  // Activity by Hour
  const hourlyActivity = new Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
  messages.forEach(m => {
    const hour = new Date(m.date).getHours();
    hourlyActivity[hour].count++;
  });

  // Who texts first? (Initiations)
  // A simple heuristic: if a message is sent > 1 hour after the previous one, it's an initiation.
  let myInitiations = 0;
  let theirInitiations = 0;
  let lastTime = 0;
  
  messages.forEach(m => {
    const time = m.date.getTime();
    if (lastTime === 0 || (time - lastTime > 60 * 60 * 1000)) {
      if (m.isFromMe) myInitiations++;
      else theirInitiations++;
    }
    lastTime = time;
  });

  // Top words (naive implementation)
  const wordCounts: Record<string, number> = {};
  messages.forEach(m => {
    if (!m.text) return;
    const words = m.text.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach(w => {
      if (w.length > 3) { // Filter short words
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    });
  });
  
  const topWords = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    messages,
    stats: {
      total: messages.length,
      sent,
      received,
      myInitiations,
      theirInitiations,
    },
    hourlyActivity,
    topWords
  };
}
