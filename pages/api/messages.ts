import type { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';
import fs from 'fs';
import path from 'path';

// Initialize Pusher with hardcoded values from .env.local
const pusher = new Pusher({
  appId: '1987339',
  key: '3c81f9444a590ff17416',
  secret: '41fe4d44703580bcf599',
  cluster: 'ap2',
  useTLS: true,
});

// Message storage location
const DATA_FILE = path.join(process.cwd(), 'chat-messages.json');

// Initialize with an empty array if the file doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Type for the messages
interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

// Read messages from the file
function getMessages(): Message[] {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading messages file:', error);
    return [];
  }
}

// Save messages to the file
function saveMessages(messages: Message[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages:', error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET request - return all messages
  if (req.method === 'GET') {
    const messages = getMessages();
    return res.status(200).json(messages);
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
        saveMessages(messages);
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
    saveMessages([]);
    return res.status(200).json({ success: true });
  }
  
  // Method not allowed
  res.status(405).json({ message: 'Method not allowed' });
} 