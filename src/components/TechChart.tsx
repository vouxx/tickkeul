import { useMemo } from "react";
import type { ChartQ } from "@/lib/course-types";
import { makeShaped, movingAverage } from "@/lib/series";

const W = 640;
const H = 240;
const VOL_H = 50;
const PAD = { t: 12, r: 8, b: 8, l: 8 };

const MA_STYLE = {
  ma5: { n: 5, color: "#f59f00", label: "5일선" },
  ma20: { n: 20, color: "#7048e8", label: "20일선" },
  ma60: { n: 60, color: "#12b886", label: "60일선" },
} as const;

/** 교육용 차트: 종가 라인 + 이동평균선 + 지지·저항선 + 거래량 */
export function TechChart({ q }: { q: ChartQ }) {
  const days = q.days ?? 80;
  const prices = useMemo(() => makeShaped(q.seed, q.shape, days, q.vol), [q, days]);
  const volumes = useMemo(
    () => (q.volume ? makeShaped(q.seed + 99, q.volume, days, 0.15).map((v) => Math.max(v, 0)) : null),
    [q, days],
  );

  const lineVals = (q.lines ?? []).map((l) => l.value);
  const min = Math.min(...prices, ...lineVals) * 0.98;
  const max = Math.max(...prices, ...lineVals) * 1.02;
  const priceH = H - (volumes ? VOL_H + 8 : 0);

  const x = (i: number) => PAD.l + (i / (days - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (priceH - PAD.t - PAD.b);
  const path = (vals: (number | null)[]) =>
    vals
      .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
      .reduce<string>((acc, pt, i, arr) => (pt === null ? acc : acc + (arr[i - 1] == null ? "M" : "L") + pt), "");

  const up = prices[prices.length - 1] >= prices[0];
  const vMax = volumes ? Math.max(...volumes) : 1;
  const barW = (W - PAD.l - PAD.r) / days - 1;

  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="연습용 주가 차트">
        {(q.lines ?? []).map((l) => (
          <g key={l.label}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(l.value)} y2={y(l.value)} stroke="var(--muted)" strokeDasharray="6 4" />
            <text x={W - PAD.r - 4} y={y(l.value) - 6} textAnchor="end" fontSize="13" fill="var(--muted)">
              {l.label}
            </text>
          </g>
        ))}
        <path d={path(prices)} fill="none" stroke={up ? "var(--up)" : "var(--down)"} strokeWidth={2.2} />
        {(q.overlays ?? []).map((o) => (
          <path
            key={o}
            d={path(movingAverage(prices, MA_STYLE[o].n))}
            fill="none"
            stroke={MA_STYLE[o].color}
            strokeWidth={2}
            strokeOpacity={0.9}
          />
        ))}
        {volumes &&
          volumes.map((v, i) => {
            const h = (v / vMax) * VOL_H;
            const rising = i === 0 || prices[i] >= prices[i - 1];
            return (
              <rect
                key={i}
                x={x(i) - barW / 2}
                y={H - h}
                width={Math.max(barW, 1)}
                height={h}
                fill={rising ? "var(--up)" : "var(--down)"}
                opacity={0.5}
              />
            );
          })}
      </svg>
      {(q.overlays?.length || volumes) && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
          <span>
            <span className={up ? "text-up" : "text-down"}>━</span> 종가
          </span>
          {(q.overlays ?? []).map((o) => (
            <span key={o}>
              <span style={{ color: MA_STYLE[o].color }}>━</span> {MA_STYLE[o].label}
            </span>
          ))}
          {volumes && <span>▮ 거래량</span>}
        </div>
      )}
    </div>
  );
}

/** 양봉·음봉 설명 그림 */
export function CandleFigure() {
  const candle = (cx: number, color: string, bodyTop: number, bodyBottom: number, top: string, bottom: string, title: string) => (
    <g>
      <line x1={cx} x2={cx} y1={20} y2={180} stroke={color} strokeWidth={3} />
      <rect x={cx - 26} y={bodyTop} width={52} height={bodyBottom - bodyTop} rx={3} fill={color} />
      <text x={cx + 40} y={24} fontSize="13" fill="var(--muted)">고가</text>
      <text x={cx + 40} y={bodyTop + 5} fontSize="13" fill="var(--fg)">{top}</text>
      <text x={cx + 40} y={bodyBottom + 5} fontSize="13" fill="var(--fg)">{bottom}</text>
      <text x={cx + 40} y={184} fontSize="13" fill="var(--muted)">저가</text>
      <text x={cx} y={210} textAnchor="middle" fontSize="15" fontWeight="700" fill={color}>{title}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 360 220" className="mx-auto mt-4 h-auto w-full max-w-sm" role="img" aria-label="양봉과 음봉 구조">
      {candle(70, "var(--up)", 60, 140, "종가", "시가", "양봉 (상승)")}
      {candle(250, "var(--down)", 60, 140, "시가", "종가", "음봉 (하락)")}
    </svg>
  );
}
