"use server";

import { sql, and, eq, like, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  entities,
  entity_sets,
  facts,
  permission_token_rights,
  permission_tokens,
} from "drizzle/schema";
import postgres from "postgres";
import { ThemeAttributes } from "src/replicache/attributes";
import { serverMutationContext } from "src/replicache/serverMutationContext";
import { v7 } from "uuid";

const client = postgres(process.env.DB_URL as string, { idle_timeout: 5 });
const db = drizzle(client);
export async function action() {
  await db.transaction(async (tx) => {
    let all_tokens = await tx
      .select({ root_entity: permission_tokens.root_entity })
      .from(permission_tokens);
    let unique_roots = all_tokens.reduce((acc, token) => {
      if (!acc.includes(token.root_entity)) acc.push(token.root_entity);
      return acc;
    }, [] as string[]);
    console.log(unique_roots.length);
    let i = 0;
    let batch_size = 100;
    while (i < unique_roots.length - batch_size) {
      console.log(
        `Processing batch ${i / batch_size + 1} of ${Math.ceil(unique_roots.length / batch_size)}`,
      );
      let batch = unique_roots.slice(i, i + batch_size);
      await Promise.all(
        batch.map(async (old_root) => {
          let [existing_entity] = await tx
            .select({ set: entities.set })
            .from(entities)
            .where(eq(entities.id, old_root));

          if (!existing_entity)
            throw new Error("Expected to find entity: " + old_root);
          let [rootpagefact] = await tx
            .select({})
            .from(facts)
            .where(
              and(eq(facts.entity, old_root), eq(facts.attribute, "root/page")),
            );
          if (rootpagefact) {
            console.log("already has root page");
            return;
          }
          let new_root = v7();
          let [entity] = await tx
            .insert(entities)
            // And add it to that permission set
            .values({ set: existing_entity.set, id: new_root })
            .returning();
          await tx.insert(facts).values([
            {
              id: v7(),
              entity: new_root,
              attribute: "root/page",
              data: sql`${{ type: "ordered-reference", value: old_root, position: "a0" }}`,
            },
          ]);
          await tx
            .update(facts)
            .set({ entity: new_root })
            .where(
              and(
                eq(facts.entity, old_root),
                inArray(facts.attribute, Object.keys(ThemeAttributes)),
              ),
            );
          await tx
            .update(permission_tokens)
            .set({ root_entity: new_root })
            .where(eq(permission_tokens.root_entity, old_root));
        }),
      );
      i = i + batch_size;
    }
  });
  console.log("done");
}
