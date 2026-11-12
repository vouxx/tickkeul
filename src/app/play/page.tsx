import { Suspense } from "react";
import { Play } from "@/components/Play";

async function PlayWithParams({ searchParams }: Pick<PageProps<"/play">, "searchParams">) {
  const { id } = await searchParams;
  return <Play id={typeof id === "string" ? id : undefined} />;
}

export default function PlayPage({ searchParams }: PageProps<"/play">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" />}>
      <PlayWithParams searchParams={searchParams} />
    </Suspense>
  );
}
