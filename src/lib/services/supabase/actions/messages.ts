"use server";

import { getCurrentUser } from "../lib/getCurrentUser";
import { createAdminClient } from "../server";

export type Message = {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  author: {
    name: string;
    image_url: string | null;
  };
};

export async function sendMessage(data: {
  roomId: string;
  text: string;
}): Promise<
  { error: false; message: Message } | { error: true; message: string }
> {
  const user = await getCurrentUser();

  if (user == null) {
    return { error: true, message: "You must be logged in to send a message" };
  }

  if (!data.text.trim()) {
    return { error: true, message: "Message cannot be empty" };
  }

  const supabase = createAdminClient();

  const { data: membership, error: membershipError } = await supabase
    .from("chat_room_member")
    .select("member_id")
    .eq("member_id", user.id)
    .eq("chat_room_id", data.roomId)
    .single();

  console.log(membership, membershipError);
  if (membershipError || !membership) {
    return { error: true, message: "You are not a member of this room" };
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      chat_room_id: data.roomId,
      text: data.text,
      author_id: user.id,
    })
    .select(
      "id, text, created_at, author_id, author:user_profiles(name, image_url)"
    )
    .single();

  if (error) {
    return { error: true, message: "Failed to send message" };
  }

  return { error: false, message };
}
