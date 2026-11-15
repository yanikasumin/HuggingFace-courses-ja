# Hugging Face 学習コース日本語版

Hugging Face が公開している**無料の学習コース（英語）の日本語訳**です。LLM（大規模言語モデル）、AI エージェント、コンピュータビジョンなど、5つのコース・全316セクションを日本語で読めます。

このリポジトリは翻訳文（MDX）の置き場所です。**読む場合はウェブサイト版がおすすめです**（クイズがその場で答え合わせでき、用語集と全文検索が使えます）。

- **ウェブサイト: https://yanikasumin.github.io/HuggingFace-courses-ja/**
- このサイトは Hugging Face 公式コースの**非公式の日本語訳**です。原典（英語）は各コースの公式ページで読めます。

## 収録コース

### 1. [LLM コース](https://yanikasumin.github.io/HuggingFace-courses-ja/llm/)（全104セクション）

大規模言語モデル（LLM）の仕組みを基礎から学ぶ中心コース。Transformer の動作原理、Hugging Face Transformers の使い方、ファインチューニング、データセットとトークナイザの扱い、音声処理や独自モデルの構築までを扱います。

- 公式（英語）: https://huggingface.co/learn/llm-course
- 翻訳文: [`llm-ja/`](llm-ja/)

### 2. [Robotics コース](https://yanikasumin.github.io/HuggingFace-courses-ja/robotics/)（全11セクション）

ロボット学習の入門コース。古典的なロボティクスの基礎（運動学・制御）から、オープンソースライブラリ LeRobot を使ったロボット学習とデータセットの扱いまでを学びます。

- 公式（英語）: https://huggingface.co/learn/robotics-course
- 翻訳文: [`robotics-ja/`](robotics-ja/)

### 3. [Agents コース](https://yanikasumin.github.io/HuggingFace-courses-ja/agents/)（全74セクション）

AI エージェントの仕組みと作り方を学ぶコース。LLM とツールの連携、思考・行動・観察のサイクルを理解し、smolagents や LangGraph を使って実際にエージェントを構築し、評価する方法までを扱います。

- 公式（英語）: https://huggingface.co/learn/agents-course
- 翻訳文: [`agents-ja/`](agents-ja/)

### 4. [MCP コース](https://yanikasumin.github.io/HuggingFace-courses-ja/mcp/)（全36セクション）

Model Context Protocol（MCP）の入門コース。MCP の概念・アーキテクチャ・通信の仕組みを学び、Gradio などと連携する MCP アプリケーションを実際に構築します。

- 公式（英語）: https://huggingface.co/learn/mcp-course
- 翻訳文: [`mcp-ja/`](mcp-ja/)

### 5. [Community CV コース](https://yanikasumin.github.io/HuggingFace-courses-ja/cv/)（全91セクション）

コンピュータビジョンを基礎から学ぶコース。画像処理と CNN の基礎から、物体検出・セグメンテーション・Vision Transformer、拡散モデルやマルチモーダルモデルまでを扱います。

- 公式（英語）: https://huggingface.co/learn/computer-vision-course
- 翻訳文: [`cv-ja/`](cv-ja/)

## どのコースから始めるか

- 機械学習や LLM を基礎から学びたい → **LLM コース**（第1章から順に）
- AI エージェントを作りたい → **Agents コース**（LLM コース第1〜2章程度の知識があると進めやすい）
- 画像認識や画像生成に興味がある → **Community CV コース**（Unit 1 の基礎から）
- LLM に外部ツールをつなぐ仕組みを知りたい → **MCP コース**（短めで、他のコースと並行できる）
- ロボットを学習させたい → **Robotics コース**（全11セクションの入門編）

## 翻訳について

- 翻訳の方針は [TRANSLATION_RULES_HF.md](TRANSLATION_RULES_HF.md) にまとめています。説明文は日本語として自然な文章にし、専門用語は英語の資料や実務でもそのまま通用する表記にそろえています。
- 翻訳は全ページを原典と照合して確認しています。進捗と検証の記録は [PROGRESS.md](PROGRESS.md) にあります。
- 原典がその後更新されている場合、最新の英語版と内容が異なることがあります。

原典リポジトリと、翻訳の基準にしたコミット:

| コース | 原典 | コミット |
|---|---|---|
| LLM | [huggingface/course](https://github.com/huggingface/course) | `8b893f0e` |
| Robotics | [huggingface/robotics-course](https://github.com/huggingface/robotics-course) | `2a50023` |
| Agents | [huggingface/agents-course](https://github.com/huggingface/agents-course) | `9b3d6b3` |
| MCP | [huggingface/mcp-course](https://github.com/huggingface/mcp-course) | `dbfa79b` |
| Community CV | [huggingface/computer-vision-course](https://github.com/huggingface/computer-vision-course) | `8569c3c` |

## ライセンス

原典と同じ Apache License 2.0 です。本リポジトリの翻訳文は原典の派生物であり、著作権は原典の権利者に帰属します。

## 翻訳・公開者

霞ヶ関京（かすみがせき・きょう）。日本の公共政策と財政を学ぶ学生です。機械学習を独学する中で、Hugging Face の公式コースに日本語版がないことを不便に感じ、全5コースを翻訳して公開しました。YouTube では、歴史を題材にした替え歌の投稿もしています。

- GitHub: [@yanikasumin](https://github.com/yanikasumin)
- YouTube: [@KASUMI_MOF](https://www.youtube.com/@KASUMI_MOF)
