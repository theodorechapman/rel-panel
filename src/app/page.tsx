import { getGlobalStats } from "@/lib/imessage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityChart } from "@/components/GlobalCharts";
import Link from "next/link";
import { Search } from "@/components/Search";
import { MessageSquare, Users, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export const revalidate = 3600; // Revalidate every hour

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q;
  const stats = await getGlobalStats(query);

  const topContact = stats.topContacts[0];

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h1 className="text-4xl font-bold tracking-tight">iMessage Insights</h1>
             <p className="text-muted-foreground">
                Analyzing {stats.totalMessages.toLocaleString()} recent messages
             </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Analyzed in current batch</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
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
              <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Top Contact</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">
                {topContact ? topContact.name : "None"}
              </div>
              <p className="text-xs text-muted-foreground">
                {topContact ? `${topContact.count.toLocaleString()} messages` : "No data"}
              </p>
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

          {/* Top 5 Contacts List */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top 5 Contacts</CardTitle>
              <CardDescription>Most active conversations</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {stats.topContacts.map((contact, i) => (
                        <Link
                            key={contact.id}
                            href={`/chat/${encodeURIComponent(contact.id)}`}
                            className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                             <div className="flex items-center space-x-4">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                    {i + 1}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{contact.name}</p>
                                    <p className="text-xs text-muted-foreground">{contact.count.toLocaleString()} messages</p>
                                </div>
                             </div>
                             <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                    ))}
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Conversations List with Search */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                    <CardTitle>Conversations</CardTitle>
                    <CardDescription>
                        {query ? `Search results for "${query}"` : `Recent active chats`}
                    </CardDescription>
                </div>
                <div className="w-[300px]">
                    <Search placeholder="Search contacts..." />
                </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentChats.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No conversations found.</p>
                ) : (
                    stats.recentChats.map((chat) => (
                    <Link 
                        href={`/chat/${encodeURIComponent(chat.chatId)}`} 
                        key={chat.chatId}
                        className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors border-b last:border-0"
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
                    ))
                )}
              </div>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
