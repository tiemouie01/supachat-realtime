"use client";

import { ChatInput } from "@/components/chat-input";
import { ChatMessage } from "@/components/chat-message";
import { Message } from "@/lib/services/supabase/actions/messages";
import { createClient } from "@/lib/services/supabase/client";
import { useEffect, useState } from "react";

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
  const { connectedUsers } = useRealtimeChat({
    roomId: room.id,
    userId: user.id,
  });
  return (
    <div className="container mx-auto h-screen-with-header border border-y-0 flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <p>
            {connectedUsers} user{connectedUsers > 1 ? "s" : ""} online
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

function useRealtimeChat({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) {
  const [connectedUsers, setConnectedUsers] = useState<number>(1);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const newChannel = supabase.channel(`room:${roomId}:messages`, {
      config: {
        private: true,
        presence: {
          key: userId,
        },
      },
    });

    newChannel
      .on("presence", { event: "sync" }, () => {
        setConnectedUsers(Object.keys(newChannel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status !== "SUBSCRIBED") return;

        newChannel.track({ userId });
      });

    return () => {
      newChannel.untrack();
      newChannel.unsubscribe();
    };
  }, [roomId, userId]);

  return { connectedUsers, messages };
}
