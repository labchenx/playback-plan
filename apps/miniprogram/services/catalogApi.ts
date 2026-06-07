import type { GameCatalogItem, GamePlatform } from '../types/game';

declare const require: <T = unknown>(path: string) => T;

const catalogSeed = require<GameCatalogItem[]>('../data/game-catalog.seed.json');

function sortByExcelOrder(games: GameCatalogItem[]): GameCatalogItem[] {
  return [...games].sort((a, b) => {
    const rowDiff = (a.sourceRow ?? Number.MAX_SAFE_INTEGER) - (b.sourceRow ?? Number.MAX_SAFE_INTEGER);
    return rowDiff || a.name.localeCompare(b.name);
  });
}

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLocaleLowerCase();
}

export const catalogApi = {
  getCatalogGames(): GameCatalogItem[] {
    return sortByExcelOrder(catalogSeed);
  },

  searchCatalogGames(keyword: string): GameCatalogItem[] {
    const normalizedKeyword = normalizeKeyword(keyword);
    const games = this.getCatalogGames();

    if (!normalizedKeyword) {
      return games;
    }

    return games.filter((game) => game.name.toLocaleLowerCase().includes(normalizedKeyword));
  },

  getCatalogGameById(id: string): GameCatalogItem | undefined {
    return this.getCatalogGames().find((game) => game.id === id);
  },

  filterCatalogByPlatform(platform: GamePlatform): GameCatalogItem[] {
    return this.getCatalogGames().filter((game) => game.platform === platform);
  }
};

export type { GameCatalogItem, GamePlatform };
