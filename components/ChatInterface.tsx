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

// Use a constant storage key for backup
const STORAGE_KEY = 'pdf-chat-messages';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ username }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  
  // Fetch messages from the server on initial render
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        console.log("Fetching messages from server");
        setIsLoading(true);
        
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
          // Try to load from localStorage as backup
          const storedMessages = localStorage.getItem(STORAGE_KEY);
          if (storedMessages) {
            const parsedMessages = JSON.parse(storedMessages) as Message[];
            setMessages(parsedMessages);
            parsedMessages.forEach(msg => messageIdsRef.current.add(msg.id));
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        // Try to load from localStorage as backup
        const storedMessages = localStorage.getItem(STORAGE_KEY);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages) as Message[];
          setMessages(parsedMessages);
          parsedMessages.forEach(msg => messageIdsRef.current.add(msg.id));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, []);
  
  // Save messages to localStorage as backup whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to localStorage:', error);
    }
  }, [messages]);
  
  // Initialize Pusher
  useEffect(() => {
    // Initialize Pusher with your app key
    const pusher = new Pusher('3c81f9444a590ff17416', {
      cluster: 'ap2',
      forceTLS: true,
    });

    // Subscribe to the chat channel
    const channel = pusher.subscribe('chat-channel');
    
    // Bind to the new message event
    channel.bind('new-message', (data: Message) => {
      console.log("Received message from Pusher:", data);
      // Check if this message ID already exists to prevent duplicates
      if (!messageIdsRef.current.has(data.id)) {
        console.log("Adding new message:", data.id);
        messageIdsRef.current.add(data.id);
        setMessages(prevMessages => [...prevMessages, data]);
      } else {
        console.log("Skipping duplicate message:", data.id);
      }
    });

    // Clean up the subscription when component unmounts
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
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
      text: inputMessage,
      sender: username,
      timestamp: Date.now(),
    };
    
    console.log("Sending new message:", newMessage);
    
    // Add message ID to the set to prevent duplicates
    messageIdsRef.current.add(newMessage.id);
    
    // Add the message locally for immediate display
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
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
      // Optionally show an error to the user
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
        
        // Clear locally
        localStorage.removeItem(STORAGE_KEY);
        setMessages([]);
        messageIdsRef.current.clear();
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
        <button 
          onClick={clearChat}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm"
        >
          Clear Chat
        </button>
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
                    <p>{message.text}</p>
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
            className="bg-blue-500 text-white px-6 py-2 rounded-r font-medium disabled:bg-blue-300"
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