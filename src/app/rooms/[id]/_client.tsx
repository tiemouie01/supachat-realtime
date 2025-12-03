"use client";

import { ChatInput } from "@/components/chat-input";
import { ChatMessage } from "@/components/chat-message";
import { Message } from "@/lib/services/supabase/actions/messages";
import { createClient } from "@/lib/services/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
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
  const { connectedUsers, messages: realtimeMessages } = useRealtimeChat({
    roomId: room.id,
    userId: user.id,
  });
  const [sentMessages, setSentMessages] = useState<
    (Message & { status: "pending" | "error" | "success" })[]
  >([]);

  const visibleMessages = messages.toReversed().concat(
    realtimeMessages,
    sentMessages.filter((m) => !realtimeMessages.find((rm) => rm.id === m.id))
  );

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
          {visibleMessages.map((message) => (
            <ChatMessage key={message.id} {...message} />
          ))}
        </div>
      </div>
      <ChatInput
        roomId={room.id}
        onSend={(message) =>
          setSentMessages((prev) => [
            ...prev,
            {
              id: message.id,
              text: message.text,
              created_at: new Date().toISOString(),
              author_id: user.id,
              author: {
                name: user.name,
                image_url: user.image_url,
              },
              status: "pending",
            },
          ])
        }
        onSuccessfulSend={(message) =>
          setSentMessages((prev) =>
            prev.map((m) =>
              m.id === message.id ? { ...message, status: "success" } : m
            )
          )
        }
        onErrorSend={(id) =>
          setSentMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, status: "error" } : m))
          )
        }
      />
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
    let newChannel: RealtimeChannel | null = null;
    let cancel = false;

    async function setupChannel() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || cancel) return;

        newChannel = supabase.channel(`room:${roomId}:messages`, {
          config: {
            private: true,
            presence: {
              key: userId,
            },
          },
        });

        newChannel
          .on("presence", { event: "sync" }, () => {
            if (newChannel) {
              setConnectedUsers(Object.keys(newChannel.presenceState()).length);
            }
          })
          .on("broadcast", { event: "INSERT" }, (payload) => {
            const messageData = payload.payload;
            if (!messageData) return;

            setMessages((prevMessages) => {
              const exists = prevMessages.some(
                (msg) => msg.id === messageData.id
              );
              if (exists) return prevMessages;

              return [
                ...prevMessages,
                {
                  id: messageData.id,
                  text: messageData.text,
                  created_at: messageData.created_at,
                  author_id: messageData.author_id,
                  author: {
                    name: messageData.author_name,
                    image_url: messageData.author_image_url,
                  },
                },
              ];
            });
          });

        await supabase.realtime.setAuth();

        newChannel.subscribe(async (status) => {
          if (status === "SUBSCRIBED" && newChannel) {
            await newChannel.track({ userId });
          }
        });
      } catch (error) {
        console.error("Error setting up realtime channel:", error);
      }
    }

    setupChannel();

    return () => {
      cancel = true;
      if (newChannel) {
        newChannel.untrack();
        newChannel.unsubscribe();
        supabase.removeChannel(newChannel);
      }
    };
  }, [roomId, userId]);

  return { connectedUsers, messages };
}
