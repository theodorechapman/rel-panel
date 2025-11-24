import { getChatDetails } from "@/lib/imessage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HourlyChart, TopWordsChart } from "@/components/ChatCharts";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 3600;

export default async function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  // Await params in Next.js 15+ (or recent 14 versions if dynamic)
  const { chatId } = await params;
  console.log(`[ChatPage] Raw param chatId: "${chatId}"`);
  const decodedId = decodeURIComponent(chatId);
  console.log(`[ChatPage] Decoded chatId: "${decodedId}"`);
  
  const data = await getChatDetails(decodedId);

  const avgLength = data.messages.length > 0 
    ? (data.messages.reduce((acc, m) => acc + (m.text?.length || 0), 0) / data.messages.length).toFixed(0) 
    : "0";

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full">
             <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Conversation Insights</h1>
            <p className="text-muted-foreground">
              Analyzing {data.stats.total.toLocaleString()} messages
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sent vs Received</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex items-end gap-2">
                <div className="text-2xl font-bold">{data.stats.sent}</div>
                <span className="text-sm text-muted-foreground mb-1">sent</span>
                <div className="text-2xl font-bold ml-4">{data.stats.received}</div>
                <span className="text-sm text-muted-foreground mb-1">received</span>
               </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Initiations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="text-2xl font-bold">{data.stats.myInitiations}</div>
                <span className="text-sm text-muted-foreground mb-1">me</span>
                <div className="text-2xl font-bold ml-4">{data.stats.theirInitiations}</div>
                <span className="text-sm text-muted-foreground mb-1">them</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Length</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgLength}
              </div>
              <p className="text-xs text-muted-foreground">chars per message</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
           {/* Hourly Activity */}
           <Card>
            <CardHeader>
              <CardTitle>Activity by Hour</CardTitle>
              <CardDescription>When are you most active?</CardDescription>
            </CardHeader>
            <CardContent>
              <HourlyChart data={data.hourlyActivity} />
            </CardContent>
          </Card>

          {/* Top Words */}
          <Card>
            <CardHeader>
              <CardTitle>Top Words</CardTitle>
              <CardDescription>Most frequently used terms (&gt; 3 chars)</CardDescription>
            </CardHeader>
            <CardContent>
              <TopWordsChart data={data.topWords} />
            </CardContent>
          </Card>
        </div>

        {/* Message History Preview */}
        <Card>
            <CardHeader>
                <CardTitle>Recent History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 border rounded-md">
                    {data.messages.slice(0, 50).map((m) => (
                        <div key={m.id} className={`flex flex-col ${m.isFromMe ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${m.isFromMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm">{m.text || "Attachment"}</p>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                                {new Date(m.date).toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {data.messages.length > 50 && (
                        <p className="text-center text-muted-foreground py-4">
                            And {data.messages.length - 50} more messages...
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
