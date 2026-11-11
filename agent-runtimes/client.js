/**
 * Client half of the Agent Runtimes bundle.
 *
 * One console for every supported agent runtime on this machine. It polls the
 * Host snapshot, lists each runtime with its live session state, and raises a
 * reminder — an in-panel banner, a sidebar badge, an overlay toast and an
 * optional desktop notification — whenever a runtime reports a pending approval.
 */
window.__ModuleLoader__.load({
  id: '@local/agent-runtimes',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useRef, useState } = React;

    const NS = 'agent-runtimes';
    const PANEL_ID = 'agent-runtimes';
    const API = '/api/agent-runtimes';
    const POLL_MS = 2500;
    const REMINDER_MS = 14000;
    const NOTIFY_KEY = 'dsh.local.agent-runtimes.notify';
    const CLOCK_MS = 15000;

    /** Bound once in apply(); components read it on every render. */
    let t = (key) => key;

    const dictionaries = {
      en: {
        panel: 'Agent runtimes',
        description: 'One console for the agent runtimes on this machine, with approval reminders.',
        'header.refresh': 'Refresh',
        'header.notify': 'Desktop notifications',
        'header.notifyOn': 'Desktop notifications on',
        'header.intercept': 'Console approvals',
        'header.interceptOn': 'Console approvals on',
        'header.offline': 'offline',
        'header.runtimes': '{count} runtimes',
        'header.pending': '{count} pending',
        'stats.running': 'Running',
        'stats.pending': 'Pending',
        'stats.sessions': 'Sessions',
        'approval.title': 'Needs your approval',
        'activity.title': 'Recent activity',
        'activity.empty': 'No activity recorded yet.',
        'activity.newSession': 'new session',
        'approval.review': 'Review',
        'approval.dismiss': 'Dismiss',
        'approval.allowOnce': 'Allow once',
        'approval.reject': 'Reject',
        'approval.openSession': 'Open session',
        'approval.none': 'No pending approvals.',
        'runtime.open': 'Open',
        'runtime.interrupt': 'Stop',
        'runtime.sessions': '{count} sessions',
        'runtime.heartbeat': 'live',
        'runtime.noData': 'Process running — no readable session state.',
        'runtime.noActive': 'No active session.',
        'runtime.progress': '{done}/{total} tasks',
        'runtime.notInstalled': 'Not installed',
        'tokens': 'Tokens',
        'approval.pendingSession': 'DeepSeek Harness session',
        'status.running': 'Running',
        'status.idle': 'Idle',
        'status.waiting': 'Waiting',
        'status.error': 'Error',
        'status.absent': 'Not installed',
        'status.stopped': 'Stopped',
        'credentials.nav': 'Agent credentials',
        'credentials.title': 'Agent credentials',
        'credentials.hint': 'Store a third-party agent app API key in the DSH credential store, bind it to a runtime and record its purpose. The secret goes to ~/.dsh/.credentials.yaml; the panel only shows its name and state.',
        'credentials.add': 'Add API key',
        'credentials.name': 'Name',
        'credentials.namePlaceholder': 'e.g. WorkBuddy sync token',
        'credentials.agent': 'Agent',
        'credentials.purpose': 'Purpose',
        'credentials.purposePlaceholder': 'What this key is used for',
        'credentials.secret': 'API key',
        'credentials.secretPlaceholder': 'Paste the key (stored in the DSH credential store)',
        'credentials.cancel': 'Cancel',
        'credentials.confirm': 'Save',
        'credentials.invoke': 'Call',
        'credentials.url': 'URL',
        'credentials.method': 'Method',
        'credentials.body': 'Body',
        'credentials.send': 'Send',
        'credentials.sending': 'Sending…',
        'credentials.urlRequired': 'Enter a URL first.',
        'credentials.callFailed': 'Call failed',
        'preset.directory': 'Directory',
        'preset.register': 'Register',
        'preset.task': 'Send task',
        'preset.result': 'Result',
        'credentials.empty': 'No API keys stored yet.',
        'credentials.loading': 'Loading…',
        'credentials.configured': 'configured',
        'credentials.missing': 'missing',
        'credentials.remove': 'Delete',
        'credentials.required': 'Name and API key are both required.',
        'credentials.failed': 'Could not save the credential.',
        'names.nav': 'Agent names',
        'names.title': 'Agent names',
        'names.hint': 'Give each runtime your own name; the console and the credential page use it. Leave the field empty to restore the default.',
        'names.save': 'Save',
        'names.saved': 'Saved.',
        'names.failed': 'Could not save the name.',
        'names.aliased': 'default: {builtin}',
        'credentials.agentPlaceholder': 'Pick a runtime or type a custom name',
        'session.running': 'Running',
        'session.idle': 'Idle',
        'session.working': 'Working',
        'session.completed': 'Completed',
        'session.error': 'Error',
        'session.waiting': 'Waiting',
        'session.archived': 'Archived',
        'session.unknown': 'Unknown',
        'empty.title': 'No agent runtimes found',
        'empty.body': 'Install WorkBuddy, CodeBuddy CN, Codex++, Cursor or DeepSeek Harness to see them here.',
        'time.justNow': 'just now',
        'time.minutes': '{count}m ago',
        'time.hours': '{count}h ago',
        'time.days': '{count}d ago',
        'notify.title': 'Agent approval needed',
        'notify.body': '{runtime}: {reason}',
        'notify.enabled': 'Desktop notifications enabled',
        'notify.denied': 'Desktop notifications were blocked by the browser',
        'notify.unsupported': 'This browser does not support desktop notifications',
        'action.opened': 'Opened {name}',
        'action.openFailed': 'Could not open {name}',
        'action.interrupted': 'Stop requested for {name}',
        'action.interruptFailed': 'Could not stop {name}',
        'action.interruptUnsupported': 'This runtime cannot be stopped from the console',
        'action.interceptOn': 'Console approvals enabled — DSH approvals will be decided here',
        'action.interceptOff': 'Console approvals disabled — DSH approvals use the normal prompt',
        'action.decisionFailed': 'Could not submit the decision to {name}',
        'action.decisionSent': 'Decision sent to {name}',
        'approval.needsAccessibility': 'Grant DeepSeek Harness Accessibility permission in System Settings to decide these approvals from the panel.',
        'reminder.title': 'Approval needed',
      },
      zh: {
        panel: '代理运行时',
        description: '本机主流 Agent 运行时统一控制台，审批请求即时提醒。',
        'header.refresh': '刷新',
        'header.notify': '桌面通知',
        'header.notifyOn': '桌面通知已开启',
        'header.intercept': '控制台审批',
        'header.interceptOn': '控制台审批已开启',
        'header.offline': '离线',
        'header.runtimes': '{count} 个运行时',
        'header.pending': '{count} 项待处理',
        'stats.running': '运行中',
        'stats.pending': '待处理',
        'stats.sessions': '会话',
        'approval.title': '需要你审批',
        'activity.title': '最近动态',
        'activity.empty': '暂无动态。',
        'activity.newSession': '新会话',
        'approval.review': '去处理',
        'approval.dismiss': '忽略',
        'approval.allowOnce': '允许一次',
        'approval.reject': '拒绝',
        'approval.openSession': '打开会话',
        'approval.none': '暂无待审批事项。',
        'runtime.open': '打开',
        'runtime.interrupt': '停止',
        'runtime.sessions': '{count} 个会话',
        'runtime.heartbeat': '活跃',
        'runtime.noData': '进程运行中 — 暂无可读的会话状态。',
        'runtime.noActive': '无活跃会话。',
        'runtime.progress': '待办 {done}/{total}',
        'runtime.notInstalled': '未安装',
        'tokens': '令牌',
        'approval.pendingSession': 'DeepSeek Harness 会话',
        'status.running': '运行中',
        'status.idle': '空闲',
        'status.waiting': '等待中',
        'status.error': '异常',
        'status.absent': '未安装',
        'status.stopped': '已停止',
        'credentials.nav': '凭据管理',
        'credentials.title': 'Agent 凭据',
        'credentials.hint': '把第三方 Agent 应用的 API Key 存进 DSH 凭证库，绑定到对应运行时并记录用途。密钥写入 ~/.dsh/.credentials.yaml，面板只显示名称和状态。',
        'credentials.add': '新增 API Key',
        'credentials.name': '名称',
        'credentials.namePlaceholder': '例如 WorkBuddy 同步令牌',
        'credentials.agent': 'Agent',
        'credentials.purpose': '用途',
        'credentials.purposePlaceholder': '描述这个 key 用来做什么',
        'credentials.secret': 'API Key',
        'credentials.secretPlaceholder': '粘贴密钥（存入 DSH 凭证库）',
        'credentials.cancel': '取消',
        'credentials.confirm': '确认',
        'credentials.invoke': '调用',
        'credentials.url': 'URL',
        'credentials.method': '方法',
        'credentials.body': '请求体',
        'credentials.send': '发送',
        'credentials.sending': '发送中…',
        'credentials.urlRequired': '请先填写 URL。',
        'credentials.callFailed': '调用失败',
        'preset.directory': '看目录',
        'preset.register': '注册',
        'preset.task': '发任务',
        'preset.result': '查结果',
        'credentials.empty': '还没有保存任何 API Key。',
        'credentials.loading': '加载中…',
        'credentials.configured': '已配置',
        'credentials.missing': '缺失',
        'credentials.remove': '删除',
        'credentials.required': '名称和 API Key 都是必填。',
        'credentials.failed': '保存凭证失败。',
        'names.nav': 'Agent 名称',
        'names.title': 'Agent 名称',
        'names.hint': '给每个运行时起一个自己的名字，看板和凭据页都会用它。留空则恢复默认。',
        'names.save': '保存',
        'names.saved': '已保存。',
        'names.failed': '保存名称失败。',
        'names.aliased': '默认：{builtin}',
        'credentials.agentPlaceholder': '选一个运行时，或直接输入自定义名称',
        'session.running': '运行中',
        'session.idle': '空闲',
        'session.working': '工作中',
        'session.completed': '已完成',
        'session.error': '异常',
        'session.waiting': '等待中',
        'session.archived': '已归档',
        'session.unknown': '未知',
        'empty.title': '未发现 Agent 运行时',
        'empty.body': '安装 WorkBuddy、CodeBuddy CN、Codex++、Cursor 或 DeepSeek Harness 后即可在此查看。',
        'time.justNow': '刚刚',
        'time.minutes': '{count} 分钟前',
        'time.hours': '{count} 小时前',
        'time.days': '{count} 天前',
        'notify.title': 'Agent 需要审批',
        'notify.body': '{runtime}：{reason}',
        'notify.enabled': '已开启桌面通知',
        'notify.denied': '浏览器拒绝了桌面通知权限',
        'notify.unsupported': '当前浏览器不支持桌面通知',
        'action.opened': '已打开 {name}',
        'action.openFailed': '无法打开 {name}',
        'action.interrupted': '已请求停止 {name}',
        'action.interruptFailed': '无法停止 {name}',
        'action.interruptUnsupported': '该运行时不支持从控制台停止',
        'action.interceptOn': '已开启控制台审批 — DSH 审批将在本面板处理',
        'action.interceptOff': '已关闭控制台审批 — DSH 审批走原有提示',
        'action.decisionFailed': '无法把决定提交给 {name}',
        'action.decisionSent': '已把决定发给 {name}',
        'approval.needsAccessibility': '在系统设置里给 DeepSeek Harness 开启「辅助功能」权限，才能在这个面板里直接处理这些审批。',
        'reminder.title': '需要审批',
      },
    };

    const CSS = `
.ar-root { flex: 1 1 auto; height: 100%; min-height: 0; min-width: 0; display: flex; flex-direction: column; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-size: 13px; }
.ar-root *, .ar-root *::before, .ar-root *::after { box-sizing: border-box; }
.ar-header { display: flex; align-items: center; gap: 8px 10px; flex-wrap: wrap; padding: 10px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.ar-titleBlock { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1 1 auto; }
.ar-title { font-size: 14px; font-weight: 650; letter-spacing: -0.01em; }
.ar-meta { color: var(--dsw-alias-label-secondary); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-headerActions { margin-left: auto; display: flex; align-items: center; gap: 6px; flex: none; }
.ar-message { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); border-radius: 8px; padding: 7px 10px; font-size: 12px; }
.ar-scroll { flex: 1 1 auto; min-height: 0; min-width: 0; overflow-y: auto; padding: 10px 12px 18px; display: flex; flex-direction: column; gap: 10px; }
.ar-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 34px 18px; text-align: center; color: var(--dsw-alias-label-secondary); }
.ar-emptyTitle { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary); }

.ar-iconBtn { appearance: none; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); border-radius: 6px; width: 26px; height: 26px; padding: 0; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex: none; font-size: 13px; line-height: 1; }
.ar-iconBtn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.ar-iconBtn--on { background: var(--dsw-alias-brand-primary); border-color: transparent; color: #fff; }
.ar-iconBtn--on:hover { background: var(--dsw-alias-brand-primary); color: #fff; }

.ar-btn { appearance: none; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); border-radius: 6px; padding: 4px 9px; font: inherit; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
.ar-btn:hover { background: var(--dsw-alias-bg-layer-2); }
.ar-btn--primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: #fff; }
.ar-btn--primary:hover { filter: brightness(1.06); background: var(--dsw-alias-brand-primary); }
.ar-btn--icon { padding: 4px 6px; }
.ar-btn:disabled { opacity: 0.55; cursor: default; }

.ar-approvals { display: flex; flex-direction: column; gap: 8px; }
.ar-approval { border: 1px solid var(--dsw-alias-state-warn-primary); background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 10%, var(--dsw-alias-bg-layer-1)); border-radius: 9px; padding: 9px 10px; }
.ar-approvalHead { display: flex; align-items: flex-start; gap: 8px; }
.ar-approvalIcon { color: var(--dsw-alias-state-warn-primary); font-size: 14px; line-height: 1.35; }
.ar-approvalText { min-width: 0; flex: 1 1 auto; }
.ar-approvalTitle { font-weight: 600; font-size: 12.5px; }
.ar-approvalReason { color: var(--dsw-alias-label-secondary); font-size: 12px; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-approvalTime { color: var(--dsw-alias-label-secondary); font-size: 11.5px; flex: none; }
.ar-approvalActions { display: flex; gap: 6px; margin-top: 8px; }

.ar-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.ar-stat { border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); padding: 7px 10px; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.ar-statLabel { color: var(--dsw-alias-label-secondary); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-statValue { font-size: 17px; font-weight: 650; line-height: 1.2; }
.ar-statValue--ok { color: var(--dsw-alias-state-success-primary); }
.ar-statValue--warn { color: var(--dsw-alias-state-warn-primary); }

.ar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; align-items: start; }
.ar-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.ar-card--absent { opacity: 0.55; }
.ar-card--error { border-color: var(--dsw-alias-state-error-primary); }
.ar-card--waiting { border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 55%, var(--dsw-alias-border-l1)); }
.ar-cardHead { display: flex; align-items: center; gap: 8px; padding: 9px 10px 0; min-width: 0; }
.ar-badge { width: 22px; height: 22px; border-radius: 6px; flex: none; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 11px; font-weight: 700; }
.ar-cardName { font-weight: 600; font-size: 13px; flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-cardBody { padding: 7px 10px 8px; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.ar-cardTitle { font-size: 13px; font-weight: 550; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.ar-cardMeta { color: var(--dsw-alias-label-secondary); font-size: 11.5px; display: flex; flex-wrap: wrap; gap: 2px 8px; min-width: 0; }
.ar-cardMeta span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.ar-cardFoot { display: flex; align-items: center; gap: 2px; padding: 0 6px 7px; min-width: 0; }
.ar-spacer { flex: 1 1 auto; }
.ar-linkBtn { appearance: none; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11.5px; cursor: pointer; padding: 3px 6px; border-radius: 5px; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
.ar-linkBtn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }

.ar-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; display: inline-block; }
.ar-dot--running { background: var(--dsw-alias-state-success-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary) 18%, transparent); }
.ar-dot--waiting { background: var(--dsw-alias-state-warn-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-warn-primary) 18%, transparent); }
.ar-dot--error { background: var(--dsw-alias-state-error-primary); }
.ar-dot--idle { background: var(--dsw-alias-state-idle-primary); }
.ar-dot--absent { background: transparent; border: 1.5px solid var(--dsw-alias-border-l2); }
.ar-dot--stopped { background: transparent; border: 1.5px solid var(--dsw-alias-state-idle-primary); }

.ar-pill { font-size: 11px; line-height: 1; padding: 3px 7px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.ar-pill--running { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent); }
.ar-pill--waiting { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 45%, transparent); }
.ar-pill--error { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, transparent); }
.ar-pill--stopped { color: var(--dsw-alias-label-secondary); border-color: var(--dsw-alias-border-l1); }
.ar-count { font-size: 10.5px; font-weight: 650; min-width: 16px; height: 16px; padding: 0 5px; border-radius: 999px; background: var(--dsw-alias-state-warn-primary); color: #fff; display: inline-flex; align-items: center; justify-content: center; }

.ar-sessions { border-top: 1px solid var(--dsw-alias-border-l1); padding: 5px 6px 7px; display: flex; flex-direction: column; gap: 1px; max-height: 240px; overflow-y: auto; }
.ar-session { display: flex; align-items: center; gap: 7px; padding: 4px 6px; border-radius: 5px; cursor: pointer; min-width: 0; }
.ar-session:hover { background: var(--dsw-alias-bg-layer-2); }
.ar-sessionTitle { flex: 1 1 auto; min-width: 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-sessionMeta { color: var(--dsw-alias-label-secondary); font-size: 11px; flex: none; }
.ar-activity { border-top: 1px solid var(--dsw-alias-border-l1); margin-top: 2px; padding-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.ar-sectionTitle { font-size: 12px; font-weight: 650; color: var(--dsw-alias-label-secondary); display: flex; align-items: center; gap: 6px; }
.ar-activityList { display: flex; flex-direction: column; gap: 2px; }
.ar-activityRow { display: flex; align-items: center; gap: 8px; padding: 3px 2px; border-radius: 5px; }
.ar-activityRow:hover { background: var(--dsw-alias-bg-layer-2); }
.ar-activityText { flex: 1 1 auto; min-width: 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-activityTime { color: var(--dsw-alias-label-secondary); font-size: 11px; flex: none; }

.ar-toastWrap { position: fixed; top: 18px; right: 18px; z-index: 9999; pointer-events: auto; }
.ar-toast { width: 320px; border: 1px solid var(--dsw-alias-state-warn-primary); background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); border-radius: 11px; padding: 11px 12px; box-shadow: 0 12px 34px rgba(0,0,0,0.28); }
.ar-toastHead { display: flex; align-items: flex-start; gap: 8px; }
.ar-toastTitle { font-weight: 650; font-size: 13px; }
.ar-toastBody { color: var(--dsw-alias-label-secondary); font-size: 12px; margin-top: 2px; }
.ar-toastActions { display: flex; gap: 6px; margin-top: 9px; }
.ar-toastClose { margin-left: auto; }

`;

    const TOAST_CSS = `
.ar-toastWrap { position: fixed; top: 18px; right: 18px; z-index: 9999; pointer-events: auto; }
.ar-toast { width: 320px; border: 1px solid var(--dsw-alias-state-warn-primary); background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); border-radius: 11px; padding: 11px 12px; box-shadow: 0 12px 34px rgba(0,0,0,0.28); font-family: inherit; }
.ar-toast *, .ar-toast *::before, .ar-toast *::after { box-sizing: border-box; }
.ar-toastHead { display: flex; align-items: flex-start; gap: 8px; }
.ar-toastTitle { font-weight: 650; font-size: 13px; }
.ar-toastBody { color: var(--dsw-alias-label-secondary); font-size: 12px; margin-top: 2px; }
.ar-toastActions { display: flex; gap: 6px; margin-top: 9px; }
.ar-toastClose { margin-left: auto; }
.ar-btn { appearance: none; border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); border-radius: 6px; padding: 4px 9px; font: inherit; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
.ar-btn--primary { background: var(--dsw-alias-brand-primary); border-color: transparent; color: #fff; }
`;

    const RUNTIME_BADGES = {
      workbuddy: { letter: 'W', color: '#0EA5E9' },
      codebuddy: { letter: 'B', color: '#F97316' },
      codex: { letter: 'X', color: '#10A37F' },
      cursor: { letter: 'C', color: '#8B5CF6' },
      dsh: { letter: 'D', color: '#2F6FED' },
    };

    /* ---------------------------------------------------------------- */
    /* store                                                            */
    /* ---------------------------------------------------------------- */

    const store = {
      snapshot: { now: Date.now(), runtimes: [], approvals: [] },
      reminder: null,
      dismissed: new Set(),
      seen: new Set(),
      message: null,
      notifyEnabled: false,
      listeners: new Set(),
      timer: undefined,
      reminderTimer: undefined,
      messageTimer: undefined,
      inFlight: false,

      start() {
        if (this.timer !== undefined) return;
        void this.refresh();
        this.timer = setInterval(() => { void this.refresh(); }, POLL_MS);
      },
      stop() {
        if (this.timer !== undefined) {
          clearInterval(this.timer);
          this.timer = undefined;
        }
      },
      subscribe(fn) {
        this.listeners.add(fn);
        return () => { this.listeners.delete(fn); };
      },
      emit() {
        for (const fn of Array.from(this.listeners)) {
          try { fn(); } catch { /* a dead listener must not break the rest */ }
        }
      },
      async refresh() {
        if (this.inFlight) return;
        this.inFlight = true;
        try {
          const response = await fetch(`${API}/snapshot`, { cache: 'no-store' });
          if (!response.ok) throw new Error(`http-${response.status}`);
          const snapshot = await response.json();
          this.apply(snapshot);
        } catch {
          // Keep the last good snapshot; the header shows the age.
        } finally {
          this.inFlight = false;
          this.emit();
        }
      },
      apply(snapshot) {
        const approvals = Array.isArray(snapshot.approvals) ? snapshot.approvals : [];
        const fresh = approvals.filter((row) => row !== null && typeof row === 'object' && !this.seen.has(row.approvalId) && !this.dismissed.has(row.approvalId));
        for (const row of approvals) {
          if (row !== null && typeof row === 'object' && typeof row.approvalId === 'string') this.seen.add(row.approvalId);
        }
        if (fresh.length > 0) {
          this.reminder = fresh[fresh.length - 1];
          this.fireNotification(this.reminder);
          if (this.reminderTimer !== undefined) clearTimeout(this.reminderTimer);
          this.reminderTimer = setTimeout(() => {
            this.reminderTimer = undefined;
            this.reminder = null;
            this.emit();
          }, REMINDER_MS);
        }
        this.snapshot = snapshot;
      },
      dismiss(approvalId) {
        if (typeof approvalId === 'string') this.dismissed.add(approvalId);
        if (this.reminder !== null && this.reminder.approvalId === approvalId) {
          this.reminder = null;
          if (this.reminderTimer !== undefined) {
            clearTimeout(this.reminderTimer);
            this.reminderTimer = undefined;
          }
        }
        this.emit();
      },
      clearReminder() {
        this.reminder = null;
        if (this.reminderTimer !== undefined) {
          clearTimeout(this.reminderTimer);
          this.reminderTimer = undefined;
        }
        this.emit();
      },
      showMessage(text) {
        this.message = text;
        if (this.messageTimer !== undefined) clearTimeout(this.messageTimer);
        this.messageTimer = setTimeout(() => {
          this.messageTimer = undefined;
          this.message = null;
          this.emit();
        }, 4000);
        this.emit();
      },
      async sendAction(action, runtimeId, sessionId, extra) {
        try {
          const response = await fetch(`${API}/action`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              action,
              runtimeId,
              sessionId,
              ...(extra !== null && typeof extra === 'object' ? extra : {}),
            }),
          });
          return await response.json();
        } catch (error) {
          return { ok: false, error: error !== null && typeof error === 'object' && error.message ? error.message : String(error) };
        }
      },
      async enableNotifications() {
        if (typeof Notification === 'undefined') {
          this.showMessage(t('notify.unsupported'));
          return false;
        }
        if (Notification.permission === 'granted') {
          this.notifyEnabled = true;
          this.showMessage(t('notify.enabled'));
          this.emit();
          return true;
        }
        if (Notification.permission === 'denied') {
          this.showMessage(t('notify.denied'));
          return false;
        }
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            this.notifyEnabled = true;
            this.showMessage(t('notify.enabled'));
            this.emit();
            return true;
          }
          this.showMessage(t('notify.denied'));
          return false;
        } catch {
          this.showMessage(t('notify.denied'));
          return false;
        }
      },
      fireNotification(approval) {
        if (!this.notifyEnabled) return;
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        try {
          const body = t('notify.body', { runtime: approval.runtimeName, reason: approval.reason });
          const notification = new Notification(t('notify.title'), { body, tag: approval.approvalId });
          notification.onclick = () => {
            window.focus();
            this.clearReminder();
          };
        } catch {
          // Notifications are best-effort.
        }
      },
    };

    try {
      store.notifyEnabled = localStorage.getItem(NOTIFY_KEY) === '1';
    } catch {
      store.notifyEnabled = false;
    }

    function useStore() {
      const [tick, setTick] = useState(0);
      useEffect(() => store.subscribe(() => setTick((value) => value + 1)), []);
      void tick;
      return store;
    }

    function useNow(intervalMs) {
      const [now, setNow] = useState(() => Date.now());
      useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(timer);
      }, [intervalMs]);
      return now;
    }

    /* ---------------------------------------------------------------- */
    /* helpers                                                          */
    /* ---------------------------------------------------------------- */

    function formatRelative(timestamp, now) {
      if (typeof timestamp !== 'number' || timestamp <= 0) return '';
      const diff = Math.max(0, now - timestamp);
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return t('time.justNow');
      if (minutes < 60) return t('time.minutes', { count: minutes });
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return t('time.hours', { count: hours });
      return t('time.days', { count: Math.floor(hours / 24) });
    }

    function formatTokens(count) {
      if (typeof count !== 'number' || count <= 0) return '';
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${Math.round(count / 1000)}k`;
      return String(count);
    }

    function runtimeStatusKey(status) {
      if (status === 'working') return 'running';
      if (status === 'running' || status === 'waiting' || status === 'error' || status === 'absent' || status === 'stopped') return status;
      return 'idle';
    }

    function sessionStatusKey(status) {
      if (status === 'pending') return 'waiting';
      if (status === 'running' || status === 'idle' || status === 'working' || status === 'completed'
        || status === 'error' || status === 'waiting' || status === 'archived') return status;
      return 'unknown';
    }

    function shortTitle(title, fallback) {
      if (typeof title === 'string' && title !== '') return title;
      return fallback;
    }

    /* ---------------------------------------------------------------- */
    /* components                                                       */
    /* ---------------------------------------------------------------- */

    function StatusDot({ status }) {
      return h('span', { className: `ar-dot ar-dot--${runtimeStatusKey(status)}` });
    }

    function Pill({ status }) {
      return h('span', { className: `ar-pill ar-pill--${runtimeStatusKey(status)}` }, t(`status.${runtimeStatusKey(status)}`));
    }

    function ShieldIcon(props) {
      const on = props.on === true;
      return h('svg', {
        width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round',
        strokeLinejoin: 'round', 'aria-hidden': true, style: { display: 'block' },
      }, [
        h('path', { d: 'M8 1.5l5.3 2.1v3.3c0 3.3-2.3 5.6-5.3 6.6-3-1-5.3-3.3-5.3-6.6V3.6z' }),
        on ? h('path', { d: 'M5.5 8.1l1.8 1.8 3.2-3.5' }) : null,
      ]);
    }

    function RuntimeBadge({ runtimeId }) {
      const badge = RUNTIME_BADGES[runtimeId] || { letter: '?', color: '#64748B' };
      return h('span', { className: 'ar-badge', style: { background: badge.color } }, badge.letter);
    }

    function PanelIcon(props) {
      const size = props.size || 16;
      const storeState = useStore();
      const count = (storeState.snapshot.approvals || []).filter((row) => !storeState.dismissed.has(row.approvalId)).length;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round',
        strokeLinejoin: 'round', 'aria-hidden': true, style: { display: 'block' },
      }, [
        h('rect', { x: 1.7, y: 2.2, width: 12.6, height: 9.2, rx: 1.6 }),
        h('path', { d: 'M4.6 6.2h6.8M4.6 8.6h4.4' }),
        h('path', { d: 'M3.4 13.6h9.2' }),
        count > 0
          ? h('circle', {
              cx: 13.8, cy: 2.4, r: 2.2, key: 'badge',
              fill: 'var(--dsw-alias-state-warn-primary)',
              stroke: 'var(--dsw-alias-bg-base)', strokeWidth: 1.1,
            })
          : null,
      ]);
    }

    function ApprovalBanner(props) {
      const { approvals, now, titleOf, onReview, onDismiss, onDecide } = props;
      if (approvals.length === 0) return null;
      return h('div', { className: 'ar-approvals' }, [
        h('div', { className: 'ar-meta', key: 'head' }, `${t('approval.title')} · ${approvals.length}`),
        approvals.map((row) => {
          const reason = row.runtimeId === 'dsh'
            ? (titleOf(row.sessionId) || row.reason || t('approval.pendingSession'))
            : row.reason;
          return h('div', { className: 'ar-approval', key: row.approvalId }, [
            h('div', { className: 'ar-approvalHead', key: 'head' }, [
              h('span', { className: 'ar-approvalIcon', key: 'icon' }, '⚠'),
              h('div', { className: 'ar-approvalText', key: 'text' }, [
                h('div', { className: 'ar-approvalTitle', key: 'title' }, `${row.runtimeName} · ${row.tool}`),
                h('div', { className: 'ar-approvalReason', key: 'reason', title: reason }, reason),
              ]),
              h('span', { className: 'ar-approvalTime', key: 'time' }, formatRelative(row.since, now)),
            ]),
            h('div', { className: 'ar-approvalActions', key: 'actions' }, (
              row.actionable === true
                ? [
                    h('button', {
                      type: 'button', className: 'ar-btn ar-btn--primary', key: 'allow',
                      onClick: () => onDecide(row, 'allowed-once'),
                    }, t('approval.allowOnce')),
                    h('button', {
                      type: 'button', className: 'ar-btn', key: 'reject',
                      onClick: () => onDecide(row, 'rejected'),
                    }, t('approval.reject')),
                    h('button', {
                      type: 'button', className: 'ar-btn', key: 'open',
                      onClick: () => onReview(row),
                    }, t('approval.openSession')),
                  ]
                : [
                    h('button', {
                      type: 'button', className: 'ar-btn ar-btn--primary', key: 'review',
                      onClick: () => onReview(row),
                    }, t('approval.review')),
                    h('button', {
                      type: 'button', className: 'ar-btn', key: 'dismiss',
                      onClick: () => onDismiss(row),
                    }, t('approval.dismiss')),
                  ]
            )),
          ]);
        }),
      ]);
    }

    function RuntimeCard(props) {
      const { runtime, now, expanded, sessionTitle, onToggle, onOpen, onInterrupt } = props;
      const status = runtimeStatusKey(runtime.status);
      const sessions = Array.isArray(runtime.sessions) ? runtime.sessions : [];
      const approvals = Array.isArray(runtime.approvals) ? runtime.approvals : [];
      const active = runtime.active !== null && typeof runtime.active === 'object' ? runtime.active : null;
      const notInstalled = runtime.installed !== true;
      const mode = runtime.extra !== null && typeof runtime.extra === 'object' && typeof runtime.extra.mode === 'string' ? runtime.extra.mode : '';

      const meta = [];
      if (active !== null) {
        if (active.model !== '') meta.push(active.model);
        const tokens = formatTokens(active.tokens);
        if (tokens !== '') meta.push(`${t('tokens')} ${tokens}`);
        if (active.cwd !== '') meta.push(active.cwd);
        const when = formatRelative(active.lastActivityAt || active.updatedAt, now);
        if (when !== '') meta.push(when);
      }

      const rows = expanded
        ? sessions.slice(0, 8).map((session) => {
          const title = shortTitle(sessionTitle(session.sessionId), session.title);
          const when = formatRelative(session.lastActivityAt || session.updatedAt, now);
          return h('div', {
            className: 'ar-session', key: session.sessionId, title,
            onClick: () => onOpen(runtime, session),
          }, [
            h(StatusDot, { status: sessionStatusKey(session.status), key: 'dot' }),
            h('span', { className: 'ar-sessionTitle', key: 'title' }, title),
            when !== '' ? h('span', { className: 'ar-sessionMeta', key: 'meta' }, when) : null,
            runtime.id === 'dsh'
              ? h('button', {
                type: 'button', className: 'ar-linkBtn', key: 'stop',
                title: t('runtime.interrupt'),
                onClick: (event) => { event.stopPropagation(); onInterrupt(runtime, session); },
              }, '■')
              : null,
          ]);
        })
        : [];

      return h('div', { className: `ar-card ar-card--${status}` }, [
        h('div', { className: 'ar-cardHead', key: 'head' }, [
          h(RuntimeBadge, { runtimeId: runtime.id, key: 'badge' }),
          h('span', { className: 'ar-cardName', key: 'name' }, runtime.name),
          approvals.length > 0 ? h('span', { className: 'ar-count', key: 'count' }, String(approvals.length)) : null,
          h(Pill, { status, key: 'pill' }),
        ]),
        h('div', { className: 'ar-cardBody', key: 'body' }, [
          h('div', { className: 'ar-cardTitle', key: 'title' },
            notInstalled
              ? t('runtime.notInstalled')
              : (active !== null
                ? shortTitle(sessionTitle(active.sessionId), active.title)
                : (mode !== '' ? `${mode} · ${t('runtime.noActive')}` : t('runtime.noActive')))),
          meta.length > 0
            ? h('div', { className: 'ar-cardMeta', key: 'meta' }, meta.map((item, index) => h('span', { key: index }, item)))
            : null,
          active !== null && active.progress !== null && typeof active.progress === 'object'
            ? h('div', { className: 'ar-cardMeta', key: 'progress' }, [
              h('span', { key: 'label' }, t('runtime.progress', { done: active.progress.done, total: active.progress.total })),
            ])
            : null,
        ]),
        notInstalled
          ? null
          : h('div', { className: 'ar-cardFoot', key: 'foot' }, [
            sessions.length > 0
              ? h('button', {
                type: 'button', className: 'ar-linkBtn', key: 'toggle',
                onClick: () => onToggle(runtime.id),
              }, [
                h('span', { className: `ar-chevron${expanded ? ' ar-chevron--open' : ''}`, key: 'chevron' }, '›'),
                h('span', { key: 'label' }, t('runtime.sessions', { count: sessions.length })),
              ])
              : null,
            h('span', { className: 'ar-spacer', key: 'spacer' }),
            active !== null && active.sessionId
              ? h('button', {
                type: 'button', className: 'ar-linkBtn', key: 'open',
                onClick: () => onOpen(runtime, null),
              }, t('runtime.open'))
              : null,
            runtime.id === 'dsh' && active !== null && active.sessionId
              ? h('button', {
                type: 'button', className: 'ar-linkBtn', key: 'stop',
                onClick: () => onInterrupt(runtime, { sessionId: active.sessionId }),
              }, t('runtime.interrupt'))
              : null,
          ]),
        rows.length > 0 ? h('div', { className: 'ar-sessions', key: 'sessions' }, rows) : null,
      ]);
    }

    function ActivityFeed(props) {
      const { events, now } = props;
      const list = (Array.isArray(events) ? events : []).slice(0, 8);
      return h('div', { className: 'ar-activity' }, [
        h('div', { className: 'ar-sectionTitle', key: 'title' }, [
          t('activity.title'),
          list.length > 0 ? h('span', { className: 'ar-meta', key: 'count' }, String(list.length)) : null,
        ]),
        list.length === 0
          ? h('div', { className: 'ar-meta', key: 'empty' }, t('activity.empty'))
          : h('div', { className: 'ar-activityList', key: 'list' }, list.map((event) => {
              const text = event.kind === 'status'
                ? `${event.runtimeName} ${t(`status.${runtimeStatusKey(event.from)}`)} → ${t(`status.${runtimeStatusKey(event.to)}`)}`
                : event.kind === 'session'
                  ? `${event.runtimeName} · ${t('activity.newSession')} ${event.title}`
                  : event.kind === 'session-status'
                    ? `${event.title} ${t(`status.${runtimeStatusKey(event.from)}`)} → ${t(`status.${runtimeStatusKey(event.to)}`)}`
                    : `${event.runtimeName} · ${t('approval.title')} ${event.reason}`;
              return h('div', { className: 'ar-activityRow', key: event.id, title: text }, [
                h('span', { className: `ar-dot ar-dot--${event.kind === 'approval' ? 'waiting' : 'idle'}`, key: 'dot' }),
                h('span', { className: 'ar-activityText', key: 'text' }, text),
                h('span', { className: 'ar-activityTime', key: 'time' }, formatRelative(event.at, now)),
              ]);
            })),
      ]);
    }

    const noopUseSessions = () => null;

    const RUNTIME_OPTIONS = [
      { id: 'workbuddy', name: 'WorkBuddy' },
      { id: 'codebuddy', name: 'CodeBuddy CN' },
      { id: 'codex', name: 'Codex++' },
      { id: 'cursor', name: 'Cursor' },
      { id: 'dsh', name: 'DeepSeek Harness' },
    ];

    /**
     * Ready-made calls for the services this console knows about. Clicking one
     * opens the invoke form pre-filled, so the placeholders can still be edited
     * before the request goes out.
     */
    const PRESET_CALLS = {
      axon: [
        { id: 'directory', labelKey: 'preset.directory', method: 'GET', url: 'https://axon-agents.com/api/agents', body: '' },
        { id: 'register', labelKey: 'preset.register', method: 'POST', url: 'https://axon-agents.com/api/agents', body: [
          '{',
          '  "agentId": "my-agent",',
          '  "name": "My Agent",',
          '  "capabilities": ["research", "summarization"],',
          '  "publicKey": "YOUR_AGENT_PUBLIC_KEY",',
          '  "walletAddress": "YOUR_WALLET_ADDRESS"',
          '}',
        ].join('\n') },
        { id: 'task', labelKey: 'preset.task', method: 'POST', url: 'https://axon-agents.com/api/tasks', body: [
          '{',
          '  "from": "YOUR_WALLET_ADDRESS",',
          '  "to": "my-agent",',
          '  "task": "Summarize why agent-to-agent payments matter"',
          '}',
        ].join('\n') },
        { id: 'result', labelKey: 'preset.result', method: 'GET', url: 'https://axon-agents.com/api/tasks/TASK_ID', body: '' },
      ],
    };

    function runtimeNameOf(id) {
      const found = RUNTIME_OPTIONS.find((option) => option.id === id);
      return found !== undefined ? found.name : id;
    }

    const CREDENTIALS_CSS = `
.ar-cr { display: flex; flex-direction: column; gap: 12px; padding: 4px 0; min-width: 0; }
.ar-crHead { display: flex; align-items: flex-start; gap: 12px; }
.ar-crHead > div { flex: 1 1 auto; min-width: 0; }
.ar-crTitle { font-size: 15px; font-weight: 650; }
.ar-crHint { color: var(--dsw-alias-label-secondary); font-size: 12px; margin-top: 2px; line-height: 1.5; }
.ar-crNotice { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); border-radius: 8px; padding: 8px 10px; font-size: 12px; }
.ar-crForm { border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.ar-crField { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
.ar-crField span { color: var(--dsw-alias-label-secondary); }
.ar-crField input, .ar-crField select { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; padding: 6px 8px; outline: none; }
.ar-crField input:focus, .ar-crField select:focus { border-color: var(--dsw-alias-brand-primary); }
.ar-crActions { display: flex; justify-content: flex-end; gap: 8px; }
.ar-crEmpty { color: var(--dsw-alias-label-secondary); font-size: 12px; padding: 14px 0; }
.ar-crList { display: flex; flex-direction: column; gap: 8px; }
.ar-crRow { display: flex; align-items: center; gap: 10px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); padding: 10px 12px; min-width: 0; }
.ar-crRowMain { flex: 1 1 auto; min-width: 0; }
.ar-crName { font-weight: 600; font-size: 13px; }
.ar-crMeta { color: var(--dsw-alias-label-secondary); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-crRowMeta { color: var(--dsw-alias-label-secondary); font-size: 11.5px; flex: none; }
.ar-crInlineInput { margin-top: 6px; width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; padding: 5px 8px; outline: none; }
.ar-crInlineInput:focus { border-color: var(--dsw-alias-brand-primary); }
.ar-crItem { display: flex; flex-direction: column; gap: 8px; }
.ar-crField textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; padding: 6px 8px; outline: none; resize: vertical; }
.ar-crField textarea:focus { border-color: var(--dsw-alias-brand-primary); }
.ar-crResult { margin: 0; max-height: 220px; overflow: auto; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-family: var(--dsw-alias-font-mono); font-size: 11.5px; line-height: 1.5; padding: 8px 10px; white-space: pre-wrap; word-break: break-word; }
`;

    function AgentNamesSection() {
      const [state, setState] = useState({ loading: true, runtimes: [], names: {}, notice: '' });
      const [drafts, setDrafts] = useState({});

      const reload = async () => {
        try {
          const response = await fetch(`${API}/snapshot`, { cache: 'no-store' });
          const data = await response.json();
          setState({
            loading: false,
            runtimes: Array.isArray(data.runtimes) ? data.runtimes : [],
            names: data.names !== null && typeof data.names === 'object' ? data.names : {},
            notice: '',
          });
        } catch (error) {
          setState({ loading: false, runtimes: [], names: {}, notice: String(error) });
        }
      };

      useEffect(() => { void reload(); }, []);

      const save = async (runtimeId) => {
        const value = drafts[runtimeId] !== undefined ? drafts[runtimeId] : (state.names[runtimeId] || '');
        try {
          const response = await fetch(`${API}/action`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: 'setName', runtimeId, name: value }),
          });
          const result = await response.json();
          if (result.ok !== true) {
            setState({ ...state, notice: t('names.failed') });
            return;
          }
          setDrafts({ ...drafts, [runtimeId]: undefined });
          setState({ ...state, notice: t('names.saved') });
          await reload();
        } catch (error) {
          setState({ ...state, notice: String(error) });
        }
      };

      return h('div', { className: 'ar-cr' }, [
        h('style', { dangerouslySetInnerHTML: { __html: CREDENTIALS_CSS }, key: 'style' }),
        h('div', { className: 'ar-crHead', key: 'head' }, [
          h('div', { key: 'text' }, [
            h('div', { className: 'ar-crTitle', key: 'title' }, t('names.title')),
            h('div', { className: 'ar-crHint', key: 'hint' }, t('names.hint')),
          ]),
        ]),
        state.notice !== '' ? h('div', { className: 'ar-crNotice', key: 'notice' }, state.notice) : null,
        state.loading
          ? h('div', { className: 'ar-crEmpty', key: 'loading' }, t('credentials.loading'))
          : h('div', { className: 'ar-crList', key: 'list' }, state.runtimes.map((runtime) => {
            const alias = state.names[runtime.id] || '';
            const value = drafts[runtime.id] !== undefined ? drafts[runtime.id] : alias;
            return h('div', { className: 'ar-crRow', key: runtime.id }, [
              h('div', { className: 'ar-crRowMain', key: 'main' }, [
                h('div', { className: 'ar-crName', key: 'name' }, runtime.name),
                h('div', { className: 'ar-crMeta', key: 'meta' },
                  alias !== '' ? t('names.aliased', { builtin: runtime.builtinName || runtime.id }) : (runtime.builtinName || runtime.id)),
                h('input', {
                  key: 'input',
                  className: 'ar-crInlineInput',
                  value: value === undefined ? '' : value,
                  placeholder: runtime.builtinName || runtime.id,
                  onChange: (event) => setDrafts({ ...drafts, [runtime.id]: event.target.value }),
                }),
              ]),
              h('button', {
                type: 'button', className: 'ar-btn ar-btn--primary', key: 'save',
                onClick: () => { void save(runtime.id); },
              }, t('names.save')),
            ]);
          })),
      ]);
    }

    function CredentialsSection() {
      const [state, setState] = useState({ loading: true, items: [], error: '', notice: '' });
      const [draft, setDraft] = useState(null);
      const [invoke, setInvoke] = useState(null);

      const reload = async () => {
        try {
          const response = await fetch(`${API}/credentials`, { cache: 'no-store' });
          const data = await response.json();
          setState({
            loading: false,
            items: Array.isArray(data.items) ? data.items : [],
            error: data.ok === true ? '' : (typeof data.error === 'string' ? data.error : ''),
            notice: '',
          });
        } catch (error) {
          setState({ loading: false, items: [], error: String(error), notice: '' });
        }
      };

      useEffect(() => { void reload(); }, []);

      const submit = async () => {
        if (draft === null) return;
        if (draft.name.trim() === '' || draft.secret.trim() === '') {
          setState({ ...state, notice: t('credentials.required') });
          return;
        }
        try {
          const response = await fetch(`${API}/credentials`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: draft.name, agent: draft.agent, purpose: draft.purpose, secret: draft.secret }),
          });
          const result = await response.json();
          if (result.ok !== true) {
            setState({ ...state, notice: t('credentials.failed') });
            return;
          }
          setDraft(null);
          setState({ ...state, notice: '' });
          await reload();
        } catch (error) {
          setState({ ...state, notice: String(error) });
        }
      };

      const remove = async (id) => {
        try {
          await fetch(`${API}/credentials`, {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ id }),
          });
        } catch {
          // The list refresh reports whatever remains.
        }
        await reload();
      };

      const sendInvoke = async () => {
        if (invoke === null) return;
        if (invoke.url.trim() === '') {
          setInvoke({ ...invoke, result: t('credentials.urlRequired') });
          return;
        }
        setInvoke({ ...invoke, result: t('credentials.sending') });
        try {
          const response = await fetch(`${API}/action`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: 'invoke', id: invoke.id, url: invoke.url, method: invoke.method, body: invoke.body }),
          });
          const result = await response.json();
          if (result.ok !== true) {
            setInvoke({ ...invoke, result: `${t('credentials.callFailed')}\n${result.error || ''}` });
            return;
          }
          setInvoke({ ...invoke, result: `HTTP ${result.status}\n\n${result.body}` });
        } catch (error) {
          setInvoke({ ...invoke, result: String(error) });
        }
      };

      const field = (key, labelKey, placeholderKey, value, onChange, type) => h('label', { className: 'ar-crField', key }, [
        h('span', { key: 'label' }, t(labelKey)),
        h('input', {
          key: 'input',
          type: type || 'text',
          value,
          placeholder: t(placeholderKey),
          onChange: (event) => onChange(event.target.value),
        }),
      ]);

      return h('div', { className: 'ar-cr' }, [
        h('style', { dangerouslySetInnerHTML: { __html: CREDENTIALS_CSS }, key: 'style' }),
        h('div', { className: 'ar-crHead', key: 'head' }, [
          h('div', { key: 'text' }, [
            h('div', { className: 'ar-crTitle', key: 'title' }, t('credentials.title')),
            h('div', { className: 'ar-crHint', key: 'hint' }, t('credentials.hint')),
          ]),
          h('button', {
            type: 'button', className: 'ar-btn ar-btn--primary', key: 'add',
            onClick: () => setDraft({ name: '', agent: 'workbuddy', purpose: '', secret: '' }),
          }, t('credentials.add')),
        ]),
        state.notice !== '' ? h('div', { className: 'ar-crNotice', key: 'notice' }, state.notice) : null,
        state.error !== '' ? h('div', { className: 'ar-crNotice', key: 'error' }, state.error) : null,
        draft !== null ? h('div', { className: 'ar-crForm', key: 'form' }, [
          field('name', 'credentials.name', 'credentials.namePlaceholder', draft.name, (value) => setDraft({ ...draft, name: value })),
          h('label', { className: 'ar-crField', key: 'agent' }, [
            h('span', { key: 'label' }, t('credentials.agent')),
            h('input', {
              key: 'input',
              list: 'agent-runtimes-agent-options',
              value: draft.agent,
              placeholder: t('credentials.agentPlaceholder'),
              onChange: (event) => setDraft({ ...draft, agent: event.target.value }),
            }),
            h('datalist', { id: 'agent-runtimes-agent-options', key: 'datalist' },
              RUNTIME_OPTIONS.map((option) => h('option', { value: option.id, key: option.id }, option.name))),
          ]),
          field('purpose', 'credentials.purpose', 'credentials.purposePlaceholder', draft.purpose, (value) => setDraft({ ...draft, purpose: value })),
          field('secret', 'credentials.secret', 'credentials.secretPlaceholder', draft.secret, (value) => setDraft({ ...draft, secret: value }), 'password'),
          h('div', { className: 'ar-crActions', key: 'actions' }, [
            h('button', { type: 'button', className: 'ar-btn', key: 'cancel', onClick: () => setDraft(null) }, t('credentials.cancel')),
            h('button', { type: 'button', className: 'ar-btn ar-btn--primary', key: 'confirm', onClick: () => { void submit(); } }, t('credentials.confirm')),
          ]),
        ]) : null,
        state.loading
          ? h('div', { className: 'ar-crEmpty', key: 'loading' }, t('credentials.loading'))
          : state.items.length === 0
            ? h('div', { className: 'ar-crEmpty', key: 'empty' }, t('credentials.empty'))
            : h('div', { className: 'ar-crList', key: 'list' }, state.items.map((item) => h('div', { className: 'ar-crItem', key: item.id }, [
              h('div', { className: 'ar-crRow', key: 'row' }, [
                h('div', { className: 'ar-crRowMain', key: 'main' }, [
                  h('div', { className: 'ar-crName', key: 'name' }, item.name),
                  h('div', { className: 'ar-crMeta', key: 'meta' },
                    `${runtimeNameOf(item.agent)} · ${item.ref} · ${item.configured ? t('credentials.configured') : t('credentials.missing')}`),
                  item.purpose !== '' ? h('div', { className: 'ar-crMeta', key: 'purpose' }, item.purpose) : null,
                ]),
                h('div', { className: 'ar-crRowMeta', key: 'time' }, formatRelative(item.createdAt, Date.now())),
                (PRESET_CALLS[item.agent] || []).map((preset) => h('button', {
                  type: 'button', className: 'ar-linkBtn', key: preset.id,
                  onClick: () => setInvoke({ id: item.id, url: preset.url, method: preset.method, body: preset.body, result: null }),
                }, t(preset.labelKey))),
                h('button', {
                  type: 'button', className: 'ar-linkBtn', key: 'invoke',
                  onClick: () => setInvoke({ id: item.id, url: '', method: 'POST', body: '', result: null }),
                }, t('credentials.invoke')),
                h('button', { type: 'button', className: 'ar-linkBtn', key: 'delete', onClick: () => { void remove(item.id); } }, t('credentials.remove')),
              ]),
              invoke !== null && invoke.id === item.id ? h('div', { className: 'ar-crForm', key: 'invokeForm' }, [
                h('label', { className: 'ar-crField', key: 'url' }, [
                  h('span', { key: 'label' }, t('credentials.url')),
                  h('input', {
                    key: 'input', value: invoke.url, placeholder: 'https://…',
                    onChange: (event) => setInvoke({ ...invoke, url: event.target.value }),
                  }),
                ]),
                h('label', { className: 'ar-crField', key: 'method' }, [
                  h('span', { key: 'label' }, t('credentials.method')),
                  h('select', {
                    key: 'select', value: invoke.method,
                    onChange: (event) => setInvoke({ ...invoke, method: event.target.value }),
                  }, ['GET', 'POST', 'PUT', 'DELETE'].map((verb) => h('option', { value: verb, key: verb }, verb))),
                ]),
                h('label', { className: 'ar-crField', key: 'body' }, [
                  h('span', { key: 'label' }, t('credentials.body')),
                  h('textarea', {
                    key: 'textarea', rows: 4, value: invoke.body, placeholder: '{"…": "…"}',
                    onChange: (event) => setInvoke({ ...invoke, body: event.target.value }),
                  }),
                ]),
                h('div', { className: 'ar-crActions', key: 'actions' }, [
                  h('button', { type: 'button', className: 'ar-btn', key: 'close', onClick: () => setInvoke(null) }, t('credentials.cancel')),
                  h('button', { type: 'button', className: 'ar-btn ar-btn--primary', key: 'send', onClick: () => { void sendInvoke(); } }, t('credentials.send')),
                ]),
                invoke.result !== null ? h('pre', { className: 'ar-crResult', key: 'result' }, invoke.result) : null,
              ]) : null,
            ]))),
      ]);
    }

    function ConsolePanel(props) {
      const { ctx, useSessions } = props;
      const storeState = useStore();
      const now = useNow(CLOCK_MS);
      const [expanded, setExpanded] = useState({});
      // The slot's session hook carries the titles; `ctx.sessions.list` on the
      // Client has no snapshot reader.
      const sessionState = (useSessions || noopUseSessions)((state) => state);

      const runtimes = Array.isArray(storeState.snapshot.runtimes) ? storeState.snapshot.runtimes : [];
      const approvals = (Array.isArray(storeState.snapshot.approvals) ? storeState.snapshot.approvals : [])
        .filter((row) => !storeState.dismissed.has(row.approvalId))
        .sort((a, b) => (b.since || 0) - (a.since || 0));
      const installed = runtimes.filter((runtime) => runtime.installed === true);
      const absent = runtimes.filter((runtime) => runtime.installed !== true);
      const ordered = [...installed].sort((a, b) => {
        const rank = (runtime) => (runtime.status === 'waiting' ? 0 : runtime.status === 'running' ? 1 : runtime.status === 'error' ? 2 : 3);
        return rank(a) - rank(b);
      });
      const snapshotAge = now - (storeState.snapshot.now || 0);
      const accessibility = storeState.snapshot.accessibility === true;
      const runningCount = installed.filter((runtime) => runtime.status === 'running' || runtime.status === 'waiting').length;
      const sessionCount = installed.reduce((total, runtime) => total + (Array.isArray(runtime.sessions) ? runtime.sessions.length : 0), 0);

      const sessionTitles = useMemo(() => {
        const map = new Map();
        const byId = (sessionState && sessionState.byId) || {};
        for (const id of Object.keys(byId)) {
          const row = byId[id] || {};
          const title = typeof row.title === 'string' && row.title !== '' ? row.title : (typeof row.displayTitle === 'string' ? row.displayTitle : '');
          if (title !== '') map.set(id, title);
        }
        return map;
      }, [sessionState]);

      const titleOf = (id) => {
        const known = sessionTitles.get(id);
        return known !== undefined ? known : '';
      };

      const toggle = (id) => setExpanded((current) => ({ ...current, [id]: current[id] !== true }));
      const open = async (runtime, session) => {
        const sessionId = session ? session.sessionId : (runtime.active !== null && typeof runtime.active === 'object' ? runtime.active.sessionId : '');
        if (runtime.id === 'dsh') {
          try {
            if (ctx.uiWorkspace && typeof ctx.uiWorkspace.openSession === 'function') ctx.uiWorkspace.openSession(sessionId);
            else if (ctx.sidebarRight && typeof ctx.sidebarRight.openResource === 'function') ctx.sidebarRight.openResource(`dsh-resource://subagentchat/session/${encodeURIComponent(sessionId)}`);
            else return;
            return;
          } catch {
            // Fall through to the message.
          }
        }
        const result = await storeState.sendAction('open', runtime.id, sessionId);
        if (result && result.ok === true) storeState.showMessage(t('action.opened', { name: runtime.name }));
        else storeState.showMessage(t('action.openFailed', { name: runtime.name }));
      };
      const interrupt = async (runtime, session) => {
        const sessionId = session ? session.sessionId : '';
        if (sessionId === '') {
          storeState.showMessage(t('action.interruptUnsupported'));
          return;
        }
        const result = await storeState.sendAction('interrupt', runtime.id, sessionId);
        if (result && result.ok === true) storeState.showMessage(t('action.interrupted', { name: runtime.name }));
        else if (result && result.error === 'not-supported') storeState.showMessage(t('action.interruptUnsupported'));
        else storeState.showMessage(t('action.interruptFailed', { name: runtime.name }));
      };
      const review = async (row) => {
        const runtime = runtimes.find((item) => item.id === row.runtimeId);
        if (runtime === undefined) return;
        await open(runtime, { sessionId: row.sessionId });
      };
      const toggleNotifications = async () => {
        if (storeState.notifyEnabled) {
          storeState.notifyEnabled = false;
          try { localStorage.setItem(NOTIFY_KEY, '0'); } catch { /* ignore */ }
          storeState.emit();
          return;
        }
        await storeState.enableNotifications();
        try { localStorage.setItem(NOTIFY_KEY, storeState.notifyEnabled ? '1' : '0'); } catch { /* ignore */ }
      };
      const toggleIntercept = async () => {
        const next = storeState.snapshot.intercept !== true;
        const result = await storeState.sendAction('setIntercept', '', '', { enabled: next });
        if (result && result.ok === true) storeState.showMessage(t(next ? 'action.interceptOn' : 'action.interceptOff'));
      };
      const decide = async (row, decision) => {
        if (row.decisionId !== undefined) {
          const result = await storeState.sendAction('decide', 'dsh', '', { decisionId: row.decisionId, decision });
          if (result && result.ok !== true) storeState.showMessage(t('action.decisionFailed', { name: row.runtimeName }));
          return;
        }
        const result = await storeState.sendAction('approveExternal', row.runtimeId, '', { decision });
        if (result && result.ok === true) storeState.showMessage(t('action.decisionSent', { name: row.runtimeName }));
        else storeState.showMessage(t('action.decisionFailed', { name: row.runtimeName }));
      };

      return h('div', { className: 'ar-root' }, [
        h('style', { dangerouslySetInnerHTML: { __html: CSS }, key: 'style' }),
        h('div', { className: 'ar-header', key: 'header' }, [
          h('div', { className: 'ar-titleBlock', key: 'titleBlock' }, [
            h('span', { className: 'ar-title', key: 'title' }, t('panel')),
            h('span', { className: 'ar-meta', key: 'meta' },
              `${t('header.runtimes', { count: installed.length })} · ${t('header.pending', { count: approvals.length })}${snapshotAge > POLL_MS * 4 ? ` · ${t('header.offline')}` : ''}`),
          ]),
          h('div', { className: 'ar-headerActions', key: 'actions' }, [
            h('button', {
              type: 'button',
              className: `ar-iconBtn${storeState.snapshot.intercept === true ? ' ar-iconBtn--on' : ''}`,
              key: 'intercept',
              title: storeState.snapshot.intercept === true ? t('header.interceptOn') : t('header.intercept'),
              'aria-pressed': storeState.snapshot.intercept === true,
              onClick: () => { void toggleIntercept(); },
            }, h(ShieldIcon, { on: storeState.snapshot.intercept === true })),
            h('button', {
              type: 'button', className: 'ar-iconBtn', key: 'notify',
              title: storeState.notifyEnabled ? t('header.notifyOn') : t('header.notify'),
              onClick: () => { void toggleNotifications(); },
            }, storeState.notifyEnabled ? '🔔' : '🔕'),
            h('button', {
              type: 'button', className: 'ar-iconBtn', key: 'refresh',
              title: t('header.refresh'), onClick: () => { void storeState.refresh(); },
            }, '⟳'),
          ]),
        ]),
        h('div', { className: 'ar-scroll', key: 'scroll' }, [
          storeState.message !== null
            ? h('div', { className: 'ar-message', key: 'message' }, storeState.message)
            : null,
          h('div', { className: 'ar-stats', key: 'stats' }, [
            h('div', { className: 'ar-stat', key: 'running' }, [
              h('div', { className: 'ar-statLabel', key: 'label' }, t('stats.running')),
              h('div', { className: 'ar-statValue ar-statValue--ok', key: 'value' }, String(runningCount)),
            ]),
            h('div', { className: 'ar-stat', key: 'pending' }, [
              h('div', { className: 'ar-statLabel', key: 'label' }, t('stats.pending')),
              h('div', { className: `ar-statValue${approvals.length > 0 ? ' ar-statValue--warn' : ''}`, key: 'value' }, String(approvals.length)),
            ]),
            h('div', { className: 'ar-stat', key: 'sessions' }, [
              h('div', { className: 'ar-statLabel', key: 'label' }, t('stats.sessions')),
              h('div', { className: 'ar-statValue', key: 'value' }, String(sessionCount)),
            ]),
          ]),
          h(ApprovalBanner, {
            key: 'approvals', approvals, now, titleOf,
            onReview: (row) => { void review(row); },
            onDismiss: (row) => storeState.dismiss(row.approvalId),
            onDecide: (row, decision) => { void decide(row, decision); },
          }),
          accessibility === false && approvals.some((row) => row.runtimeId !== 'dsh')
            ? h('div', { className: 'ar-message', key: 'accessibility' }, t('approval.needsAccessibility'))
            : null,
          ordered.length === 0 && absent.length === 0
            ? h('div', { className: 'ar-empty', key: 'empty' }, [
              h('div', { className: 'ar-emptyTitle', key: 'title' }, t('empty.title')),
              h('div', { key: 'body' }, t('empty.body')),
            ])
            : h('div', { className: 'ar-grid', key: 'grid' }, [
              ...ordered.map((runtime) => h(RuntimeCard, {
                key: runtime.id, runtime, now,
                expanded: expanded[runtime.id] === true,
                sessionTitle: titleOf,
                onToggle: toggle,
                onOpen: (target, session) => { void open(target, session); },
                onInterrupt: (target, session) => { void interrupt(target, session); },
              })),
              ...absent.map((runtime) => h(RuntimeCard, {
                key: runtime.id, runtime, now,
                expanded: false,
                sessionTitle: titleOf,
                onToggle: () => {},
                onOpen: () => {},
                onInterrupt: () => {},
              })),
            ]),
          h(ActivityFeed, {
            key: 'activity',
            events: Array.isArray(storeState.snapshot.activity) ? storeState.snapshot.activity : [],
            now,
          }),
        ]),
      ]);
    }

    function ReminderToast() {
      const storeState = useStore();
      const reminder = storeState.reminder;
      useEffect(() => () => {
        if (storeState.reminderTimer !== undefined) clearTimeout(storeState.reminderTimer);
      }, []);
      if (reminder === null) return null;
      return h('div', { className: 'ar-toastWrap' }, [
        h('style', { dangerouslySetInnerHTML: { __html: TOAST_CSS }, key: 'style' }),
        h('div', { className: 'ar-toast', key: 'toast' }, [
          h('div', { className: 'ar-toastHead', key: 'head' }, [
            h('div', { key: 'text' }, [
              h('div', { className: 'ar-toastTitle', key: 'title' }, `${t('reminder.title')} · ${reminder.runtimeName}`),
              h('div', { className: 'ar-toastBody', key: 'body' }, reminder.reason),
            ]),
            h('button', {
              type: 'button', className: 'ar-btn ar-btn--icon ar-toastClose', key: 'close',
              onClick: () => storeState.clearReminder(),
            }, '✕'),
          ]),
          h('div', { className: 'ar-toastActions', key: 'actions' }, (
            reminder.actionable === true
              ? [
                  h('button', {
                    type: 'button', className: 'ar-btn ar-btn--primary', key: 'allow',
                    onClick: () => {
                      void storeState.sendAction('decide', 'dsh', '', { decisionId: reminder.decisionId, decision: 'allowed-once' });
                      storeState.clearReminder();
                    },
                  }, t('approval.allowOnce')),
                  h('button', {
                    type: 'button', className: 'ar-btn', key: 'reject',
                    onClick: () => {
                      void storeState.sendAction('decide', 'dsh', '', { decisionId: reminder.decisionId, decision: 'rejected' });
                      storeState.clearReminder();
                    },
                  }, t('approval.reject')),
                ]
              : [
                  h('button', {
                    type: 'button', className: 'ar-btn ar-btn--primary', key: 'review',
                    onClick: () => {
                      const runtime = (storeState.snapshot.runtimes || []).find((row) => row.id === reminder.runtimeId);
                      if (runtime !== undefined) {
                        const sessionId = reminder.sessionId || (runtime.active !== null && typeof runtime.active === 'object' ? runtime.active.sessionId : '');
                        void storeState.sendAction('open', runtime.id, sessionId).then((result) => {
                          if (result && result.ok === true) storeState.showMessage(t('action.opened', { name: runtime.name }));
                        });
                      }
                      storeState.clearReminder();
                    },
                  }, t('approval.review')),
                ]
          )),
        ]),
      ]);
    }

    /* ---------------------------------------------------------------- */
    /* registration                                                     */
    /* ---------------------------------------------------------------- */

    return {
      inject: ['slots', 'locale', 'sessions', 'uiWorkspace'],
      apply(ctx) {
        t = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, dictionaries), 'agent-runtimes: dictionaries');

        ctx.effect(() => {
          store.start();
          return () => store.stop();
        }, 'agent-runtimes: store');

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', key: PANEL_ID, locale: NS,
          inject: () => ({ ctx }),
        }, ConsolePanel));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: PANEL_ID, order: 28, locale: NS,
          label: () => t('panel'),
        }, PanelIcon));

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay', id: 'agent-runtimes.reminder', order: 90,
          label: () => t('panel'),
        }, ReminderToast));

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section', id: 'agent-runtimes-names', order: 24, locale: NS,
          label: () => t('names.nav'),
        }, AgentNamesSection));

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section', id: 'agent-runtimes-credentials', order: 25, locale: NS,
          label: () => t('credentials.nav'),
        }, CredentialsSection));
      },
    };
  },
});
