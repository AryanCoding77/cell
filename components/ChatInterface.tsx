import React, { useState, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

interface ChatInterfaceProps {
  username: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ username }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const pusherRef = useRef<Pusher | null>(null);
  
  // Fetch messages from the server
  const fetchMessages = async () => {
    try {
      console.log("Fetching messages from server");
      
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json() as Message[];
        console.log("Received messages from server:", data);
        
        // Create a set of existing message IDs
        const messageIds = new Set<string>();
        data.forEach(msg => messageIds.add(msg.id));
        
        // Update the message IDs ref
        messageIdsRef.current = messageIds;
        
        // Set the messages
        setMessages(data);
      } else {
        console.error("Failed to fetch messages:", response.statusText);
        throw new Error(response.statusText);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      alert('Failed to load messages. Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Pusher and fetch messages
  useEffect(() => {
    // Initialize Pusher
    pusherRef.current = new Pusher('3c81f9444a590ff17416', {
      cluster: 'ap2',
      forceTLS: true,
    });

    // Subscribe to the chat channel
    const channel = pusherRef.current.subscribe('chat-channel');
    
    // Bind to the new message event
    channel.bind('new-message', (data: Message) => {
      console.log("Received message from Pusher:", data);
      // Check if this message ID already exists to prevent duplicates
      if (!messageIdsRef.current.has(data.id)) {
        console.log("Adding new message:", data.id);
        messageIdsRef.current.add(data.id);
        setMessages(prevMessages => [...prevMessages, data].sort((a, b) => a.timestamp - b.timestamp));
      } else {
        console.log("Skipping duplicate message:", data.id);
      }
    });

    // Bind to the clear messages event
    channel.bind('clear-messages', () => {
      console.log("Received clear messages event");
      setMessages([]);
      messageIdsRef.current.clear();
    });

    // Fetch initial messages
    fetchMessages();

    // Clean up
    return () => {
      if (pusherRef.current) {
        channel.unbind_all();
        channel.unsubscribe();
        pusherRef.current.disconnect();
      }
    };
  }, []);

  // Scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: username,
      timestamp: Date.now(),
    };
    
    console.log("Sending new message:", newMessage);
    
    // Clear the input right away for better UX
    setInputMessage('');
    
    try {
      // Send the message to the API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Clear chat history
  const clearChat = async () => {
    if (confirm('Are you sure you want to clear all chat messages?')) {
      try {
        // Clear on the server
        const response = await fetch('/api/messages', {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to clear chat history');
        }
      } catch (error) {
        console.error('Error clearing chat:', error);
        alert('Failed to clear chat history. Please try again.');
      }
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="bg-blue-600 text-white p-4 shadow flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Private Chat</h1>
          <p>You are chatting as: {username}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchMessages()}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-400"
          >
            Refresh
          </button>
          <button 
            onClick={clearChat}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-400"
          >
            Clear Chat
          </button>
        </div>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Loading messages...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map(message => (
                <div 
                  key={message.id}
                  className={`flex ${message.sender === username ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                      message.sender === username 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white'
                    }`}
                  >
                    <div className="font-bold">{message.sender}</div>
                    <p className="break-words">{message.text}</p>
                    <div className="text-xs text-right mt-1 opacity-75">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <form onSubmit={sendMessage} className="bg-white p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-r font-medium hover:bg-blue-400 disabled:bg-blue-300"
            disabled={isLoading || !inputMessage.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface; 