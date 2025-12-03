"use server";

import z from "zod";
import { createRoomSchema } from "../schemas/rooms";
import { getCurrentUser } from "../lib/getCurrentUser";
import { createAdminClient } from "../server";
import { redirect } from "next/navigation";

export async function createRoom(unsafeData: z.infer<typeof createRoomSchema>) {
  const { success, data } = createRoomSchema.safeParse(unsafeData);

  if (!success) {
    return {
      success: false,
      error: "Invalid room data",
    };
  }

  const user = await getCurrentUser();
  if (user == null) {
    return { error: true, message: "User not authenticated" };
  }

  const supabase = createAdminClient();
  const { data: room, error: roomError } = await supabase
    .from("chat_room")
    .insert({ name: data.name, is_public: data.isPublic })
    .select("*")
    .single();

  if (roomError || room == null) {
    return { error: true, message: "Failed to create room" };
  }

  const { error: membershipError } = await supabase
    .from("chat_room_member")
    .insert({ chat_room_id: room.id, member_id: user.id });

  if (membershipError) {
    return { error: true, message: "Failed to add user to room" };
  }

  redirect(`/rooms/${room.id}`);
}

export async function addUserToRoom({
  roomId,
  userId,
}: {
  roomId: string;
  userId: string;
}) {
  const currentUser = await getCurrentUser();
  if (currentUser == null) {
    return { error: true, message: "User not authenticated" };
  }

  const supabase = createAdminClient();

  const { data: roomMembership, error: roomMembershipError } = await supabase
    .from("chat_room_member")
    .select("member_id")
    .eq("member_id", currentUser.id)
    .eq("chat_room_id", roomId)
    .single();

  if (roomMembershipError || roomMembership == null) {
    return { error: true, message: "You are not a member of this room" };
  }

  const { data: userProfile, error: userProfileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (userProfileError || userProfile == null) {
    return { error: true, message: "User not found" };
  }

  const { data: existingMembership } = await supabase
    .from("chat_room_member")
    .select("member_id")
    .eq("member_id", userId)
    .eq("chat_room_id", roomId)
    .single();

  if (existingMembership) {
    return { error: true, message: "User is already a member of this room" };
  }

  const { error: insertError } = await supabase
    .from("chat_room_member")
    .insert({ chat_room_id: roomId, member_id: userId });

  if (insertError) {
    return { error: true, message: "Failed to add user to room" };
  }

  return { error: false, message: "User added to room successfully" };
}
