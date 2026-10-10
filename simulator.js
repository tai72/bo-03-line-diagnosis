// 売上シミュレーションの計算と表示用フォーマット。
// 来院1件あたりの広告費（デモ用の仮定値）
export const COST_PER_VISIT = 15000;

const yen = new Intl.NumberFormat('ja-JP');

export function simulate({ adBudget, closeRate, unitPrice }) {
  const visits = adBudget / COST_PER_VISIT;
  const deals = visits * (closeRate / 100);
  return { adBudget, closeRate, unitPrice, visits, deals, sales: deals * unitPrice };
}

export const format = {
  yen: (value) => `${yen.format(Math.round(value))}円`,
  manYen: (value) => `約${yen.format(Math.max(0, Math.round(value / 10000)))}万円`,
  people: (value) => `約${Math.max(0, Math.round(value))}人`,
  percent: (value) => `${value}%`,
};
