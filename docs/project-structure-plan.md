# 白玩计划项目结构规划

## 1. 结论

当前建议保持两个独立仓库：

- 前端仓库：`playback-plan`
- 后端仓库：`playplan_api`

现阶段不建议把两个仓库合并为 monorepo。前端已经形成原生微信小程序页面结构，后端是微信云托管 Express 服务模板，两者部署、调试和发布节奏不同。先把 API 契约、目录边界和数据导入流程稳定下来，比现在迁移仓库结构更重要。

后续如果需要 React Native / Expo、后台管理端、共享 npm 包发布，再评估 monorepo 或 workspace 化。

## 2. 当前仓库结构分析

### 2.1 前端仓库 `playback-plan`

当前结构要点：

```text
playback-plan
├─ apps
│  └─ miniprogram
│     ├─ pages
│     │  ├─ home
│     │  ├─ library
│     │  ├─ add
│     │  ├─ game-detail
│     │  ├─ sell-game
│     │  ├─ sell-result
│     │  ├─ stats
│     │  └─ settings
│     ├─ components
│     ├─ custom-tab-bar
│     ├─ services
│     │  ├─ catalogApi.ts
│     │  └─ gameApi.ts
│     ├─ data
│     │  └─ game-catalog.seed.json
│     ├─ types
│     ├─ utils
│     ├─ styles
│     └─ assets
├─ docs
│  ├─ 01-product-requirements.md
│  ├─ 02-technical-architecture.md
│  └─ stage-statements
├─ files
├─ scripts
└─ ui-project
```

现状判断：

- 小程序前端以静态 UI 和本地数据为主，页面基本已经成型。
- `gameApi.ts` 目前封装 `wx storage` 中的用户游戏记录。
- `catalogApi.ts` 目前读取 `game-catalog.seed.json`。
- `files` 中有 Excel 和封面图片，适合开发阶段导入使用，不应进入小程序包体。
- `docs/stage-statements` 已经保存阶段说明，例如 `01-game-catalog-init.statement.md`。

### 2.2 后端仓库 `playplan_api`

当前结构要点：

```text
playplan_api
├─ index.js
├─ db.js
├─ index.html
├─ package.json
├─ Dockerfile
├─ container.config.json
├─ README.md
└─ LICENSE
```

现状判断：

- 这是微信云托管 Express 模板，当前主要是计数器示例。
- `index.js` 同时承担 app 初始化、路由注册、示例 API 和启动服务。
- `db.js` 使用 `sequelize` 连接 MySQL，并定义 `Counter` 示例模型。
- 数据库账号密码从环境变量读取，方向正确，但需要拆出配置和业务模型。
- `container.config.json` 仍是模板配置，默认数据库名为 `nodejs_demo`，后续应改成白玩计划自己的数据库名。

## 3. 为什么当前保持独立仓库

建议保持独立仓库的原因：

- 前端是微信小程序工程，主要由微信开发者工具打开和预览；后端是云托管容器服务，主要通过 Docker / 云托管发布。
- 后端未来会拥有 MySQL schema、导入脚本、图片上传脚本和服务端环境变量，这些不应该混进小程序工程。
- 封面图片约 32MB，不适合进入小程序包。独立后端仓库更容易把 `files` 作为导入输入或本地临时数据管理。
- 当前前端已有大量未提交页面和组件结构，强行迁移 monorepo 会产生大量路径变更，容易打断 MVP 进度。
- 共享类型当前可以先通过接口文档和手动同步维护，等 API 稳定后再考虑生成或抽出共享包。

独立仓库的代价：

- 前后端类型不能天然共享。
- API 字段变更需要同步更新两边。
- 本地联调需要分别启动小程序和后端服务。

当前可以接受这些代价，因为 MVP 的核心风险是数据模型和 API 闭环，不是仓库治理。

## 4. 如果改成 monorepo 的迁移成本

如果后续要合并为 monorepo，目标结构可能是：

```text
playback-plan
├─ apps
│  ├─ miniprogram
│  └─ api
├─ packages
│  ├─ shared
│  ├─ domain
│  └─ api-client
├─ cloud
├─ docs
└─ files
```

迁移成本包括：

- 后端 Git 历史需要保留或合并，处理起来不如独立仓库直接。
- 微信云托管构建目录要从仓库根目录改为 `apps/api`，Dockerfile、package.json、部署配置都要调整。
- 前端小程序 project config、导入路径和开发者工具打开路径需要重新确认。
- `files` 目录的大文件归属要重新规划，否则容易误把图片带进前端工程。
- 需要建立 workspace、lint、build、类型共享规则，短期会消耗 MVP 开发时间。

因此当前不建议迁移。等接口稳定、数据导入跑通、前端不再依赖 storage 后，再评估是否合并。

## 5. 前端仓库建议结构

前端仓库继续保留原生小程序结构，重点是把 API 调用从页面和 storage 中抽出来。

建议结构：

```text
playback-plan
├─ apps
│  └─ miniprogram
│     ├─ pages
│     ├─ components
│     ├─ custom-tab-bar
│     ├─ services
│     │  ├─ request.ts
│     │  ├─ catalogApi.ts
│     │  ├─ gameApi.ts
│     │  ├─ dashboardApi.ts
│     │  ├─ paybackApi.ts
│     │  └─ activityApi.ts
│     ├─ config
│     │  └─ api.ts
│     ├─ types
│     │  ├─ game.ts
│     │  ├─ catalog.ts
│     │  ├─ dashboard.ts
│     │  └─ api.ts
│     ├─ utils
│     ├─ styles
│     ├─ assets
│     └─ data
│        └─ mock-only
├─ docs
│  └─ stage-statements
├─ scripts
├─ files
└─ ui-project
```

说明：

- `services/request.ts` 是唯一底层请求入口，页面不直接调用 `wx.request` 或 `wx.cloud.callContainer`。
- `catalogApi.ts` 只负责基础游戏库接口。
- `gameApi.ts` 只负责用户自己的游戏记录。
- `dashboardApi.ts` 负责首页账本统计。
- `paybackApi.ts` 负责待回血列表。
- `activityApi.ts` 负责最近记录。
- `data/game-catalog.seed.json` 后续只保留为开发 fallback 或 mock，不再作为长期数据源。
- `files` 中的 Excel 和图片不复制到 `apps/miniprogram/assets`。

## 6. 后端仓库建议结构

后端继续使用微信云托管 Express 模板，不引入 Nest、Taro、React 或复杂框架。建议做轻量分层：

```text
playplan_api
├─ src
│  ├─ app.js
│  ├─ server.js
│  ├─ config
│  │  ├─ env.js
│  │  └─ database.js
│  ├─ db
│  │  ├─ sequelize.js
│  │  ├─ init.js
│  │  └─ models
│  │     ├─ gameCatalog.model.js
│  │     ├─ userGame.model.js
│  │     └─ activityLog.model.js
│  ├─ middleware
│  │  ├─ authOpenId.js
│  │  ├─ errorHandler.js
│  │  └─ notFound.js
│  ├─ modules
│  │  ├─ catalog
│  │  │  ├─ catalog.routes.js
│  │  │  ├─ catalog.controller.js
│  │  │  ├─ catalog.service.js
│  │  │  └─ catalog.repository.js
│  │  ├─ games
│  │  │  ├─ games.routes.js
│  │  │  ├─ games.controller.js
│  │  │  ├─ games.service.js
│  │  │  └─ games.repository.js
│  │  ├─ dashboard
│  │  │  ├─ dashboard.routes.js
│  │  │  ├─ dashboard.controller.js
│  │  │  └─ dashboard.service.js
│  │  ├─ payback
│  │  │  ├─ payback.routes.js
│  │  │  ├─ payback.controller.js
│  │  │  └─ payback.service.js
│  │  └─ activities
│  │     ├─ activities.routes.js
│  │     ├─ activities.controller.js
│  │     └─ activities.service.js
│  ├─ routes
│  │  └─ index.js
│  └─ utils
│     ├─ response.js
│     ├─ pagination.js
│     └─ money.js
├─ scripts
│  ├─ import-game-catalog.js
│  ├─ upload-covers.js
│  └─ generate-thumbnails.js
├─ migrations
├─ seeders
├─ files
│  ├─ imports
│  └─ covers
├─ docs
│  ├─ api.md
│  ├─ database.md
│  └─ deploy.md
├─ index.js
├─ package.json
├─ Dockerfile
├─ container.config.json
└─ README.md
```

落地方式建议循序渐进：

1. 保留根目录 `index.js` 作为云托管启动入口。
2. 让根目录 `index.js` 只做 `require('./src/server')`，把 Express app 和路由放进 `src`。
3. 先迁移模板计数器示例，确认云托管启动正常。
4. 再新增 catalog、games、dashboard 等业务模块。

### 6.1 配置与密钥

数据库配置只从环境变量读取：

```text
MYSQL_ADDRESS
MYSQL_USERNAME
MYSQL_PASSWORD
MYSQL_DATABASE
NODE_ENV
```

要求：

- 不把数据库账号密码写死到代码。
- 不提交真实 `.env`。
- 可以提供 `.env.example`，只写变量名和示例占位。
- `container.config.json` 不保存真实密码。

### 6.2 MySQL 表建议

MVP 最小表：

```text
game_catalog
user_games
activity_logs
```

`game_catalog` 保存基础游戏资料：

```text
id
name
platform
release_date
publisher
region
cover_url
cover_thumb_url
cover_file_id
cover_thumb_file_id
local_image_path
source_original_url
source
source_row
created_at
updated_at
```

`user_games` 保存用户游戏账本：

```text
id
user_id
catalog_game_id
name
media_type
platform
release_date
region
status
purchase_price
purchase_shipping_fee
purchase_other_fee
purchase_date
purchase_channel
sold_price
sell_shipping_fee
sell_platform_fee
sell_other_fee
sold_date
sell_channel
sell_note
note
cover_url
created_at
updated_at
```

`activity_logs` 保存最近记录：

```text
id
user_id
game_id
type
title
amount
created_at
```

实体版和数字版规则在服务层校验：

- `media_type = physical` 参与买入、卖出、回血、白玩指数、待回血统计。
- `media_type = digital` 只进入游戏库，不允许 `to_payback`、`selling`、`sold`，不参与卖出和白玩统计。
- `status = collection` 可以在 UI 展示为传家宝，不进入待回血提醒。

### 6.3 API 路由建议

基础接口：

```text
GET /api/health
GET /api/wx/openid
```

基础游戏库：

```text
GET /api/catalog/games
GET /api/catalog/games/:id
```

用户游戏：

```text
GET /api/games
POST /api/games
GET /api/games/:id
PATCH /api/games/:id
DELETE /api/games/:id
POST /api/games/:id/sell
PATCH /api/games/:id/status
```

首页和待回血：

```text
GET /api/dashboard/summary
GET /api/payback/games
GET /api/activities
```

管理和导入接口建议先不暴露给小程序。Excel 导入、封面上传优先使用后端 `scripts` 离线执行。

## 7. 前端 API 调用结构

### 7.1 `request.ts`

`request.ts` 负责统一：

- base URL / 云托管服务配置
- HTTP method
- query 和 body
- loading 可选项
- 错误提示
- 响应 code 解包
- 登录态和 openid 相关 header 处理

建议接口形态：

```ts
request<T>({
  url: '/api/games',
  method: 'GET',
  data: {}
})
```

底层可以先使用 `wx.cloud.callContainer`，如果后续切换普通 HTTPS 域名，只改 `request.ts`。

### 7.2 `catalogApi.ts`

职责：基础游戏库查询。

```ts
catalogApi.listCatalogGames(params)
catalogApi.searchCatalogGames(keyword)
catalogApi.getCatalogGameById(id)
```

对应后端：

```text
GET /api/catalog/games
GET /api/catalog/games/:id
```

### 7.3 `gameApi.ts`

职责：用户自己的游戏记录。

```ts
gameApi.listGames(params)
gameApi.getGameById(id)
gameApi.createGame(input)
gameApi.updateGame(id, input)
gameApi.updateGameStatus(id, status)
gameApi.sellGame(id, input)
gameApi.deleteGame(id)
```

对应后端：

```text
GET /api/games
GET /api/games/:id
POST /api/games
PATCH /api/games/:id
PATCH /api/games/:id/status
POST /api/games/:id/sell
DELETE /api/games/:id
```

### 7.4 `dashboardApi.ts` 和 `paybackApi.ts`

首页不要直接拉全量 games 再在页面计算。建议：

```ts
dashboardApi.getSummary()
paybackApi.listPaybackGames(params)
activityApi.listRecentActivities()
```

对应后端：

```text
GET /api/dashboard/summary
GET /api/payback/games
GET /api/activities
```

复杂计算放在后端 service，前端只做展示。以后如果抽共享 domain 包，再把同一套纯函数复用到前后端。

## 8. `docs/stage-statements` 保存规则

阶段说明建议继续放在前端产品仓库，因为它描述的是产品和交付阶段，不是后端私有实现。

后续推荐统一为目录式结构：

```text
playback-plan
└─ docs
   └─ stage-statements
      ├─ 01-game-catalog-init
      │  └─ statement.md
      ├─ 02-backend-structure-plan
      │  └─ statement.md
      ├─ 03-catalog-api-mysql
      │  └─ statement.md
      └─ 04-user-games-api
         └─ statement.md
```

当前已有的 `docs/stage-statements/01-game-catalog-init.statement.md` 可以先保留，不必为了命名统一立即移动。下一次整理阶段文档时，再迁移为 `docs/stage-statements/01-game-catalog-init/statement.md`。

每个 `statement.md` 建议包含：

- 阶段目标
- 完成内容
- 涉及仓库
- API / 数据库 / 前端调用变化
- 文件变更
- 验证方式
- 当前限制
- 下一阶段建议

如果某个阶段主要修改后端，可以在后端仓库 `docs` 中写技术细节，但前端仓库的 `stage-statements/<stage>/statement.md` 仍作为总入口，并链接后端文档。

## 9. 图片和 Excel 处理原则

基础游戏库来自 Excel 和本地封面图片，但处理边界要清楚：

- Excel 是导入源，不是运行时数据源。
- MySQL 的 `game_catalog` 是后端运行时数据源。
- 封面图片上传到云存储 / COS 后，接口返回 `coverThumbUrl` 或可访问的 `coverUrl`。
- 小程序只展示 URL，不保存 32MB 图片。
- 不把图片转 base64。
- 不把图片二进制写入 JSON 或 MySQL。
- 不把 `files/nintendo_store_covers_hq` 复制进 `apps/miniprogram/assets`。

建议后续导入链路：

```text
files/games.xlsx
↓
scripts/import-game-catalog.js
↓
game_catalog
↓
scripts/upload-covers.js
↓
云存储 / COS
↓
回写 coverFileId / coverThumbUrl
↓
前端 catalogApi 展示缩略图
```

## 10. 下一阶段推荐开发顺序

下一阶段建议从后端基础结构和 `game_catalog` API 开始，而不是先改前端页面。

推荐顺序：

1. 在 `playplan_api` 建立轻量 `src` 目录，保留 Express 和 Sequelize。
2. 拆出环境变量配置、数据库连接、统一响应和错误处理中间件。
3. 建立 `game_catalog` Sequelize model。
4. 写 `scripts/import-game-catalog.js`，从 Excel 导入 MySQL。
5. 实现 `GET /api/catalog/games` 和 `GET /api/catalog/games/:id`。
6. 前端新增 `services/request.ts`，把 `catalogApi.ts` 从本地 seed 切到后端 API。
7. 再实现 `user_games` 的新增、列表、详情和卖出 API。

这样做的好处是：先把基础游戏库从本地 seed 迁到后端，验证云托管 Express + MySQL + 小程序 request 的主链路。链路打通后，再迁移用户游戏记录，风险最小。
