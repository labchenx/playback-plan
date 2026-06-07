# 阶段 2：云托管后端、MySQL、对象存储基础接入

## 1. 阶段目标

本阶段目标是确认微信云托管 Express 后端服务、MySQL 数据库和对象存储三类基础设施已经具备可连接、可检查、可部署的基础能力。

本阶段只处理后端基础连接与检查接口，不创建业务表，不导入游戏库数据，也不开发 `game_catalog`、`user_games` 等业务 API。阶段完成后，后续开发可以基于稳定的健康检查、数据库连接模块和对象存储配置继续推进。

## 2. 本阶段完成内容

- 保留微信云托管 Express 模板作为后端基础，不引入 Nest、Taro、React Web 或其他复杂后端框架。
- 整理 Express 入口，将接口统一挂载到 `/api`。
- 移除模板计数器示例对数据库建表示例的依赖，避免本阶段创建无关业务表。
- 新增 MySQL 连接配置模块，数据库连接信息全部从环境变量读取。
- 新增 MySQL 连通性检查逻辑，通过 `SELECT 1 AS ok` 验证数据库可访问。
- 新增对象存储配置模块，COS 连接信息全部从环境变量读取。
- 新增对象存储连通性检查逻辑，通过 bucket 检查确认对象存储配置可用。
- 新增 `.env.example`，只保留变量名和占位值，不保存真实账号、密码或密钥。
- 新增三个基础检查接口：`GET /api/health`、`GET /api/db-check`、`GET /api/storage-check`。

## 3. 后端服务结构

后端项目位于独立仓库：

```text
D:\code\playplan_api
```

当前后端继续使用微信云托管 Express 模板，根目录保留：

```text
playplan_api
├─ index.js
├─ db.js
├─ index.html
├─ package.json
├─ package-lock.json
├─ Dockerfile
├─ container.config.json
├─ .env.example
└─ src
   ├─ config
   │  └─ env.js
   ├─ db
   │  └─ mysql.js
   ├─ routes
   │  └─ index.js
   └─ storage
      └─ cos.js
```

结构说明：

- `index.js`：Express 服务启动入口，负责中间件、首页、`/api` 路由挂载和错误处理。
- `db.js`：兼容模板根目录数据库模块入口，转发到 `src/db/mysql.js`。
- `src/config/env.js`：集中读取环境变量，并拆分 MySQL 地址。
- `src/db/mysql.js`：创建 Sequelize 连接并提供数据库检查方法。
- `src/storage/cos.js`：创建对象存储客户端并提供存储检查方法。
- `src/routes/index.js`：集中声明基础检查接口。

## 4. MySQL 连接方式

当前 MySQL 数据库名为：

```text
playback_data
```

连接方式：

- 后端通过 `sequelize` 和 `mysql2` 连接 MySQL。
- `MYSQL_ADDRESS` 使用 `host:port` 格式。
- `MYSQL_DATABASE` 配置为 `playback_data`。
- `MYSQL_USERNAME`、`MYSQL_PASSWORD` 从云托管环境变量或本地 `.env` 读取。
- 检查接口只执行 `SELECT 1 AS ok`，不创建表、不改表、不写入数据。

测试方式：

```http
GET /api/db-check
```

成功时返回 `code: 0`，并说明数据库检查状态为 `ok`。失败时只返回缺少的环境变量名或通用失败原因，不返回数据库密码、连接串明文或 SQL 错误细节。

## 5. 对象存储连接方式

对象存储用于后续保存游戏封面图和缩略图。MySQL 只保存图片访问标识或地址，例如：

- `cover_url`
- `cover_thumb_url`
- `cover_file_id`
- `cover_thumb_file_id`
- `local_image_path`

MySQL 不保存图片二进制本体，也不保存 base64 图片内容。

当前对象存储通过 COS SDK 检查 bucket 是否可访问。对象存储的 SecretId、SecretKey、Bucket、Region 均从环境变量读取。后续进入封面上传阶段时，再补充批量上传和 URL / fileID 回写逻辑。

## 6. 新增接口

### GET /api/health

用途：确认 Express 服务进程可用。

返回内容包括：

- 服务状态
- 服务名称
- 启动时长
- 当前时间
- 运行环境

该接口不依赖 MySQL 或对象存储。

### GET /api/db-check

用途：确认 MySQL 配置和连接可用。

检查内容：

- 环境变量是否完整。
- 是否可以连接 `playback_data`。
- 是否可以执行最小查询 `SELECT 1 AS ok`。

该接口不创建业务表。

### GET /api/storage-check

用途：确认对象存储配置和 bucket 访问能力可用。

检查内容：

- 环境变量是否完整。
- COS bucket 和 region 是否可访问。
- 后续封面图上传所需的存储基础配置是否具备。

该接口不上传图片，也不写入对象存储。

## 7. 环境变量说明

MySQL：

```text
MYSQL_ADDRESS
MYSQL_USERNAME
MYSQL_PASSWORD
MYSQL_DATABASE
```

对象存储：

```text
COS_SECRET_ID
COS_SECRET_KEY
COS_BUCKET
COS_REGION
COS_PREFIX
```

服务运行：

```text
PORT
NODE_ENV
```

说明：

- `MYSQL_DATABASE` 当前应配置为 `playback_data`。
- `COS_PREFIX` 可用于约定后续封面图对象路径，例如 `covers/`。
- 本地只提交 `.env.example`，不提交 `.env`。
- 云托管环境中通过服务环境变量配置真实值，不把真实密码或密钥写入代码、文档或 `container.config.json`。

## 8. 测试方式

### 本地测试

进入后端项目：

```powershell
cd D:\code\playplan_api
```

安装依赖：

```powershell
npm install
```

参考 `.env.example` 配置本地环境变量后启动：

```powershell
$env:PORT='3012'
npm start
```

访问检查接口：

```powershell
curl.exe http://localhost:3012/api/health
curl.exe http://localhost:3012/api/db-check
curl.exe http://localhost:3012/api/storage-check
```

如果未配置 MySQL 或对象存储环境变量，`db-check` 和 `storage-check` 会返回 503，并列出缺少的环境变量名。这属于预期行为。

### 云托管环境测试

在微信云托管服务中配置环境变量后，发布后端服务，然后访问：

```text
https://<云托管服务域名>/api/health
https://<云托管服务域名>/api/db-check
https://<云托管服务域名>/api/storage-check
```

预期结果：

- `/api/health` 返回 `code: 0`。
- `/api/db-check` 返回 `code: 0`，表示 `playback_data` 可连接。
- `/api/storage-check` 返回 `code: 0`，表示对象存储 bucket 可访问。

## 9. 当前限制

- 当前还没有创建 `game_catalog` 表。
- 当前还没有创建 `user_games` 表。
- 当前还没有导入 Excel 游戏发售数据到 MySQL。
- 当前还没有开发 `game_catalog` 业务接口。
- 当前还没有开发 `user_games` 业务接口。
- 当前还没有上传封面图到对象存储。
- 当前还没有生成 `cover_file_id`、`cover_thumb_file_id` 或缩略图 URL。
- 当前小程序前端仍然使用本地 seed / storage 作为开发阶段数据来源。

## 10. 下一阶段建议

下一阶段建议是：

```text
03-mysql-schema-and-catalog-import.statement.md
```

需要完成：

- 创建 `game_catalog` 表。
- 创建 `user_games` 表。
- 导入 Excel 游戏发售数据。
- `cover_url` 暂时使用 Excel 封面原图 URL。
- `local_image_path` 保留给对象存储回写阶段使用。

下一阶段仍建议先完成 schema 和基础游戏库导入，不急于扩展复杂业务接口。先让 MySQL 中存在可查询的 `game_catalog` 数据，再开发 catalog 查询 API 和前端切换逻辑。
