import { headers } from "next/headers";
import { ImageResponse } from "next/og";
export const runtime = "edge";
export default async function OpenGraphImage(props: {
  params: { doc_id: string };
}) {
  if (process.env.NODE_ENV === "development") return;
  const headersList = headers();
  const hostname = headersList.get("x-forwarded-host");
  let protocol = headersList.get("x-forwarded-proto");
  let path = `${protocol}://${hostname}/${props.params.doc_id}`;
  let startTime = Date.now();
  console.log("starting fetch");
  let response = await fetch(
    `https://pro.microlink.io/?url=${path}&screenshot=true&&viewport.width=1200&viewport.height=630&meta=false&embed=screenshot.url`,
    {
      headers: {
        "x-api-key": process.env.MICROLINK_API_KEY!,
      },
    },
  );
  let endTime = Date.now();
  console.log(`fetched in ${(endTime - startTime) / 1000} seconds`);
  return response;
}
