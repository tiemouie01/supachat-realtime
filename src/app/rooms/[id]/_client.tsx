"use client";

import { Message } from "@/lib/services/supabase/actions/messages";

export function RoomClient({
  room,
  user,
  messages,
}: {
  room: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    image_url: string | null;
  };
  messages: Message[];
}) {
  return <div>RoomClient</div>;
}
