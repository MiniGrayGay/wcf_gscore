## WCF<=> GSCore 转换器

### 下载对应版本WX

[大陆镜像](https://blog.minigg.cn/g/92/)

[Github](https://github.com/MiniGrayGay/wcf_gscore/releases/latest)

（如无特殊需求建议使用新版，如需兼容旧版VX客户端可安装对应需要的@zippybee/wechatcore的版本）

| @zippybee/wechatcore版本 | WeChatFerry依赖版本 | 对应可用微信版本 |
|:------------------------:|:-------------------:|:---------------:|
| v3.1.22                   | v39.5.x              | 3.9.12.51        |
| v3.1.18                   | v39.4.x              | 3.9.12.17        |
| v3.0.6                    | v39.3.x              | 3.9.11.25        |


### 安装[pnpm](https://pnpm.io/zh/installation)

> 已安装的可以跳过（或者使用npm）

```sh
npm install pnpm -g
```

###  安装依赖

> 外网环境请修改的本地npm配置.npmrc

```sh
# 直接安装
pnpm i
```

### 修改配置（可选）

> 修改 `app.js` 最上方 `gscore_servers` 为你的服务器地址，默认为本机云崽2536端口


### 启动转发器

> 首次运行按提示输入登录

```sh
node app.js
```

[wcferry-node](https://github.com/dr-forget/wcferry-node/)
[WeChatFerry](https://github.com/lich0821/WeChatFerry/)
