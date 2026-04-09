# Mutual — Development Guidelines

## Form Submissions

**Always use the `<SubmitButton>` component** (`@/components/submit-button`) for form submit buttons. Never use a plain `<button type="submit">` in a form with a server action.

`SubmitButton` uses `useFormStatus` to automatically disable the button while the form is submitting, preventing double-submit bugs.

```tsx
import { SubmitButton } from "@/components/submit-button";

<form action={myAction}>
  <SubmitButton
    pendingText="Saving..."
    className="..."
  >
    Save
  </SubmitButton>
</form>
```

## Server Actions

- Server actions that create resources should handle duplicate requests gracefully (e.g., check for existing records before inserting).
- Use `revalidatePath` after mutations to keep the UI in sync.
- Use the admin Supabase client (`@/lib/supabase/admin`) only when bypassing RLS is necessary (webhooks, system operations).

## Project Structure

- `apps/platform/` — Next.js App Router platform
- `packages/tsconfig/` — Shared TypeScript configs
- Server actions live in `src/app/actions/`
- Reusable components live in `src/components/`
- Database migrations live in `supabase/migrations/` (run in order via Supabase SQL editor)
