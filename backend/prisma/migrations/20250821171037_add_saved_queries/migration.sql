-- CreateTable
CREATE TABLE "public"."saved_queries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "visualization_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "saved_queries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."saved_queries" ADD CONSTRAINT "saved_queries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
