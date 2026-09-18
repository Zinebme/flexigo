-- Dashboard i18n per user preference (independent from storefront language)
alter table public.profiles add column if not exists dashboard_language text not null default 'fr' check (dashboard_language in ('fr','ar','en'));
alter table public.profiles add column if not exists dashboard_language_updated_at timestamptz not null default now();

-- Function to update timestamp
create or replace function public.profiles_dashboard_lang_updated() returns trigger language plpgsql as $$
begin
  new.dashboard_language_updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_dashboard_lang on public.profiles;
create trigger trg_profiles_dashboard_lang before update of dashboard_language on public.profiles
  for each row execute function public.profiles_dashboard_lang_updated();
