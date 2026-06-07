Component({
  properties: {
    iconSrc: {
      type: String,
      value: ''
    },
    label: {
      type: String,
      value: ''
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('fabtap');
    }
  }
});
