# 看图猜词游戏 - 部署指南

## 项目结构

```
game/
├── frontend/     # Vue 前端
├── backend/      # Express 后端
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

### 第二步：部署到 Vercel（全栈，推荐）

1. 访问 [Vercel](https://vercel.com/) 并登录
2. 点击 "Add New Project" → 导入 GitHub 仓库
3. **Root Directory** 选择仓库根目录（不要选 `frontend`）
4. 环境变量（必填）：
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SESSION_SECRET`
   - `COZE_API_KEY`
   - `COZE_WORKFLOW_ID`
   - `NODE_ENV=production`
   - `ADMIN_EMAILS` = 管理员邮箱（逗号分隔）

5. Vercel 会自动构建并部署：
   - 前端输出：`/`
   - 后端 API：`/api/*`

### （可选）分离部署：后端 Railway + 前端 Vercel

若你更想分离部署，请按以下流程：

1. 后端 Railway：根目录 `backend`，配置环境变量同上
2. 前端 Vercel：根目录 `frontend`，环境变量 `VITE_API_URL`
3. 前后端联调需要额外处理 CORS 与 Cookie（见注意事项）

## 📝 环境变量清单

### 后端 (Vercel / Railway)

| 变量名 | 说明 |
|--------|------|
| SUPABASE_URL | Supabase 项目 URL |
| SUPABASE_KEY | Supabase anon key |
| SESSION_SECRET | Session 加密密钥 |
| COZE_API_KEY | Coze API 密钥 |
| COZE_WORKFLOW_ID | Coze 工作流 ID |
| NODE_ENV | 设为 `production` |
| ADMIN_EMAILS | 管理员邮箱列表（逗号分隔） |

### 前端 (仅分离部署时需要)

| 变量名 | 说明 |
|--------|------|
| VITE_API_URL | Railway 后端 URL |

## ⚠️ 注意事项

1. **同域 Cookie**：当前 `sameSite: 'lax'`，适合同域（Vercel 全栈）
2. **跨域部署**：如果前后端分离，需要改为 `sameSite: 'none'` 且开启 CORS
3. **HTTPS**：生产环境必须使用 HTTPS
4. **Session 存储**：当前使用内存存储，函数重启会丢失登录状态
