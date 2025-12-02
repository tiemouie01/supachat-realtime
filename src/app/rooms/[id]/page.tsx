import { getCurrentUser } from "@/lib/services/supabase/lib/getCurrentUser";
import { createAdminClient } from "@/lib/services/supabase/server";
import { notFound } from "next/navigation";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [room, user, messages] = await Promise.all([
    getRoom(id),
    getUser(),
    getMessages(id),
  ]);

  if (room == null) return notFound();

  return <RoomClient room={room} user={user} messages={messages} />;
}

async function getRoom(id: string) {
  const user = await getCurrentUser();
  if (user == null) return null;

  const supabase = createAdminClient();
  const { data: room, error } = await supabase
    .from("chat_room")
    .select("id, name, chat_room_member!inner ()")
    .eq("id", id)
    .eq("chat_room_member.member_id", user.id)
    .single();
  if (error) return null;
  return room;
}

async function getUser() {
  const user = await getCurrentUser();
  if (user == null) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, name, image_url")
    .eq("id", user.id)
    .single();
  if (error) return null;
  return data;
}

async function getMessages(roomId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, text, created_at, author_id, author:user_profiles ( name, image_url)"
    )
    .eq("chat_room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return data;
}
