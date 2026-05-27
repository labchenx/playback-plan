type QuickActionKey = 'purchase' | 'sell' | 'library_search' | 'pending';

type QuickAction = {
  key: QuickActionKey;
  label: string;
  iconSrc: string;
  iconClass: string;
  primary?: boolean;
};

type RecentGame = {
  id: string;
  title: string;
  platform: string;
  price: string;
  statusText: string;
  meta: string;
  coverUrl: string;
  platformClass: string;
  isCollection?: boolean;
};

type AchievementStat = {
  label: string;
  value: string;
  unit?: string;
  iconSrc: string;
  iconClass: string;
  highlight?: boolean;
};

type TaskItem = {
  type: string;
  title: string;
  desc: string;
  actionText: string;
  iconSrc: string;
  iconClass: string;
};

Page({
  data: {
    summary: {
      actualCost: '4,550',
      totalPurchaseCost: '6,850',
      totalSellPayback: '2,300',
      holdingCount: 28,
      paybackRate: 33,
      remainingToFree: '2,250'
    },
    quickActions: [
      { key: 'purchase', label: '登记买入', iconSrc: '/assets/icons/action-purchase.png', iconClass: 'quick-add', primary: true },
      { key: 'sell', label: '登记卖出', iconSrc: '/assets/icons/action-sell.png', iconClass: 'quick-sell' },
      { key: 'library_search', label: '搜游戏库', iconSrc: '/assets/icons/action-library-search.png', iconClass: 'quick-search' },
      { key: 'pending', label: '待处理', iconSrc: '/assets/icons/action-pending.png', iconClass: 'quick-pending' }
    ] as QuickAction[],
    recentGames: [
      {
        id: 'zelda-totk',
        title: '塞尔达传说 王国之泪',
        platform: 'NS',
        price: '¥260',
        statusText: '已通关',
        meta: '永久收藏 / 不卖出',
        coverUrl: '/assets/home/cover-zelda.svg',
        platformClass: 'platform-red',
        isCollection: true
      },
      {
        id: 'need-for-speed',
        title: '极品飞车 不羁',
        platform: 'PS5',
        price: '¥180',
        statusText: '持有中',
        meta: '入库 12 天',
        coverUrl: '/assets/home/cover-racing.svg',
        platformClass: 'platform-blue'
      },
      {
        id: 'it-takes-two',
        title: '双人成行',
        platform: 'PS5',
        price: '¥150',
        statusText: '待出售',
        meta: '挂牌中',
        coverUrl: '/assets/home/cover-it-takes-two.svg',
        platformClass: 'platform-blue'
      }
    ] as RecentGame[],
    achievement: {
      collectionCount: 3
    },
    achievementStats: [
      { label: '已卖出', value: '12', unit: '款', iconSrc: '/assets/icons/stat-sold.svg', iconClass: 'stat-sold' },
      { label: '几乎白玩', value: '5', unit: '款', iconSrc: '/assets/icons/stat-coins.svg', iconClass: 'stat-coins' },
      { label: '倒赚游戏', value: '2', unit: '款', iconSrc: '/assets/icons/stat-up.svg', iconClass: 'stat-up' },
      { label: '最高白玩指数', value: '116', iconSrc: '/assets/icons/stat-fire.svg', iconClass: 'stat-fire', highlight: true }
    ] as AchievementStat[],
    tasks: [
      {
        type: 'finished',
        title: '3 款已通关',
        desc: '不含传家宝，可考虑卖出回血',
        actionText: '去处理',
        iconSrc: '/assets/icons/task-check.svg',
        iconClass: 'task-icon-green'
      },
      {
        type: 'abandoned',
        title: '2 款已弃坑',
        desc: '放着可惜，看看要不要处理',
        actionText: '去处理',
        iconSrc: '/assets/icons/task-alert.svg',
        iconClass: 'task-icon-amber'
      },
      {
        type: 'selling',
        title: '1 款出售中',
        desc: '成功卖出后记得记录成交价',
        actionText: '去记录',
        iconSrc: '/assets/icons/task-clock.svg',
        iconClass: 'task-icon-blue'
      }
    ] as TaskItem[],
    activities: [
      {
        id: 'a1',
        date: '05-26',
        typeText: '买入',
        typeClass: 'activity-buy',
        title: '塞尔达传说 王国之泪',
        amount: '¥260'
      },
      {
        id: 'a2',
        date: '05-24',
        typeText: '卖出',
        typeClass: 'activity-sell',
        title: '马里奥赛车 8',
        amount: '回血 ¥280'
      },
      {
        id: 'a3',
        date: '05-22',
        typeText: '添加',
        typeClass: 'activity-add',
        title: '双人成行 PS5',
        amount: ''
      }
    ]
  },

  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;

    if (tabBar) {
      tabBar.setData({ selected: 0 });
    }
  },

  onOpenSearch() {
    wx.showToast({
      title: '后续接入游戏库搜索',
      icon: 'none'
    });
  },

  onOpenSummaryInfo() {
    wx.showModal({
      title: '实际花费',
      content: '实际花费 = 买游戏总花费 - 卖游戏总回血。',
      showCancel: false
    });
  },

  onOpenPaybackHint() {
    wx.showToast({
      title: '卖出回血后会更新差额',
      icon: 'none'
    });
  },

  onQuickAction(event: WechatMiniprogram.TouchEvent) {
    const key = event.currentTarget.dataset.key as QuickActionKey;
    const actionTitle: Record<QuickActionKey, string> = {
      purchase: '登记买入',
      sell: '登记卖出',
      library_search: '搜游戏库',
      pending: '待处理'
    };

    wx.showToast({
      title: `${actionTitle[key]}功能待接入`,
      icon: 'none'
    });
  },

  onViewLibrary() {
    wx.showToast({
      title: '游戏库页面待接入',
      icon: 'none'
    });
  },

  onOpenGame(event: WechatMiniprogram.TouchEvent) {
    const id = event.currentTarget.dataset.id;
    wx.showToast({
      title: `打开游戏 ${id}`,
      icon: 'none'
    });
  },

  onOpenPlayStats() {
    wx.showModal({
      title: '白玩指数',
      content: '100 表示基本回本，超过 100 表示倒赚。指数越高，说明这款游戏玩得越划算。',
      showCancel: false
    });
  },

  onViewPayback() {
    wx.showToast({
      title: '待回血页面待接入',
      icon: 'none'
    });
  },

  onOpenTask(event: WechatMiniprogram.TouchEvent) {
    const type = event.currentTarget.dataset.type;
    wx.showToast({
      title: `查看${type}游戏`,
      icon: 'none'
    });
  }
});
