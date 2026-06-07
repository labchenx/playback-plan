import type { GameItem } from '../services/gameApi';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateStart(value?: string): number | null {
  if (!value) return null;

  const time = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(time) ? time : null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calcPurchaseTotal(game: Pick<GameItem, 'purchasePrice' | 'purchaseShippingFee' | 'purchaseOtherFee'>): number {
  return roundMoney(game.purchasePrice + (game.purchaseShippingFee ?? 0) + (game.purchaseOtherFee ?? 0));
}

export function calcSellNetAmount(
  game: Pick<GameItem, 'soldPrice' | 'sellShippingFee' | 'sellPlatformFee' | 'sellOtherFee'>
): number | null {
  if (game.soldPrice == null) return null;

  return roundMoney(
    game.soldPrice - (game.sellShippingFee ?? 0) - (game.sellPlatformFee ?? 0) - (game.sellOtherFee ?? 0)
  );
}

export function calcFinalCost(purchaseTotal: number, sellNetAmount: number | null): number | null {
  if (sellNetAmount == null) return null;
  return roundMoney(purchaseTotal - sellNetAmount);
}

export function calcPlayIndex(purchaseTotal: number, sellNetAmount: number | null): number | null {
  if (purchaseTotal <= 0 || sellNetAmount == null) return null;
  return Math.round((sellNetAmount / purchaseTotal) * 100);
}

export function getPlayIndexLevel(playIndex: number | null): string {
  if (playIndex == null) return '未生成';
  if (playIndex >= 120) return '血赚玩家';
  if (playIndex >= 110) return '神级白玩';
  if (playIndex >= 100) return '倒赚游玩';
  if (playIndex >= 95) return '几乎白玩';
  if (playIndex >= 80) return '小亏体验';
  if (playIndex >= 60) return '正常回血';
  return '回血失败';
}

export function calcHoldingDays(purchaseDate: string, endDate?: string): number {
  const start = parseDateStart(purchaseDate);
  if (start == null) return 0;

  const now = new Date();
  const fallbackEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = parseDateStart(endDate) ?? fallbackEnd;

  return Math.max(Math.floor((end - start) / DAY_MS), 0);
}
