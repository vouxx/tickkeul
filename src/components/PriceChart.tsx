interface Props {
  before: number[];
  after?: number[];
}

const W = 640;
const H = 220;
const PAD = { t: 16, r: 12, b: 24, l: 12 };

/** 공시 전(회색) + 공시 후(상승 빨강/하락 파랑) 종가 라인 차트 */
export function PriceChart({ before, after }: Props) {
  const all = after ? [...before, ...after] : before;
  // 결과 공개 전에도 x축 폭은 고정해서, 공개 순간 차트가 '이어지는' 느낌을 준다
  const total = before.length + 20;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;

  const x = (i: number) => PAD.l + (i / (total - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b);
  const path = (vals: number[], offset: number) =>
    vals.map((v, i) => `${i ? "L" : "M"}${x(i + offset).toFixed(1)},${y(v).toFixed(1)}`).join("");

  const base = before[before.length - 1];
  const cut = before.length - 1;
  const up = after ? after[after.length - 1] >= base : true;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="주가 차트">
      <line x1={PAD.l} x2={W - PAD.r} y1={y(base)} y2={y(base)} stroke="var(--line)" strokeDasharray="4 4" />
      <line x1={x(cut)} x2={x(cut)} y1={PAD.t} y2={H - PAD.b} stroke="var(--muted)" strokeDasharray="2 3" />
      <text x={x(cut)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--muted)">
        공시일
      </text>
      <path d={path(before, 0)} fill="none" stroke="var(--fg)" strokeOpacity={after ? 0.35 : 1} strokeWidth={2} />
      {after ? (
        <path
          d={path([base, ...after], cut)}
          fill="none"
          stroke={up ? "var(--up)" : "var(--down)"}
          strokeWidth={2.5}
        />
      ) : (
        <>
          <rect x={x(cut) + 4} y={PAD.t} width={W - PAD.r - x(cut) - 4} height={H - PAD.t - PAD.b} rx={8} fill="var(--line)" opacity={0.45} />
          <text x={(x(cut) + W - PAD.r) / 2} y={H / 2} textAnchor="middle" fontSize="14" fill="var(--muted)">
            ?
          </text>
        </>
      )}
      <circle cx={x(cut)} cy={y(base)} r={4} fill="var(--fg)" />
    </svg>
  );
}
