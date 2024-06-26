import { drizzle } from "drizzle-orm/postgres-js";
import { entities } from "drizzle/schema";
import { redirect } from "next/navigation";
import postgres from "postgres";
import { Doc } from "./[doc_id]/Doc";
import { UpdateURL } from "components/UpdateURL";
const client = postgres(process.env.DB_URL as string);
const db = drizzle(client);

export const dynamic = "force-dynamic";

export default async function RootPage() {
  let rows = await db.insert(entities).values({}).returning();
  return (
    <>
      <UpdateURL url={`/${rows[0].id}`} />
      <Doc doc_id={rows[0].id} initialFacts={[]} />
    </>
  );
}
