-- Lets either participant delete a conversation from the chat widget.
drop policy if exists "messages_delete_participants" on public.messages;
create policy "messages_delete_participants" on public.messages
  for delete to authenticated
  using ((select auth.uid()) in (sender_id, receiver_id));
