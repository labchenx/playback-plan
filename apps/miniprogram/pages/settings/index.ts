import { type GameItem, gameApi } from '../../services/gameApi';
import { calcPlayIndex, calcPurchaseTotal, calcSellNetAmount } from '../../utils/gameCalculations';

type ProfileStat = {
  label: string;
  value: string;
  unit?: string;
  iconSrc: string;
  iconClass: string;
};

type ProfileLink = {
  label: string;
  value?: string;
  action: 'feedback' | 'privacy' | 'version';
};

type SoldPlayResult = {
  playIndex: number;
};

function getSoldPhysicalPlayResults(games: GameItem[]): SoldPlayResult[] {
  return games
    .filter((game) => game.mediaType === 'physical' && game.status === 'sold')
    .map((game) => {
      const purchaseTotal = calcPurchaseTotal(game);
      const sellNetAmount = calcSellNetAmount(game);
      return {
        playIndex: calcPlayIndex(purchaseTotal, sellNetAmount)
      };
    })
    .filter((item): item is SoldPlayResult => item.playIndex != null);
}

function createProfileStats(games: GameItem[]): ProfileStat[] {
  const soldPhysicalGames = games.filter((game) => game.mediaType === 'physical' && game.status === 'sold');
  const soldPlayResults = getSoldPhysicalPlayResults(games);
  const highestPlayIndex = soldPlayResults.length
    ? Math.max(...soldPlayResults.map((item) => item.playIndex))
    : null;
  const profitPlayCount = soldPlayResults.filter((item) => item.playIndex >= 100).length;

  return [
    {
      label: '已记录游戏',
      value: String(games.length),
      unit: '款',
      iconSrc: '/assets/profile/profile-stat-game.svg',
      iconClass: 'stat-icon-blue'
    },
    {
      label: '已卖出',
      value: String(soldPhysicalGames.length),
      unit: '款',
      iconSrc: '/assets/profile/profile-stat-sold.svg',
      iconClass: 'stat-icon-green'
    },
    {
      label: '最高白玩指数',
      value: highestPlayIndex == null ? '--' : String(highestPlayIndex),
      iconSrc: '/assets/profile/profile-stat-fire.svg',
      iconClass: 'stat-icon-red'
    },
    {
      label: '倒赚游玩',
      value: String(profitPlayCount),
      unit: '次',
      iconSrc: '/assets/profile/profile-stat-coins.svg',
      iconClass: 'stat-icon-amber'
    }
  ];
}

Page({
  data: {
    user: {
      nickname: '玩家昵称',
      subtitle: '继续记录你的白玩战绩'
    },
    stats: [] as ProfileStat[],
    links: [
      { label: '意见反馈', action: 'feedback' },
      { label: '隐私说明', action: 'privacy' },
      { label: '版本信息', value: 'v0.1.0', action: 'version' }
    ] as ProfileLink[]
  },

  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;

    if (tabBar) {
      tabBar.setData({ selected: 4, hidden: false });
    }

    this.loadProfileStats();
  },

  loadProfileStats() {
    const games = gameApi.getUserGames();

    this.setData({
      stats: createProfileStats(games)
    });
  },

  onOpenPlayIndexInfo() {
    wx.showModal({
      title: '白玩指数',
      content: '100 表示基本回本，超过 100 表示倒赚。指数越高，说明这款实体游戏玩得越划算。',
      showCancel: false
    });
  },

  onOpenLink(event: WechatMiniprogram.TouchEvent) {
    const action = event.currentTarget.dataset.action as ProfileLink['action'] | undefined;

    if (action === 'feedback') {
      wx.showToast({
        title: '意见反馈入口待接入',
        icon: 'none'
      });
      return;
    }

    if (action === 'privacy') {
      wx.showModal({
        title: '隐私说明',
        content: '当前版本先使用本地小程序数据记录游戏账本，暂不接入云数据库。',
        showCancel: false
      });
      return;
    }

    if (action === 'version') {
      wx.showToast({
        title: '白玩计划 v0.1.0',
        icon: 'none'
      });
    }
  }
});
