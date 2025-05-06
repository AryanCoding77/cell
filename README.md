# PDF Viewer with Private Chat

This is a Next.js application that provides a PDF viewer with a password-protected private chat system.

## Features

- PDF viewer with navigation controls
- Three-dot menu in the top right corner of the PDF
- Password protection (9544 for "Unknown 1", 911 for "Unknown 2")
- Real-time private chat between two users using Pusher
- Clean UI using Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (14.x or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   # or
   yarn
   ```

3. Set up your Pusher account:
   - Create an account at [pusher.com](https://pusher.com)
   - Create a new Channels app
   - Update the Pusher credentials in both:
     - `components/ChatInterface.tsx`
     - `pages/api/messages.ts`

4. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. The main page displays the PDF viewer
2. Click the three-dot menu at the top right of the PDF
3. Click "More" in the dropdown
4. Enter one of two passwords:
   - `9544` to access as "Unknown 1"
   - `911` to access as "Unknown 2"
5. Start chatting in the private chat room 