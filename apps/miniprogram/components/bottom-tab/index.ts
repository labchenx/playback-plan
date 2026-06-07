Component({
  properties: {
    tabs: {
      type: Array,
      value: []
    },
    selected: {
      type: Number,
      value: 0
    }
  },

  methods: {
    onTabTap(event: WechatMiniprogram.TouchEvent) {
      const index = Number(event.currentTarget.dataset.index);
      this.triggerEvent('tabtap', { index });
    }
  }
});
