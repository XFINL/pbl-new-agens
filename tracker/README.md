# 埋点 SDK（tracker.js）

原生 JavaScript 单文件埋点 SDK，无依赖、无构建步骤——**源码即发布物**，由后端 `GET /tracker.js` 直接托管
（文件位置由 `TRACKER_PATH` 配置，默认 `../tracker/tracker.js`），避免多副本漂移。

## 使用

把下面一行放进被测网站每个页面都能加载的位置（一般是公共布局的 `<head>` 内）：

```html
<script defer src="https://<平台地址>/tracker.js" data-site="pk_live_xxxxxxxx"></script>
```

`data-site` 为站点公钥，在平台「我的站点」中新建站点后获得。

| 可选属性 | 说明 |
| --- | --- |
| `data-endpoint` | 自定义上报地址（默认取脚本自身的 origin） |
| `data-disabled` | 完全禁用自动采集 |

## 采集内容

| 事件 | 触发时机 |
| --- | --- |
| `pageview` | 脚本加载时 + `pushState` / `replaceState` / `popstate` 之后（同 URL 去重，SPA 路由切换同样记录） |
| `pulse` | 页面可见时每 15s 一次（`document.visibilityState === 'visible'`），用于会话时长估算 |

- 访客 ID：`localStorage.gm_vid`（首次访问生成，长期保持）
- 会话 ID：`sessionStorage.gm_sid`，距上次活动超过 30 分钟自动新开会话（`localStorage.gm_last_act` 记录活跃时间）
- 上报通道：优先 `navigator.sendBeacon`，降级 `fetch(keepalive)`；请求体以 `text/plain;charset=UTF-8` 发送，跨域不触发预检
- 容错：整个 SDK 包裹在 `try/catch` 中，上报失败静默丢弃，绝不影响宿主页面

## 上报协议

`POST {endpoint}/api/collect`，JSON 请求体：

```json
{
  "k": "pk_live_xxx",
  "e": "pageview",
  "vid": "v_<uuid>",
  "sid": "s_<uuid>",
  "url": "https://a.com/post/1?utm_source=x",
  "title": "文章标题",
  "ref": "https://www.google.com/",
  "sw": 1440, "sh": 900,
  "lang": "zh-CN", "tz": "Asia/Shanghai",
  "ts": 1758900000000
}
```

服务端负责解析 `path` 与 UTM、分类来源渠道、解析 UA（浏览器 / 系统 / 设备类型）、屏幕分桶，并把 IP 哈希后即弃。
非法公钥、未知事件类型一律返回 204（静默丢弃，不暴露站点是否存在）。

## 隐私

- 不写 Cookie、不做浏览器指纹、不上报表单内容与任何个人标识
- 原始 IP 不落库，仅存 `sha256(ip + 每日盐)`，不可跨天关联
- 时间归属以服务端落库时间为准，客户端时间仅作参考字段