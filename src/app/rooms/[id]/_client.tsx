"use client";

import { ChatInput } from "@/components/chat-input";
import { ChatMessage } from "@/components/chat-message";
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
  return (
    <div className="container mx-auto h-screen-with-header border border-y-0 flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <p>
            0 users online
            {/* {connectedUsers.length} connected users */}
          </p>
          {/* <InviteUserModal roomId={room.id} /> */}
        </div>
      </div>
      <div
        className="grow overflow-y-auto flex flex-col-reverse"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--color-border) transparent",
        }}
      >
        <div>
          {messages.toReversed().map((message) => (
            <ChatMessage key={message.id} {...message} />
          ))}
        </div>
      </div>
      <ChatInput roomId={room.id} />
    </div>
  );
}

function InviteUserModal({ roomId }: { roomId: string }) {
  return (
    <div>
      <h1>Invite User</h1>
    </div>
  );
}
