import type { GameItem, GameStatus } from '../services/gameApi';

export type PaybackStatus = 'finished' | 'abandoned' | 'to_payback' | 'selling';

export const PAYBACK_STATUSES: PaybackStatus[] = ['finished', 'abandoned', 'to_payback', 'selling'];

export const PAYBACK_REASON_TEXT: Record<PaybackStatus, string> = {
  finished: '已通关，可以考虑卖掉回血',
  abandoned: '已弃坑，可以考虑处理',
  to_payback: '你已标记准备处理',
  selling: '正在出售中，记得记录成交'
};

export function isPaybackStatus(status: GameStatus): status is PaybackStatus {
  return PAYBACK_STATUSES.includes(status as PaybackStatus);
}

export function isPaybackCandidate(game: GameItem): game is GameItem & { status: PaybackStatus } {
  return game.mediaType === 'physical' && isPaybackStatus(game.status);
}
