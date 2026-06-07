Component({
  options: {
    multipleSlots: true
  },

  properties: {
    title: {
      type: String,
      value: ''
    },
    spacing: {
      type: String,
      value: 'default'
    },
    tabSafe: {
      type: Boolean,
      value: false
    }
  }
});
