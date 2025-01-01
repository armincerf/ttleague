"use client";

import { useQuery } from "@triplit/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/use-token-check";
import { client } from "./adminClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarPlus } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdminTools } from "./components/AdminTools";
import { CreateEventDialog } from "./components/CreateEventDialog";
import { useState } from "react";
import { EditEventDialog } from "./components/EditEventDialog";

export default function AdminPage() {
  const { isAdmin } = useAdmin();
  const { results: events } = useQuery(
    client,
    client.query("events").order("start_time", "DESC")
  );
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to access the admin area.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <AdminTools />

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Event Management</h2>
          <Dialog open={showCreateEventDialog} onOpenChange={setShowCreateEventDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <CalendarPlus className="h-4 w-4" />
                Create Event
              </Button>
            </DialogTrigger>
            <CreateEventDialog onClose={() => setShowCreateEventDialog(false)} />
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events?.map((event) => (
            <Card 
              key={event.id} 
              className="h-full hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedEventId(event.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{event.name}</CardTitle>
                <CardDescription>
                  {new Date(event.start_time).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {event.description || "No description"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Dialog open={!!selectedEventId} onOpenChange={(open) => !open && setSelectedEventId(null)}>
        {selectedEventId && (
          <EditEventDialog 
            eventId={selectedEventId} 
            onClose={() => setSelectedEventId(null)} 
          />
        )}
      </Dialog>
    </div>
  );
}
