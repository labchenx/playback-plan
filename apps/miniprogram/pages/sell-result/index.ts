import { type GameItem, gameApi } from '../../services/gameApi';
import {
  calcFinalCost,
  calcHoldingDays,
  calcPlayIndex,
  calcPurchaseTotal,
  calcSellNetAmount,
  getPlayIndexLevel
} from '../../utils/gameCalculations';

type ResultTone = 'profit' | 'free' | 'cost';

type ResultView = {
  id: string;
  name: string;
  platformText: string;
  platformClass: string;
  coverUrl: string;
  hasCover: boolean;
  mediaTypeText: string;
  statusText: string;
  holdingDays: number;
  holdingDaysText: string;
  purchaseTotalText: string;
  sellNetAmountText: string;
  finalCostText: string;
  finalCostValueText: string;
  finalCostLabel: string;
  resultTone: ResultTone;
  playIndexText: string;
  playLevelText: string;
  summaryLineBefore: string;
  summaryAmountText: string;
  summaryLineAfter: string;
};

const platformTextMap: Record<GameItem['platform'], string> = {
  NS1: 'NS1',
  NS2: 'NS2',
  PS5: 'PS5',
  OTHER: '其他'
};

function formatAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '¥0';
  return Number.isInteger(value) ? `¥${value}` : `¥${value.toFixed(2)}`;
}

function getResultTone(finalCost: number | null): ResultTone {
  if (finalCost == null || finalCost > 0) return 'cost';
  if (finalCost === 0) return 'free';
  return 'profit';
}

function getFinalCostText(finalCost: number | null): string {
  if (finalCost == null) return '未生成';
  if (finalCost < 0) return `倒赚 ${formatAmount(Math.abs(finalCost))}`;
  if (finalCost === 0) return '0 成本玩完';
  return `最终花了 ${formatAmount(finalCost)}`;
}

function getFinalCostLabel(finalCost: number | null): string {
  if (finalCost == null || finalCost > 0) return '最终花费';
  if (finalCost === 0) return '0 成本';
  return '倒赚';
}

function getFinalCostValueText(finalCost: number | null): string {
  if (finalCost == null) return '--';
  if (finalCost < 0) return `+${formatAmount(Math.abs(finalCost))}`;
  if (finalCost === 0) return '0';
  return formatAmount(finalCost);
}

function getSummaryText(finalCost: number | null, holdingDays: number): Pick<ResultView, 'summaryLineBefore' | 'summaryAmountText' | 'summaryLineAfter'> {
  if (finalCost == null) {
    return {
      summaryLineBefore: '卖出结果正在生成，',
      summaryAmountText: '',
      summaryLineAfter: '请稍后再看看。'
    };
  }

  if (finalCost < 0) {
    return {
      summaryLineBefore: '这款游戏你不但玩到了，还多回了 ',
      summaryAmountText: formatAmount(Math.abs(finalCost)),
      summaryLineAfter: '。'
    };
  }

  if (finalCost === 0) {
    return {
      summaryLineBefore: '这款游戏基本 ',
      summaryAmountText: '0 成本',
      summaryLineAfter: '玩完。'
    };
  }

  return {
    summaryLineBefore: `你持有了 ${holdingDays} 天，最后只花 `,
    summaryAmountText: formatAmount(finalCost),
    summaryLineAfter: '玩完。'
  };
}

function toResultView(game: GameItem): ResultView {
  const purchaseTotal = calcPurchaseTotal(game);
  const sellNetAmount = calcSellNetAmount(game);
  const finalCost = calcFinalCost(purchaseTotal, sellNetAmount);
  const playIndex = calcPlayIndex(purchaseTotal, sellNetAmount);
  const holdingDays = calcHoldingDays(game.purchaseDate, game.soldDate);
  const summaryText = getSummaryText(finalCost, holdingDays);

  return {
    id: game.id,
    name: game.name,
    platformText: platformTextMap[game.platform],
    platformClass: game.platform === 'PS5' ? 'platform-blue' : 'platform-red',
    coverUrl: game.coverUrl || '',
    hasCover: Boolean(game.coverUrl),
    mediaTypeText: '实体版',
    statusText: '已出售',
    holdingDays,
    holdingDaysText: `持有了 ${holdingDays} 天`,
    purchaseTotalText: formatAmount(purchaseTotal),
    sellNetAmountText: formatAmount(sellNetAmount),
    finalCostText: getFinalCostText(finalCost),
    finalCostValueText: getFinalCostValueText(finalCost),
    finalCostLabel: getFinalCostLabel(finalCost),
    resultTone: getResultTone(finalCost),
    playIndexText: playIndex == null ? '--' : `${playIndex}`,
    playLevelText: getPlayIndexLevel(playIndex),
    ...summaryText
  };
}

Page({
  data: {
    id: '',
    isLoading: true,
    notFound: false,
    blockedMessage: '',
    result: null as ResultView | null
  },

  onLoad(query: { id?: string }) {
    const id = query.id || '';
    this.setData({ id });
    this.loadResult(id);
  },

  loadResult(id: string) {
    this.setData({ isLoading: true, notFound: false, blockedMessage: '', result: null });

    const game = id ? gameApi.getGameById(id) : undefined;

    if (!game) {
      this.setData({
        isLoading: false,
        notFound: true
      });
      return;
    }

    if (game.mediaType !== 'physical') {
      this.showBlockedAndReturn(game.id, '数字版游戏不生成卖出结果');
      return;
    }

    if (game.status !== 'sold') {
      this.showBlockedAndReturn(game.id, '这款实体版游戏还没有完成卖出');
      return;
    }

    this.setData({
      isLoading: false,
      result: toResultView(game)
    });
  },

  showBlockedAndReturn(id: string, message: string) {
    wx.showToast({ title: message, icon: 'none' });
    this.setData({
      isLoading: false,
      blockedMessage: message
    });

    setTimeout(() => {
      wx.redirectTo({ url: `/pages/game-detail/index?id=${id}` });
    }, 1000);
  },

  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }

    this.onViewDetail();
  },

  onClose() {
    this.onComplete();
  },

  onComplete() {
    wx.switchTab({ url: '/pages/library/index' });
  },

  onReturnLibrary() {
    wx.switchTab({ url: '/pages/library/index' });
  },

  onViewDetail() {
    const id = this.data.id;
    if (!id) {
      wx.switchTab({ url: '/pages/library/index' });
      return;
    }

    wx.redirectTo({ url: `/pages/game-detail/index?id=${id}` });
  },

  onContinueSell() {
    wx.switchTab({ url: '/pages/library/index' });
  }
});
