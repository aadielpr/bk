CREATE TYPE "user_role" AS ENUM('owner', 'operator', 'super_admin');--> statement-breakpoint
CREATE TABLE "coop_assignments" (
	"id" serial PRIMARY KEY,
	"coop_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"c_at" timestamp with time zone DEFAULT now() NOT NULL,
	"u_at" timestamp with time zone,
	"d_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "coops" (
	"id" serial PRIMARY KEY,
	"farm_id" integer NOT NULL,
	"name" text NOT NULL,
	"c_at" timestamp with time zone DEFAULT now() NOT NULL,
	"u_at" timestamp with time zone,
	"d_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"c_at" timestamp with time zone DEFAULT now() NOT NULL,
	"u_at" timestamp with time zone,
	"d_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"farm_id" integer,
	"c_at" timestamp with time zone DEFAULT now() NOT NULL,
	"u_at" timestamp with time zone,
	"d_at" timestamp with time zone,
	CONSTRAINT "users_farm_id_matches_role" CHECK ((("role" = 'super_admin') AND "farm_id" IS NULL) OR (("role" <> 'super_admin') AND "farm_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "coop_assignments_coop_user_live_idx" ON "coop_assignments" ("coop_id","user_id") WHERE "d_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_live_idx" ON "users" ("username") WHERE "d_at" IS NULL;--> statement-breakpoint
ALTER TABLE "coop_assignments" ADD CONSTRAINT "coop_assignments_coop_id_coops_id_fkey" FOREIGN KEY ("coop_id") REFERENCES "coops"("id");--> statement-breakpoint
ALTER TABLE "coop_assignments" ADD CONSTRAINT "coop_assignments_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "coops" ADD CONSTRAINT "coops_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_farm_id_farms_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "farms"("id");