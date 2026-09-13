import { ImageResponse } from "next/og";
import { AppIcon } from "@/components/AppIcon";

const SIZES = [192, 512];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

export async function GET(_request: Request, ctx: RouteContext<"/icons/[size]">) {
  const size = Number((await ctx.params).size);
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });
  return new ImageResponse(<AppIcon size={size} />, { width: size, height: size });
}
