import { getGlobalStats } from "@/lib/imessage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityChart } from "@/components/GlobalCharts";
import Link from "next/link";

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const stats = await getGlobalStats();

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold tracking-tight">iMessage Insights</h1>
          <p className="text-muted-foreground">
            Analyzing {stats.totalMessages.toLocaleString()} recent messages
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Analyzed in current batch</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.sent / stats.totalMessages) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Received</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.received.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.received / stats.totalMessages) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topContacts.length}</div>
              <p className="text-xs text-muted-foreground">In top 5</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          {/* Main Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>Message volume over the last year</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ActivityChart data={stats.history} />
            </CardContent>
          </Card>

          {/* Top Contacts / Recent Chats */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>
                You have {stats.recentChats.length} active chats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentChats.map((chat) => (
                  <Link 
                    href={`/chat/${encodeURIComponent(chat.chatId)}`} 
                    key={chat.chatId}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {chat.displayName || chat.chatId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {chat.isGroup ? "Group Chat" : "Direct Message"}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
