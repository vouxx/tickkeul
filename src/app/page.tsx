import { BackupBanner } from "@/components/Account";
import { DailyGoal, LearnPath, TodayTerm } from "@/components/LearnPath";
import { LevelPrompt } from "@/components/Level";

export default function Home() {
  return (
    <div className="flex flex-col gap-5">
      <LevelPrompt />
      <DailyGoal />
      <BackupBanner />
      <LearnPath />
      <TodayTerm />
    </div>
  );
}
