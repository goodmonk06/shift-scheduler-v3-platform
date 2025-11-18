# Shift Scheduler v3 - SaaS Platform

汎用シフト管理SaaSプラットフォーム。マルチテナント対応で、介護施設・飲食店・小売など、様々な業種のシフト管理をサポートします。

## 📋 目次

- [特徴](#特徴)
- [技術スタック](#技術スタック)
- [アーキテクチャ](#アーキテクチャ)
- [セットアップ](#セットアップ)
- [使い方](#使い方)
- [ディレクトリ構成](#ディレクトリ構成)
- [v2からの移行](#v2からの移行)

## ✨ 特徴

### コア機能

- **マルチテナント対応**: テナントごとに完全に分離されたデータ管理
- **RBAC (Role-Based Access Control)**: 管理者・マネージャー・スタッフの3段階権限
- **シフト自動生成**: ヒューリスティックアルゴリズムによる最適なシフト割当
- **柔軟なシフトパターン**: 業種に応じたカスタマイズ可能なパターン設定
- **制約ルール管理**: 労働基準法準拠やカスタムルールの設定
- **休暇申請管理**: スタッフの休暇申請・承認フロー

### SaaS機能

- **Stripe連携課金**: サブスクリプション管理と自動請求
- **3つの料金プラン**: Trial / Standard / Pro
- **プラン別制限**: 施設数・スタッフ数の上限管理

### UI/UX

- **モダンなダッシュボード**: リアルタイムの稼働状況表示
- **レスポンシブデザイン**: モバイル・タブレット対応
- **直感的な操作**: shadcn/uiによる洗練されたUI

## 🛠 技術スタック

### バックエンド

- **NestJS** - TypeScriptによるスケーラブルなNode.jsフレームワーク
- **Prisma** - 型安全なORMでPostgreSQLと連携
- **PostgreSQL** - リレーショナルデータベース
- **Redis** - キャッシュ・セッション管理
- **Passport + JWT** - 認証・認可
- **Stripe** - 決済・サブスクリプション管理

### フロントエンド

- **Next.js 14** - App Routerによるモダンなフレームワーク
- **React 18** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストのCSS
- **shadcn/ui** - 美しいコンポーネントライブラリ
- **Zustand** - 軽量な状態管理

### インフラ

- **Docker Compose** - ローカル開発環境
- **Swagger** - API自動ドキュメント生成

## 🏗 アーキテクチャ

### システム構成

```
┌─────────────┐
│  Frontend   │  Next.js (Port 3000)
│  (Next.js)  │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐
│  Backend    │  NestJS (Port 3001)
│  (NestJS)   │
└──────┬──────┘
       │
       ├──────▶ PostgreSQL (Port 5432)
       ├──────▶ Redis (Port 6379)
       └──────▶ Stripe API
```

### データモデル (主要エンティティ)

```
Tenant (テナント)
  ├── User (ユーザー)
  └── Facility (施設)
       ├── Staff (スタッフ)
       ├── ShiftPattern (シフトパターン)
       ├── ShiftAssignment (シフト割当)
       ├── ConstraintRule (制約ルール)
       └── LeaveRequest (休暇申請)
```

### マルチテナント設計

- 全てのデータに`tenantId`を付与
- ミドルウェアでJWTトークンから`tenantId`を抽出
- データアクセス時に自動的にテナントでフィルタリング

### シフト自動生成エンジン

```typescript
interface ISchedulerEngine {
  generate(input: ScheduleInput): Promise<ScheduleOutput>;
}
```

- インターフェース化により、将来的にOR-Toolsなどの高度なアルゴリズムへの差し替えが容易
- 現在はヒューリスティックエンジンを実装
- スキル要件、希望曜日、休暇などを考慮した割当

## 🚀 セットアップ

### 前提条件

- Node.js 18以上
- Docker & Docker Compose
- (オプション) Stripeアカウント

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd shift-scheduler-v3-platform
```

### 2. データベース起動

```bash
docker-compose up -d
```

### 3. バックエンドセットアップ

```bash
cd backend

# 依存関係のインストール
npm install

# 環境変数設定
cp .env.example .env
# .envファイルを編集してください

# Prismaマイグレーション
npx prisma migrate dev

# Seedデータ投入
npm run prisma:seed

# バックエンド起動
npm run start:dev
```

バックエンドは http://localhost:3001 で起動します。
Swagger UI: http://localhost:3001/api/docs

### 4. フロントエンドセットアップ

```bash
cd frontend

# 依存関係のインストール
npm install

# 環境変数設定
cp .env.example .env

# フロントエンド起動
npm run dev
```

フロントエンドは http://localhost:3000 で起動します。

### 5. ログイン

デモアカウントでログインできます：

**介護施設**
- Email: `admin@sakura-care.com`
- Password: `password123`

**飲食店**
- Email: `manager@bella-vita.com`
- Password: `password123`

## 📖 使い方

### シフト自動生成の流れ

1. **施設登録**: 設定画面から施設を登録
2. **スタッフ登録**: スタッフ管理画面からスタッフを登録（スキル、雇用形態、希望曜日など）
3. **シフトパターン登録**: シフトパターン画面でパターンを定義（早番、日勤、夜勤など）
4. **制約ルール設定**: 最大連続勤務日数、最小休憩時間などを設定
5. **シフト自動生成**: スケジュール画面で「自動生成」ボタンをクリック
6. **確認・調整**: 生成されたシフトを確認し、必要に応じて手動調整
7. **公開**: スタッフに公開

### API使用例

```bash
# ログイン
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sakura-care.com","password":"password123"}'

# スタッフ一覧取得（要Bearer Token）
curl http://localhost:3001/api/staff \
  -H "Authorization: Bearer <your-token>"

# シフト生成
curl -X POST http://localhost:3001/api/scheduler/generate \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "facilityId": "facility-id",
    "startDate": "2025-02-01",
    "endDate": "2025-02-28"
  }'
```

## 📁 ディレクトリ構成

```
shift-scheduler-v3-platform/
├── backend/                    # NestJSバックエンド
│   ├── prisma/
│   │   ├── schema.prisma      # Prismaスキーマ定義
│   │   └── seed.ts            # Seedデータ
│   └── src/
│       ├── auth/              # 認証モジュール
│       ├── tenant/            # テナント管理
│       ├── facility/          # 施設管理
│       ├── staff/             # スタッフ管理
│       ├── shift-pattern/     # シフトパターン
│       ├── shift-assignment/  # シフト割当
│       ├── constraint-rule/   # 制約ルール
│       ├── leave-request/     # 休暇申請
│       ├── billing/           # Stripe課金
│       ├── scheduler/         # シフト自動生成エンジン
│       │   ├── interfaces/    # エンジンインターフェース
│       │   └── engines/       # 具体的な実装
│       ├── common/
│       │   ├── decorators/    # カスタムデコレーター
│       │   ├── guards/        # RBACガード
│       │   └── middleware/    # マルチテナントミドルウェア
│       └── prisma/            # Prismaサービス
│
├── frontend/                  # Next.jsフロントエンド
│   ├── app/
│   │   ├── (dashboard)/       # ダッシュボードグループ
│   │   │   ├── dashboard/     # ダッシュボード
│   │   │   ├── staff/         # スタッフ管理
│   │   │   ├── patterns/      # パターン管理
│   │   │   ├── schedule/      # スケジュール
│   │   │   ├── billing/       # 課金管理
│   │   │   └── settings/      # 設定
│   │   └── login/             # ログイン画面
│   ├── components/
│   │   ├── ui/                # shadcn/uiコンポーネント
│   │   └── layout/            # レイアウトコンポーネント
│   └── lib/
│       ├── api.ts             # API クライアント
│       └── utils.ts           # ユーティリティ
│
└── docker-compose.yml         # PostgreSQL & Redis
```

## 🔄 v2からの移行

### 主な変更点

| v2 (welfare-shift-scheduler-core) | v3 (shift-scheduler-v3-platform) |
|-----------------------------------|----------------------------------|
| シングルテナント                     | マルチテナント対応                  |
| ローカルアプリ                       | SaaSプラットフォーム                |
| 介護施設特化                        | 汎用的な業種対応                    |
| スタンドアロン                       | Stripe課金統合                     |

### 移行パス (高レベル)

1. **データ移行**
   - v2の施設データを新しいTenantとして登録
   - スタッフデータをマイグレーション（新しいスキーマに合わせて変換）
   - シフトパターンを再定義

2. **アルゴリズム統合**
   - v2の最適化エンジン(`welfare-shift-scheduler-core`)を`ISchedulerEngine`インターフェースに準拠するよう実装
   - `backend/src/scheduler/engines/`に新しいエンジンを追加
   - エンジンの切り替えは設定で制御

3. **移行スクリプト例**
   ```typescript
   // backend/src/migration/migrate-v2.ts
   async function migrateFromV2(v2Data: V2Data) {
     // 1. Tenant作成
     const tenant = await prisma.tenant.create({...});

     // 2. Facility作成
     const facility = await prisma.facility.create({
       tenantId: tenant.id,
       ...
     });

     // 3. Staff移行
     // 4. ShiftPattern移行
     // 5. 既存シフト履歴の移行（オプション）
   }
   ```

## 🧪 テスト

```bash
# バックエンドのテスト
cd backend
npm run test

# フロントエンドのテスト
cd frontend
npm run test
```

## 📝 ライセンス

MIT

## 🤝 コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📮 サポート

問題や質問がある場合は、GitHubのissueを開いてください。

---

**Built with ❤️ using NestJS, Next.js, and TypeScript**
