"use client";

import { ComponentProps } from "react";
import { ActionButton } from "./ui/action-button";
import { useCurrentUser } from "@/lib/services/supabase/hooks/useCurrentUser";
import { createClient } from "@/lib/services/supabase/client";
import { useRouter } from "next/navigation";

export function JoinRoomButton({
  children,
  roomId,
  ...props
}: Omit<ComponentProps<typeof ActionButton>, "action"> & {
  roomId: string;
}) {
  const { user } = useCurrentUser();
  const router = useRouter();

  async function joinRoom() {
    if (user == null) {
      return { error: true, message: "You must be logged in to join a room" };
    }

    const supabase = createClient();
    const { error } = await supabase.from("chat_room_member").insert({
      chat_room_id: roomId,
      user_id: user.id,
    });
    if (error) {
      return { error: true, message: error.message };
    }
    router.refresh();
    router.push(`/rooms/${roomId}`);
    return { error: false };
  }
  return (
    <ActionButton {...props} action={joinRoom}>
      {children}
    </ActionButton>
  );
}
