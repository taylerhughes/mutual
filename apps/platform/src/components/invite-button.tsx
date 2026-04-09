"use client";

import { useState } from "react";
import { createInvite } from "@/app/actions/invites";

export function InviteButton({
  communityId,
  communitySlug,
}: {
  communityId: string;
  communitySlug: string;
}) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    const result = await createInvite(communityId, communitySlug);
    if (result?.url) {
      setInviteUrl(result.url);
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex h-9 items-center rounded-md border border-zinc-200 px-4 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
    >
      {copied ? "Copied!" : inviteUrl ? "Copy invite link" : "Share invite link"}
    </button>
  );
}
