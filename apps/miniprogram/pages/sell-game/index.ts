import { type GameItem, type GameStatus, type SellGameInput, gameApi } from '../../services/gameApi';
import {
  calcFinalCost,
  calcHoldingDays,
  calcPlayIndex,
  calcPurchaseTotal,
  calcSellNetAmount,
  getPlayIndexLevel
} from '../../utils/gameCalculations';

type OptionItem = {
  label: string;
  value: string;
};

type SellGameForm = {
  soldPrice: string;
  soldDate: string;
  sellChannel: string;
  sellShippingFee: string;
  sellPlatformFee: string;
  sellOtherFee: string;
  sellNote: string;
};

type GameSummaryView = {
  id: string;
  name: string;
  platformText: string;
  platformClass: string;
  statusText: string;
  statusVariant: string;
  coverUrl: string;
  hasCover: boolean;
  purchaseTotalText: string;
  holdingDaysText: string;
};

type PreviewView = {
  isReady: boolean;
  purchaseTotalText: string;
  sellNetAmountText: string;
  finalCostText: string;
  finalCostTone: 'brand' | 'success' | 'dark';
  playIndexText: string;
  playLevelText: string;
  helperText: string;
};

type InputEvent = WechatMiniprogram.CustomEvent<{ value: string }>;

const sellChannelOptions: OptionItem[] = [
  { label: '闲鱼', value: '闲鱼' },
  { label: '转转', value: '转转' },
  { label: '线下店', value: '线下店' },
  { label: '朋友转让', value: '朋友转让' },
  { label: '其他', value: '其他' }
];

const platformTextMap: Record<GameItem['platform'], string> = {
  NS1: 'NS1',
  NS2: 'NS2',
  PS5: 'PS5',
  OTHER: '其他'
};

const statusTextMap: Record<GameStatus, string> = {
  not_started: '未开始',
  playing: '游玩中',
  finished: '已通关',
  abandoned: '已弃坑',
  to_payback: '待回血',
  selling: '出售中',
  sold: '已出售',
  collection: '传家宝'
};

const statusVariantMap: Record<GameStatus, string> = {
  not_started: 'muted',
  playing: 'info',
  finished: 'success',
  abandoned: 'warning',
  to_payback: 'warning',
  selling: 'info',
  sold: 'muted',
  collection: 'warning'
};

function getToday(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toAmount(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function toOptionalAmount(value: string): number | undefined {
  const amount = toAmount(value);
  return amount > 0 ? amount : 0;
}

function amountToFormValue(value?: number): string {
  if (value == null) return '';
  return Number.isInteger(value) ? `${value}` : `${value}`;
}

function formatAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '--';
  return Number.isInteger(value) ? `¥${value}` : `¥${value.toFixed(2)}`;
}

function createDefaultForm(): SellGameForm {
  return {
    soldPrice: '',
    soldDate: getToday(),
    sellChannel: sellChannelOptions[0].value,
    sellShippingFee: '',
    sellPlatformFee: '',
    sellOtherFee: '',
    sellNote: ''
  };
}

function createFormFromGame(game: GameItem): SellGameForm {
  return {
    soldPrice: amountToFormValue(game.soldPrice),
    soldDate: game.soldDate || getToday(),
    sellChannel: game.sellChannel || sellChannelOptions[0].value,
    sellShippingFee: amountToFormValue(game.sellShippingFee),
    sellPlatformFee: amountToFormValue(game.sellPlatformFee),
    sellOtherFee: amountToFormValue(game.sellOtherFee),
    sellNote: game.sellNote || ''
  };
}

function getFinalCostText(finalCost: number | null): string {
  if (finalCost == null) return '--';
  if (finalCost < 0) return `倒赚 ${formatAmount(Math.abs(finalCost))}`;
  if (finalCost === 0) return '0 成本玩完';
  return `最终花费 ${formatAmount(finalCost)}`;
}

function getFinalCostTone(finalCost: number | null): PreviewView['finalCostTone'] {
  if (finalCost == null) return 'dark';
  if (finalCost <= 0) return 'success';
  return 'brand';
}

function toGameSummaryView(game: GameItem): GameSummaryView {
  const purchaseTotal = calcPurchaseTotal(game);

  return {
    id: game.id,
    name: game.name,
    platformText: platformTextMap[game.platform],
    platformClass: game.platform === 'PS5' ? 'platform-blue' : 'platform-red',
    statusText: statusTextMap[game.status],
    statusVariant: statusVariantMap[game.status],
    coverUrl: game.coverUrl || '',
    hasCover: Boolean(game.coverUrl),
    purchaseTotalText: formatAmount(purchaseTotal),
    holdingDaysText: `${calcHoldingDays(game.purchaseDate, game.soldDate)}天`
  };
}

function createPreview(game: GameItem | null, form: SellGameForm): PreviewView {
  const purchaseTotal = game ? calcPurchaseTotal(game) : 0;
  const soldPrice = toAmount(form.soldPrice);

  if (!game || purchaseTotal <= 0 || soldPrice <= 0) {
    return {
      isReady: false,
      purchaseTotalText: game ? formatAmount(purchaseTotal) : '--',
      sellNetAmountText: '--',
      finalCostText: '--',
      finalCostTone: 'dark',
      playIndexText: '--',
      playLevelText: '等待填写',
      helperText: '填写卖出成交价后，会实时生成预计结果。'
    };
  }

  const sellNetAmount = calcSellNetAmount({
    soldPrice,
    sellShippingFee: toAmount(form.sellShippingFee),
    sellPlatformFee: toAmount(form.sellPlatformFee),
    sellOtherFee: toAmount(form.sellOtherFee)
  });
  const finalCost = calcFinalCost(purchaseTotal, sellNetAmount);
  const playIndex = calcPlayIndex(purchaseTotal, sellNetAmount);

  return {
    isReady: true,
    purchaseTotalText: formatAmount(purchaseTotal),
    sellNetAmountText: formatAmount(sellNetAmount),
    finalCostText: getFinalCostText(finalCost),
    finalCostTone: getFinalCostTone(finalCost),
    playIndexText: playIndex == null ? '--' : `${playIndex}`,
    playLevelText: getPlayIndexLevel(playIndex),
    helperText: '保存后会以当前卖出记录生成正式结果。'
  };
}

Page({
  data: {
    id: '',
    isLoading: true,
    isSaving: false,
    notFound: false,
    blockedMessage: '',
    rawGame: null as GameItem | null,
    game: null as GameSummaryView | null,
    form: createDefaultForm(),
    sellChannelOptions,
    preview: createPreview(null, createDefaultForm()),
    heroSubtitle: '填写成交信息，生成白玩指数'
  },

  onLoad(query: { id?: string }) {
    const id = query.id || '';
    this.setData({ id });
    this.loadGame(id);
  },

  loadGame(id: string) {
    this.setData({ isLoading: true, notFound: false, blockedMessage: '' });

    const game = id ? gameApi.getGameById(id) : undefined;

    if (!game) {
      this.setData({
        isLoading: false,
        notFound: true,
        rawGame: null,
        game: null
      });
      return;
    }

    if (game.mediaType === 'digital') {
      wx.showToast({ title: '数字版游戏不能记录卖出', icon: 'none' });
      this.setData({
        isLoading: false,
        rawGame: null,
        game: null,
        blockedMessage: '数字版游戏不能记录卖出'
      });
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/game-detail/index?id=${game.id}` });
      }, 900);
      return;
    }

    const form = createFormFromGame(game);

    this.setData({
      isLoading: false,
      notFound: false,
      rawGame: game,
      game: toGameSummaryView(game),
      form,
      preview: createPreview(game, form),
      heroSubtitle: game.status === 'sold' ? '修改成交信息，更新白玩指数' : '填写成交信息，生成白玩指数'
    });
  },

  onBack() {
    const id = this.data.id;

    if (id) {
      wx.redirectTo({ url: `/pages/game-detail/index?id=${id}` });
      return;
    }

    wx.navigateBack();
  },

  onInput(event: InputEvent) {
    const field = event.currentTarget.dataset.field as keyof SellGameForm;
    if (!field) return;

    const form = {
      ...this.data.form,
      [field]: event.detail.value
    };

    this.setData({
      form,
      preview: createPreview(this.data.rawGame, form)
    });
  },

  onDateChange(event: WechatMiniprogram.PickerChange) {
    const form = {
      ...this.data.form,
      soldDate: event.detail.value
    };

    this.setData({
      form,
      preview: createPreview(this.data.rawGame, form)
    });
  },

  onSelectChannel(event: WechatMiniprogram.TouchEvent) {
    const value = event.currentTarget.dataset.value;
    if (!value) return;

    const form = {
      ...this.data.form,
      sellChannel: value
    };

    this.setData({
      form,
      preview: createPreview(this.data.rawGame, form)
    });
  },

  validateForm(): boolean {
    if (toAmount(this.data.form.soldPrice) <= 0) {
      wx.showToast({ title: '请填写卖出成交价', icon: 'none' });
      return false;
    }

    if (!this.data.form.soldDate) {
      wx.showToast({ title: '请选择卖出日期', icon: 'none' });
      return false;
    }

    return true;
  },

  onCancel() {
    this.onBack();
  },

  onSave() {
    if (this.data.isSaving || !this.validateForm()) return;

    const game = this.data.rawGame;
    if (!game) return;

    const form = this.data.form;
    const payload: SellGameInput = {
      soldPrice: toAmount(form.soldPrice),
      soldDate: form.soldDate,
      sellChannel: form.sellChannel,
      sellShippingFee: toOptionalAmount(form.sellShippingFee),
      sellPlatformFee: toOptionalAmount(form.sellPlatformFee),
      sellOtherFee: toOptionalAmount(form.sellOtherFee),
      sellNote: form.sellNote.trim()
    };

    this.setData({ isSaving: true });

    const updated = gameApi.sellGame(game.id, payload);

    if (!updated) {
      wx.showToast({ title: '保存失败，请稍后再试', icon: 'none' });
      this.setData({ isSaving: false });
      return;
    }

    wx.showToast({ title: '卖出记录已保存', icon: 'success' });
    wx.redirectTo({ url: `/pages/sell-result/index?id=${updated.id}` });
  }
});
