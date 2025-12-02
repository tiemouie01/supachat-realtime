"use client";

import { FormEvent, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "./ui/input-group";
import { SendIcon } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from "@/lib/services/supabase/actions/messages";

export function ChatInput({ roomId }: { roomId: string }) {
  const [message, setMessage] = useState("");

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    setMessage("");
    const text = message.trim();
    if (!text) return;

    const result = await sendMessage({
      roomId,
      text,
    });

    if (result.error) {
      toast.error(result.message);
    } else {
      //   result.
    }
  }

  return (
    <form className="p-3">
      <InputGroup>
        <InputGroupTextarea
          placeholder="Type your message..."
          className="field-sizing-content min-h-auto"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="submit"
            aria-label="Send"
            title="Send"
            size="icon-sm"
          >
            <SendIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
