# 白玩计划 AGENTS.md

## 项目定位

白玩计划是一款面向 NS1、NS2、PS5 实体游戏玩家的微信小程序，用于记录实体游戏卡带 / 光盘的买入、持有、卖出和回血情况。

它不是游戏商城，不是游戏社区，也不是金融资产工具，而是一个带有玩家趣味的实体游戏账本。

## 必读文件

每次开发前优先阅读：

- `docs/01-product-requirements.md`
- `docs/02-technical-architecture.md`

如果任务涉及首页 UI 迁移，再阅读：

- `ui-project`

`ui-project` 是 Figma Make 生成的 React 首页代码，只作为 UI 参考，不是最终实现。

## 技术路线

当前 MVP 使用：

- 原生微信小程序
- TypeScript
- Monorepo
- 微信云开发可作为第一版后端方案

当前不要使用：

- React Web 作为最终产物
- Taro
- React Native
- UniApp
- Tailwind 作为最终小程序样式方案
- shadcn/ui、framer-motion、lucide-react 等 Web UI 依赖

后期可能做 React Native / Expo，但当前不要创建 RN 工程。后期只复用 `packages/shared`、`packages/domain`、`packages/api-client` 中的类型、业务计算和 API 封装。

## 项目结构

推荐结构：

```text
apps/miniprogram
packages/shared
packages/domain
packages/api-client
cloud
docs
ui-project
```

如果项目已有结构，优先遵循现有结构，不要为了匹配推荐结构而大幅重构。

## 小程序 Tab

MVP 底部 Tab 固定为：

- 首页
- 游戏库
- +
- 待回血
- 我的

## 首页快捷入口

首页快捷入口固定为：

- 登记买入
- 登记卖出
- 搜游戏库
- 待处理

如果 Figma 代码中有“扫码入库”，替换为“待处理”。  
如果有“登记录入”，改为“登记买入”。

## 游戏状态

状态使用：

```ts
export type GameStatus =
  | 'not_started'
  | 'playing'
  | 'finished'
  | 'abandoned'
  | 'to_payback'
  | 'selling'
  | 'sold'
  | 'collection';
```

`collection` 是数据层收藏状态，UI 中可以展示为：

- 传家宝
- 永久收藏 / 不卖出

MVP 阶段不要新增 `isHeirloom` 字段，除非任务明确要求重构数据模型。

收藏 / 传家宝游戏不进入待回血提醒。

## 核心计算

买入实际花费：

```text
买入实际花费 = 买入价格 + 买入运费 + 其他买入费用
```

卖出实际回血：

```text
卖出实际回血 = 卖出成交价 - 卖出运费 - 平台手续费 - 其他卖出费用
```

实际花费：

```text
实际花费 = 买游戏总花费 - 卖游戏总回血
```

白玩指数：

```text
白玩指数 = 卖出实际回血 / 买入实际花费 × 100
```

## 代码组织

- 类型、枚举、常量放在 `packages/shared`
- 白玩指数、首页统计、待回血规则等纯函数放在 `packages/domain`
- API 请求封装放在 `packages/api-client`
- 小程序页面放在 `apps/miniprogram/pages`
- 小程序组件放在 `apps/miniprogram/components`

页面不要直接写复杂业务计算。  
页面不要到处直接调用云数据库。  
应通过 service / api-client 封装调用。

## Figma React UI 迁移规则

当任务涉及 `ui-project` 时：

- JSX 转 WXML
- CSS / Tailwind 转 WXSS
- React state / props 转 Page data / setData
- onClick 转 bindtap
- map 转 wx:for
- 条件渲染转 wx:if
- img 转 image
- div / section / span 转 view / text

不要保留 React、Tailwind、lucide-react、framer-motion、shadcn/ui 等依赖。

如果 `app.json` 已配置 tabBar，不要在页面里重复写自定义底部导航。

## 产品用词

推荐使用：

- 买游戏花了
- 卖游戏回血
- 实际花费
- 白玩指数
- 白玩战绩
- 待回血
- 待处理
- 几乎白玩
- 倒赚游玩
- 传家宝

避免使用：

- 市值
- 浮盈
- 持仓
- 收益率
- 投资回报
- 未实现盈亏

## Codex 工作方式

每次任务请先：

1. 阅读 `AGENTS.md`
2. 阅读任务指定文档
3. 分析现有项目结构
4. 给出简短实施计划
5. 再开始修改文件

不要一上来重构整个项目。

## 禁止事项

- 不要把项目改成 React Web
- 不要引入 Taro
- 不要创建 React Native 工程，除非任务明确要求
- 不要新增扫码入库
- 不要使用金融投资类术语
- 不要在页面里直接写复杂业务计算
- 不要把云数据库操作散落在页面中
- 不要为了 UI 迁移大幅重构整个项目