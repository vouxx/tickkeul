import {
  ArrowRightLeft,
  Banknote,
  BookOpen,
  BrickWall,
  Brain,
  Building,
  Building2,
  Calculator,
  CalendarClock,
  CalendarDays,
  ChartCandlestick,
  ChartColumn,
  Compass,
  Dices,
  Divide,
  DollarSign,
  Egg,
  FileText,
  Flag,
  Frown,
  Fuel,
  Gem,
  Gift,
  Globe,
  Handshake,
  Hourglass,
  Landmark,
  Medal,
  Megaphone,
  Moon,
  Newspaper,
  Pizza,
  Receipt,
  RefreshCw,
  Repeat,
  Rocket,
  RollerCoaster,
  Ruler,
  Scale,
  Scissors,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Ship,
  ShoppingBasket,
  ShoppingCart,
  Shuffle,
  Siren,
  Sprout,
  Stethoscope,
  Tag,
  Target,
  Telescope,
  Thermometer,
  Timer,
  TrendingDown,
  Users,
  UsersRound,
  Waves,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Level } from "@/data/levels";
import { levelInfo } from "@/data/levels";

/** 코스 데이터(유닛·개념 카드)에서 이름으로 고르는 아이콘 */
export const ICONS: Record<string, LucideIcon> = {
  ArrowRightLeft,
  Banknote,
  BookOpen,
  BrickWall,
  Brain,
  Building,
  Building2,
  Calculator,
  CalendarClock,
  CalendarDays,
  ChartCandlestick,
  ChartColumn,
  Compass,
  Dices,
  Divide,
  DollarSign,
  Egg,
  FileText,
  Flag,
  Frown,
  Fuel,
  Gift,
  Globe,
  Handshake,
  Hourglass,
  Landmark,
  Medal,
  Megaphone,
  Moon,
  Newspaper,
  Pizza,
  Receipt,
  RefreshCw,
  Repeat,
  Rocket,
  RollerCoaster,
  Ruler,
  Scale,
  Scissors,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Ship,
  ShoppingBasket,
  ShoppingCart,
  Shuffle,
  Siren,
  Sprout,
  Stethoscope,
  Tag,
  Target,
  Telescope,
  Thermometer,
  Timer,
  TrendingDown,
  Users,
  UsersRound,
  Waves,
  Wrench,
};

export function NamedIcon({ name, className, size = 24 }: { name: string; className?: string; size?: number }) {
  const Icon = ICONS[name] ?? BookOpen;
  return <Icon className={className} size={size} strokeWidth={2} aria-hidden="true" />;
}

/** 레벨 배지: 브론즈·실버·골드는 메달, 다이아는 보석 */
export function LevelIcon({ level, size = 20, className }: { level: Level; size?: number; className?: string }) {
  const Icon = level === 4 ? Gem : Medal;
  return <Icon size={size} color={levelInfo(level).color} strokeWidth={2.2} className={className} aria-hidden="true" />;
}

export function LevelBadge({ level, className = "" }: { level: Level; className?: string }) {
  const info = levelInfo(level);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${className}`}
      style={{ color: info.color, background: `color-mix(in oklab, ${info.color} 14%, transparent)` }}
    >
      <LevelIcon level={level} size={13} />
      {info.name}
    </span>
  );
}
