import { Replicache } from "replicache";
import { ReplicacheMutators } from "../replicache";
import { supabaseBrowserClient } from "../supabase/browserClient";

export async function addImage(
  file: File,
  rep: Replicache<ReplicacheMutators>,
  args: { parent: string; position: string },
) {
  let client = supabaseBrowserClient();
  let cache = await caches.open("minilink-user-assets");
  let fileID = crypto.randomUUID();
  let url = client.storage.from("minilink-user-assets").getPublicUrl(fileID)
    .data.publicUrl;
  let dimensions = await getImageDimensions(file);
  await cache.put(
    url,
    new Response(file, {
      headers: {
        "Content-Type": file.type,
        "Content-Length": file.size.toString(),
      },
    }),
  );
  let newBlockEntity = crypto.randomUUID();
  await rep.mutate.addBlock({
    type: "image",
    parent: args.parent,
    position: args.position,
    newEntityID: newBlockEntity,
  });
  await rep.mutate.assertFact({
    entity: newBlockEntity,
    attribute: "block/image",
    data: {
      type: "image",
      src: url,
      height: dimensions.height,
      width: dimensions.width,
    },
  });
  await client.storage.from("minilink-user-assets").upload(fileID, file);
}

function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  let url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };
    img.onerror = reject;
    img.src = url;
  });
}
