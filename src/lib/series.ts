/** 시드 고정 난수 — 같은 문제는 항상 같은 차트가 나오도록 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const round = (p: number) => {
  // 호가 단위 흉내: 1만 원 이상은 50원, 미만은 10원 단위
  const tick = p >= 10000 ? 50 : 10;
  return Math.round(p / tick) * tick;
};

/**
 * 공시 전 60거래일 종가. `trend`는 60일 누적 수익률(예: 0.2 = +20%).
 */
export function makeBefore(seed: number, last: number, trend: number, vol = 0.018): number[] {
  const rand = mulberry32(seed);
  const n = 60;
  const drift = Math.log(1 + trend) / n;
  const logs: number[] = [0];
  for (let i = 1; i < n; i++) logs.push(logs[i - 1] + drift + vol * gauss(rand));
  // 마지막 값이 정확히 `last`가 되도록 평행이동
  const shift = Math.log(last) - logs[n - 1];
  return logs.map((l) => round(Math.exp(l + shift)));
}

/**
 * 공시 후 20거래일 종가. d1/d5/d20 시점 수익률을 정확히 맞추고 사이는 노이즈로 채운다.
 */
export function makeAfter(
  seed: number,
  base: number,
  targets: { d1: number; d5: number; d20: number },
  vol = 0.012,
): number[] {
  const rand = mulberry32(seed * 7919);
  const points: [number, number][] = [
    [0, 0],
    [1, Math.log(1 + targets.d1)],
    [5, Math.log(1 + targets.d5)],
    [20, Math.log(1 + targets.d20)],
  ];
  const out: number[] = [];
  for (let day = 1; day <= 20; day++) {
    const seg = points.findIndex(([d]) => d >= day);
    const [d0, l0] = points[seg - 1];
    const [d1, l1] = points[seg];
    const t = (day - d0) / (d1 - d0);
    // 다리(bridge) 노이즈: 구간 끝점에서는 0
    const noise = d1 === day ? 0 : vol * gauss(rand) * Math.sin(Math.PI * t);
    out.push(round(base * Math.exp(l0 + (l1 - l0) * t + noise)));
  }
  return out;
}

/**
 * 교육용 차트: 기준점(shape)을 같은 간격으로 놓고 그 사이를 노이즈로 채운다.
 * 노이즈는 기준선으로 되돌아오는(평균회귀) 형태라 모양이 유지된다.
 */
export function makeShaped(seed: number, shape: number[], days = 80, vol = 0.012): number[] {
  const rand = mulberry32(seed);
  const out: number[] = [];
  let noise = 0;
  for (let i = 0; i < days; i++) {
    const t = (i / (days - 1)) * (shape.length - 1);
    const k = Math.min(Math.floor(t), shape.length - 2);
    const f = t - k;
    // 기준점 사이는 부드럽게(코사인) 보간
    const w = (1 - Math.cos(Math.PI * f)) / 2;
    const base = shape[k] * (1 - w) + shape[k + 1] * w;
    noise = noise * 0.75 + vol * gauss(rand);
    out.push(base * (1 + noise));
  }
  return out;
}

export function movingAverage(values: number[], n: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < n - 1) return null;
    let s = 0;
    for (let j = i - n + 1; j <= i; j++) s += values[j];
    return s / n;
  });
}
