import { type GameItem, type GameStatus, gameApi } from '../../services/gameApi';
import {
  calcFinalCost,
  calcHoldingDays,
  calcPlayIndex,
  calcPurchaseTotal,
  calcSellNetAmount,
  getPlayIndexLevel
} from '../../utils/gameCalculations';

type DetailMode = 'physical_unsold' | 'physical_sold' | 'digital';

type SegmentItem = {
  label: string;
  value: DetailMode;
  active: boolean;
};

type SummaryItem = {
  label: string;
  value: string;
  unit?: string;
  tone: 'brand' | 'dark' | 'success';
};

type InfoRow = {
  label: string;
  value: string;
  highlight?: boolean;
};

type DetailView = {
  id: string;
  name: string;
  mode: DetailMode;
  isPhysical: boolean;
  isDigital: boolean;
  isSoldPhysical: boolean;
  isCollection: boolean;
  showPrimaryAction: boolean;
  primaryActionText: string;
  mediaTypeText: string;
  mediaTypeClass: string;
  platformText: string;
  platformClass: string;
  regionText: string;
  statusText: string;
  statusVariant: string;
  coverUrl: string;
  hasCover: boolean;
  segmentItems: SegmentItem[];
  summaryItems: SummaryItem[];
  hintText: string;
  hintTone: 'warning' | 'info' | 'success';
  purchaseTitle: string;
  purchaseRows: InfoRow[];
  showSellSection: boolean;
  hasSellRecord: boolean;
  sellRows: InfoRow[];
  sellEmptyTitle: string;
  sellEmptyDesc: string;
  showPlayResult: boolean;
  playIndexText: string;
  playLevelText: string;
  finalCostText: string;
  finalCostTone: 'brand' | 'success' | 'dark';
  resultDesc: string;
  note: string;
};

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

const physicalHintTextMap: Partial<Record<GameStatus, string>> = {
  finished: '可以考虑卖掉回血',
  abandoned: '已弃坑，可以考虑处理',
  to_payback: '你已标记准备处理',
  selling: '正在出售中，卖出后记得记录成交',
  collection: '永久收藏 / 不卖出'
};

function formatAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '¥0';
  return Number.isInteger(value) ? `¥${value}` : `¥${value.toFixed(2)}`;
}

function formatNullableAmount(value: number | null | undefined): string {
  return value == null ? '未记录' : formatAmount(value);
}

function getDetailMode(game: GameItem): DetailMode {
  if (game.mediaType === 'digital') return 'digital';
  return game.status === 'sold' ? 'physical_sold' : 'physical_unsold';
}

function getSegmentItems(mode: DetailMode): SegmentItem[] {
  return [
    { label: '实体未售', value: 'physical_unsold', active: mode === 'physical_unsold' },
    { label: '实体已售', value: 'physical_sold', active: mode === 'physical_sold' },
    { label: '数字版', value: 'digital', active: mode === 'digital' }
  ];
}

function getFinalCostText(finalCost: number | null): string {
  if (finalCost == null) return '未生成';
  if (finalCost < 0) return `倒赚 ${formatAmount(Math.abs(finalCost))}`;
  if (finalCost === 0) return '0 成本玩完';
  return `最终花了 ${formatAmount(finalCost)}`;
}

function getFinalCostTone(finalCost: number | null): DetailView['finalCostTone'] {
  if (finalCost == null) return 'dark';
  if (finalCost <= 0) return 'success';
  return 'brand';
}

function toDetailView(game: GameItem): DetailView {
  const isPhysical = game.mediaType === 'physical';
  const isDigital = game.mediaType === 'digital';
  const isSoldPhysical = isPhysical && game.status === 'sold';
  const isCollection = game.status === 'collection';
  const mode = getDetailMode(game);
  const purchaseTotal = calcPurchaseTotal(game);
  const sellNetAmount = isSoldPhysical ? calcSellNetAmount(game) : null;
  const finalCost = calcFinalCost(purchaseTotal, sellNetAmount);
  const playIndex = calcPlayIndex(purchaseTotal, sellNetAmount);
  const holdingDays = calcHoldingDays(game.purchaseDate, isSoldPhysical ? game.soldDate : undefined);
  const hasSellRecord = isSoldPhysical;
  const hintText = isDigital
    ? '数字版游戏不参与回血和白玩统计'
    : isSoldPhysical
      ? getFinalCostText(finalCost)
      : physicalHintTextMap[game.status] ?? '卖出后可生成白玩指数';
  const showPrimaryAction = isPhysical && !isCollection;

  return {
    id: game.id,
    name: game.name,
    mode,
    isPhysical,
    isDigital,
    isSoldPhysical,
    isCollection,
    showPrimaryAction,
    primaryActionText: isSoldPhysical ? '查看卖出结果' : '记录卖出',
    mediaTypeText: isPhysical ? '实体版' : '数字版',
    mediaTypeClass: isPhysical ? 'media-physical' : 'media-digital',
    platformText: platformTextMap[game.platform],
    platformClass: game.platform === 'PS5' ? 'platform-blue' : 'platform-red',
    regionText: game.region || '未记录',
    statusText: statusTextMap[game.status],
    statusVariant: statusVariantMap[game.status],
    coverUrl: game.coverUrl || '',
    hasCover: Boolean(game.coverUrl),
    segmentItems: getSegmentItems(mode),
    summaryItems: isSoldPhysical
      ? [
          { label: '买入花费', value: formatAmount(purchaseTotal), tone: 'brand' },
          { label: '卖游戏回血', value: formatAmount(sellNetAmount), tone: 'success' },
          { label: '白玩指数', value: playIndex == null ? '--' : `${playIndex}`, tone: 'dark' }
        ]
      : [
          { label: isDigital ? '购买价格' : '买入花费', value: formatAmount(isDigital ? game.purchasePrice : purchaseTotal), tone: 'brand' },
          { label: '已持有', value: `${holdingDays}`, unit: '天', tone: 'dark' }
        ],
    hintText,
    hintTone: isDigital ? 'info' : isSoldPhysical ? 'success' : 'warning',
    purchaseTitle: isDigital ? '购买信息' : '买入信息',
    purchaseRows: [
      { label: isDigital ? '购买价格' : '买入价格', value: formatAmount(game.purchasePrice), highlight: true },
      ...(isPhysical ? [{ label: '买入运费', value: formatAmount(game.purchaseShippingFee) }] : []),
      ...(isPhysical && game.purchaseOtherFee ? [{ label: '其他费用', value: formatAmount(game.purchaseOtherFee) }] : []),
      { label: '购买日期', value: game.purchaseDate || '未记录' },
      { label: '购买渠道', value: game.purchaseChannel || '未记录' }
    ],
    showSellSection: isPhysical,
    hasSellRecord,
    sellRows: [
      { label: '卖出成交价', value: formatNullableAmount(game.soldPrice), highlight: true },
      { label: '卖出运费', value: formatAmount(game.sellShippingFee ?? 0) },
      { label: '平台手续费', value: formatAmount(game.sellPlatformFee ?? 0) },
      ...(game.sellOtherFee ? [{ label: '其他费用', value: formatAmount(game.sellOtherFee) }] : []),
      { label: '卖出日期', value: game.soldDate || '未记录' },
      { label: '卖出渠道', value: game.sellChannel || '未记录' },
      { label: '卖出回血', value: formatNullableAmount(sellNetAmount), highlight: true }
    ],
    sellEmptyTitle: '暂无卖出记录',
    sellEmptyDesc: '卖出后可生成白玩指数',
    showPlayResult: isSoldPhysical,
    playIndexText: playIndex == null ? '--' : `${playIndex}`,
    playLevelText: getPlayIndexLevel(playIndex),
    finalCostText: getFinalCostText(finalCost),
    finalCostTone: getFinalCostTone(finalCost),
    resultDesc:
      finalCost == null
        ? '卖出后会根据买入花费和卖出回血生成结果'
        : `买入 ${formatAmount(purchaseTotal)}，回血 ${formatAmount(sellNetAmount)}，${getFinalCostText(finalCost)}。`,
    note: game.note || '暂无备注'
  };
}

Page({
  data: {
    id: '',
    isLoading: true,
    notFound: false,
    game: null as DetailView | null
  },

  onLoad(query: { id?: string }) {
    this.setData({ id: query.id || '' });
    this.loadGame(query.id || '');
  },

  loadGame(id: string) {
    this.setData({ isLoading: true, notFound: false });

    const game = id ? gameApi.getGameById(id) : undefined;

    if (!game) {
      this.setData({ game: null, isLoading: false, notFound: true });
      return;
    }

    this.setData({
      game: toDetailView(game),
      isLoading: false,
      notFound: false
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onEdit() {
    wx.showToast({
      title: 'TODO：编辑信息',
      icon: 'none'
    });
  },

  onPrimaryAction() {
    const game = this.data.game;
    if (!game) return;

    if (game.isSoldPhysical) {
      wx.navigateTo({ url: `/pages/sell-result/index?id=${game.id}` });
      return;
    }

    wx.navigateTo({ url: `/pages/sell-game/index?id=${game.id}` });
  }
});
