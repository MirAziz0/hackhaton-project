-- LaunchLens AI: removes the app's tables so 0001_init.sql can recreate them cleanly.
-- WARNING: this deletes ALL data in these six tables. Only use it on a fresh/demo project.
-- Run this, then 0001_init.sql, then seed.sql.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.messages cascade;
drop table if exists public.transactions cascade;
drop table if exists public.analyses cascade;
drop table if exists public.businesses cascade;
drop table if exists public.market_data cascade;
drop table if exists public.profiles cascade;
