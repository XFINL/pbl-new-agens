/**
 * 流量台 Glassmeter 埋点 SDK
 *
 * 用法：
 *   <script defer src="https://<平台地址>/tracker.js" data-site="pk_live_xxxx"></script>
 *
 * 可选属性：
 *   data-endpoint  自定义上报地址（默认取脚本自身的 origin）
 *   data-disabled  完全禁用自动采集
 *
 * 采集：pageview（进入 + SPA 路由切换）、pulse（可见时每 15s 心跳）
 * 隐私：不写 Cookie、不采集表单内容、不上报任何个人标识
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) {
    var scripts = document.getElementsByTagName("script");
    script = scripts[scripts.length - 1];
  }
  if (!script) return;

  var siteKey = script.getAttribute("data-site") || "";
  if (!siteKey || script.hasAttribute("data-disabled")) return;

  var PULSE_INTERVAL = 15000;
  var SESSION_TIMEOUT = 30 * 60 * 1000;
  var KEY_VID = "gm_vid";
  var KEY_SID = "gm_sid";
  var KEY_LAST_ACT = "gm_last_act";

  // 上报地址：data-endpoint 优先，否则取脚本自身 origin
  var endpoint = script.getAttribute("data-endpoint") || "";
  if (!endpoint && script.src) {
    try {
      endpoint = new URL(script.src).origin;
    } catch (_error) {
      endpoint = "";
    }
  }
  endpoint = endpoint.replace(/\/+$/, "");
  var collectUrl = endpoint + "/api/collect";

  /* ---------- 工具（全部容错，SDK 绝不抛错） ---------- */

  function uuid() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      }
    } catch (_error) {}
    var result = "";
    while (result.length < 24) {
      result += Math.floor(Math.random() * 16).toString(16);
    }
    return result;
  }

  function store(storage) {
    return {
      get: function (key) {
        try {
          return storage.getItem(key);
        } catch (_error) {
          return null;
        }
      },
      set: function (key, value) {
        try {
          storage.setItem(key, value);
        } catch (_error) {}
      },
    };
  }

  var local = store(window.localStorage);
  var session = store(window.sessionStorage);

  /* ---------- 访客与会话 ---------- */

  function getVisitorId() {
    var vid = local.get(KEY_VID);
    if (!vid) {
      vid = "v_" + uuid();
      local.set(KEY_VID, vid);
    }
    return vid;
  }

  function getSessionId() {
    var now = Date.now();
    var sid = session.get(KEY_SID);
    var lastAct = parseInt(local.get(KEY_LAST_ACT) || "0", 10) || 0;
    if (!sid || now - lastAct > SESSION_TIMEOUT) {
      sid = "s_" + uuid();
      session.set(KEY_SID, sid);
    }
    local.set(KEY_LAST_ACT, String(now));
    return sid;
  }

  var visitorId = getVisitorId();

  /* ---------- 上报 ---------- */

  function send(eventName) {
    try {
      var body = JSON.stringify({
        k: siteKey,
        e: eventName,
        vid: visitorId,
        sid: getSessionId(),
        url: String(location.href).slice(0, 2048),
        title: String(document.title || "").slice(0, 256),
        ref: String(document.referrer || "").slice(0, 2048),
        sw: window.screen ? window.screen.width : 0,
        sh: window.screen ? window.screen.height : 0,
        lang: navigator.language || "",
        tz: (function () {
          try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
          } catch (_error) {
            return "";
          }
        })(),
        ts: Date.now(),
      });

      // 以 text/plain 发送，跨域下不触发预检
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
        if (navigator.sendBeacon(collectUrl, blob)) return;
      }
      if (window.fetch) {
        fetch(collectUrl, {
          method: "POST",
          body: body,
          keepalive: true,
          mode: "cors",
          credentials: "omit",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
        })["catch"](function () {});
      }
    } catch (_error) {
      /* 静默失败 */
    }
  }

  /* ---------- 页面浏览 ---------- */

  var lastUrl = "";

  function trackPageview() {
    var current = String(location.href);
    if (current === lastUrl) return;
    lastUrl = current;
    send("pageview");
  }

  function wrapHistoryMethod(name) {
    var original = history[name];
    if (typeof original !== "function") return;
    history[name] = function () {
      var result = original.apply(this, arguments);
      window.setTimeout(trackPageview, 0);
      return result;
    };
  }

  try {
    wrapHistoryMethod("pushState");
    wrapHistoryMethod("replaceState");
    window.addEventListener("popstate", function () {
      window.setTimeout(trackPageview, 0);
    });
  } catch (_error) {}

  /* ---------- 心跳 ---------- */

  function startPulse() {
    window.setInterval(function () {
      if (document.visibilityState === "visible") send("pulse");
    }, PULSE_INTERVAL);
  }

  function start() {
    trackPageview();
    startPulse();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  }
})();