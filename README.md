# 入戏档案

密室玩家人格测试小程序。规则以 `ru-xi-player-personality-miniapp-spec-v1.md` 为准，任务顺序见 `docs/DEV_PLAN.md`。

当前可运行的是 P0 测评闭环：开场资料、60 题与条件分支、服务端报告。人格形象图使用剪影占位。答卷存在 API 进程内存里，重启后清空；PostgreSQL 只提供了本地容器，还没有接入仓储。

## 启动

```bash
cd apps/api
export GOCACHE="$PWD/../../.gocache"
export GOMODCACHE="$PWD/../../.gomodcache"
export GOPROXY=https://goproxy.cn,direct
go test ./...
HTTP_ADDR=:8080 go run ./cmd/api
```

另一个终端：

```bash
cd apps/miniapp
npm install
npm run dev:h5
```

浏览器打开终端里打印的本地地址。接口地址写在小程序的 `src/api.ts`，默认是 `http://127.0.0.1:8080`。

开发时用户身份来自请求头 `X-User-Id`。小程序会在本地生成一个，并在每次请求带上。
