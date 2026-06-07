Component({
  properties: {
    actionKey: {
      type: String,
      value: ''
    },
    label: {
      type: String,
      value: ''
    },
    iconSrc: {
      type: String,
      value: ''
    },
    iconClass: {
      type: String,
      value: ''
    },
    primary: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('entrytap', { key: this.data.actionKey });
    }
  }
});
