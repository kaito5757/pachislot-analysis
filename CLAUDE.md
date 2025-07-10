# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 言語とコミュニケーション

**重要**: このプロジェクトでは、すべてのやり取りを日本語で行います。Claude Codeは日本語でコミュニケーションを取り、コメントや説明も日本語で記述してください。

## 開発コマンド

```bash
# TurboPackを使用した開発サーバー
npm run dev

# プロダクションビルド
npm run build

# コード品質チェック
npm run lint        # Biomeによるリンティング（自動修正付き）
npm run format      # Biomeによるフォーマット
npm run check       # リント + フォーマットの組み合わせ

# プロダクションサーバー
npm run start
```

## アーキテクチャ概要

これは、パチンコ店のスロットマシンデータを分析するNext.js 15 TypeScriptアプリケーションです。slorepo.comからデータをスクレイピングし、日本語インターフェースで分析機能を提供します。

### 技術スタック

- **Next.js 15** with App Router and Server Components
- **React 19** with TypeScript
- **Firebase/FireStore** データストレージ
- **Biome** リンティングとフォーマッティング（ESLint/Prettier不使用）
- **Tailwind CSS** with Shadcn/UI components
- **Axios + Cheerio** ウェブスクレイピング

### 主要ディレクトリ

- `/app/` - Next.js App Router構造
  - `/app/[parlor]/` - パーラー別の動的ページと台分析
  - `/app/scraping/` - Server Actionsを使用したウェブスクレイピング機能
  - `/app/setting/` - パーラー登録と設定
- `/components/` - Shadcn/UIを使用した再利用可能なUIコンポーネント
- `/lib/` - Firebase設定とユーティリティ関数

### データベース構造（Firestore）

```bash
parlours/{parlourId}
  └── machines/{machineId} - 台の設定情報
slots/{parlourId}
  └── data/{dataId} - 個別のスロット実績レコード
```

### ウェブスクレイピングシステム

メインのスクレイピング機能は`app/scraping/action.ts`にあります：

- `https://www.slorepo.com/hole/{parlourId}/{date}/kishu/?kishu={machineName}`からデータを取得
- 抽出データ：台番号、差枚数、ゲーム数、BB/RB回数、出玉率
- 既存日付をチェックして重複データの挿入を防止
- セキュアなサーバーサイド実行のためServer Actionsを使用

### コードスタイル（Biome設定）

- **インデント**: タブ（スペース不使用）
- **クォート**: JavaScript/TypeScriptでダブルクォート
- **行末**: 自動検出
- **インポート整理**: 有効
- **推奨ルール**: 有効

### 開発パターン

1. **Server Components**: Firebaseからのデータ取得に使用
2. **Server Actions**: フォームとデータ変更（スクレイピング、パーラー登録）に使用
3. **型安全性**: Zodによる厳密なTypeScript検証
4. **日本語ローカライゼーション**: すべてのUIテキストは日本語
5. **エラーハンドリング**: 適切なエラー境界とユーザーフィードバック
6. **Firebase統合**: サーバーサイドはAdmin SDK、リアルタイム更新はClient SDK

### データフロー

1. パーラーを台設定と共に登録
2. スクレイピングで各台の日次実績データを取得
3. 月次/年次分析用にデータを集約
4. データ分析用のCSVエクスポート機能
5. 差枚数実績に基づく出玉率計算

### 重要事項

- このアプリケーションは日本のパチンコ業界専用に設計されています
- すべての日付フォーマットは日本ロケール（`"ja"`）を使用
- スクレイピング対象：slorepo.com（外部依存）
- Firebaseコレクションは特定のネスト構造に従います
- UIコンポーネントはカスタムテーマを使用したShadcn/UIを使用