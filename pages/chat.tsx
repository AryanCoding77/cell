import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ChatInterface from '@/components/ChatInterface';

const ChatPage: React.FC = () => {
  const router = useRouter();
  const { user } = router.query;
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    // Validate that the user is either Unknown 1 or Unknown 2
    if (typeof user === 'string') {
      if (user === 'Unknown 1' || user === 'Unknown 2') {
        setUsername(user);
      } else {
        // Redirect to home if invalid user
        router.push('/');
      }
    }
  }, [user, router]);

  // Don't render until we have a valid username
  if (!username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Private Chat</title>
        <meta name="description" content="Private Chat" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ChatInterface username={username} />
    </div>
  );
};

export default ChatPage; 