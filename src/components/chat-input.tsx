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
import { Message, sendMessage } from "@/lib/services/supabase/actions/messages";

type Props = {
  roomId: string;
  onSend: (message: { id: string; text: string }) => void;
  onSuccessfulSend: (message: Message) => void;
  onErrorSend: (id: string) => void;
};

export function ChatInput({
  roomId,
  onSend,
  onSuccessfulSend,
  onErrorSend,
}: Props) {
  const [message, setMessage] = useState("");

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const id = crypto.randomUUID();
    const text = message.trim();

    setMessage("");
    if (!text) return;
    onSend({ id, text });

    const result = await sendMessage({
      id,
      roomId,
      text,
    });

    if (result.error) {
      toast.error(result.message);
      onErrorSend(id);
    } else {
      onSuccessfulSend(result.message);
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
