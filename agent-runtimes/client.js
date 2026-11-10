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
        'header.offline': 'offline',
        'header.runtimes': '{count} runtimes',
        'header.pending': '{count} pending',
        'approval.title': 'Needs your approval',
        'activity.title': 'Recent activity',
        'activity.empty': 'No activity recorded yet.',
        'activity.newSession': 'new session',
        'approval.review': 'Review',
        'approval.dismiss': 'Dismiss',
        'approval.none': 'No pending approvals.',
        'runtime.open': 'Open',
        'runtime.interrupt': 'Stop',
        'runtime.sessions': '{count} sessions',
        'runtime.heartbeat': 'live',
        'runtime.noData': 'Process running — no readable session state.',
        'runtime.notInstalled': 'Not installed',
        'tokens': 'Tokens',
        'approval.pendingSession': 'DeepSeek Harness session',
        'status.running': 'Running',
        'status.idle': 'Idle',
        'status.waiting': 'Waiting',
        'status.error': 'Error',
        'status.absent': 'Not installed',
        'status.stopped': 'Stopped',
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
        'reminder.title': 'Approval needed',
      },
      zh: {
        panel: '代理运行时',
        description: '本机主流 Agent 运行时统一控制台，审批请求即时提醒。',
        'header.refresh': '刷新',
        'header.notify': '桌面通知',
        'header.notifyOn': '桌面通知已开启',
        'header.offline': '离线',
        'header.runtimes': '{count} 个运行时',
        'header.pending': '{count} 项待处理',
        'approval.title': '需要你审批',
        'activity.title': '最近动态',
        'activity.empty': '暂无动态。',
        'activity.newSession': '新会话',
        'approval.review': '去处理',
        'approval.dismiss': '忽略',
        'approval.none': '暂无待审批事项。',
        'runtime.open': '打开',
        'runtime.interrupt': '停止',
        'runtime.sessions': '{count} 个会话',
        'runtime.heartbeat': '活跃',
        'runtime.noData': '进程运行中 — 暂无可读的会话状态。',
        'runtime.notInstalled': '未安装',
        'tokens': '令牌',
        'approval.pendingSession': 'DeepSeek Harness 会话',
        'status.running': '运行中',
        'status.idle': '空闲',
        'status.waiting': '等待中',
        'status.error': '异常',
        'status.absent': '未安装',
        'status.stopped': '已停止',
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
        'reminder.title': '需要审批',
      },
    };

    const CSS = `
.ar-root { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-size: 13px; }
.ar-root *, .ar-root *::before, .ar-root *::after { box-sizing: border-box; }
.ar-header { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.ar-title { font-size: 14px; font-weight: 650; letter-spacing: -0.01em; }
.ar-meta { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.ar-headerActions { margin-left: auto; display: flex; align-items: center; gap: 6px; }
.ar-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 10px 12px 18px; display: flex; flex-direction: column; gap: 10px; }
.ar-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 34px 18px; text-align: center; color: var(--dsw-alias-label-secondary); }
.ar-emptyTitle { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary); }

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

.ar-runtime { border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
.ar-runtime--absent { opacity: 0.55; }
.ar-runtime--error { border-color: var(--dsw-alias-state-error-primary); }
.ar-runtimeHead { display: flex; align-items: center; gap: 9px; padding: 9px 11px; cursor: pointer; }
.ar-runtimeHead:hover { background: var(--dsw-alias-bg-layer-2); }
.ar-badge { width: 24px; height: 24px; border-radius: 7px; flex: none; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; }
.ar-runtimeName { font-weight: 600; font-size: 13px; }
.ar-runtimeState { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.ar-runtimeRight { margin-left: auto; display: flex; align-items: center; gap: 6px; }
.ar-chevron { color: var(--dsw-alias-label-secondary); font-size: 11px; transition: transform 0.12s ease; }
.ar-chevron--open { transform: rotate(90deg); }

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
.ar-count { font-size: 11px; font-weight: 650; min-width: 17px; height: 17px; padding: 0 5px; border-radius: 999px; background: var(--dsw-alias-state-warn-primary); color: #fff; display: inline-flex; align-items: center; justify-content: center; }

.ar-active { padding: 0 11px 9px; display: flex; flex-direction: column; gap: 3px; }
.ar-activeTitle { font-size: 12.5px; font-weight: 550; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-activeMeta { color: var(--dsw-alias-label-secondary); font-size: 11.5px; display: flex; gap: 8px; flex-wrap: wrap; }

.ar-sessions { border-top: 1px solid var(--dsw-alias-border-l1); padding: 6px 8px 8px; display: flex; flex-direction: column; gap: 2px; }.ar-session { display: flex; align-items: center; gap: 8px; padding: 5px 7px; border-radius: 6px; cursor: pointer; }
.ar-session:hover { background: var(--dsw-alias-bg-layer-2); }
.ar-sessionTitle { flex: 1 1 auto; min-width: 0; font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ar-sessionMeta { color: var(--dsw-alias-label-secondary); font-size: 11.5px; flex: none; }
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

.ar-iconWrap { position: relative; display: inline-flex; }
.ar-iconBadge { position: absolute; top: -5px; right: -7px; min-width: 13px; height: 13px; padding: 0 3px; border-radius: 999px; background: var(--dsw-alias-state-warn-primary); color: #fff; font-size: 9px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
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

    const ICON_CSS = `
.ar-iconWrap { position: relative; display: inline-flex; }
.ar-iconBadge { position: absolute; top: -5px; right: -7px; min-width: 13px; height: 13px; padding: 0 3px; border-radius: 999px; background: var(--dsw-alias-state-warn-primary); color: #fff; font-size: 9px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
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
      async sendAction(action, runtimeId, sessionId) {
        try {
          const response = await fetch(`${API}/action`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action, runtimeId, sessionId }),
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

    function RuntimeBadge({ runtimeId }) {
      const badge = RUNTIME_BADGES[runtimeId] || { letter: '?', color: '#64748B' };
      return h('span', { className: 'ar-badge', style: { background: badge.color } }, badge.letter);
    }

    function PanelIcon(props) {
      const size = props.size || 16;
      const storeState = useStore();
      const count = (storeState.snapshot.approvals || []).filter((row) => !storeState.dismissed.has(row.approvalId)).length;
      return h('span', { className: 'ar-iconWrap' }, [
        h('style', { dangerouslySetInnerHTML: { __html: ICON_CSS }, key: 'style' }),
        h('svg', {
          width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
          stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round',
          strokeLinejoin: 'round', 'aria-hidden': true, style: { display: 'block' },
        }, [
          h('rect', { x: 1.7, y: 2.2, width: 12.6, height: 9.2, rx: 1.6 }),
          h('path', { d: 'M4.6 6.2h6.8M4.6 8.6h4.4' }),
          h('path', { d: 'M3.4 13.6h9.2' }),
        ]),
        count > 0 ? h('span', { className: 'ar-iconBadge', key: 'badge' }, String(count)) : null,
      ]);
    }

    function ApprovalBanner(props) {
      const { approvals, now, titleOf, onReview, onDismiss } = props;
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
            h('div', { className: 'ar-approvalActions', key: 'actions' }, [
              h('button', {
                type: 'button', className: 'ar-btn ar-btn--primary', key: 'review',
                onClick: () => onReview(row),
              }, t('approval.review')),
              h('button', {
                type: 'button', className: 'ar-btn', key: 'dismiss',
                onClick: () => onDismiss(row),
              }, t('approval.dismiss')),
            ]),
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

      const head = h('div', {
        className: 'ar-runtimeHead', onClick: () => onToggle(runtime.id),
        role: 'button', tabIndex: 0,
        onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') onToggle(runtime.id); },
      }, [
        h(StatusDot, { status, key: 'dot' }),
        h(RuntimeBadge, { runtimeId: runtime.id, key: 'badge' }),
        h('div', { key: 'names' }, [
          h('div', { className: 'ar-runtimeName', key: 'name' }, runtime.name),
          h('div', { className: 'ar-runtimeState', key: 'state' },
            notInstalled
              ? t('runtime.notInstalled')
              : (active !== null ? shortTitle(active.title, runtime.id) : (mode !== '' ? mode : t('runtime.noData')))),
        ]),
        h('div', { className: 'ar-runtimeRight', key: 'right' }, [
          approvals.length > 0 ? h('span', { className: 'ar-count', key: 'count' }, String(approvals.length)) : null,
          h(Pill, { status, key: 'pill' }),
          h('span', { className: `ar-chevron${expanded ? ' ar-chevron--open' : ''}`, key: 'chevron' }, '›'),
        ]),
      ]);

      if (notInstalled) {
        return h('div', { className: 'ar-runtime ar-runtime--absent' }, [head]);
      }

      const body = [];
      if (active !== null) {
        const meta = [];
        if (active.model !== '') meta.push(h('span', { key: 'model' }, active.model));
        const activeTokens = formatTokens(active.tokens);
        if (activeTokens !== '') meta.push(h('span', { key: 'tokens' }, `${t('tokens')} ${activeTokens}`));
        if (active.cwd !== '') meta.push(h('span', { key: 'cwd' }, active.cwd));
        const when = formatRelative(active.lastActivityAt || active.updatedAt, now);
        if (when !== '') meta.push(h('span', { key: 'time' }, when));
        body.push(h('div', { className: 'ar-active', key: 'active' }, [
          h('div', { className: 'ar-activeTitle', key: 'title', title: active.title }, shortTitle(active.title, runtime.id)),
          meta.length > 0 ? h('div', { className: 'ar-activeMeta', key: 'meta' }, meta) : null,
        ]));
      }

      if (expanded) {
        const rows = sessions.slice(0, 8).map((session) => {
          const title = shortTitle(sessionTitle(session.sessionId), session.title);
          const meta = [];
          if (session.model !== '') meta.push(h('span', { key: 'model' }, session.model));
          const sessionTokens = formatTokens(session.tokens);
          if (sessionTokens !== '') meta.push(h('span', { key: 'tokens' }, `${t('tokens')} ${sessionTokens}`));
          const when = formatRelative(session.lastActivityAt || session.updatedAt, now);
          if (when !== '') meta.push(h('span', { key: 'time' }, when));
          return h('div', {
            className: 'ar-session', key: session.sessionId, title,
            onClick: () => onOpen(runtime, session),
          }, [
            h(StatusDot, { status: sessionStatusKey(session.status), key: 'dot' }),
            h('span', { className: 'ar-sessionTitle', key: 'title' }, title),
            meta.length > 0 ? h('span', { className: 'ar-sessionMeta', key: 'meta' }, meta) : null,
            runtime.id === 'dsh'
              ? h('button', {
                  type: 'button', className: 'ar-btn ar-btn--icon', key: 'stop',
                  title: t('runtime.interrupt'),
                  onClick: (event) => {
                    event.stopPropagation();
                    onInterrupt(runtime, session);
                  },
                }, '■')
              : null,
          ]);
        });
        if (rows.length === 0) {
          rows.push(h('div', { className: 'ar-meta', key: 'none' }, t('runtime.noData')));
        }
        body.push(h('div', { className: 'ar-sessions', key: 'sessions' }, rows));
      }

      return h('div', { className: `ar-runtime ar-runtime--${status}` }, [head, ...body]);
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

    function ConsolePanel(props) {
      const { ctx } = props;
      const storeState = useStore();
      const now = useNow(CLOCK_MS);
      const [expanded, setExpanded] = useState({});

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

      const sessionTitles = useMemo(() => {
        const map = new Map();
        try {
          const snapshot = ctx.sessions && ctx.sessions.list && typeof ctx.sessions.list.getSnapshot === 'function'
            ? ctx.sessions.list.getSnapshot() : null;
          const byId = (snapshot && snapshot.byId) || {};
          for (const id of Object.keys(byId)) {
            const row = byId[id] || {};
            const title = typeof row.title === 'string' && row.title !== '' ? row.title : (typeof row.displayTitle === 'string' ? row.displayTitle : '');
            if (title !== '') map.set(id, title);
          }
        } catch {
          // Titles are a nicety; the console works without them.
        }
        return map;
      }, [ctx, storeState.snapshot.now]);

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

      return h('div', { className: 'ar-root' }, [
        h('style', { dangerouslySetInnerHTML: { __html: CSS }, key: 'style' }),
        h('div', { className: 'ar-header', key: 'header' }, [
          h('span', { className: 'ar-title', key: 'title' }, t('panel')),
          h('span', { className: 'ar-meta', key: 'meta' },
            `${t('header.runtimes', { count: installed.length })} · ${t('header.pending', { count: approvals.length })}${snapshotAge > POLL_MS * 4 ? ` · ${t('header.offline')}` : ''}`),
          h('div', { className: 'ar-headerActions', key: 'actions' }, [
            storeState.message !== null ? h('span', { className: 'ar-meta', key: 'message' }, storeState.message) : null,
            h('button', {
              type: 'button', className: 'ar-btn ar-btn--icon', key: 'notify',
              title: storeState.notifyEnabled ? t('header.notifyOn') : t('header.notify'),
              onClick: () => { void toggleNotifications(); },
            }, storeState.notifyEnabled ? '🔔' : '🔕'),
            h('button', {
              type: 'button', className: 'ar-btn ar-btn--icon', key: 'refresh',
              title: t('header.refresh'), onClick: () => { void storeState.refresh(); },
            }, '⟳'),
          ]),
        ]),
        h('div', { className: 'ar-scroll', key: 'scroll' }, [
          h(ApprovalBanner, {
            key: 'approvals', approvals, now, titleOf,
            onReview: (row) => { void review(row); },
            onDismiss: (row) => storeState.dismiss(row.approvalId),
          }),
          ordered.length === 0 && absent.length === 0
            ? h('div', { className: 'ar-empty', key: 'empty' }, [
              h('div', { className: 'ar-emptyTitle', key: 'title' }, t('empty.title')),
              h('div', { key: 'body' }, t('empty.body')),
            ])
            : [
              ...ordered.map((runtime) => h(RuntimeCard, {
                key: runtime.id, runtime, now,
                expanded: expanded[runtime.id] === true,
                sessionTitle: titleOf,
                onToggle: toggle,
                onOpen: (target, session) => { void open(target, session); },
                onInterrupt: (target, session) => { void interrupt(target, session); },
              })),
              ...absent.map((runtime) => h('div', {
                className: 'ar-runtime ar-runtime--absent', key: runtime.id,
              }, [
                h('div', { className: 'ar-runtimeHead' }, [
                  h(StatusDot, { status: 'absent', key: 'dot' }),
                  h(RuntimeBadge, { runtimeId: runtime.id, key: 'badge' }),
                  h('div', { key: 'names' }, [
                    h('div', { className: 'ar-runtimeName', key: 'name' }, runtime.name),
                    h('div', { className: 'ar-runtimeState', key: 'state' }, t('runtime.notInstalled')),
                  ]),
                  h('div', { className: 'ar-runtimeRight', key: 'right' }, [
                    h(Pill, { status: 'absent', key: 'pill' }),
                  ]),
                ]),
              ])),
            ],
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
          h('div', { className: 'ar-toastActions', key: 'actions' }, [
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
          ]),
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
      },
    };
  },
});
