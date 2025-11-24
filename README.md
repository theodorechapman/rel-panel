# iMessage Insights Dashboard

A local dashboard for visualizing your iMessage history and getting relationship insights. Built with [Next.js](https://nextjs.org/), [@photon-ai/imessage-kit](https://github.com/photon-ai/imessage-kit), and [shadcn/ui](https://ui.shadcn.com/).

## Features

- **Global Dashboard**:
  - Total message volume and sent/received ratio.
  - Activity heatmap (last 12 months).
  - Top 5 most active contacts.
  - List of recent conversations with real contact names (via local Contacts integration).
  
- **Conversation Insights**:
  - Deep dive into individual chats.
  - Hourly activity breakdown (when do you talk the most?).
  - "Who texts first?" analysis (initiation stats).
  - Top words usage frequency.
  - Searchable message history viewer.

## Prerequisites

- **macOS**: This project only works on macOS as it reads the local iMessage database (`chat.db`).
- **Node.js**: Version 18 or higher.
- **Permissions**: You must grant **Full Disk Access** and **Contacts** access to your terminal/IDE.

## Installation

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   cd rel-panel
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Grant Permissions**:
   - Go to **System Settings** > **Privacy & Security**.
   - **Full Disk Access**: Add your terminal (e.g., Terminal, iTerm, VS Code, Cursor). This is required to read `~/Library/Messages/chat.db`.
   - **Contacts**: Allow your terminal to access Contacts. This is used to resolve phone numbers to names.

## Running the App

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open the dashboard**:
   - Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Troubleshooting

### "Access Denied" or Empty Data
- **Full Disk Access**: Ensure your terminal has Full Disk Access. If you just granted it, **restart your terminal**.
- **Contacts Permission**: Run the helper script manually to trigger the permission dialog if it didn't appear:
  ```bash
  swift scripts/get_contacts.swift
  ```
- **Missing Messages**: The app defaults to analyzing the last 50,000-100,000 messages for performance. You can adjust this limit in `src/lib/imessage.ts`.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database Access**: `@photon-ai/imessage-kit` (SQLite wrapper)
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Charts**: Recharts
- **Contacts**: Native macOS Contacts framework via Swift helper script

## License

MIT
