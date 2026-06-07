Component({
  properties: {
    game: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onTap() {
      const game = this.data.game as { id?: string };

      this.triggerEvent('cardtap', { id: game.id ?? '' });
    }
  }
});
