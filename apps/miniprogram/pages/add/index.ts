import { type CreateGameInput, type GameMediaType, type GamePlatform, type GameStatus, gameApi } from '../../services/gameApi';
import type { GameCatalogItem } from '../../services/catalogApi';

type OptionItem<T extends string = string> = {
  label: string;
  value: T;
};

type AddGameForm = {
  catalogGameId: string;
  name: string;
  mediaType: GameMediaType;
  platform: GamePlatform;
  releaseDate: string;
  region: string;
  status: GameStatus;
  purchasePrice: string;
  purchaseShippingFee: string;
  purchaseDate: string;
  purchaseChannel: string;
  note: string;
  coverUrl: string;
};

type InputEvent = WechatMiniprogram.CustomEvent<{ value: string }>;

const mediaTypeOptions: OptionItem<GameMediaType>[] = [
  { label: '实体版', value: 'physical' },
  { label: '数字版', value: 'digital' }
];

const platformOptions: OptionItem<GamePlatform>[] = [
  { label: 'NS1', value: 'NS1' },
  { label: 'NS2', value: 'NS2' },
  { label: 'PS5', value: 'PS5' },
  { label: '其他', value: 'OTHER' }
];

const regionOptions: OptionItem[] = [
  { label: '港版', value: '港版' },
  { label: '日版', value: '日版' },
  { label: '其他', value: '其他' }
];

const physicalStatusOptions: OptionItem<GameStatus>[] = [
  { label: '未开始', value: 'not_started' },
  { label: '游玩中', value: 'playing' },
  { label: '已通关', value: 'finished' },
  { label: '待回血', value: 'to_payback' },
  { label: '收藏', value: 'collection' }
];

const digitalStatusOptions: OptionItem<GameStatus>[] = physicalStatusOptions.filter((item) => item.value !== 'to_payback');

const physicalChannelOptions: OptionItem[] = [
  { label: '拼多多', value: '拼多多' },
  { label: '淘宝', value: '淘宝' },
  { label: '京东', value: '京东' },
  { label: '闲鱼', value: '闲鱼' },
  { label: '其他', value: '其他' }
];

const digitalChannelOptions: OptionItem[] = [
  { label: '拼多多', value: '拼多多' },
  { label: '淘宝', value: '淘宝' },
  { label: '京东', value: '京东' },
  { label: '闲鱼', value: '闲鱼' },
  { label: '其他', value: '其他' }
];

function getToday(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createDefaultForm(): AddGameForm {
  return {
    catalogGameId: '',
    name: '',
    mediaType: 'physical',
    platform: 'NS1',
    releaseDate: '',
    region: '港版',
    status: 'not_started',
    purchasePrice: '',
    purchaseShippingFee: '',
    purchaseDate: getToday(),
    purchaseChannel: '拼多多',
    note: '',
    coverUrl: ''
  };
}

function toAmount(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function createCatalogPrefillPatch(catalogItem: GameCatalogItem): Partial<AddGameForm> {
  return {
    catalogGameId: catalogItem.id,
    name: catalogItem.name,
    platform: catalogItem.platform,
    releaseDate: catalogItem.releaseDate ?? '',
    coverUrl: catalogItem.coverUrl ?? ''
  };
}

Page({
  data: {
    mediaTypeOptions,
    platformOptions,
    regionOptions,
    statusOptions: physicalStatusOptions,
    channelOptions: physicalChannelOptions,
    form: createDefaultForm(),
    isSaving: false
  },

  onShow() {
    const tabBar = typeof this.getTabBar === 'function' ? this.getTabBar() : null;

    if (tabBar) {
      tabBar.setData({ selected: 2, hidden: true });
    }
  },

  onBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }

    wx.switchTab({ url: '/pages/home/index' });
  },

  onInput(event: InputEvent) {
    const field = event.currentTarget.dataset.field as keyof AddGameForm;
    if (!field) return;

    this.setData({
      [`form.${field}`]: event.detail.value
    });
  },

  onSelectMediaType(event: WechatMiniprogram.TouchEvent) {
    const mediaType = event.currentTarget.dataset.value as GameMediaType;
    if (!mediaType || mediaType === this.data.form.mediaType) return;

    const isDigital = mediaType === 'digital';
    const nextStatusOptions = isDigital ? digitalStatusOptions : physicalStatusOptions;
    const nextChannelOptions = isDigital ? digitalChannelOptions : physicalChannelOptions;
    const currentStatus = this.data.form.status;
    const nextStatus = nextStatusOptions.some((item) => item.value === currentStatus) ? currentStatus : 'not_started';

    this.setData({
      statusOptions: nextStatusOptions,
      channelOptions: nextChannelOptions,
      'form.mediaType': mediaType,
      'form.status': nextStatus,
      'form.purchaseChannel': nextChannelOptions[0].value,
      'form.purchaseShippingFee': isDigital ? '' : this.data.form.purchaseShippingFee
    });
  },

  onSelectPlatform(event: WechatMiniprogram.TouchEvent) {
    this.setData({
      'form.platform': event.currentTarget.dataset.value as GamePlatform
    });
  },

  onSelectRegion(event: WechatMiniprogram.TouchEvent) {
    this.setData({
      'form.region': event.currentTarget.dataset.value
    });
  },

  onSelectStatus(event: WechatMiniprogram.TouchEvent) {
    this.setData({
      'form.status': event.currentTarget.dataset.value as GameStatus
    });
  },

  onSelectChannel(event: WechatMiniprogram.TouchEvent) {
    this.setData({
      'form.purchaseChannel': event.currentTarget.dataset.value
    });
  },

  onDateChange(event: WechatMiniprogram.PickerChange) {
    this.setData({
      'form.purchaseDate': event.detail.value
    });
  },

  prefillFromCatalogItem(catalogItem: GameCatalogItem) {
    // TODO: wire this to catalogApi.searchCatalogGames(keyword) after the add-page search UI is introduced.
    this.setData({
      form: {
        ...this.data.form,
        ...createCatalogPrefillPatch(catalogItem)
      }
    });
  },

  onChooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles[0];
        if (!file) return;

        this.setData({
          'form.coverUrl': file.tempFilePath
        });
      }
    });
  },

  onSaveGame() {
    this.saveGame(false);
  },

  onSaveAndContinue() {
    this.saveGame(true);
  },

  validateForm(): boolean {
    const form = this.data.form;

    if (!form.name.trim()) {
      wx.showToast({ title: '请填写游戏名称', icon: 'none' });
      return false;
    }

    if (!form.mediaType || !form.platform || !form.status) {
      wx.showToast({ title: '请选择完整游戏信息', icon: 'none' });
      return false;
    }

    if (!form.purchaseDate) {
      wx.showToast({ title: '请选择购买日期', icon: 'none' });
      return false;
    }

    if (toAmount(form.purchasePrice) <= 0) {
      wx.showToast({ title: '请填写买入价格', icon: 'none' });
      return false;
    }

    return true;
  },

  saveGame(continueAdding: boolean) {
    if (this.data.isSaving || !this.validateForm()) return;

    const form = this.data.form;
    const payload: CreateGameInput = {
      catalogGameId: form.catalogGameId || undefined,
      name: form.name.trim(),
      mediaType: form.mediaType,
      platform: form.platform,
      releaseDate: form.releaseDate || undefined,
      region: form.region,
      status: form.status,
      purchasePrice: toAmount(form.purchasePrice),
      purchaseShippingFee: form.mediaType === 'physical' ? toAmount(form.purchaseShippingFee) : 0,
      purchaseOtherFee: 0,
      purchaseDate: form.purchaseDate,
      purchaseChannel: form.purchaseChannel,
      note: form.note.trim(),
      coverUrl: form.coverUrl
    };

    this.setData({ isSaving: true });

    try {
      gameApi.createGame(payload);
      wx.showToast({ title: '游戏已保存', icon: 'success' });

      if (continueAdding) {
        this.setData({
          form: createDefaultForm(),
          statusOptions: physicalStatusOptions,
          channelOptions: physicalChannelOptions,
          isSaving: false
        });
        return;
      }

      this.setData({
        form: createDefaultForm(),
        statusOptions: physicalStatusOptions,
        channelOptions: physicalChannelOptions,
        isSaving: false
      });
      wx.switchTab({ url: '/pages/library/index' });
    } catch (error) {
      wx.showToast({ title: '保存失败，请稍后再试', icon: 'none' });
      this.setData({ isSaving: false });
    }
  }
});
