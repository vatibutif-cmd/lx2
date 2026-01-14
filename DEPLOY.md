# 部署指南 (腾讯云/阿里云)

本项目已优化为**单端口服务**模式：后端 Node.js 服务 (Port 3001) 会自动托管 React 前端静态文件。部署时无需额外配置 Nginx 反向代理（除非需要 HTTPS 或域名映射）。

## 1. 准备工作
确保本地代码已提交或打包。
- 核心文件夹：`ui-restoration`
- 关键命令：
  - `npm run build` (构建前端)
  - `npm run server` (启动服务)

## 2. 服务器环境配置
购买云服务器 (推荐 Ubuntu 20.04/22.04 或 CentOS 7+)。
登录服务器后，执行以下命令安装 Node.js (v18+):

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

安装 PM2 (进程管理器，用于后台运行服务):
```bash
sudo npm install -g pm2
```

## 3. 代码上传
可以通过 Git 或 SCP 上传代码。

**方法 A: Git (推荐)**
1. 将代码推送到 GitHub/Gitee。
2. 在服务器上克隆：
   ```bash
   git clone <your-repo-url>
   cd newyear/ui-restoration
   ```

**方法 B: SCP/SFTP**
直接将 `ui-restoration` 文件夹上传到服务器（排除 `node_modules`）。

## 4. 安装依赖与构建
进入项目目录：
```bash
cd /path/to/ui-restoration

# 安装依赖
npm install

# 构建前端 (生成 dist 目录)
npm run build
```

## 5. 启动服务 (基础版 - IP访问)
如果不需要域名，直接使用 PM2 启动。

```bash
# 启动服务
pm2 start server/index.js --name "newyear-energy"

# 查看状态
pm2 status

# 查看日志
pm2 logs newyear-energy
```

## 6. 防火墙设置 (关键)
在腾讯云/阿里云控制台的**安全组**设置中，放行 **3001** 端口 (TCP)。

## 7. 进阶部署：使用域名 (推荐)

如果您有域名（例如 `newyear.company.com`），请按以下步骤操作。这种方式可以避免 IP 变动导致二维码失效。

### 步骤 A: 启动服务 (指定域名)
使用环境变量 `PUBLIC_URL` 告诉服务器当前的域名。

```bash
# 先停止旧服务 (如果已启动)
pm2 delete newyear-energy

# 启动新服务 (将 http://your-domain.com 替换为您的真实域名)
# 注意：不要带末尾的斜杠 /
pm2 start server/index.js --name "newyear-energy" --env PUBLIC_URL=http://your-domain.com
```

### 步骤 B: 配置 Nginx 反向代理 (可选但推荐)
使用 Nginx 可以让您使用 80/443 端口访问，无需带端口号。

1. 安装 Nginx: `sudo apt install nginx` (Ubuntu) 或 `sudo yum install nginx` (CentOS)
2. 编辑配置文件: `sudo nano /etc/nginx/conf.d/newyear.conf`
3. 写入以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
4. 重启 Nginx: `sudo systemctl restart nginx`

## 8. 应对域名/IP 变动

**场景 1：仅更换服务器公网 IP (已配置域名)**
*   **操作**：登录域名解析控制台（阿里云/腾讯云 DNS），修改域名的 A 记录指向新 IP。
*   **服务器端**：**不需要做任何操作**。只要域名没变，二维码依然有效。

**场景 2：更换了域名 (例如从 a.com 换到 b.com)**
*   **操作**：需要重启 PM2 进程以更新二维码链接。
    ```bash
    # 1. 停止当前进程
    pm2 delete newyear-energy
    
    # 2. 使用新域名重新启动
    pm2 start server/index.js --name "newyear-energy" --env PUBLIC_URL=http://lxnewyear.com
    ```
