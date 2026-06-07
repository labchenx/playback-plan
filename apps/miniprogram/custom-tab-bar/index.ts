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
  { key: 'home', label: '首页', iconClass: 'tab-home', iconSrc: '/assets/tab/tab-home.svg', activeIconSrc: '/assets/tab/tab-home-active.svg', pagePath: '/pages/home/index' },
  { key: 'library', label: '游戏库', iconClass: 'tab-library', iconSrc: '/assets/tab/tab-library.svg', activeIconSrc: '/assets/tab/tab-library-active.svg', pagePath: '/pages/library/index' },
  { key: 'add', label: '添加', iconClass: 'tab-add', iconSrc: '/assets/tab/tab-add.svg', pagePath: '/pages/add/index', primary: true },
  { key: 'payback', label: '待回血', iconClass: 'tab-stats', iconSrc: '/assets/tab/tab-payback.svg', activeIconSrc: '/assets/tab/tab-payback-active.svg', pagePath: '/pages/stats/index' },
  { key: 'settings', label: '我的', iconClass: 'tab-user', iconSrc: '/assets/tab/tab-user.svg', activeIconSrc: '/assets/tab/tab-user-active.svg', pagePath: '/pages/settings/index' }
];

Component({
  data: {
    selected: 0,
    tabs,
    hidden: false
  },

  pageLifetimes: {
    show() {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      const route = `/${current.route}`;
      const selected = tabs.findIndex((item) => item.pagePath === route);
      const hidden = route === '/pages/add/index';

      if (selected !== -1) {
        this.setData({ selected, hidden });
        return;
      }

      this.setData({ hidden });
    }
  },

  methods: {
    onTabTap(event: WechatMiniprogram.CustomEvent<{ index: number }>) {
      const index = Number(event.detail.index);
      const target = tabs[index];

      if (!target) return;

      wx.switchTab({
        url: target.pagePath
      });
    }
  }
});
