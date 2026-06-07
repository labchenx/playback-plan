import { type GameItem, type GameMediaType, type GameStatus, gameApi } from '../../services/gameApi';
import { calcHoldingDays, calcPlayIndex, calcPurchaseTotal, calcSellNetAmount, getPlayIndexLevel } from '../../utils/gameCalculations';

type FilterValue = 'all';
type MediaTypeFilter = GameMediaType | FilterValue;
type StatusFilter = GameStatus | FilterValue;

type OptionItem<T extends string = string> = {
  label: string;
  value: T;
};

type LibraryGameCard = {
  id: string;
  name: string;
  mediaType: GameMediaType;
  mediaTypeText: string;
  mediaTypeClass: string;
  platformText: string;
  platformClass: string;
  status: GameStatus;
  statusText: string;
  statusVariant: string;
  priceLabel: string;
  priceText: string;
  purchaseChannelText: string;
  purchaseDateText: string;
  holdDaysText: string;
  coverUrl: string;
  hasCover: boolean;
  isCollection: boolean;
  isPhysical: boolean;
  isDigital: boolean;
  isSoldPhysical: boolean;
  sellPaybackText: string;
  playIndexText: string;
  playLevelText: string;
  cardHintText: string;
  showRecordSell: boolean;
};

type InputEvent = WechatMiniprogram.CustomEvent<{ value: string }>;

const mediaTypeOptions: OptionItem<MediaTypeFilter>[] = [
  { label: '全部', value: 'all' },
  { label: '实体版', value: 'physical' },
  { label: '数字版', value: 'digital' }
];

const allStatusOptions: OptionItem<StatusFilter>[] = [
  { label: '全部', value: 'all' },
  { label: '未开始', value: 'not_started' },
  { label: '游玩中', value: 'playing' },
  { label: '已通关', value: 'finished' },
  { label: '已弃坑', value: 'abandoned' },
  { label: '待回血', value: 'to_payback' },
  { label: '出售中', value: 'selling' },
  { label: '已出售', value: 'sold' },
  { label: '收藏', value: 'collection' }
];

const physicalHintTextMap: Partial<Record<GameStatus, string>> = {
  finished: '可以考虑卖掉回血',
  abandoned: '可以考虑处理回血',
  to_payback: '已标记待回血',
  selling: '正在出售中'
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

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return '¥0';
  return Number.isInteger(value) ? `¥${value}` : `¥${value.toFixed(2)}`;
}

function getStatusOptions(): OptionItem<StatusFilter>[] {
  return allStatusOptions;
}

function toLibraryGameCard(game: GameItem): LibraryGameCard {
  const isPhysical = game.mediaType === 'physical';
  const isSoldPhysical = isPhysical && game.status === 'sold';
  const isCollection = game.status === 'collection';
  const purchaseTotal = calcPurchaseTotal(game);
  const sellPayback = isSoldPhysical ? calcSellNetAmount(game) : null;
  const playIndex = isSoldPhysical ? calcPlayIndex(purchaseTotal, sellPayback) : null;
  const isDigital = !isPhysical;
  const showRecordSell = isPhysical && !isSoldPhysical && !isCollection;
  const cardHintText = isDigital
    ? '数字版不参与回血统计'
    : isCollection
      ? '永久收藏 / 不卖出'
      : physicalHintTextMap[game.status] ?? '';

  return {
    id: game.id,
    name: game.name,
    mediaType: game.mediaType,
    mediaTypeText: isPhysical ? '实体版' : '数字版',
    mediaTypeClass: isPhysical ? 'media-physical' : 'media-digital',
    platformText: platformTextMap[game.platform],
    platformClass: game.platform === 'PS5' ? 'platform-blue' : 'platform-red',
    status: game.status,
    statusText: statusTextMap[game.status],
    statusVariant: statusVariantMap[game.status],
    priceLabel: isPhysical ? '买入价格' : '购买价格',
    priceText: formatAmount(isPhysical ? purchaseTotal : game.purchasePrice),
    purchaseChannelText: game.purchaseChannel || '未记录',
    purchaseDateText: game.purchaseDate || '未记录',
    holdDaysText: `已持有 ${calcHoldingDays(game.purchaseDate)} 天`,
    coverUrl: game.coverUrl || '',
    hasCover: Boolean(game.coverUrl),
    isCollection,
    isPhysical,
    isDigital,
    isSoldPhysical,
    sellPaybackText: formatAmount(sellPayback ?? 0),
    playIndexText: playIndex == null ? '--' : `${playIndex}`,
    playLevelText: getPlayIndexLevel(playIndex),
    cardHintText,
    showRecordSell
  };
}

function filterGames(games: GameItem[], searchText: string, mediaType: MediaTypeFilter, status: StatusFilter): GameItem[] {
  const keyword = searchText.trim().toLowerCase();

  return games.filter((game) => {
    if (keyword && !game.name.toLowerCase().includes(keyword)) return false;
    if (mediaType !== 'all' && game.mediaType !== mediaType) return false;
    if (status !== 'all' && game.status !== status) return false;

    return true;
  });
}

Page({
  data: {
    games: [] as GameItem[],
    displayGames: [] as LibraryGameCard[],
    mediaTypeOptions,
    statusOptions: allStatusOptions,
    searchText: '',
    selectedMediaType: 'all' as MediaTypeFilter,
    selectedStatus: 'all' as StatusFilter,
    hasGames: false,
    hasFilteredGames: false
  },

  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;

    if (tabBar) {
      tabBar.setData({ selected: 1, hidden: false });
    }

    this.loadGames();
  },

  loadGames() {
    const games = gameApi.getUserGames();
    this.refreshList(games, this.data.searchText, this.data.selectedMediaType, this.data.selectedStatus);
  },

  refreshList(games: GameItem[], searchText: string, selectedMediaType: MediaTypeFilter, selectedStatus: StatusFilter) {
    const filteredGames = filterGames(games, searchText, selectedMediaType, selectedStatus);

    this.setData({
      games,
      searchText,
      selectedMediaType,
      selectedStatus,
      statusOptions: getStatusOptions(),
      displayGames: filteredGames.map(toLibraryGameCard),
      hasGames: games.length > 0,
      hasFilteredGames: filteredGames.length > 0
    });
  },

  onSearchInput(event: InputEvent) {
    this.refreshList(this.data.games, event.detail.value, this.data.selectedMediaType, this.data.selectedStatus);
  },

  onSelectMediaType(event: WechatMiniprogram.TouchEvent) {
    const selectedMediaType = event.currentTarget.dataset.value as MediaTypeFilter;
    if (!selectedMediaType) return;

    this.refreshList(this.data.games, this.data.searchText, selectedMediaType, this.data.selectedStatus);
  },

  onSelectStatus(event: WechatMiniprogram.TouchEvent) {
    const selectedStatus = event.currentTarget.dataset.value as StatusFilter;
    if (!selectedStatus) return;

    this.refreshList(this.data.games, this.data.searchText, this.data.selectedMediaType, selectedStatus);
  },

  onAddGame() {
    wx.switchTab({ url: '/pages/add/index' });
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
  }
});
