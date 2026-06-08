
  create table "public"."dimensions" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "display_order" integer not null,
    "color" text
      );


alter table "public"."dimensions" enable row level security;


  create table "public"."questions" (
    "id" uuid not null default gen_random_uuid(),
    "dimension_id" uuid not null,
    "text" text not null,
    "display_order" integer not null
      );


alter table "public"."questions" enable row level security;


  create table "public"."respondents" (
    "id" uuid not null default gen_random_uuid(),
    "session_id" uuid not null,
    "name" text not null,
    "email" text not null,
    "completed" boolean default false,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."respondents" enable row level security;


  create table "public"."responses" (
    "id" uuid not null default gen_random_uuid(),
    "respondent_id" uuid not null,
    "question_id" uuid not null,
    "value" integer not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."responses" enable row level security;


  create table "public"."sessions" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."sessions" enable row level security;

CREATE UNIQUE INDEX dimensions_display_order_key ON public.dimensions USING btree (display_order);

CREATE UNIQUE INDEX dimensions_pkey ON public.dimensions USING btree (id);

CREATE UNIQUE INDEX questions_dimension_id_display_order_key ON public.questions USING btree (dimension_id, display_order);

CREATE UNIQUE INDEX questions_pkey ON public.questions USING btree (id);

CREATE UNIQUE INDEX respondents_pkey ON public.respondents USING btree (id);

CREATE UNIQUE INDEX respondents_session_id_email_key ON public.respondents USING btree (session_id, email);

CREATE UNIQUE INDEX responses_pkey ON public.responses USING btree (id);

CREATE UNIQUE INDEX responses_respondent_id_question_id_key ON public.responses USING btree (respondent_id, question_id);

CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);

alter table "public"."dimensions" add constraint "dimensions_pkey" PRIMARY KEY using index "dimensions_pkey";

alter table "public"."questions" add constraint "questions_pkey" PRIMARY KEY using index "questions_pkey";

alter table "public"."respondents" add constraint "respondents_pkey" PRIMARY KEY using index "respondents_pkey";

alter table "public"."responses" add constraint "responses_pkey" PRIMARY KEY using index "responses_pkey";

alter table "public"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "public"."dimensions" add constraint "dimensions_display_order_key" UNIQUE using index "dimensions_display_order_key";

alter table "public"."questions" add constraint "questions_dimension_id_display_order_key" UNIQUE using index "questions_dimension_id_display_order_key";

alter table "public"."questions" add constraint "questions_dimension_id_fkey" FOREIGN KEY (dimension_id) REFERENCES public.dimensions(id) not valid;

alter table "public"."questions" validate constraint "questions_dimension_id_fkey";

alter table "public"."respondents" add constraint "name_length" CHECK (((char_length(name) >= 2) AND (char_length(name) <= 100))) not valid;

alter table "public"."respondents" validate constraint "name_length";

alter table "public"."respondents" add constraint "respondents_session_id_email_key" UNIQUE using index "respondents_session_id_email_key";

alter table "public"."respondents" add constraint "respondents_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) not valid;

alter table "public"."respondents" validate constraint "respondents_session_id_fkey";

alter table "public"."responses" add constraint "responses_question_id_fkey" FOREIGN KEY (question_id) REFERENCES public.questions(id) not valid;

alter table "public"."responses" validate constraint "responses_question_id_fkey";

alter table "public"."responses" add constraint "responses_respondent_id_fkey" FOREIGN KEY (respondent_id) REFERENCES public.respondents(id) not valid;

alter table "public"."responses" validate constraint "responses_respondent_id_fkey";

alter table "public"."responses" add constraint "responses_respondent_id_question_id_key" UNIQUE using index "responses_respondent_id_question_id_key";

alter table "public"."responses" add constraint "responses_value_check" CHECK (((value >= 1) AND (value <= 5))) not valid;

alter table "public"."responses" validate constraint "responses_value_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_respondent_not_completed()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM respondents WHERE id = NEW.respondent_id AND completed = true
  ) THEN
    RAISE EXCEPTION 'El encuestado ya completó la evaluación';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_session_active()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sessions s
    JOIN respondents r ON r.session_id = s.id
    WHERE r.id = NEW.respondent_id AND s.is_active = true
  ) THEN
    RAISE EXCEPTION 'La sesión no está activa';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_session_active_for_respondent()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sessions WHERE id = NEW.session_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'La sesión no está activa';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_session_active_for_response()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM sessions s
    JOIN respondents r ON r.session_id = s.id
    WHERE r.id = NEW.respondent_id AND s.is_active = true
  ) THEN
    RAISE EXCEPTION 'La sesión no está activa';
  END IF;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."dimensions" to "anon";

grant insert on table "public"."dimensions" to "anon";

grant references on table "public"."dimensions" to "anon";

grant select on table "public"."dimensions" to "anon";

grant trigger on table "public"."dimensions" to "anon";

grant truncate on table "public"."dimensions" to "anon";

grant update on table "public"."dimensions" to "anon";

grant delete on table "public"."dimensions" to "authenticated";

grant insert on table "public"."dimensions" to "authenticated";

grant references on table "public"."dimensions" to "authenticated";

grant select on table "public"."dimensions" to "authenticated";

grant trigger on table "public"."dimensions" to "authenticated";

grant truncate on table "public"."dimensions" to "authenticated";

grant update on table "public"."dimensions" to "authenticated";

grant delete on table "public"."dimensions" to "service_role";

grant insert on table "public"."dimensions" to "service_role";

grant references on table "public"."dimensions" to "service_role";

grant select on table "public"."dimensions" to "service_role";

grant trigger on table "public"."dimensions" to "service_role";

grant truncate on table "public"."dimensions" to "service_role";

grant update on table "public"."dimensions" to "service_role";

grant delete on table "public"."questions" to "anon";

grant insert on table "public"."questions" to "anon";

grant references on table "public"."questions" to "anon";

grant select on table "public"."questions" to "anon";

grant trigger on table "public"."questions" to "anon";

grant truncate on table "public"."questions" to "anon";

grant update on table "public"."questions" to "anon";

grant delete on table "public"."questions" to "authenticated";

grant insert on table "public"."questions" to "authenticated";

grant references on table "public"."questions" to "authenticated";

grant select on table "public"."questions" to "authenticated";

grant trigger on table "public"."questions" to "authenticated";

grant truncate on table "public"."questions" to "authenticated";

grant update on table "public"."questions" to "authenticated";

grant delete on table "public"."questions" to "service_role";

grant insert on table "public"."questions" to "service_role";

grant references on table "public"."questions" to "service_role";

grant select on table "public"."questions" to "service_role";

grant trigger on table "public"."questions" to "service_role";

grant truncate on table "public"."questions" to "service_role";

grant update on table "public"."questions" to "service_role";

grant delete on table "public"."respondents" to "anon";

grant insert on table "public"."respondents" to "anon";

grant references on table "public"."respondents" to "anon";

grant select on table "public"."respondents" to "anon";

grant trigger on table "public"."respondents" to "anon";

grant truncate on table "public"."respondents" to "anon";

grant update on table "public"."respondents" to "anon";

grant delete on table "public"."respondents" to "authenticated";

grant insert on table "public"."respondents" to "authenticated";

grant references on table "public"."respondents" to "authenticated";

grant select on table "public"."respondents" to "authenticated";

grant trigger on table "public"."respondents" to "authenticated";

grant truncate on table "public"."respondents" to "authenticated";

grant update on table "public"."respondents" to "authenticated";

grant delete on table "public"."respondents" to "service_role";

grant insert on table "public"."respondents" to "service_role";

grant references on table "public"."respondents" to "service_role";

grant select on table "public"."respondents" to "service_role";

grant trigger on table "public"."respondents" to "service_role";

grant truncate on table "public"."respondents" to "service_role";

grant update on table "public"."respondents" to "service_role";

grant delete on table "public"."responses" to "anon";

grant insert on table "public"."responses" to "anon";

grant references on table "public"."responses" to "anon";

grant select on table "public"."responses" to "anon";

grant trigger on table "public"."responses" to "anon";

grant truncate on table "public"."responses" to "anon";

grant update on table "public"."responses" to "anon";

grant delete on table "public"."responses" to "authenticated";

grant insert on table "public"."responses" to "authenticated";

grant references on table "public"."responses" to "authenticated";

grant select on table "public"."responses" to "authenticated";

grant trigger on table "public"."responses" to "authenticated";

grant truncate on table "public"."responses" to "authenticated";

grant update on table "public"."responses" to "authenticated";

grant delete on table "public"."responses" to "service_role";

grant insert on table "public"."responses" to "service_role";

grant references on table "public"."responses" to "service_role";

grant select on table "public"."responses" to "service_role";

grant trigger on table "public"."responses" to "service_role";

grant truncate on table "public"."responses" to "service_role";

grant update on table "public"."responses" to "service_role";

grant delete on table "public"."sessions" to "anon";

grant insert on table "public"."sessions" to "anon";

grant references on table "public"."sessions" to "anon";

grant select on table "public"."sessions" to "anon";

grant trigger on table "public"."sessions" to "anon";

grant truncate on table "public"."sessions" to "anon";

grant update on table "public"."sessions" to "anon";

grant delete on table "public"."sessions" to "authenticated";

grant insert on table "public"."sessions" to "authenticated";

grant references on table "public"."sessions" to "authenticated";

grant select on table "public"."sessions" to "authenticated";

grant trigger on table "public"."sessions" to "authenticated";

grant truncate on table "public"."sessions" to "authenticated";

grant update on table "public"."sessions" to "authenticated";

grant delete on table "public"."sessions" to "service_role";

grant insert on table "public"."sessions" to "service_role";

grant references on table "public"."sessions" to "service_role";

grant select on table "public"."sessions" to "service_role";

grant trigger on table "public"."sessions" to "service_role";

grant truncate on table "public"."sessions" to "service_role";

grant update on table "public"."sessions" to "service_role";


  create policy "dimensions_read"
  on "public"."dimensions"
  as permissive
  for select
  to public
using (true);



  create policy "questions_read"
  on "public"."questions"
  as permissive
  for select
  to public
using (true);



  create policy "respondents_delete_admin"
  on "public"."respondents"
  as permissive
  for delete
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "respondents_insert"
  on "public"."respondents"
  as permissive
  for insert
  to public
with check (true);



  create policy "respondents_read"
  on "public"."respondents"
  as permissive
  for select
  to public
using (true);



  create policy "respondents_update"
  on "public"."respondents"
  as permissive
  for update
  to public
using (true);



  create policy "responses_delete_admin"
  on "public"."responses"
  as permissive
  for delete
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "responses_insert"
  on "public"."responses"
  as permissive
  for insert
  to public
with check (true);



  create policy "responses_read"
  on "public"."responses"
  as permissive
  for select
  to public
using (true);



  create policy "responses_update"
  on "public"."responses"
  as permissive
  for update
  to public
using (true);



  create policy "sessions_delete_admin"
  on "public"."sessions"
  as permissive
  for delete
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "sessions_insert_admin"
  on "public"."sessions"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "sessions_read"
  on "public"."sessions"
  as permissive
  for select
  to public
using (true);



  create policy "sessions_update_admin"
  on "public"."sessions"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));


CREATE TRIGGER ensure_session_active_for_respondent BEFORE INSERT ON public.respondents FOR EACH ROW EXECUTE FUNCTION public.check_session_active_for_respondent();

CREATE TRIGGER ensure_respondent_not_completed BEFORE INSERT ON public.responses FOR EACH ROW EXECUTE FUNCTION public.check_respondent_not_completed();

CREATE TRIGGER ensure_session_active_for_response BEFORE INSERT ON public.responses FOR EACH ROW EXECUTE FUNCTION public.check_session_active_for_response();


