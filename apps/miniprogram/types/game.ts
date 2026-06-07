export type GamePlatform = 'NS1' | 'NS2' | 'PS5' | 'OTHER';

export type GameCatalogSource = 'manual' | 'excel_import';

export type GameCatalogItem = {
  id: string;
  name: string;
  platform: GamePlatform;
  releaseDate?: string;
  publisher?: string;
  region?: string;

  coverUrl?: string;
  coverThumbUrl?: string;
  coverFileId?: string;
  coverThumbFileId?: string;
  localImagePath?: string;
  sourceOriginalUrl?: string;

  source: GameCatalogSource;
  sourceRow?: number;

  createdAt: string;
  updatedAt: string;
};
