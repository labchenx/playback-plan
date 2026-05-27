type TabItem = {
  key: string;
  label: string;
  iconClass: string;
  iconSrc: string;
  activeIconSrc?: string;
  pagePath: string;
  primary?: boolean;
};

const tabs: TabItem[] = [
  { key: 'home', label: '首页', iconClass: 'tab-home', iconSrc: '/assets/icons/tab-home.svg', activeIconSrc: '/assets/icons/tab-home-active.svg', pagePath: '/pages/home/index' },
  { key: 'library', label: '游戏库', iconClass: 'tab-library', iconSrc: '/assets/icons/tab-library.svg', activeIconSrc: '/assets/icons/tab-library-active.svg', pagePath: '/pages/library/index' },
  { key: 'add', label: '添加', iconClass: 'tab-add', iconSrc: '/assets/icons/tab-add.svg', pagePath: '/pages/add/index', primary: true },
  { key: 'stats', label: '统计', iconClass: 'tab-stats', iconSrc: '/assets/icons/tab-stats.svg', activeIconSrc: '/assets/icons/tab-stats-active.svg', pagePath: '/pages/stats/index' },
  { key: 'settings', label: '我的', iconClass: 'tab-user', iconSrc: '/assets/icons/tab-user.svg', activeIconSrc: '/assets/icons/tab-user-active.svg', pagePath: '/pages/settings/index' }
];

Component({
  data: {
    selected: 0,
    tabs
  },

  pageLifetimes: {
    show() {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      const route = `/${current.route}`;
      const selected = tabs.findIndex((item) => item.pagePath === route);

      if (selected !== -1) {
        this.setData({ selected });
      }
    }
  },

  methods: {
    onTabTap(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index);
      const target = tabs[index];

      if (!target) return;

      wx.switchTab({
        url: target.pagePath
      });
    }
  }
});
