# 阶段 3：MySQL 表结构与基础游戏库导入

## 1. 阶段目标

本阶段目标是在微信云托管 Express 后端项目中完成 `playback_data` 的基础业务表结构，并把 `/files/games.xlsx` 中的游戏发售记录导入 MySQL `game_catalog`。

本阶段只做建表和 Excel 导入，不开发业务 API，不改小程序前端 UI，也不做图片回写。

## 2. 完成内容

- 新增 `game_catalog` 表，用于保存基础游戏资料。
- 新增 `user_games` 表，用于保存用户自己的买入、持有、卖出和回血记录。
- 新增阶段 3 migration SQL。
- 新增可重复运行的 Excel 导入脚本。
- 导入时使用 Excel 的 `封面原图URL` 写入 `cover_url` 和 `source_original_url`。
- 导入时保留 Excel 的 `入库用本地图片` 到 `local_image_path`。
- 图片不写入 MySQL，不转 base64，不复制进小程序 assets。

## 3. 表结构说明

### game_catalog

`game_catalog` 是基础游戏资料表，不保存用户个人账本数据。

字段包括：

- `id`：主键，基于 `platform + name` 生成稳定 ID。
- `name`：游戏名。
- `platform`：平台，本阶段 Excel 导入默认 `NS1`。
- `release_date`：发售日期，尽量转为 `YYYY-MM-DD`。
- `publisher`：发行商，本阶段预留。
- `region`：区服，本阶段预留。
- `cover_url`：当前用于展示的封面原图 URL。
- `cover_thumb_url`：缩略图 URL，阶段 4 回写。
- `cover_file_id`：对象存储原图 file id，阶段 4 回写。
- `cover_thumb_file_id`：对象存储缩略图 file id，阶段 4 回写。
- `local_image_path`：Excel 中的本地图片路径，供后续对象存储同步使用。
- `source_original_url`：来源原图 URL。
- `source`：数据来源，本阶段为 `excel_import`。
- `source_row`：Excel 原始行号。
- `created_at` / `updated_at`：创建和更新时间。

唯一约束：

```text
platform + name
```

### user_games

`user_games` 是用户个人游戏账本表，保存用户自己的买入、持有、卖出和回血相关字段。

字段包括：

- `id`
- `openid`
- `catalog_game_id`
- `name`
- `media_type`
- `platform`
- `cover_url`
- `region`
- `edition`
- `game_condition`
- `status`
- `purchase_price`
- `purchase_shipping_fee`
- `purchase_other_fee`
- `purchase_date`
- `purchase_channel`
- `sold_price`
- `sold_date`
- `sell_channel`
- `sell_shipping_fee`
- `sell_platform_fee`
- `sell_other_fee`
- `sell_note`
- `note`
- `created_at`
- `updated_at`

`catalog_game_id` 可关联 `game_catalog.id`，删除 catalog 记录时用户记录保留，`catalog_game_id` 置空。

## 4. Excel 字段映射

Excel 来源：

```text
files/games.xlsx
```

脚本会自动扫描包含游戏名表头的 sheet。当前识别到：

```text
Sheet2
```

字段映射：

| Excel 字段 | MySQL 字段 |
| --- | --- |
| 游戏名 | `name` |
| 发售日期 | `release_date` |
| 封面原图URL | `cover_url`、`source_original_url` |
| 入库用本地图片 | `local_image_path` |

固定值：

| 字段 | 值 |
| --- | --- |
| `platform` | `NS1` |
| `source` | `excel_import` |
| `source_row` | Excel 原始行号 |

## 5. ID 与去重规则

ID 生成规则：

```text
catalog-{platform 小写}-{sha1(platform:name 小写) 前 12 位}
```

例如同一个 `platform + name` 会稳定生成同一个 catalog ID。

去重规则：

- 跳过空游戏名。
- 同一批 Excel 中，同一 `platform + name` 只保留第一条。
- MySQL 表上使用 `platform + name` 唯一约束。
- 重复运行导入脚本时，已有记录会按 `platform + name` 更新，不插入重复数据。

## 6. 图片字段策略

本阶段只保存图片引用信息：

- `cover_url` 使用 Excel 的 `封面原图URL`。
- `source_original_url` 同样使用 Excel 的 `封面原图URL`。
- `local_image_path` 保留 Excel 的 `入库用本地图片`。
- `cover_thumb_url`、`cover_file_id`、`cover_thumb_file_id` 本阶段留空。

本阶段明确不做：

- 不把图片二进制写入 MySQL。
- 不把图片转成 base64。
- 不复制图片进小程序 assets。
- 不回写对象存储 file id。

## 7. 文件变更

- `playplan_api/migrations/20260607_001_create_game_catalog_and_user_games.sql`
- `playplan_api/migrations/20260607_002_import_game_catalog_from_excel.sql`
- `playplan_api/scripts/import-game-catalog.js`
- `playplan_api/package.json`
- `playplan_api/package-lock.json`
- `docs/stage-statements/03-mysql-schema-and-catalog-import.statement.md`

## 8. migration 和导入脚本运行方式

进入后端目录：

```powershell
cd D:\code\playback-plan\playplan_api
```

本阶段目标库是云托管 MySQL 的 `playback_data`，不是本地 MySQL。优先在微信云托管 MySQL 控制台中选择 `playback_data`，执行 migration SQL：

```text
playplan_api/migrations/20260607_001_create_game_catalog_and_user_games.sql
```

然后继续执行 Excel 数据导入 SQL：

```text
playplan_api/migrations/20260607_002_import_game_catalog_from_excel.sql
```

如果需要通过命令行执行，也应使用云数据库连接信息，而不是 `127.0.0.1`。示例：

```powershell
$env:MYSQL_ADDRESS='<云数据库 host:port>'
$env:MYSQL_USERNAME='<云数据库用户名>'
$env:MYSQL_PASSWORD='<云数据库密码>'
$env:MYSQL_DATABASE='playback_data'

cmd /c "mysql.exe --default-character-set=utf8mb4 -h <云数据库 host> -P <云数据库 port> -u <云数据库用户名> -p playback_data < migrations\20260607_001_create_game_catalog_and_user_games.sql"
```

后端部署到云托管后，可通过只读诊断接口查询当前库中的表：

```text
GET https://<云托管服务域名>/api/db-tables
```

如果 Excel 更新过，可以重新生成导入 SQL：

```powershell
npm run export:game-catalog-sql
```

也可以先 dry-run 检查 Excel：

```powershell
npm run import:game-catalog:dry-run
```

如果不是在云数据库控制台执行 SQL，而是在拥有云数据库环境变量的后端运行环境里导入，可以执行：

```powershell
npm run import:game-catalog
```

可选参数：

```powershell
node scripts/import-game-catalog.js --input ..\files\games.xlsx --platform NS1
node scripts/import-game-catalog.js --sheet Sheet2
```

## 9. 测试方式

dry-run 验证：

```powershell
npm run import:game-catalog:dry-run
```

当前 dry-run 结果：

```json
{
  "sheet": "Sheet2",
  "headerRow": 1,
  "totalRows": 159,
  "imported": 159,
  "skippedEmptyName": 0,
  "duplicateRows": 0,
  "invalidDates": 0,
  "dryRun": true
}
```

导入后验证：

```sql
SELECT COUNT(*) FROM game_catalog;
SELECT COUNT(*) FROM game_catalog WHERE source = 'excel_import';
SELECT id, name, platform, release_date, cover_url, local_image_path
FROM game_catalog
ORDER BY source_row
LIMIT 5;
```

重复导入验证：

```powershell
npm run import:game-catalog
npm run import:game-catalog
```

第二次运行应主要表现为 `unchanged`，不应增加重复记录。

## 10. 当前限制

- 本阶段未开发 `game_catalog` 查询 API。
- 本阶段未开发 `user_games` 业务 API。
- 本阶段未切换小程序前端数据源。
- 本阶段未做对象存储 file id 回写。
- 本阶段未生成缩略图。
- 本阶段不处理图片上传，只保留 URL 和本地路径。
- 本地当前没有配置 MySQL 环境变量时，只能执行 dry-run，不能实际写入 `playback_data`。

## 11. 下一阶段建议

下一阶段建议：

```text
04-cover-storage-sync
```

建议完成：

- 读取 `game_catalog.local_image_path`。
- 批量上传原图到对象存储。
- 生成或上传缩略图。
- 回写 `cover_file_id`、`cover_thumb_file_id`、`cover_thumb_url`。
- 保留 `source_original_url` 用于追溯原始封面来源。
