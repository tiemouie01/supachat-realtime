import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { MessageSquareIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto max-2-3xl px-4 py-8 space-y-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant={"icon"}>
            <MessageSquareIcon />
          </EmptyMedia>
          <EmptyTitle>No Chat Rooms</EmptyTitle>
          <EmptyDescription>
            Create a new chat room to get started
          </EmptyDescription>
          <EmptyContent>
            <Button asChild>
              <Link href={"rooms/new"}>Create Room</Link>
            </Button>
          </EmptyContent>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
