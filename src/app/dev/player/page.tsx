import { notFound } from "next/navigation";
import { questions } from "@/content/bank";
import { Player } from "@/components/Player";

// Local-only preview of the child screens with no sign-in and no saving. Returns 404 in production.
export default async function DevPlayerPage({ searchParams }: PageProps<"/dev/player">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { ids } = await searchParams;
  const selected = typeof ids === "string" ? ids.split(",").flatMap((id) => questions.filter((q) => q.id === id)) : questions.slice(0, 8);
  return <Player student={{ id: "preview", name: "Aishik", avatar: "🏎️" }} questions={selected} save={false} />;
}
