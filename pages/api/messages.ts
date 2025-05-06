import type { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Initialize Pusher with hardcoded values from .env.local
const pusher = new Pusher({
  appId: '1987339',
  key: '3c81f9444a590ff17416',
  secret: '41fe4d44703580bcf599',
  cluster: 'ap2',
  useTLS: true,
});

// Message storage location - store in user's home directory for persistence
const DATA_DIR = path.join(os.homedir(), '.pdf-chat-data');
const DATA_FILE = path.join(DATA_DIR, 'chat-messages.json');

// Ensure the data directory exists with proper permissions
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o755 });
}

// Initialize with an empty array if the file doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), { mode: 0o644 });
}

// Type for the messages
interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

// Read messages from the file with error handling and retries
function getMessages(): Message[] {
  let retries = 3;
  while (retries > 0) {
    try {
      if (!fs.existsSync(DATA_FILE)) {
        return [];
      }
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const messages = JSON.parse(data);
      
      // Validate the data structure
      if (!Array.isArray(messages)) {
        console.error('Invalid messages data structure');
        return [];
      }
      
      // Sort messages by timestamp
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error(`Error reading messages file (${retries} retries left):`, error);
      retries--;
      if (retries === 0) {
        return [];
      }
    }
  }
  return [];
}

// Save messages to the file with error handling and retries
function saveMessages(messages: Message[]): boolean {
  let retries = 3;
  while (retries > 0) {
    try {
      // Sort messages by timestamp before saving
      const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
      fs.writeFileSync(DATA_FILE, JSON.stringify(sortedMessages, null, 2), { mode: 0o644 });
      return true;
    } catch (error) {
      console.error(`Error saving messages (${retries} retries left):`, error);
      retries--;
      if (retries === 0) {
        return false;
      }
    }
  }
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET request - return all messages
  if (req.method === 'GET') {
    try {
      const messages = getMessages();
      return res.status(200).json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ message: 'Error fetching messages' });
    }
  }
  
  // POST request - add a new message
  if (req.method === 'POST') {
    try {
      const { id, text, sender, timestamp } = req.body;
      
      // Validate the message
      if (!id || !text || !sender) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      console.log(`Processing message: ${id} from ${sender}`);
      
      // Create the new message
      const newMessage: Message = { id, text, sender, timestamp };
      
      // Get existing messages and add the new one
      const messages = getMessages();
      
      // Check for duplicates
      if (!messages.some(msg => msg.id === id)) {
        messages.push(newMessage);
        if (!saveMessages(messages)) {
          return res.status(500).json({ message: 'Failed to save message' });
        }
      }
      
      // Trigger a new event on Pusher - using the same channel name as client
      await pusher.trigger('chat-channel', 'new-message', newMessage);
      
      console.log(`Successfully sent message: ${id}`);
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Error sending message' });
    }
    return;
  }
  
  // DELETE request - clear all messages
  if (req.method === 'DELETE') {
    try {
      if (saveMessages([])) {
        // Also notify all clients about the clear
        await pusher.trigger('chat-channel', 'clear-messages', {});
        return res.status(200).json({ success: true });
      } else {
        return res.status(500).json({ message: 'Failed to clear messages' });
      }
    } catch (error) {
      console.error('Error clearing messages:', error);
      return res.status(500).json({ message: 'Error clearing messages' });
    }
  }
  
  // Method not allowed
  res.status(405).json({ message: 'Method not allowed' });
} 