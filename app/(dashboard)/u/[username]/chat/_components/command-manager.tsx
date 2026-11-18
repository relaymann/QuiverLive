"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createChatCommand, deleteChatCommand } from "@/actions/chat-commands";

type Command = { id: string; name: string; response: string; cooldownSeconds: number };

export function CommandManager({ commands }: { commands: Command[] }) {
  const [name, setName] = useState("");
  const [response, setResponse] = useState("");
  const [cooldown, setCooldown] = useState("0");
  const [pending, startTransition] = useTransition();

  const addCommand = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      try {
        await createChatCommand({ name, response, cooldownSeconds: Number(cooldown) });
        setName("");
        setResponse("");
        setCooldown("0");
        toast.success("Chat command created");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not create command");
      }
    });
  };

  const removeCommand = (id: string) => {
    startTransition(async () => {
      try {
        await deleteChatCommand(id);
        toast.success("Chat command deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not delete command");
      }
    });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={addCommand} className="grid gap-3 rounded-xl bg-muted p-4 md:grid-cols-[minmax(120px,0.7fr)_minmax(180px,2fr)_120px_auto] md:items-end">
        <label className="space-y-1 text-sm font-medium">
          Command name
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="socials" maxLength={33} required />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Response
          <Input value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Follow me on..." maxLength={500} required />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Cooldown (seconds)
          <Input type="number" min={0} max={3600} step={1} value={cooldown} onChange={(event) => setCooldown(event.target.value)} required />
        </label>
        <Button type="submit" disabled={pending} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
      </form>

      {commands.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No custom commands yet. Add one above; viewers can trigger it in chat with !commandname.</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {commands.map((command) => (
            <li key={command.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">!{command.name}<span className="ml-2 text-xs font-normal text-muted-foreground">{command.cooldownSeconds}s cooldown</span></div>
                <p className="break-words text-sm text-muted-foreground">{command.response}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" disabled={pending} aria-label={`Delete !${command.name}`} onClick={() => removeCommand(command.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Command names are case-insensitive. Built-in !watchtime and !followage commands are reserved. Cooldowns are enforced by the database across app instances.</p>
    </div>
  );
}
