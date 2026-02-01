# 看图猜词游戏 - 部署指南

## 项目结构

```
game/
├── frontend/     # Vue 前端 (部署到 Vercel)
├── backend/      # Express 后端 (部署到 Railway)
└── docs/         # 文档
```

## 🚀 部署步骤

### 第一步：推送代码到 GitHub

```bash
# 在 game 目录下执行
cd D:/myproject/game

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit: 看图猜词游戏"

# 在 GitHub 创建新仓库后，关联远程仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送代码
git push -u origin main
```

### 第二步：部署后端到 Railway

1. 访问 [Railway](https://railway.app/) 并登录
2. 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库，设置根目录为 `backend`
4. 添加环境变量：
   - `SUPABASE_URL` = 你的 Supabase URL
   - `SUPABASE_KEY` = 你的 Supabase Key
   - `SESSION_SECRET` = 一个随机字符串
   - `COZE_API_KEY` = 你的 Coze API Key
   - `COZE_WORKFLOW_ID` = 你的 Coze Workflow ID
   - `NODE_ENV` = production
   - `FRONTEND_URL` = (先留空，部署前端后再填)

5. Railway 会自动部署，获取后端 URL（如 `https://xxx.railway.app`）

### 第三步：部署前端到 Vercel

1. 访问 [Vercel](https://vercel.com/) 并登录
2. 点击 "Add New Project" → 导入 GitHub 仓库
3. 设置：
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
4. 添加环境变量：
   - `VITE_API_URL` = Railway 后端 URL（如 `https://xxx.railway.app`）
5. 点击 Deploy

### 第四步：更新 Railway 环境变量

回到 Railway，更新 `FRONTEND_URL` 为 Vercel 前端 URL（如 `https://xxx.vercel.app`）

## 📝 环境变量清单

### 后端 (Railway)

| 变量名 | 说明 |
|--------|------|
| SUPABASE_URL | Supabase 项目 URL |
| SUPABASE_KEY | Supabase anon key |
| SESSION_SECRET | Session 加密密钥 |
| COZE_API_KEY | Coze API 密钥 |
| COZE_WORKFLOW_ID | Coze 工作流 ID |
| NODE_ENV | 设为 `production` |
| FRONTEND_URL | Vercel 前端 URL |

### 前端 (Vercel)

| 变量名 | 说明 |
|--------|------|
| VITE_API_URL | Railway 后端 URL |

## ⚠️ 注意事项

1. **跨域 Cookie**：已配置 `sameSite: 'none'` 支持跨域
2. **HTTPS**：生产环境必须使用 HTTPS
3. **Session 存储**：当前使用内存存储，如果 Railway 重启会丢失登录状态
