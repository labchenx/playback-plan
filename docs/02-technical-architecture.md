# 白玩计划 - 技术架构文档（v0.4 修订版）

## 1. 文档目的

本文档用于指导「白玩计划」MVP 的技术选型、项目结构和后续开发方式。

主要面向：

- 使用 Codex 开发项目时的上下文说明
- 后续维护项目结构
- 后期从微信小程序扩展到 React Native App

---

## 2. 技术路线结论

### 2.1 第一版技术路线

MVP 第一版建议使用：

```text
原生微信小程序 + TypeScript + Monorepo
```

不使用 Taro。

### 2.2 原因

选择原生微信小程序的原因：

1. 第一版主要目标是尽快完成微信小程序 MVP
2. 原生小程序平台能力直接，调试路径短
3. Codex 更容易基于原生小程序结构生成和修改代码
4. 微信登录、云开发、上传图片、底部 Tab 等能力接入更直接
5. 避免 Taro 跨端抽象带来的调试和适配成本

### 2.3 后期 React Native 策略

后期如果开发 React Native App，不追求复用小程序 UI。

推荐复用：

- 类型定义
- 枚举常量
- 白玩指数计算
- 首页统计计算
- 待回血规则
- API 请求封装
- 数据模型

不强行复用：

- 小程序页面 UI
- 小程序组件
- 小程序导航
- 微信授权相关代码

---

## 3. 总体架构

采用：

```text
Monorepo + 原生小程序前端 + 共享业务逻辑包 + 后端/云函数层
```

推荐目录：

```text
playback-plan
├─ apps
│  ├─ miniprogram
│  └─ mobile
│
├─ packages
│  ├─ shared
│  ├─ domain
│  └─ api-client
│
├─ cloud
│  ├─ functions
│  └─ database
│
├─ docs
│  ├─ 01-product-requirements.md
│  ├─ 02-homepage-design.md
│  └─ 03-technical-architecture.md
│
├─ package.json
└─ README.md
```

---

## 4. 应用目录说明

### 4.1 apps/miniprogram

微信小程序主应用。

建议结构：

```text
apps/miniprogram
├─ pages
│  ├─ home
│  ├─ library
│  ├─ payback
│  └─ profile
│
├─ components
│  ├─ stat-card
│  ├─ game-card
│  ├─ action-button
│  └─ empty-state
│
├─ services
│  ├─ gameService.ts
│  ├─ dashboardService.ts
│  └─ userService.ts
│
├─ utils
├─ app.ts
├─ app.json
├─ app.wxss
├─ project.config.json
└─ tsconfig.json
```

页面对应底部 Tab：

```text
pages/home       首页
pages/library    游戏库
pages/payback    待回血
pages/profile    我的
```

### 4.2 apps/mobile

后期 React Native / Expo App 预留目录。

MVP 阶段可以只保留：

```text
apps/mobile
└─ README.md
```

后期开发时增加 React Native 工程，并复用 `packages` 中的逻辑。

---

## 5. packages 共享包设计

### 5.1 packages/shared

放共享类型、枚举、常量。

建议结构：

```text
packages/shared
├─ src
│  ├─ types.ts
│  ├─ enums.ts
│  ├─ constants.ts
│  └─ index.ts
└─ package.json
```

内容包括：

- GameItem 类型
- ActivityLog 类型
- 游戏平台枚举
- 游戏状态枚举
- 白玩等级枚举
- 渠道类型
- 通用常量

### 5.2 packages/domain

放业务计算逻辑。

建议结构：

```text
packages/domain
├─ src
│  ├─ cost.ts
│  ├─ playIndex.ts
│  ├─ dashboard.ts
│  ├─ paybackReminder.ts
│  └─ index.ts
└─ package.json
```

内容包括：

- 买入实际花费计算
- 卖出实际回血计算
- 白玩指数计算
- 白玩等级判断
- 首页统计计算
- 待回血提醒判断

### 5.3 packages/api-client

放接口调用封装。

建议结构：

```text
packages/api-client
├─ src
│  ├─ request.ts
│  ├─ gameApi.ts
│  ├─ dashboardApi.ts
│  ├─ activityApi.ts
│  └─ index.ts
└─ package.json
```

说明：

即使第一版使用微信云开发，也不建议页面直接调用数据库。

页面应该调用：

```ts
gameApi.createGame()
gameApi.updateGame()
gameApi.sellGame()
dashboardApi.getHomeStats()
```

这样后期从微信云开发切换到独立后端时，页面改动较小。

---

## 6. 后端 / 云函数选择

### 6.1 第一版推荐

第一版可以使用微信云开发：

```text
微信云函数 + 云数据库 + 云存储
```

原因：

- 适合微信小程序 MVP
- 登录接入方便
- 不需要单独部署服务器
- 文件存储方便用于游戏封面

### 6.2 需要注意

即使用微信云开发，也要避免页面直接散乱操作数据库。

不推荐：

```ts
wx.cloud.database().collection('games').add(...)
```

推荐：

```ts
gameApi.createGame(payload)
```

然后在 `api-client` 内部决定调用云函数还是 REST API。

### 6.3 后期可迁移

如果后期需要独立 App 或更复杂服务，可以迁移到：

```text
Node.js / NestJS / Express
PostgreSQL / MySQL
Prisma
REST API
```

由于页面调用已经通过 `api-client` 封装，迁移成本会更低。

---

## 7. 核心数据模型

### 7.1 GameItem

```ts
export type GamePlatform = 'NS1' | 'NS2' | 'PS5' | 'OTHER';

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
  userId: string;

  name: string;
  platform: GamePlatform;
  coverUrl?: string;
  region?: string;
  edition?: string;
  condition?: string;

  status: GameStatus;

  purchasePrice: number;
  purchaseShippingFee?: number;
  purchaseOtherFee?: number;
  purchaseDate: string;
  purchaseChannel?: string;

  soldPrice?: number;
  sellShippingFee?: number;
  sellPlatformFee?: number;
  sellOtherFee?: number;
  soldDate?: string;
  sellChannel?: string;

  note?: string;
  createdAt: string;
  updatedAt: string;
};
```

### 7.2 ActivityLog

```ts
export type ActivityType =
  | 'create'
  | 'update'
  | 'purchase'
  | 'sell'
  | 'status_change';

export type ActivityLog = {
  id: string;
  userId: string;
  gameItemId?: string;
  type: ActivityType;
  title: string;
  amount?: number;
  createdAt: string;
};
```

### 7.3 DashboardStats

```ts
export type DashboardStats = {
  actualCost: number;
  totalPurchaseCost: number;
  totalSellPayback: number;
  holdingCount: number;

  soldCount: number;
  nearlyFreePlayCount: number;
  profitPlayCount: number;
  highestPlayIndex?: number;

  paybackReminderCount: number;

  // 收藏 / 传家宝数量
  collectionCount: number;
};
```

### 7.4 状态与 UI 文案说明

数据层继续使用 `collection` 表示收藏状态。

UI 层可以将 `collection` 展示为：

```text
传家宝
永久收藏 / 不卖出
```

MVP 阶段不新增独立的 `isHeirloom` 字段，避免和现有 `status` 设计冲突。后续如果需要同时表达“已通关 + 传家宝”，再升级数据模型。

---

## 8. 核心业务计算

### 8.1 买入实际花费

```ts
export function calcPurchaseTotal(game: GameItem): number {
  return (
    game.purchasePrice +
    (game.purchaseShippingFee ?? 0) +
    (game.purchaseOtherFee ?? 0)
  );
}
```

### 8.2 卖出实际回血

```ts
export function calcSellNetAmount(game: GameItem): number | null {
  if (game.soldPrice == null) return null;

  return (
    game.soldPrice -
    (game.sellShippingFee ?? 0) -
    (game.sellPlatformFee ?? 0) -
    (game.sellOtherFee ?? 0)
  );
}
```

### 8.3 白玩指数

```ts
export function calcPlayIndex(
  purchaseTotal: number,
  sellNetAmount: number
): number | null {
  if (purchaseTotal <= 0) return null;
  return Math.round((sellNetAmount / purchaseTotal) * 100);
}
```

### 8.4 白玩等级

```ts
export function getPlayLevel(playIndex: number): string {
  if (playIndex >= 120) return '血赚玩家';
  if (playIndex >= 110) return '神级白玩';
  if (playIndex >= 100) return '倒赚游玩';
  if (playIndex >= 95) return '几乎白玩';
  if (playIndex >= 80) return '小亏体验';
  if (playIndex >= 60) return '正常回血';
  return '回血失败';
}
```

### 8.5 最终花费

```ts
export function calcFinalPlayCost(
  purchaseTotal: number,
  sellNetAmount: number
): number {
  return purchaseTotal - sellNetAmount;
}
```

说明：

- 结果 > 0：最终花费
- 结果 = 0：0 成本玩完
- 结果 < 0：倒赚金额

---

## 9. 首页统计计算

首页统计由 `packages/domain/dashboard.ts` 负责。

### 9.1 统计字段

需要计算：

- 实际花费
- 买游戏花了
- 卖游戏回血
- 当前持有
- 已卖出
- 几乎白玩数量
- 倒赚游玩数量
- 最高白玩指数
- 待回血提醒数量

### 9.2 计算规则

```text
买游戏花了 = 所有游戏买入实际花费总和

卖游戏回血 = 所有已出售游戏卖出实际回血总和

实际花费 = 买游戏花了 - 卖游戏回血

当前持有 = 状态不是 sold 的游戏数量

已卖出 = 状态为 sold 的游戏数量

几乎白玩 = 已出售且白玩指数 >= 95 的游戏数量

倒赚游玩 = 已出售且白玩指数 >= 100 的游戏数量

最高白玩指数 = 已出售游戏中白玩指数最大值

收藏 / 传家宝数量 = 状态为 collection 的游戏数量
```

---

## 10. 待回血规则

由 `packages/domain/paybackReminder.ts` 负责。

### 10.1 进入待回血的条件

```text
状态 = finished
状态 = abandoned
状态 = to_payback
状态 = selling
买入超过 90 天且状态 = not_started
```

### 10.2 不进入待回血的条件

```text
状态 = sold
状态 = collection（UI 展示为传家宝 / 收藏）
状态 = playing
```

### 10.3 返回结果

函数可以返回：

```ts
export type PaybackReminder = {
  gameId: string;
  reason:
    | 'finished'
    | 'abandoned'
    | 'marked_to_payback'
    | 'selling'
    | 'long_time_not_started';
  text: string;
};
```

示例文案：

```text
已通关，可以考虑卖掉回血
已弃坑，可以考虑处理
正在出售中，记得记录成交
买了很久还没开始玩
```

---

## 11. 小程序页面规划

### 11.1 首页 pages/home

功能：

- 展示核心账本卡片
- 展示快捷操作
- 展示白玩战绩
- 展示待回血提醒
- 展示最近记录

### 11.2 游戏库 pages/library

功能：

- 展示全部游戏
- 搜索游戏
- 筛选平台 / 状态
- 排序
- 进入详情
- 添加游戏

### 11.3 待回血 pages/payback

功能：

- 展示待回血游戏
- 显示待回血原因
- 支持记录卖出
- 支持标记收藏
- 支持暂不处理

### 11.4 我的 pages/profile

功能：

- 平台管理
- 渠道管理
- 数据导出
- 关于产品
- 意见反馈

---

## 12. 组件规划

### 12.1 通用组件

```text
components/stat-card
components/game-card
components/empty-state
components/action-button
components/section-card
components/status-tag
```

### 12.2 首页组件

```text
components/home/hero-header
components/home/ledger-summary-card
components/home/quick-actions
components/home/recent-games-card
components/home/play-stats-card
components/home/payback-reminder-card
components/home/recent-activity-card
```

### 12.3 首页快捷操作组件

`components/home/quick-actions` 展示 4 个入口：

```text
登记买入
登记卖出
搜游戏库
待处理
```

不要展示：

```text
扫码入库
```

推荐 action key：

```ts
export type HomeQuickActionKey =
  | 'purchase'
  | 'sell'
  | 'library_search'
  | 'pending';
```

文案映射：

```ts
export const HOME_QUICK_ACTION_LABEL: Record<HomeQuickActionKey, string> = {
  purchase: '登记买入',
  sell: '登记卖出',
  library_search: '搜游戏库',
  pending: '待处理',
};
```

### 12.4 传家宝标识组件

建议新增：

```text
components/game-card/collection-badge
```

用途：

- 当 `game.status === 'collection'` 时，在游戏封面右下角显示“传家宝”
- 不使用白底 PNG
- 推荐用 WXML + WXSS 或 SVG 实现
- 风格应轻量、圆润、与 App 原生 UI 统一

示例样式方向：

```text
暖金色 / 琥珀色
小圆章或小胶囊
文字：传家宝
说明：永久收藏 / 不卖出
```


---

## 13. Codex 开发建议

### 13.1 开发顺序

建议按照以下顺序开发：

```text
1. 初始化 monorepo 和小程序项目
2. 创建 shared 类型和枚举
3. 创建 domain 业务计算函数
4. 创建首页静态 UI
5. 调整首页快捷操作：登记买入、登记卖出、搜游戏库、待处理
6. 接入 mock 数据
7. 实现添加游戏
8. 实现游戏库
9. 实现记录卖出
10. 接入白玩指数计算
11. 实现待回血页
12. 接入云函数 / 云数据库
13. 清理 mock 数据
```

### 13.2 每次给 Codex 的任务方式

建议按模块给任务，不要一次性要求生成整个项目。

示例：

```text
请实现 packages/domain/playIndex.ts，包含买入实际花费、卖出实际回血、白玩指数、白玩等级计算，并补充基础单元测试。
```

```text
请实现 pages/home 首页 UI，使用 mock 数据展示核心账本卡片、快捷操作、白玩战绩、待回血提醒和最近记录。快捷操作必须是：登记买入、登记卖出、搜游戏库、待处理，不要出现扫码入库。
```

```text
请实现添加游戏页面，字段包括游戏名称、平台、买入价格、购买日期、当前状态，保存时调用 gameApi.createGame。
```

### 13.3 代码要求

- 使用 TypeScript
- 业务计算函数必须是纯函数
- 页面中不要写复杂计算
- 页面通过 service/api 获取数据
- 不要把云数据库操作散落在页面组件里
- 计算逻辑写在 `packages/domain`
- 类型写在 `packages/shared`
- 不要新增扫码入库相关页面、图标或字段
- `collection` 状态在 UI 上可以显示为“传家宝”

### 13.4 当前补充开发任务

基于现有设计稿，本轮 Codex 开发重点：

```text
1. 将首页快捷入口从“扫码入库”替换为“待处理”
2. 将“登记录入”调整为“登记买入”
3. 保持 4 个快捷入口布局不变
4. 图标风格统一，不使用扫码 / 相机图标
5. 在最近入库游戏卡片中支持 collection 状态显示为“传家宝”
6. 待回血规则继续排除 collection
7. 首页白玩战绩中可展示 collectionCount
```

---

## 14. 命名规范

### 14.1 项目仓库名

```text
playback-plan
```

### 14.2 中文产品名

```text
白玩计划
```

### 14.3 代码命名建议

白玩指数：

```ts
playIndex
```

白玩等级：

```ts
playLevel
```

待回血：

```ts
payback
```

卖出回血：

```ts
sellPayback
```

实际花费：

```ts
actualCost
```

收藏 / 传家宝：

```ts
collection
collectionCount
```

游戏记录：

```ts
gameItem
```

---

## 15. 后期 React Native 扩展

后期新增：

```text
apps/mobile
```

建议技术方向：

```text
React Native / Expo + TypeScript
```

复用内容：

```text
packages/shared
packages/domain
packages/api-client
```

不复用内容：

```text
apps/miniprogram/pages
apps/miniprogram/components
微信授权相关代码
微信云开发直接调用代码
```

### 15.1 后期 App 目录示例

```text
apps/mobile
├─ src
│  ├─ screens
│  ├─ components
│  ├─ navigation
│  └─ services
├─ app.json
└─ package.json
```

---

## 16. 风险和注意事项

### 16.1 不要过度设计

MVP 不需要：

- 微服务
- GraphQL
- 复杂权限系统
- 多端同步 UI
- 完整社区价格库

### 16.2 不要让 UI 和业务逻辑耦合

错误做法：

```text
在首页页面里直接计算所有白玩指数和首页统计。
```

正确做法：

```text
首页调用 dashboardService 获取统计结果。
统计逻辑放在 packages/domain/dashboard.ts。
```

### 16.3 不要依赖二手价格

第一版没有二手市场价格，因此不要提前设计需要市场价格才能成立的首页指标。

### 16.4 先保证核心闭环

第一版最重要闭环：

```text
添加游戏
↓
记录买入花费
↓
更新游戏状态
↓
记录卖出
↓
生成白玩指数
↓
首页展示白玩战绩
```

---

## 17. 第一版完成标准

MVP 完成时应满足：

1. 用户可以添加游戏
2. 用户可以查看游戏库
3. 用户可以编辑游戏状态
4. 用户可以记录卖出
5. 系统可以计算白玩指数
6. 首页可以展示实际花费、买游戏花了、卖游戏回血、当前持有
7. 首页可以展示白玩战绩
8. 首页可以展示待回血提醒
9. 待回血页可以列出可处理游戏
10. 我的页有基础设置入口
11. 首页快捷操作不出现扫码入库
12. 首页快捷操作为：登记买入、登记卖出、搜游戏库、待处理
13. 收藏状态游戏在 UI 中可以显示为传家宝
14. 收藏 / 传家宝游戏不进入待回血提醒
