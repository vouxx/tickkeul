import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonGate } from "@/components/Gate";
import { LessonPlayer } from "@/components/LessonPlayer";
import { allLessons, getLesson } from "@/data/course";
import { qKey } from "@/lib/course-types";

export function generateStaticParams() {
  return allLessons.map((l) => ({ id: l.id }));
}

async function LessonContent({ params }: Pick<PageProps<"/lesson/[id]">, "params">) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();

  const items = lesson.questions.map((q, i) => ({ q, key: qKey(lesson.id, i) }));
  return (
    <LessonGate lessonId={lesson.id}>
      <LessonPlayer
        key={lesson.id}
        items={items}
        lessonId={lesson.id}
        title={`${lesson.unit.title} · ${lesson.title}`}
      />
    </LessonGate>
  );
}

export default function LessonPage({ params }: PageProps<"/lesson/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-card" />}>
      <LessonContent params={params} />
    </Suspense>
  );
}
