import type { GamePlatform } from '../types/game';

export type { GamePlatform } from '../types/game';

export type GameMediaType = 'physical' | 'digital';

export type GameStatus =
  | 'not_started'
  | 'playing'
  | 'finished'
  | 'abandoned'
  | 'to_payback'
  | 'selling'
  | 'sold'
  | 'collection';

export type GameItem = {
  id: string;
  catalogGameId?: string;
  name: string;
  mediaType: GameMediaType;
  platform: GamePlatform;
  releaseDate?: string;
  region?: string;
  status: GameStatus;
  purchasePrice: number;
  purchaseShippingFee: number;
  purchaseOtherFee: number;
  purchaseDate: string;
  purchaseChannel?: string;
  soldPrice?: number;
  sellShippingFee?: number;
  sellPlatformFee?: number;
  sellOtherFee?: number;
  soldDate?: string;
  sellChannel?: string;
  sellNote?: string;
  note?: string;
  coverUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateGameInput = Omit<GameItem, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateGameInput = Partial<Omit<GameItem, 'id' | 'createdAt' | 'updatedAt'>>;
export type SellGameInput = Pick<
  GameItem,
  'soldPrice' | 'soldDate' | 'sellChannel' | 'sellShippingFee' | 'sellPlatformFee' | 'sellOtherFee' | 'sellNote'
>;

const STORAGE_KEY = 'playback_plan_games';
const DIGITAL_BLOCKED_STATUS: GameStatus[] = ['to_payback', 'selling', 'sold'];

function readStoredGames(): GameItem[] {
  const value = wx.getStorageSync(STORAGE_KEY);
  return Array.isArray(value) ? (value as GameItem[]) : [];
}

function writeStoredGames(games: GameItem[]): void {
  wx.setStorageSync(STORAGE_KEY, games);
}

function createGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeGame(input: GameItem): GameItem {
  const isDigitalWithPhysicalStatus = input.mediaType === 'digital' && DIGITAL_BLOCKED_STATUS.includes(input.status);

  return {
    ...input,
    status: isDigitalWithPhysicalStatus ? 'not_started' : input.status,
    purchaseShippingFee: input.mediaType === 'digital' ? 0 : (input.purchaseShippingFee ?? 0),
    purchaseOtherFee: input.purchaseOtherFee ?? 0
  };
}

export const gameApi = {
  getUserGames(): GameItem[] {
    return readStoredGames()
      .map(normalizeGame)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  listGames(): GameItem[] {
    return this.getUserGames();
  },

  getGameById(id: string): GameItem | undefined {
    return this.getUserGames().find((game) => game.id === id);
  },

  createGame(input: CreateGameInput): GameItem {
    const now = new Date().toISOString();
    const game = normalizeGame({
      ...input,
      id: createGameId(),
      createdAt: now,
      updatedAt: now
    });

    writeStoredGames([game, ...readStoredGames()]);
    return game;
  },

  updateGame(id: string, input: UpdateGameInput): GameItem | undefined {
    const games = this.getUserGames();
    const target = games.find((game) => game.id === id);

    if (!target) return undefined;

    const updated = normalizeGame({
      ...target,
      ...input,
      id: target.id,
      createdAt: target.createdAt,
      updatedAt: new Date().toISOString()
    });

    writeStoredGames(games.map((game) => (game.id === id ? updated : game)));
    return updated;
  },

  sellGame(id: string, input: SellGameInput): GameItem | undefined {
    const target = this.getGameById(id);

    if (!target || target.mediaType !== 'physical') return undefined;

    return this.updateGame(id, {
      ...input,
      status: 'sold'
    });
  }
};
