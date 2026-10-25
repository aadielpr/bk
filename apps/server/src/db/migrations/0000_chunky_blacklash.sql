CREATE TYPE "public"."user_role" AS ENUM('owner', 'operator', 'super_admin');--> statement-breakpoint
CREATE TABLE "coop_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"coop_id" integer NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coops" (
	"id" serial PRIMARY KEY NOT NULL,
	"farm_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"farm_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_farm_id_matches_role" CHECK ((("users"."role" = 'super_admin') AND "users"."farm_id" IS NULL) OR (("users"."role" <> 'super_admin') AND "users"."farm_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "coop_assignments" ADD CONSTRAINT "coop_assignments_coop_id_coops_id_fk" FOREIGN KEY ("coop_id") REFERENCES "public"."coops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coop_assignments" ADD CONSTRAINT "coop_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coops" ADD CONSTRAINT "coops_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coop_assignments_coop_user_idx" ON "coop_assignments" USING btree ("coop_id","user_id");