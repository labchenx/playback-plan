import { type GameItem, gameApi } from '../../services/gameApi';
import { calcHoldingDays, calcPurchaseTotal } from '../../utils/gameCalculations';
import { PAYBACK_REASON_TEXT, type PaybackStatus, isPaybackCandidate } from '../../utils/paybackRules';

type FilterValue = 'all' | PaybackStatus;

type FilterOption = {
  label: string;
  value: FilterValue;
};

type RecoveryStat = {
  label: string;
  value: number;
  unit: string;
  tone: 'warning' | 'success' | 'muted' | 'info';
};

type RecoveryGameCard = {
  id: string;
  name: string;
  platformText: string;
  platformClass: string;
  status: PaybackStatus;
  statusText: string;
  statusVariant: string;
  purchaseTotalText: string;
  holdingDaysText: string;
  reasonText: string;
  coverUrl: string;
  hasCover: boolean;
  secondaryActionText: string;
};

const filterOptions: FilterOption[] = [
  { label: '全部', value: 'all' },
  { label: '已通关', value: 'finished' },
  { label: '已弃坑', value: 'abandoned' },
  { label: '待回血', value: 'to_payback' },
  { label: '出售中', value: 'selling' }
];

const platformTextMap: Record<GameItem['platform'], string> = {
  NS1: 'NS1',
  NS2: 'NS2',
  PS5: 'PS5',
  OTHER: '其他'
};

const statusTextMap: Record<PaybackStatus, string> = {
  finished: '已通关',
  abandoned: '已弃坑',
  to_payback: '待回血',
  selling: '出售中'
};

const statusVariantMap: Record<PaybackStatus, string> = {
  finished: 'success',
  abandoned: 'warning',
  to_payback: 'warning',
  selling: 'info'
};

const secondaryActionTextMap: Record<PaybackStatus, string> = {
  finished: '标记出售中',
  abandoned: '暂不处理',
  to_payback: '标记出售中',
  selling: '修改状态'
};

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '¥0';
  return Number.isInteger(value) ? `¥${value}` : `¥${value.toFixed(2)}`;
}

function countByStatus(games: Array<GameItem & { status: PaybackStatus }>, status: PaybackStatus): number {
  return games.filter((game) => game.status === status).length;
}

function toStats(games: Array<GameItem & { status: PaybackStatus }>): RecoveryStat[] {
  return [
    { label: '待回血', value: games.length, unit: '款', tone: 'warning' },
    { label: '已通关', value: countByStatus(games, 'finished'), unit: '款', tone: 'success' },
    { label: '已弃坑', value: countByStatus(games, 'abandoned'), unit: '款', tone: 'muted' },
    { label: '出售中', value: countByStatus(games, 'selling'), unit: '款', tone: 'info' }
  ];
}

function toRecoveryGameCard(game: GameItem & { status: PaybackStatus }): RecoveryGameCard {
  const platformText = platformTextMap[game.platform];

  return {
    id: game.id,
    name: game.name,
    platformText,
    platformClass: game.platform === 'PS5' ? 'platform-blue' : 'platform-red',
    status: game.status,
    statusText: statusTextMap[game.status],
    statusVariant: statusVariantMap[game.status],
    purchaseTotalText: formatAmount(calcPurchaseTotal(game)),
    holdingDaysText: `已持有 ${calcHoldingDays(game.purchaseDate)} 天`,
    reasonText: PAYBACK_REASON_TEXT[game.status],
    coverUrl: game.coverUrl || '',
    hasCover: Boolean(game.coverUrl),
    secondaryActionText: secondaryActionTextMap[game.status]
  };
}

function filterBySelectedStatus(games: Array<GameItem & { status: PaybackStatus }>, selectedFilter: FilterValue) {
  if (selectedFilter === 'all') return games;
  return games.filter((game) => game.status === selectedFilter);
}

Page({
  data: {
    filterOptions,
    selectedFilter: 'all' as FilterValue,
    stats: [] as RecoveryStat[],
    allRecoveryGames: [] as Array<GameItem & { status: PaybackStatus }>,
    displayGames: [] as RecoveryGameCard[],
    hasRecoveryGames: false,
    hasFilteredGames: false
  },

  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;

    if (tabBar) {
      tabBar.setData({ selected: 3, hidden: false });
    }

    this.loadRecoveryGames();
  },

  loadRecoveryGames() {
    const recoveryGames = gameApi.getUserGames().filter(isPaybackCandidate);
    this.refreshList(recoveryGames, this.data.selectedFilter);
  },

  refreshList(recoveryGames: Array<GameItem & { status: PaybackStatus }>, selectedFilter: FilterValue) {
    const filteredGames = filterBySelectedStatus(recoveryGames, selectedFilter);

    this.setData({
      allRecoveryGames: recoveryGames,
      selectedFilter,
      stats: toStats(recoveryGames),
      displayGames: filteredGames.map(toRecoveryGameCard),
      hasRecoveryGames: recoveryGames.length > 0,
      hasFilteredGames: filteredGames.length > 0
    });
  },

  onSelectFilter(event: WechatMiniprogram.TouchEvent) {
    const selectedFilter = event.currentTarget.dataset.value as FilterValue;
    if (!selectedFilter) return;

    this.refreshList(this.data.allRecoveryGames, selectedFilter);
  },

  onOpenGame(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;

    wx.navigateTo({ url: `/pages/game-detail/index?id=${id}` });
  },

  onRecordSell(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id;
    if (!id) return;

    wx.navigateTo({ url: `/pages/sell-game/index?id=${id}` });
  },

  onTodoAction(event: WechatMiniprogram.TouchEvent) {
    const action = event.currentTarget.dataset.action;

    wx.showToast({
      title: `${action || '操作'}待接入`,
      icon: 'none'
    });
  },

  onShowEmptyState() {
    this.refreshList(this.data.allRecoveryGames, 'all');
  }
});
