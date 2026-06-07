# 阶段 1：基础游戏库初始化

## 1. 阶段目标

本阶段目标是把 Excel 中的游戏发售记录初始化为开发阶段可读取的基础游戏库 `game_catalog` 数据，并与用户自己的游戏账本记录 `user_games` 保持清晰区分。

基础游戏库只保存游戏资料，例如游戏名、平台、发售日、封面来源和后续云存储所需的本地图片路径。用户买入、持有、卖出、回血等账本数据仍然属于 `user_games`。

## 2. 本阶段完成内容

- 新增 `GameCatalogItem` 类型，用于描述基础游戏库条目。
- 从 `files/games.xlsx` 生成开发用 seed：`apps/miniprogram/data/game-catalog.seed.json`。
- 新增 `catalogApi`，提供基础游戏库读取、搜索、按 id 查询和按平台筛选能力。
- 当前只接入本地 seed 数据，不接云数据库。
- 在添加游戏页预留 catalog item 自动填充入口，后续可以接搜索选择 UI。
- 新增可重复运行的 seed 生成脚本，便于后续 Excel 更新后重新生成。

## 3. 数据来源

数据来源为：

```text
files/games.xlsx
```

实际读取的 sheet 为 `Sheet2`，字段包括：

- `序号`
- `游戏名称`
- `发售日期`
- `封面原图URL`
- `入库用本地图片`

字段映射规则：

- `游戏名称` -> `name`
- `发售日期` -> `releaseDate`，统一转为 `YYYY-MM-DD`
- `封面原图URL` -> `coverUrl` 和 `sourceOriginalUrl`
- `入库用本地图片` -> `localImagePath`
- `platform` 当前默认 `NS1`
- `source` 固定为 `excel_import`
- `sourceRow` 记录 Excel 原始数据行号，首条数据为第 2 行
- `id` 根据 `platform + name` 生成稳定 hash slug，重复导入时不会变化

导入结果：

- Excel 数据行数：159
- 最终导入：159
- 空游戏名跳过：0
- 重复数据跳过：0
- 无法解析日期：0

去重规则为同一 `platform + name` 只保留一条。

## 4. 数据模型

`GameCatalogItem` 字段设计：

```ts
type GameCatalogItem = {
  id: string
  name: string
  platform: 'NS1' | 'NS2' | 'PS5' | 'OTHER'
  releaseDate?: string
  publisher?: string
  region?: string

  coverUrl?: string
  coverThumbUrl?: string
  coverFileId?: string
  coverThumbFileId?: string
  localImagePath?: string
  sourceOriginalUrl?: string

  source: 'manual' | 'excel_import'
  sourceRow?: number

  createdAt: string
  updatedAt: string
}
```

`game_catalog` 和 `user_games` 的区别：

- `game_catalog` 是基础游戏资料库，不记录用户是否买入、买入价格、卖出回血、状态、备注等个人账本信息。
- `user_games` 是用户自己的游戏记录，保存买入、持有、卖出和白玩指数相关字段。
- 后续添加游戏页选择 catalog item 后，只把 `catalogGameId` 以及名称、平台、封面、发售日等基础字段带入用户表单，保存时仍然创建独立的 user game 记录。

## 5. 文件变更

- `scripts/generate-game-catalog-seed.py`：从 `files/games.xlsx` 生成本地 seed JSON，并输出导入统计。
- `apps/miniprogram/types/game.ts`：新增 `GamePlatform`、`GameCatalogSource`、`GameCatalogItem` 类型。
- `apps/miniprogram/data/game-catalog.seed.json`：开发阶段基础游戏库 seed 数据，共 159 条。
- `apps/miniprogram/services/catalogApi.ts`：新增基础游戏库读取和搜索封装。
- `apps/miniprogram/services/gameApi.ts`：复用 `GamePlatform` 类型，并为用户游戏记录预留 `catalogGameId`、`releaseDate`。
- `apps/miniprogram/pages/add/index.ts`：预留 `prefillFromCatalogItem`，后续添加游戏页搜索选择后可自动填充基础信息。
- `docs/stage-statements/01-game-catalog-init.statement.md`：本阶段说明文档。

## 6. 图片处理策略

开发阶段不把约 32MB 的图片复制进小程序包，原因是会增大小程序包体积，也不利于后续云存储和缩略图策略统一管理。

当前策略：

- 先使用 Excel 中的 `封面原图URL` 作为 `coverUrl` 展示封面。
- 同时保留 `入库用本地图片` 到 `localImagePath`，供后续批量处理使用。
- 不把图片转 base64。
- 不把图片二进制写入 JSON 或数据库。
- 如果开发工具或真机因为图片域名限制无法显示封面，当前先降级使用 placeholder。

后续云存储阶段：

- 批量压缩 `localImagePath` 对应的图片。
- 上传到微信云存储 / COS。
- 生成 `coverFileId`、`coverThumbFileId`、`coverThumbUrl`。
- 云存储完成后，再从远程原图 URL 展示切换为云存储文件和缩略图展示。

## 7. 测试方式

验证 seed JSON 是否生成：

```powershell
Test-Path apps/miniprogram/data/game-catalog.seed.json
```

验证导入数量：

```powershell
@'
import json
from pathlib import Path
items = json.loads(Path('apps/miniprogram/data/game-catalog.seed.json').read_text(encoding='utf-8'))
print(len(items))
'@ | python -
```

验证 catalogApi 逻辑：

- `getCatalogGames()` 应返回 159 条数据。
- `searchCatalogGames('塞尔达')` 应返回包含“塞尔达传说旷野之息”等名称的结果。
- `getCatalogGameById(id)` 应能按 seed 中的 `id` 找到对应条目。
- `filterCatalogByPlatform('NS1')` 当前应返回 159 条。

验证封面 URL 是否保留：

- 检查任意 seed 条目的 `coverUrl` 和 `sourceOriginalUrl`。
- 当前 `missing_cover` 为 0。
- 当前 `missing_local` 为 0。

重新生成 seed：

```powershell
python scripts/generate-game-catalog-seed.py --input files/games.xlsx --output apps/miniprogram/data/game-catalog.seed.json
```

## 8. 当前限制

- 当前未接云数据库，`catalogApi` 只读取本地 seed。
- 当前未上传图片到微信云存储 / COS。
- 当前未生成缩略图字段，`coverThumbUrl`、`coverFileId`、`coverThumbFileId` 仍为空。
- 当前未完整改造添加游戏页 UI，只预留了 `prefillFromCatalogItem`。
- 当前搜索只支持游戏名模糊搜索，尚未支持拼音、别名、发行商、区服等扩展搜索。
- 当前平台默认 `NS1`，因为 Excel 没有单独平台字段。

## 9. 下一阶段建议

下一阶段建议是：

```text
添加游戏页接入基础游戏库搜索与选择
```

需要实现：

- 搜索 `game_catalog`
- 选择游戏
- 自动填充名称、平台、封面、发售日
- 保存 `user_games` 时记录 `catalogGameId`
