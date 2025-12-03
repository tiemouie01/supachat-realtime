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

  console.log(realtimeMessages);

  const visibleMessages = messages.toReversed().concat(realtimeMessages);

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
      <ChatInput roomId={room.id} />
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
        // Get the current session to ensure we're authenticated
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          return;
        }

        if (!session) {
          console.error(
            "No session found, cannot subscribe to realtime channel"
          );
          return;
        }

        if (cancel) return;

        // Create channel first
        newChannel = supabase.channel(`room:${roomId}:messages`, {
          config: {
            private: true,
            presence: {
              key: userId,
            },
          },
        });

        // Set up listeners before subscribing
        newChannel
          .on("presence", { event: "sync" }, () => {
            if (newChannel) {
              setConnectedUsers(Object.keys(newChannel.presenceState()).length);
            }
          })
          .on("broadcast", { event: "INSERT" }, (payload) => {
            console.log("Full broadcast payload:", payload);
            // The payload from realtime.send is directly in payload.payload
            const messageData = payload.payload;
            console.log("Received broadcast messageData:", messageData);

            if (!messageData) {
              console.error("No message data in payload:", payload);
              return;
            }

            setMessages((prevMessages) => {
              // Prevent duplicates by checking if message already exists
              const exists = prevMessages.some(
                (msg) => msg.id === messageData.id
              );
              if (exists) {
                console.log(
                  "Duplicate message detected, skipping:",
                  messageData.id
                );
                return prevMessages;
              }

              console.log("Adding new message to state:", messageData);
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

        // Set auth before subscribing - let it use the current session automatically
        console.log("Setting realtime auth");
        await supabase.realtime.setAuth();

        // Now subscribe
        newChannel.subscribe(async (status, err) => {
          console.log("Channel subscription status:", status, err);
          if (status === "SUBSCRIBED" && newChannel) {
            console.log("Channel subscribed, tracking presence");
            await newChannel.track({ userId });
          }
          if (status === "CHANNEL_ERROR") {
            console.error("Channel error:", err);
          }
          if (status === "TIMED_OUT") {
            console.error("Channel subscription timed out");
          }
          if (status === "CLOSED") {
            console.log("Channel closed");
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
