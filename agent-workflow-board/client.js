/**
 * Client half of the Agent Workflow Board bundle.
 *
 * Four views over one multi-agent workspace:
 *  - Overview: workspace totals, the lead Session card, and a recent-activity feed.
 *  - Graph: the session lineage as a live agent DAG (Lead -> members -> grandchildren).
 *  - Timeline: durable workflow runs plus the agent-spawning rail.
 *  - Team: the Agent Team roster and shared task board, with a lineage roster fallback.
 *
 * Registered as a left-sidebar panel, a center panel, and a right-sidebar tab.
 */
window.__ModuleLoader__.load({
  id: '@local/agent-workflow-board',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useRef, useState } = React;

    const NS = 'agent-workflow-board';
    const PANEL_ID = 'agent-workflow-board';
    const WIDE_MIN = 780;
    const ACTIVE_MS = 2 * 60 * 60 * 1000;
    const RUNS_API = '/api/agent-workflow-board/runs';
    const NODE_W = 248;
    const NODE_H = 106;
    const HGAP = 56;
    const VGAP = 16;

    const dictionaries = {
      en: {
        panel: 'Agent workflow',
        description: 'Live multi-agent workflow board: overview, agent lineage graph, workflow run timeline and Agent Team task board.',
        'tab.overview': 'Overview',
        'tab.graph': 'Graph',
        'tab.timeline': 'Timeline',
        'tab.team': 'Team',
        'overview.title': 'Overview',
        'overview.lead': 'Current session',
        'overview.pick': 'Pick a root session',
        'overview.stats.sessions': 'Sessions',
        'overview.stats.agents': 'Agents',
        'overview.stats.running': 'Running',
        'overview.stats.tokens': 'Tokens',
        'overview.stats.runs': 'Workflow runs',
        'overview.stats.duration': 'Agent time',
        'overview.empty': 'No sessions yet.\nOpen a conversation or spawn a subagent to populate this board.',
        'overview.activity': 'Recent activity',
        'overview.activity.empty': 'No recorded activity yet.',
        'overview.activity.session': 'Session updated',
        'overview.activity.agent': 'Agent spawned',
        'overview.activity.run': 'Workflow run',
        'overview.activity.turn': 'Turn finished',
        'overview.open': 'Open',
        'overview.model': 'Model',
        'overview.updated': 'Updated',
        'overview.children': '{count} agents',
        'overview.noModel': 'No model route yet',
        'graph.title': 'Agent graph',
        'graph.empty': 'No sessions yet.\nOpen a conversation or spawn a subagent to see the workflow graph.',
        'graph.showAll': 'Show all',
        'graph.activeOnly': 'Active only',
        'graph.hidden': '{count} idle hidden',
        'graph.root': 'Root session',
        'graph.open': 'Open conversation',
        'graph.current': 'Current',
        'graph.agents': '{count} agents',
        'graph.legend': 'Running · Done · Idle · Failed',
        tokens: 'Tokens',
        duration: 'Duration',
        'mode.continuable': 'continuable',
        'mode.one-shot': 'one-shot',
        'mode.external': 'external',
        'mode.unknown': 'unknown',
        'status.running': 'Running',
        'status.done': 'Done',
        'status.idle': 'Idle',
        'status.failed': 'Failed',
        'status.waiting': 'Waiting',
        'timeline.title': 'Workflow timeline',
        'timeline.empty': 'No workflow runs yet.\nRun the workflow tool (multi-agent orchestration) and its stages and agents appear here.',
        'timeline.runs': '{count} runs',
        'timeline.agents': '{count} agents',
        'timeline.offline': 'offline',
        'timeline.running': 'running',
        'timeline.completed': 'completed',
        'timeline.cancelled': 'cancelled',
        'timeline.error': 'error',
        'timeline.interrupted': 'interrupted',
        'timeline.defaultPhase': 'Default phase',
        'timeline.open': 'Open agent conversation',
        'timeline.agentRail': 'Agent spawning',
        'timeline.agentRailEmpty': 'No subagent has been spawned in this workspace yet.',
        'timeline.runSection': 'Workflow runs',
        'timeline.runEmpty': 'No workflow runs recorded yet.',
        'team.title': 'Team',
        'team.empty': 'No Agent Team in this session.\nSpawn teammates to see the roster and the shared task board.',
        'team.roster': 'Roster',
        'team.tasks': 'Tasks',
        'team.lead': 'lead',
        'team.member': 'member',
        'team.owner': 'Owner',
        'team.unowned': 'Unowned',
        'team.blockedBy': 'Blocked by',
        'team.writeScopes': 'Write scopes',
        'team.ready': 'Ready',
        'team.blocked': 'Blocked',
        'team.open': 'Open conversation',
        'team.lineageTitle': 'Agent roster',
        'team.lineageHint': 'This workspace has no Agent Team record yet. Showing every session in the lineage instead — spawn teammates to add roles, tasks and write scopes.',
        'team.tasksEmpty': 'No shared tasks yet.',
        'task.pending': 'Pending',
        'task.in_progress': 'In progress',
        'task.completed': 'Completed',
      },
      zh: {
        panel: '代理工作流',
        description: '实时多 Agent 工作流面板：总览、代理代际关系图、工作流运行时间线、Agent 团队任务板。',
        'tab.overview': '总览',
        'tab.graph': '关系图',
        'tab.timeline': '时间线',
        'tab.team': '团队',
        'overview.title': '总览',
        'overview.lead': '当前会话',
        'overview.pick': '选择根会话',
        'overview.stats.sessions': '会话',
        'overview.stats.agents': '代理',
        'overview.stats.running': '运行中',
        'overview.stats.tokens': 'Token',
        'overview.stats.runs': '工作流',
        'overview.stats.duration': '代理耗时',
        'overview.empty': '还没有会话。\n打开一个对话或派生一个子代理，这里就会显示工作流内容。',
        'overview.activity': '最近活动',
        'overview.activity.empty': '还没有记录到活动。',
        'overview.activity.session': '会话更新',
        'overview.activity.agent': '派生代理',
        'overview.activity.run': '工作流运行',
        'overview.activity.turn': '回合结束',
        'overview.open': '打开',
        'overview.model': '模型',
        'overview.updated': '更新于',
        'overview.children': '{count} 个子代理',
        'overview.noModel': '尚未选择模型',
        'graph.title': '代理关系图',
        'graph.empty': '还没有会话。\n打开一个对话或派生一个子代理，这里就会显示出工作流关系图。',
        'graph.showAll': '显示全部',
        'graph.activeOnly': '只看活跃',
        'graph.hidden': '已隐藏 {count} 个沉睡节点',
        'graph.root': '根会话',
        'graph.open': '打开会话',
        'graph.current': '当前',
        'graph.agents': '{count} 个子代理',
        'graph.legend': '运行中 · 已完成 · 待命 · 失败',
        tokens: 'Token',
        duration: '耗时',
        'mode.continuable': '可续聊',
        'mode.one-shot': '一次性',
        'mode.external': '外部',
        'mode.unknown': '未知',
        'status.running': '运行中',
        'status.done': '已完成',
        'status.idle': '待命',
        'status.failed': '失败',
        'status.waiting': '等待中',
        'timeline.title': '工作流时间线',
        'timeline.empty': '还没有工作流运行。\n让模型调用 workflow 工具（多代理编排）后，阶段与子代理会出现在这里。',
        'timeline.runs': '{count} 次运行',
        'timeline.agents': '{count} 个子代理',
        'timeline.offline': '离线',
        'timeline.running': '运行中',
        'timeline.completed': '已完成',
        'timeline.cancelled': '已取消',
        'timeline.error': '出错',
        'timeline.interrupted': '已中断',
        'timeline.defaultPhase': '默认阶段',
        'timeline.open': '打开子代理会话',
        'timeline.agentRail': '代理派生',
        'timeline.agentRailEmpty': '该工作区还没有派生过子代理。',
        'timeline.runSection': '工作流运行',
        'timeline.runEmpty': '还没有工作流运行记录。',
        'team.title': '团队',
        'team.empty': '当前会话没有 Agent 团队。\n派生队友后，这里会显示花名册与共享任务板。',
        'team.roster': '花名册',
        'team.tasks': '任务',
        'team.lead': '负责人',
        'team.member': '成员',
        'team.owner': '负责人',
        'team.unowned': '未分配',
        'team.blockedBy': '被阻塞',
        'team.writeScopes': '可写范围',
        'team.ready': '可开始',
        'team.blocked': '被阻塞',
        'team.open': '打开会话',
        'team.lineageTitle': '代理名册',
        'team.lineageHint': '该工作区还没有 Agent 团队记录，先展示会话血缘中的全部代理；派生队友后可显示角色、任务与可写范围。',
        'team.tasksEmpty': '还没有共享任务。',
        'task.pending': '待处理',
        'task.in_progress': '进行中',
        'task.completed': '已完成',
      },
    };

    const CSS = [
      '.awb-root{display:flex;flex-direction:column;flex:1 1 auto;height:100%;min-height:0;min-width:0;color:var(--dsw-alias-label-primary);font-size:13px}',
      '.awb-view{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;min-width:0}',
      '.awb-tabs{display:flex;gap:4px;padding:10px 14px 0;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}',
      '.awb-tab{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:20px;padding:6px 11px;border-radius:8px;cursor:pointer}',
      '.awb-tab:hover{background:var(--dsw-alias-bg-layer-1)}',
      '.awb-tabActive{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}',
      '.awb-body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}',
      '.awb-toolbar{display:flex;align-items:center;gap:8px;padding:12px 16px 8px;flex:none;flex-wrap:wrap}',
      '.awb-toolbarTitle{font-size:15px;font-weight:650;letter-spacing:-0.01em}',
      '.awb-meta{font-size:11.5px;color:var(--dsw-alias-label-secondary)}',
      '.awb-select{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;padding:4px 7px;max-width:230px}',
      '.awb-btn{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;padding:4px 10px;cursor:pointer}',
      '.awb-btn:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.awb-scroll{flex:1 1 auto;min-height:0;overflow:auto;padding:6px 16px 22px}',
      '.awb-scroll::-webkit-scrollbar{width:10px;height:10px}',
      '.awb-scroll::-webkit-scrollbar-thumb{background:var(--dsw-alias-bg-layer-2);border-radius:6px;border:2px solid transparent;background-clip:content-box}',
      '.awb-scroll::-webkit-scrollbar-thumb:hover{background:var(--dsw-alias-border-l2);background-clip:content-box}',
      '.awb-empty{padding:44px 18px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12.5px;white-space:pre-line}',
      '.awb-emptyIcon{width:40px;height:40px;border-radius:12px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}',
      '.awb-legend{display:flex;gap:8px;align-items:center;font-size:11px;color:var(--dsw-alias-label-secondary);margin-left:auto}',
      /* overview */
      '.awb-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin:4px 0 16px}',
      '.awb-stat{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:11px 13px;min-width:0}',
      '.awb-statLabel{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);letter-spacing:0.02em}',
      '.awb-statValue{font-size:20px;line-height:27px;font-weight:650;letter-spacing:-0.02em;margin-top:2px;font-variant-numeric:tabular-nums}',
      '.awb-statValueSm{font-size:14px;line-height:22px;font-weight:600;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.awb-card{border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);padding:13px 15px;margin-bottom:16px}',
      '.awb-cardHead{display:flex;align-items:center;gap:9px;min-width:0}',
      '.awb-cardTitle{flex:1 1 auto;min-width:0;font-size:14px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-cardMeta{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}',
      '.awb-sectionTitle{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:650;margin:4px 0 9px}',
      '.awb-count{font-size:11px;color:var(--dsw-alias-label-secondary);font-weight:400;font-variant-numeric:tabular-nums}',
      '.awb-feed{display:flex;flex-direction:column;gap:2px}',
      '.awb-feedRow{display:flex;align-items:center;gap:9px;padding:7px 9px;border-radius:9px;min-width:0}',
      '.awb-feedRow:hover{background:var(--dsw-alias-bg-layer-1)}',
      '.awb-feedIcon{width:24px;height:24px;flex:none;border-radius:7px;background:var(--dsw-alias-bg-layer-2);display:flex;align-items:center;justify-content:center;font-size:12px}',
      '.awb-feedText{flex:1 1 auto;min-width:0;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-feedTime{flex:none;font-size:10.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}',
      /* graph */
      '.awb-graphScroll{height:100%;overflow:auto}',
      '.awb-graphCanvas{position:relative}',
      '.awb-graphEdges{position:absolute;left:0;top:0;pointer-events:none}',
      '.awb-node{position:absolute;display:flex;flex-direction:column;gap:4px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:9px 11px;box-sizing:border-box;overflow:hidden}',
      '.awb-node:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}',
      '.awb-nodeCurrent{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 35%,transparent)}',
      '.awb-nodeHead{display:flex;align-items:center;gap:7px;min-width:0}',
      '.awb-nodeLabel{flex:1 1 auto;min-width:0;font-size:12.5px;font-weight:600;line-height:17px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.awb-nodeOpen{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:16px;padding:2px 5px;border-radius:6px;cursor:pointer;flex:none}',
      '.awb-nodeOpen:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.awb-nodeMeta{display:flex;gap:4px;flex-wrap:wrap;min-width:0;align-items:center}',
      '.awb-tag{font-size:10.5px;line-height:16px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border-radius:6px;padding:0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;font-variant-numeric:tabular-nums}',
      '.awb-pill{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;line-height:16px;border-radius:999px;padding:0 7px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);flex:none}',
      '.awb-pillText{font-variant-numeric:tabular-nums}',
      '.awb-dot{width:8px;height:8px;border-radius:50%;flex:none}',
      '.awb-dot--running{background:var(--dsw-alias-brand-primary)}',
      '.awb-dot--done{background:var(--dsw-alias-state-success-primary)}',
      '.awb-dot--idle{background:var(--dsw-alias-state-idle-primary)}',
      '.awb-dot--failed{background:var(--dsw-alias-state-error-primary)}',
      '.awb-dot--waiting{background:var(--dsw-alias-state-warn-primary)}',
      '.awb-listNode{margin:2px 0}',
      '.awb-listRow{display:flex;align-items:center;gap:8px;padding:6px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}',
      '.awb-listRow:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.awb-listLabel{flex:1 1 auto;min-width:0;font-size:12.5px;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-listKids{margin-left:14px;border-left:1px solid var(--dsw-alias-border-l1);padding-left:8px}',
      /* timeline */
      '.awb-run{border:1px solid var(--dsw-alias-border-l1);border-radius:13px;background:var(--dsw-alias-bg-layer-1);margin-bottom:11px;overflow:hidden}',
      '.awb-runHead{display:flex;align-items:center;gap:9px;padding:10px 13px;cursor:pointer}',
      '.awb-runHead:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.awb-runName{flex:1 1 auto;min-width:0;font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-runMeta{font-size:10.5px;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,monospace;white-space:nowrap;font-variant-numeric:tabular-nums}',
      '.awb-runBody{border-top:1px solid var(--dsw-alias-border-l1);padding:11px 13px}',
      '.awb-station{margin-bottom:13px}',
      '.awb-station:last-child{margin-bottom:0}',
      '.awb-stationHead{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:650;margin-bottom:7px}',
      '.awb-pillRow{display:flex;align-items:center;gap:8px;padding:5px 9px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);margin-bottom:5px;font-size:12px}',
      '.awb-pillRow:last-child{margin-bottom:0}',
      '.awb-pillRowClick{cursor:pointer}',
      '.awb-pillRowClick:hover{background:var(--dsw-alias-bg-layer-1)}',
      '.awb-pillLabel{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-rail{position:relative;margin-left:5px;padding-left:20px;border-left:1px solid var(--dsw-alias-border-l2)}',
      '.awb-railItem{position:relative;padding:0 0 14px 4px}',
      '.awb-railItem:last-child{padding-bottom:2px}',
      '.awb-railDot{position:absolute;left:-26px;top:4px;width:11px;height:11px;border-radius:50%;background:var(--dsw-alias-bg-layer-1);border:2px solid var(--dsw-alias-brand-primary)}',
      '.awb-railTitle{font-size:12.5px;font-weight:600;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-railSub{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      /* team */
      '.awb-member{display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-layer-1);margin-bottom:6px}',
      '.awb-memberName{flex:1 1 auto;min-width:0;font-size:12.5px;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-task{border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-layer-1);padding:9px 11px;margin-bottom:7px}',
      '.awb-taskTitle{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;margin-bottom:4px}',
      '.awb-taskSubject{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-taskMeta{display:flex;gap:5px;flex-wrap:wrap;font-size:10.5px;color:var(--dsw-alias-label-secondary)}',
      '.awb-hint{font-size:11.5px;line-height:17px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border:1px dashed var(--dsw-alias-border-l2);border-radius:10px;padding:9px 11px;margin-bottom:12px}',
    ].join('\n');

    /* ------------------------------------------------------------------ */
    /* helpers                                                             */
    /* ------------------------------------------------------------------ */

    function formatTokens(value) {
      if (value === undefined || value === null) return '';
      const number = Number(value) || 0;
      if (number < 1000) return String(Math.round(number));
      if (number < 1e6) return `${(Math.round(number / 100) / 10).toFixed(1)}k`;
      return `${(Math.round(number / 1e5) / 10).toFixed(1)}M`;
    }

    function formatDuration(ms) {
      if (ms === undefined || ms === null || !Number.isFinite(ms)) return '';
      const total = Math.max(0, Math.floor(ms / 1000));
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;
      if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
      if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
      return `${seconds}s`;
    }

    function formatClock(ms) {
      if (!ms) return '';
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatRelative(ms, now) {
      if (!ms) return '';
      const locale = (typeof navigator !== 'undefined' && navigator.language) || 'en';
      const delta = Math.max(0, now - ms);
      const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const minutes = Math.floor(delta / 60000);
      if (minutes < 1) return format.format(0, 'second');
      if (minutes < 60) return format.format(-minutes, 'minute');
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return format.format(-hours, 'hour');
      const days = Math.floor(hours / 24);
      if (days < 7) return format.format(-days, 'day');
      return new Date(ms).toLocaleDateString(locale);
    }

    function tokenTotal(usage) {
      if (usage === undefined || usage === null) return undefined;
      return usage.uncachedInputTokens + usage.outputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
    }

    function timingDuration(values, now) {
      const timing = values.subagentTiming;
      if (timing === undefined) return undefined;
      if (timing.active === undefined) return timing.settledMs;
      return timing.settledMs + Math.max(0, now - timing.active.since);
    }

    function statusOf(rec) {
      if (rec === undefined || rec === null) return 'idle';
      if (rec.running === true) return 'running';
      if (rec.lastTurnCompleted === true) return 'done';
      if (rec.lastTurnCompleted === false) return 'failed';
      if (rec.blank) return 'idle';
      return 'waiting';
    }

    function displayTitle(rec) {
      if (rec === undefined || rec === null) return '';
      return rec.title || rec.displayTitle || rec.id;
    }

    function buildLineage(snapshot) {
      const raw = (snapshot && snapshot.byId) || {};
      const projections = (snapshot && snapshot.projectionsBySession) || {};
      const byId = {};
      for (const id of Object.keys(raw)) {
        const rec = raw[id] || {};
        const values = (projections[id] && projections[id].values) || {};
        byId[id] = {
          id,
          title: rec.title || '',
          displayTitle: rec.displayTitle || '',
          parentId: rec.parentId || rec.parentSessionId || '',
          blank: Boolean(rec.blank),
          updatedAt: rec.updatedAt || 0,
          cwd: rec.cwd || '',
          running: Boolean(rec.running),
          lastTurnCompleted: values.subagentTiming ? values.subagentTiming.lastTurnCompleted : undefined,
          values,
        };
      }
      const children = {};
      const roots = [];
      for (const id of Object.keys(byId)) {
        const parent = byId[id].parentId;
        if (parent !== '' && byId[parent] !== undefined) {
          (children[parent] = children[parent] || []).push(id);
        } else {
          roots.push(id);
        }
      }
      const time = (id) => byId[id].updatedAt;
      roots.sort((left, right) => time(right) - time(left));
      for (const parent of Object.keys(children)) children[parent].sort((left, right) => time(right) - time(left));
      return { byId, children, roots };
    }

    function nodeInfo(rec, now) {
      if (rec === undefined || rec === null) {
        return { label: '', model: undefined, mode: undefined, tokens: undefined, duration: undefined };
      }
      const subagent = rec.values.subagent;
      const selection = rec.values.modelSelection;
      return {
        label: rec.title || (subagent && subagent.label) || rec.displayTitle || rec.id.slice(0, 8),
        model: selection && selection.next ? selection.next.model : undefined,
        mode: subagent ? subagent.mode : undefined,
        tokens: tokenTotal(rec.values.tokenUsage),
        duration: timingDuration(rec.values, now),
      };
    }

    function summarize(lineage, now) {
      const counts = { total: 0, running: 0, done: 0, failed: 0, idle: 0, waiting: 0, tokens: 0, hasTokens: false, duration: 0, hasDuration: false };
      for (const id of Object.keys(lineage.byId)) {
        const rec = lineage.byId[id];
        counts.total += 1;
        counts[statusOf(rec)] += 1;
        const tokens = tokenTotal(rec.values.tokenUsage);
        if (tokens !== undefined) { counts.tokens += tokens; counts.hasTokens = true; }
        const duration = timingDuration(rec.values, now);
        if (duration !== undefined) { counts.duration += duration; counts.hasDuration = true; }
      }
      return counts;
    }

    /** Chronological feed of session updates and spawned agents. */
    function collectActivity(lineage, limit) {
      const events = [];
      for (const id of Object.keys(lineage.byId)) {
        const rec = lineage.byId[id];
        if (rec.updatedAt) {
          events.push({ at: rec.updatedAt, kind: 'session', sessionId: id, title: displayTitle(rec) });
        }
        const catalog = rec.values.subagentCatalog;
        if (Array.isArray(catalog)) {
          for (const entry of catalog) {
            events.push({
              at: entry.createdAt,
              kind: 'agent',
              sessionId: id,
              childId: entry.id,
              title: entry.label || entry.id,
              mode: entry.mode,
            });
          }
        }
      }
      events.sort((left, right) => right.at - left.at);
      return typeof limit === 'number' ? events.slice(0, limit) : events;
    }

    function memberStatus(member, running) {
      if (member.phase === 'failed') return 'failed';
      if (member.phase === 'provisioning') return 'waiting';
      return running === true ? 'running' : 'idle';
    }

    function taskStatus(task) {
      if (task.status === 'in_progress') return 'running';
      if (task.status === 'completed') return 'done';
      return task.ready ? 'idle' : 'waiting';
    }

    function stopLabel(run, t) {
      if (!run.endedAt) return t('timeline.running');
      const reason = run.stopReason || 'completed';
      const key = `timeline.${reason}`;
      return key in dictionaries.en ? t(key) : t('timeline.completed');
    }

    function useNow(intervalMs) {
      const [now, setNow] = useState(() => Date.now());
      useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(timer);
      }, [intervalMs]);
      return now;
    }

    function useWorkflowRuns() {
      const [state, setState] = useState({ runs: [], ok: false });
      useEffect(() => {
        let stop = false;
        const tick = () => {
          fetch(RUNS_API, { cache: 'no-store' })
            .then((response) => (response.ok ? response.json() : null))
            .then((json) => {
              if (!stop && json !== null) setState({ runs: Array.isArray(json.runs) ? json.runs : [], ok: true });
            })
            .catch(() => {
              if (!stop) setState((current) => ({ runs: current.runs, ok: false }));
            });
        };
        tick();
        const timer = setInterval(tick, 2000);
        return () => { stop = true; clearInterval(timer); };
      }, []);
      return state;
    }

    /** Host session rows over the shared HTTP RPC, polled beside the Client store. */
    function useHostSessions() {
      const [sessions, setSessions] = useState([]);
      useEffect(() => {
        let stop = false;
        const tick = () => {
          const rpcId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            ? crypto.randomUUID() : `awb-${Date.now()}-${Math.random().toString(16).slice(2)}`;
          fetch('api/session/list', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ type: 'client-request', rpcId, method: 'session/list', payload: {} }),
          })
            .then((response) => (response.ok ? response.json() : null))
            .then((envelope) => {
              if (stop || envelope === null) return;
              const result = envelope.result;
              if (result === undefined || result.ok !== true) return;
              const items = result.value && Array.isArray(result.value.items) ? result.value.items : [];
              setSessions(items.map((item) => {
                const values = (item.projections && item.projections.values) || {};
                return {
                  id: item.sessionId,
                  title: typeof values.title === 'string' ? values.title : undefined,
                  parentId: item.parentSessionId,
                  running: Boolean(item.running),
                  blank: Boolean(item.blank),
                  updatedAt: item.updatedAt,
                  cwd: item.cwd,
                  values,
                };
              }));
            })
            .catch(() => {
              // The Client store alone still renders the board.
            });
        };
        tick();
        const timer = setInterval(tick, 3000);
        return () => { stop = true; clearInterval(timer); };
      }, []);
      return sessions;
    }

    const EMPTY_SNAPSHOT = { ids: [], byId: {}, phase: 'pending', projectionsBySession: {} };

    /**
     * Merge Host session rows with the Client store snapshot. The Client row wins
     * where both know the Session, so live retention and fresher values survive.
     * @param store - Client `SessionListState` snapshot.
     * @param hostSessions - rows from the Host sessions endpoint.
     * @returns one snapshot in the Client store's shape.
     */
    function mergeSnapshots(store, hostSessions) {
      const byId = {};
      const projectionsBySession = {};
      for (const session of hostSessions) {
        const values = (session && session.values) || {};
        byId[session.id] = {
          id: session.id,
          title: session.title || '',
          displayTitle: session.title || session.id,
          parentId: session.parentId || '',
          blank: Boolean(session.blank),
          updatedAt: session.updatedAt || 0,
          cwd: session.cwd || '',
          running: Boolean(session.running),
          retainedBy: {},
          lastTurnCompleted: values.subagentTiming ? values.subagentTiming.lastTurnCompleted : undefined,
          values,
        };
        projectionsBySession[session.id] = { values, state: 'ready', error: null };
      }
      const storeById = (store && store.byId) || {};
      for (const id of Object.keys(storeById)) {
        const row = storeById[id] || {};
        byId[id] = { ...(byId[id] || {}), ...row };
      }
      const storeProjections = (store && store.projectionsBySession) || {};
      for (const id of Object.keys(storeProjections)) {
        projectionsBySession[id] = storeProjections[id];
        const row = byId[id];
        if (row !== undefined) row.values = storeProjections[id].values || row.values;
      }
      return { ids: Object.keys(byId), byId, phase: 'ready', projectionsBySession };
    }

    /** Open one Session: subagents open in the right sidebar, others in the main view. */
    function makeOpenSession(ctx) {
      return function openSession(sessionId) {
        let parent;
        try {
          const snapshot = ctx.sessions && ctx.sessions.list && typeof ctx.sessions.list.getSnapshot === 'function'
            ? ctx.sessions.list.getSnapshot() : null;
          const rec = snapshot && snapshot.byId ? snapshot.byId[sessionId] : null;
          parent = rec && (rec.parentId || rec.parentSessionId);
        } catch (error) {
          parent = undefined;
        }
        try {
          if (parent && ctx.sidebarRight && typeof ctx.sidebarRight.openResource === 'function') {
            const query = new URLSearchParams({ parent: String(parent), mode: 'unknown' });
            ctx.sidebarRight.openResource(`dsh-resource://subagentchat/session/${encodeURIComponent(sessionId)}?${query.toString()}`);
            return;
          }
        } catch (error) {
          // Fall through to the main view.
        }
        try {
          if (ctx.uiWorkspace && typeof ctx.uiWorkspace.openSession === 'function') ctx.uiWorkspace.openSession(sessionId);
        } catch (error) {
          // Nothing further to try.
        }
      };
    }

    /* ------------------------------------------------------------------ */
    /* shared bits                                                         */
    /* ------------------------------------------------------------------ */

    function Dot({ status }) {
      return h('span', { className: `awb-dot awb-dot--${status}` });
    }

    function EmptyState({ t, message, icon, hint }) {
      return h('div', { className: 'awb-empty' }, [
        h('div', { className: 'awb-emptyIcon', key: 'icon' }, icon || '🗂'),
        h('div', { key: 'text' }, message),
        hint ? h('div', { className: 'awb-meta', style: { marginTop: 8 }, key: 'hint' }, hint) : null,
      ]);
    }

    function StatTile({ label, value, small }) {
      return h('div', { className: 'awb-stat' }, [
        h('div', { className: 'awb-statLabel', key: 'label' }, label),
        h('div', { className: small ? 'awb-statValueSm' : 'awb-statValue', key: 'value' }, value),
      ]);
    }

    /* ------------------------------------------------------------------ */
    /* overview                                                            */
    /* ------------------------------------------------------------------ */

    function OverviewView(props) {
      const { leadSessionId, snapshot, openSession, t, now, runs, runCount, emptyHint } = props;
      const lineage = useMemo(() => buildLineage(snapshot), [snapshot]);
      const stats = useMemo(() => summarize(lineage, now), [lineage, now]);
      const activity = useMemo(() => collectActivity(lineage, 12), [lineage]);
      const lead = leadSessionId !== '' ? lineage.byId[leadSessionId] : undefined;
      const leadInfo = lead ? nodeInfo(lead, now) : undefined;
      const leadStatus = lead ? statusOf(lead) : 'idle';

      return h('div', { className: 'awb-view' }, [
        h('div', { className: 'awb-toolbar', key: 'toolbar' }, [
          h('span', { className: 'awb-toolbarTitle', key: 'title' }, t('overview.title')),
          h('span', { className: 'awb-meta', key: 'meta' },
            `${stats.total} ${t('overview.stats.sessions').toLowerCase()} · ${stats.running} ${t('status.running').toLowerCase()}`),
        ]),
        h('div', { className: 'awb-scroll', key: 'scroll' }, [
          stats.total === 0
            ? EmptyState({ t, message: t('overview.empty'), icon: '🗂', hint: emptyHint })
            : [
              h('div', { className: 'awb-stats', key: 'stats' }, [
                h(StatTile, { key: 'sessions', label: t('overview.stats.sessions'), value: String(stats.total) }),
                h(StatTile, { key: 'agents', label: t('overview.stats.agents'), value: String(countAgents(lineage)) }),
                h(StatTile, { key: 'running', label: t('overview.stats.running'), value: String(stats.running) }),
                h(StatTile, {
                  key: 'tokens', label: t('overview.stats.tokens'),
                  value: stats.hasTokens ? formatTokens(stats.tokens) : '—', small: true,
                }),
                h(StatTile, {
                  key: 'runs', label: t('overview.stats.runs'),
                  value: String(runCount), small: true,
                }),
              ]),
              lead !== undefined
                ? h('div', { className: 'awb-card', key: 'lead' }, [
                  h('div', { className: 'awb-cardHead' }, [
                    h(Dot, { status: leadStatus, key: 'dot' }),
                    h('span', { className: 'awb-cardTitle', title: leadInfo.label, key: 'title' }, leadInfo.label),
                    h('span', { className: 'awb-pill', key: 'status' }, [
                      h('span', { className: `awb-dot awb-dot--${leadStatus}`, key: 'pilldot' }),
                      h('span', { className: 'awb-pillText', key: 'pilltext' }, t(`status.${leadStatus}`)),
                    ]),
                    h('button', {
                      type: 'button', className: 'awb-nodeOpen', title: t('overview.open'),
                      'aria-label': t('overview.open'), onClick: () => openSession(lead.id), key: 'open',
                    }, t('overview.open')),
                  ]),
                  h('div', { className: 'awb-cardMeta' }, [
                    leadInfo.model ? h('span', { className: 'awb-tag', key: 'model' }, `⚡ ${leadInfo.model}`) : null,
                    h('span', { className: 'awb-tag', key: 'updated' },
                      `${t('overview.updated')} ${formatRelative(lead.updatedAt, now)}`),
                    leadInfo.tokens !== undefined ? h('span', { className: 'awb-tag', key: 'tokens' },
                      `${t('tokens')} ${formatTokens(leadInfo.tokens)}`) : null,
                    leadInfo.duration !== undefined ? h('span', { className: 'awb-tag', key: 'duration' },
                      `${t('duration')} ${formatDuration(leadInfo.duration)}`) : null,
                    (lineage.children[lead.id] || []).length > 0
                      ? h('span', { className: 'awb-tag', key: 'children' },
                        t('overview.children', { count: (lineage.children[lead.id] || []).length }))
                      : null,
                  ]),
                ])
                : null,
              h('div', { className: 'awb-sectionTitle', key: 'activityTitle' }, [
                t('overview.activity'),
                h('span', { className: 'awb-count', key: 'count' }, String(activity.length)),
              ]),
              activity.length === 0
                ? h('div', { className: 'awb-meta', key: 'activityEmpty' }, t('overview.activity.empty'))
                : h('div', { className: 'awb-feed', key: 'feed' }, activity.map((event) => h('div', {
                    className: 'awb-feedRow', key: `${event.kind}-${event.at}-${event.sessionId}`,
                  }, [
                    h('span', { className: 'awb-feedIcon', key: 'icon' },
                      event.kind === 'agent' ? '🤖' : event.kind === 'run' ? '⚡' : '💬'),
                    h('span', { className: 'awb-feedText', key: 'text' },
                      `${t(`overview.activity.${event.kind}`)} · ${event.title}`),
                    h('span', { className: 'awb-feedTime', key: 'time' }, formatRelative(event.at, now)),
                    h('button', {
                      type: 'button', className: 'awb-nodeOpen', key: 'open',
                      title: t('overview.open'), 'aria-label': t('overview.open'),
                      onClick: () => openSession(event.childId || event.sessionId),
                    }, '→'),
                  ]))),
              runs.length > 0
                ? h('div', { className: 'awb-sectionTitle', key: 'runTitle' }, [
                  t('timeline.runSection'),
                  h('span', { className: 'awb-count', key: 'count' }, String(runs.length)),
                ])
                : null,
              ...(runs.length > 0
                ? runs.slice(0, 3).map((run) => h('div', { className: 'awb-feedRow', key: `run-${run.id}` }, [
                  h('span', { className: 'awb-feedIcon', key: 'icon' }, '⚡'),
                  h('span', { className: 'awb-feedText', key: 'text' }, run.name),
                  h('span', { className: 'awb-feedTime', key: 'time' }, formatRelative(run.startedAt, now)),
                ]))
                : []),
            ],
        ]),
      ]);
    }

    function countAgents(lineage) {
      let total = 0;
      const walk = (id) => {
        const kids = lineage.children[id] || [];
        total += kids.length;
        for (const kid of kids) walk(kid);
      };
      for (const root of lineage.roots) walk(root);
      return total;
    }

    /* ------------------------------------------------------------------ */
    /* graph view                                                          */
    /* ------------------------------------------------------------------ */

    function NodeCard(props) {
      const { node, info, status, current, t, onOpen } = props;
      return h('div', {
        className: `awb-node${current ? ' awb-nodeCurrent' : ''}`,
        style: { left: node.x, top: node.y, width: NODE_W, height: NODE_H },
      }, [
        h('div', { className: 'awb-nodeHead', key: 'head' }, [
          h(Dot, { status, key: 'dot' }),
          h('span', { className: 'awb-nodeLabel', title: info.label, key: 'label' }, info.label),
          h('button', {
            type: 'button', className: 'awb-nodeOpen', title: t('graph.open'),
            'aria-label': t('graph.open'), onClick: () => onOpen(node.id), key: 'open',
          }, '💬'),
        ]),
        h('div', { className: 'awb-nodeMeta', key: 'meta1' }, [
          h('span', { className: `awb-pill awb-pill--${status}`, key: 'status' }, [
            h('span', { className: `awb-dot awb-dot--${status}`, key: 'pilldot' }),
            h('span', { className: 'awb-pillText', key: 'pilltext' }, t(`status.${status}`)),
          ]),
          current ? h('span', { className: 'awb-tag', key: 'current' }, t('graph.current')) : null,
          info.mode ? h('span', { className: 'awb-tag', key: 'mode' }, t(`mode.${info.mode}`)) : null,
        ]),
        h('div', { className: 'awb-nodeMeta', key: 'meta2' }, [
          info.model ? h('span', { className: 'awb-tag', title: info.model, key: 'model' }, `⚡ ${info.model}`) : null,
          info.tokens !== undefined ? h('span', { className: 'awb-tag', key: 'tokens' },
            `${t('tokens')} ${formatTokens(info.tokens)}`) : null,
        ]),
        h('div', { className: 'awb-nodeMeta', key: 'meta3' }, [
          info.duration !== undefined ? h('span', { className: 'awb-tag', key: 'duration' },
            `${t('duration')} ${formatDuration(info.duration)}`) : null,
          node.childCount > 0 ? h('span', { className: 'awb-tag', key: 'children' },
            t('graph.agents', { count: node.childCount })) : null,
        ]),
      ]);
    }

    function ListTree(props) {
      const { root, lineage, statusOfNode, infoOf, currentId, t, onOpen, depth } = props;
      const info = infoOf(root.id);
      return h('div', { className: 'awb-listNode' }, [
        h('div', { className: 'awb-listRow', style: { marginLeft: depth * 16 }, key: 'row' }, [
          h(Dot, { status: statusOfNode(root.id), key: 'dot' }),
          h('span', { className: 'awb-listLabel', title: info.label, key: 'label' }, info.label),
          currentId === root.id ? h('span', { className: 'awb-tag', key: 'current' }, t('graph.current')) : null,
          h('button', {
            type: 'button', className: 'awb-nodeOpen', title: t('graph.open'),
            'aria-label': t('graph.open'), onClick: () => onOpen(root.id), key: 'open',
          }, '💬'),
        ]),
        root.kids.length > 0
          ? h('div', { className: 'awb-listKids', key: 'kids' }, root.kids.map((kid) => h(ListTree, {
            key: kid.id, root: kid, lineage, statusOfNode, infoOf, currentId, t, onOpen, depth: depth + 1,
          })))
          : null,
      ]);
    }

    function GraphView(props) {
      const { snapshot, openSession, t, now, currentId, emptyHint } = props;
      const [rootId, setRootId] = useState('');
      const [showAll, setShowAll] = useState(false);
      const [wide, setWide] = useState(true);
      const wrapRef = useRef(null);

      useEffect(() => {
        const el = wrapRef.current;
        if (el === null || typeof ResizeObserver === 'undefined') return undefined;
        const update = () => setWide(el.clientWidth >= WIDE_MIN);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
      }, []);

      const lineage = useMemo(() => buildLineage(snapshot), [snapshot]);
      const stats = useMemo(() => summarize(lineage, now), [lineage, now]);
      const infoOf = (id) => nodeInfo(lineage.byId[id], now);
      const statusOfNode = (id) => statusOf(lineage.byId[id]);

      const isActive = (id) => {
        const rec = lineage.byId[id];
        return rec === undefined || rec.updatedAt === 0 || (now - rec.updatedAt) < ACTIVE_MS;
      };
      const subtreeActive = (id) => {
        if (isActive(id)) return true;
        return (lineage.children[id] || []).some(subtreeActive);
      };
      const visibleKids = (id) => (lineage.children[id] || []).filter((child) => showAll || isActive(child) || subtreeActive(child));
      const buildTree = (id) => ({ id, kids: visibleKids(id).map(buildTree) });
      const buildFullTree = (id) => ({ id, kids: (lineage.children[id] || []).map(buildFullTree) });
      const countNodes = (node) => 1 + node.kids.reduce((sum, kid) => sum + countNodes(kid), 0);

      const effectiveRoot = rootId !== '' && lineage.byId[rootId] !== undefined
        ? rootId
        : (lineage.roots[0] || '');
      const tree = effectiveRoot !== '' ? buildTree(effectiveRoot) : null;
      const fullTree = effectiveRoot !== '' ? buildFullTree(effectiveRoot) : null;
      const hiddenCount = tree !== null && fullTree !== null
        ? Math.max(0, countNodes(fullTree) - countNodes(tree))
        : 0;

      const nodes = [];
      const edges = [];
      if (tree !== null) {
        let cursor = 0;
        const walk = (node, depth, parentId) => {
          const index = cursor;
          cursor += 1;
          nodes.push({
            id: node.id, depth, index,
            x: depth * (NODE_W + HGAP), y: index * (NODE_H + VGAP),
            childCount: node.kids.length,
          });
          if (parentId !== null) edges.push([parentId, node.id]);
          for (const kid of node.kids) walk(kid, depth + 1, node.id);
        };
        walk(tree, 0, null);
      }

      const width = nodes.length === 0 ? 0 : Math.max(...nodes.map((node) => node.x + NODE_W));
      const height = nodes.length === 0 ? 0 : Math.max(...nodes.map((node) => node.y + NODE_H));
      const nodeById = new Map(nodes.map((node) => [node.id, node]));
      const paths = [];
      for (const [from, to] of edges) {
        const start = nodeById.get(from);
        const end = nodeById.get(to);
        if (start === undefined || end === undefined) continue;
        const x1 = start.x + NODE_W;
        const y1 = start.y + NODE_H / 2;
        const x2 = end.x;
        const y2 = end.y + NODE_H / 2;
        const middle = (x1 + x2) / 2;
        paths.push(`M ${x1} ${y1} C ${middle} ${y1}, ${middle} ${y2}, ${x2} ${y2}`);
      }

      return h('div', { className: 'awb-view', ref: wrapRef }, [
        h('div', { className: 'awb-toolbar', key: 'toolbar' }, [
          h('span', { className: 'awb-toolbarTitle', key: 'title' }, t('graph.title')),
          h('span', { className: 'awb-meta', key: 'summary' },
            `${stats.total} ${t('overview.stats.sessions').toLowerCase()} · ${countAgents(lineage)} ${t('overview.stats.agents').toLowerCase()} · ${stats.running} ${t('status.running').toLowerCase()}`),
          lineage.roots.length > 1
            ? h('select', {
              className: 'awb-select', value: effectiveRoot, title: t('graph.root'),
              onChange: (event) => setRootId(event.target.value), key: 'root',
            }, lineage.roots.slice(0, 40).map((id) => h('option', { key: id, value: id }, displayTitle(lineage.byId[id]))))
            : null,
          h('button', { type: 'button', className: 'awb-btn', onClick: () => setShowAll((value) => !value), key: 'toggle' },
            showAll ? t('graph.activeOnly') : t('graph.showAll')),
          hiddenCount > 0 ? h('span', { className: 'awb-meta', key: 'hidden' }, t('graph.hidden', { count: hiddenCount })) : null,
          h('span', { className: 'awb-legend', key: 'legend' }, [
            h('span', { className: 'awb-dot awb-dot--running', key: 'running' }), t('status.running'),
            h('span', { className: 'awb-dot awb-dot--done', key: 'done' }), t('status.done'),
            h('span', { className: 'awb-dot awb-dot--idle', key: 'idle' }), t('status.idle'),
            h('span', { className: 'awb-dot awb-dot--failed', key: 'failed' }), t('status.failed'),
          ]),
        ]),
        h('div', { className: 'awb-scroll', key: 'scroll' }, [
          tree === null
            ? EmptyState({ t, message: t('graph.empty'), icon: '🕸', hint: emptyHint })
            : wide
              ? h('div', { className: 'awb-graphScroll', key: 'wide' }, [
                h('div', { className: 'awb-graphCanvas', style: { width, height }, key: 'canvas' }, [
                  h('svg', {
                    className: 'awb-graphEdges', width, height,
                    viewBox: `0 0 ${width} ${height}`, fill: 'none',
                    'aria-hidden': true, key: 'edges',
                  }, paths.map((d, index) => h('path', {
                    key: index, d, stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 1.5,
                  }))),
                  nodes.map((node) => h(NodeCard, {
                    key: node.id, node, info: infoOf(node.id),
                    status: statusOfNode(node.id), current: currentId === node.id,
                    t, onOpen: openSession,
                  })),
                ]),
              ])
              : h('div', { key: 'narrow' }, h(ListTree, {
                root: tree, lineage, statusOfNode, infoOf, currentId, t, onOpen: openSession, depth: 0,
              })),
        ]),
      ]);
    }

    /* ------------------------------------------------------------------ */
    /* timeline view                                                       */
    /* ------------------------------------------------------------------ */

    function RunCard(props) {
      const { run, t, openSession } = props;
      const [open, setOpen] = useState(false);
      const agents = Array.isArray(run.agents) ? run.agents : [];
      const failedCount = agents.filter((agent) => agent.status === 'failed').length;
      const running = !run.endedAt;
      const failed = failedCount > 0 || /error|fail|cancel/i.test(run.stopReason || '');
      const status = running ? 'running' : failed ? 'failed' : 'done';

      const byPhase = new Map();
      for (const agent of agents) {
        const key = agent.phase === undefined || agent.phase === null || agent.phase === ''
          ? t('timeline.defaultPhase') : String(agent.phase);
        if (!byPhase.has(key)) byPhase.set(key, []);
        byPhase.get(key).push(agent);
      }
      const time = run.startedAt ? new Date(run.startedAt).toLocaleTimeString() : '';

      return h('div', { className: 'awb-run' }, [
        h('div', { className: 'awb-runHead', onClick: () => setOpen((value) => !value), key: 'head' }, [
          h(Dot, { status, key: 'dot' }),
          h('span', { className: 'awb-runName', title: run.name, key: 'name' }, run.name),
          h('span', { className: 'awb-runMeta', key: 'meta' },
            `${time} · ${agents.length} · ${stopLabel(run, t)}`),
        ]),
        open
          ? h('div', { className: 'awb-runBody', key: 'body' }, [
            [...byPhase.entries()].map(([phase, list]) => h('div', { className: 'awb-station', key: phase }, [
              h('div', { className: 'awb-stationHead', key: 'head' }, [
                h('span', { key: 'name' }, phase),
                h('span', { className: 'awb-count', key: 'count' }, String(list.length)),
              ]),
              list.map((agent) => h('div', {
                key: agent.seq,
                className: `awb-pillRow${agent.childId ? ' awb-pillRowClick' : ''}`,
                title: agent.childId ? t('timeline.open') : undefined,
                onClick: agent.childId ? () => openSession(agent.childId) : undefined,
              }, [
                h(Dot, {
                  status: agent.status === 'done' ? 'done' : agent.status === 'failed' ? 'failed' : 'running',
                  key: 'dot',
                }),
                h('span', { className: 'awb-pillLabel', key: 'label' }, agent.label),
              ])),
            ])),
            Array.isArray(run.logs) && run.logs.length > 0
              ? h('div', { className: 'awb-taskMeta', key: 'logs' },
                run.logs.slice(-3).map((line, index) => h('span', { key: index }, line)))
              : null,
          ])
          : null,
      ]);
    }

    function TimelineView(props) {
      const { snapshot, openSession, t, now, runs, runOk } = props;
      const lineage = useMemo(() => buildLineage(snapshot), [snapshot]);
      const agentEvents = useMemo(() => collectActivity(lineage, 40).filter((event) => event.kind === 'agent'), [lineage]);
      const totalRunAgents = runs.reduce((total, run) => total + (Array.isArray(run.agents) ? run.agents.length : 0), 0);

      return h('div', { className: 'awb-view' }, [
        h('div', { className: 'awb-toolbar', key: 'toolbar' }, [
          h('span', { className: 'awb-toolbarTitle', key: 'title' }, t('timeline.title')),
          h('span', { className: 'awb-meta', key: 'meta' },
            `${t('timeline.runs', { count: runs.length })} · ${t('timeline.agents', { count: totalRunAgents })}${runOk ? '' : ` · ${t('timeline.offline')}`}`),
        ]),
        h('div', { className: 'awb-scroll', key: 'scroll' }, [
          h('div', { className: 'awb-sectionTitle', key: 'runSection' }, [
            t('timeline.runSection'),
            h('span', { className: 'awb-count', key: 'count' }, String(runs.length)),
          ]),
          runs.length === 0
            ? h('div', { className: 'awb-hint', key: 'runEmpty' }, t('timeline.runEmpty'))
            : runs.slice().reverse().map((run) => h(RunCard, { key: run.id, run, t, openSession })),
          h('div', { className: 'awb-sectionTitle', key: 'railSection' }, [
            t('timeline.agentRail'),
            h('span', { className: 'awb-count', key: 'count' }, String(agentEvents.length)),
          ]),
          agentEvents.length === 0
            ? h('div', { className: 'awb-hint', key: 'railEmpty' }, t('timeline.agentRailEmpty'))
            : h('div', { className: 'awb-rail', key: 'rail' }, agentEvents.map((event) => h('div', {
                className: 'awb-railItem', key: `${event.at}-${event.childId}`,
              }, [
                h('span', { className: 'awb-railDot', key: 'dot' }),
                h('div', { className: 'awb-railTitle', key: 'title' }, event.title),
                h('div', { className: 'awb-railSub', key: 'sub' },
                  `${t('overview.activity.agent')} · ${formatClock(event.at)} · ${t(`mode.${event.mode || 'unknown'}`)}`),
              ]))),
        ]),
      ]);
    }

    /* ------------------------------------------------------------------ */
    /* team view                                                           */
    /* ------------------------------------------------------------------ */

    function TeamView(props) {
      const { leadSessionId, snapshot, openSession, t, now } = props;
      const lineage = useMemo(() => buildLineage(snapshot), [snapshot]);
      const team = leadSessionId !== '' && snapshot.projectionsBySession[leadSessionId] !== undefined
        ? snapshot.projectionsBySession[leadSessionId].values.agentTeam
        : undefined;
      const members = team && Array.isArray(team.members) ? team.members : [];
      const tasks = team && Array.isArray(team.tasks) ? team.tasks : [];
      const modelOf = (id) => {
        const values = snapshot.projectionsBySession[id] ? snapshot.projectionsBySession[id].values : undefined;
        return values && values.modelSelection && values.modelSelection.next ? values.modelSelection.next.model : undefined;
      };
      const roster = members.length > 0
        ? members.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          status: memberStatus(member, snapshot.byId[member.id] ? snapshot.byId[member.id].running : undefined),
          model: modelOf(member.id),
        }))
        : collectActivity(lineage).filter((event) => event.kind === 'agent').map((event) => ({
          id: event.childId,
          name: event.title,
          role: 'member',
          status: statusOf(lineage.byId[event.childId]),
          model: nodeInfo(lineage.byId[event.childId], now).model,
        }));

      return h('div', { className: 'awb-view' }, [
        h('div', { className: 'awb-toolbar', key: 'toolbar' }, [
          h('span', { className: 'awb-toolbarTitle', key: 'title' }, t('team.title')),
          team !== undefined
            ? h('span', { className: 'awb-meta', key: 'meta' },
              `${t('team.roster')} ${members.length} · ${t('team.tasks')} ${tasks.length}`)
            : null,
        ]),
        h('div', { className: 'awb-scroll', key: 'scroll' }, [
          team === undefined && roster.length === 0
            ? EmptyState({ t, message: t('team.empty'), icon: '👥' })
            : [
              team === undefined && roster.length > 0
                ? h('div', { className: 'awb-hint', key: 'hint' }, t('team.lineageHint'))
                : null,
              h('div', { className: 'awb-sectionTitle', key: 'rosterTitle' }, [
                t(team !== undefined ? 'team.roster' : 'team.lineageTitle'),
                h('span', { className: 'awb-count', key: 'count' }, String(roster.length)),
              ]),
              roster.length === 0
                ? h('div', { className: 'awb-meta', key: 'rosterEmpty' }, t('team.empty'))
                : roster.map((member) => h('div', { key: member.id, className: 'awb-member' }, [
                  h(Dot, { status: member.status, key: 'dot' }),
                  h('span', { className: 'awb-memberName', title: member.name, key: 'name' }, member.name),
                  h('span', { className: 'awb-tag', key: 'role' },
                    t(member.role === 'lead' ? 'team.lead' : 'team.member')),
                  member.model ? h('span', { className: 'awb-tag', key: 'model' }, `⚡ ${member.model}`) : null,
                  h('button', {
                    type: 'button', className: 'awb-nodeOpen', title: t('team.open'),
                    'aria-label': t('team.open'), onClick: () => openSession(member.id), key: 'open',
                  }, '💬'),
                ])),
              team !== undefined
                ? h('div', { className: 'awb-sectionTitle', key: 'tasksTitle' }, [
                  t('team.tasks'),
                  h('span', { className: 'awb-count', key: 'count' }, String(tasks.length)),
                ])
                : null,
              team !== undefined && tasks.length === 0
                ? h('div', { className: 'awb-meta', key: 'tasksEmpty' }, t('team.tasksEmpty'))
                : null,
              team !== undefined
                ? tasks.map((task) => h('div', { key: task.id, className: 'awb-task' }, [
                  h('div', { className: 'awb-taskTitle', key: 'title' }, [
                    h(Dot, { status: taskStatus(task), key: 'dot' }),
                    h('span', { className: 'awb-taskSubject', title: task.subject, key: 'subject' }, task.subject),
                  ]),
                  h('div', { className: 'awb-taskMeta', key: 'meta' }, [
                    h('span', { key: 'status' }, t(`task.${task.status}`)),
                    h('span', { key: 'owner' }, `${t('team.owner')}: ${task.ownerName || t('team.unowned')}`),
                    task.status === 'pending'
                      ? h('span', { key: 'ready' }, task.ready ? t('team.ready') : t('team.blocked'))
                      : null,
                    task.blockedBy && task.blockedBy.length > 0
                      ? h('span', { key: 'blockedBy' }, `${t('team.blockedBy')}: ${task.blockedBy.length}`)
                      : null,
                    task.writeScopes && task.writeScopes.length > 0
                      ? h('span', { key: 'writeScopes' }, `${t('team.writeScopes')}: ${task.writeScopes.join(', ')}`)
                      : null,
                  ]),
                ]))
                : null,
            ],
        ]),
      ]);
    }

    /* ------------------------------------------------------------------ */
    /* panels                                                              */
    /* ------------------------------------------------------------------ */

    function TabBar(props) {
      const { tab, setTab, t } = props;
      const tabs = [
        ['overview', t('tab.overview')],
        ['graph', t('tab.graph')],
        ['timeline', t('tab.timeline')],
        ['team', t('tab.team')],
      ];
      return h('div', { className: 'awb-tabs' }, tabs.map(([key, label]) => h('button', {
        type: 'button', key, className: `awb-tab${tab === key ? ' awb-tabActive' : ''}`,
        onClick: () => setTab(key),
      }, label)));
    }

    function PanelBody(props) {
      const {
        tab, setTab, t, now, runs, runOk,
        useSessions, sessionId, leadSessionId, openSession,
      } = props;
      const storeSnapshot = typeof useSessions === 'function' ? useSessions((state) => state) : EMPTY_SNAPSHOT;
      const hostSessions = useHostSessions();
      const snapshot = useMemo(() => mergeSnapshots(storeSnapshot, hostSessions), [storeSnapshot, hostSessions]);
      const lineage = useMemo(() => buildLineage(snapshot), [snapshot]);
      const emptyHint = `store ${Object.keys((storeSnapshot && storeSnapshot.byId) || {}).length} · host ${hostSessions.length}`;
      const currentId = (() => {
        const found = Object.values(snapshot.byId)
          .find((rec) => rec.retainedBy && rec.retainedBy.mainView > 0);
        return (found && found.id) || sessionId || leadSessionId || '';
      })();
      const lead = leadSessionId || sessionId || lineage.roots[0] || '';

      return h('div', { className: 'awb-root' }, [
        h('style', { dangerouslySetInnerHTML: { __html: CSS }, key: 'style' }),
        h(TabBar, { tab, setTab, t, key: 'tabs' }),
        h('div', { className: 'awb-body', key: 'body' }, [
          tab === 'overview'
            ? h(OverviewView, {
              leadSessionId: lead, snapshot, openSession, t, now,
              runs, runCount: runs.length, emptyHint, key: 'view',
            })
            : tab === 'graph'
              ? h(GraphView, {
                snapshot, openSession, t, now, currentId, emptyHint, key: 'view',
              })
              : tab === 'timeline'
                ? h(TimelineView, { snapshot, openSession, t, now, runs, runOk, key: 'view' })
                : h(TeamView, { leadSessionId: lead, snapshot, openSession, t, now, key: 'view' }),
        ]),
      ]);
    }

    function MainPanel(props) {
      const { useSessions, openSession, t } = props;
      const [tab, setTab] = useState('overview');
      const now = useNow(15000);
      const { runs, ok } = useWorkflowRuns();
      return h(PanelBody, { tab, setTab, t, now, runs, runOk: ok, useSessions, openSession });
    }

    function AsidePanel(props) {
      const { useSession, sessionId, useSessions, openSession, t } = props;
      const [tab, setTab] = useState('overview');
      const now = useNow(15000);
      const { runs, ok } = useWorkflowRuns();
      const parentSessionId = useSession((state) => (state ? state.subagent && state.subagent.address.parentSessionId : undefined));
      return h(PanelBody, {
        tab, setTab, t, now, runs, runOk: ok, useSessions, sessionId,
        leadSessionId: parentSessionId || sessionId || '',
        openSession,
      });
    }

    function PanelIcon(props) {
      const size = props.size || 16;
      return h('svg', {
        width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round',
        strokeLinejoin: 'round', 'aria-hidden': true, style: { display: 'block' },
      }, [
        h('rect', { x: 5.6, y: 1.4, width: 4.8, height: 3.2, rx: 0.9 }),
        h('rect', { x: 1.4, y: 11.4, width: 4.8, height: 3.2, rx: 0.9 }),
        h('rect', { x: 9.8, y: 11.4, width: 4.8, height: 3.2, rx: 0.9 }),
        h('path', { d: 'M8 4.6v3M8 7.6c0 2.2-4.2 1-4.2 8M8 7.6c0 2.2 4.2 1 4.2 8' }),
      ]);
    }

    /* ------------------------------------------------------------------ */
    /* registration                                                        */
    /* ------------------------------------------------------------------ */

    return {
      inject: ['slots', 'locale', 'sessions', 'uiWorkspace', 'sidebarRight', 'sidebarRightTabs'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dictionaries), 'agent-workflow-board: dictionaries');
        const t = ctx.locale.bind(NS);
        const openSession = makeOpenSession(ctx);

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main', key: PANEL_ID, locale: NS,
          inject: () => ({ openSession }),
        }, MainPanel));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: PANEL_ID, order: 24, locale: NS,
          label: () => t('panel'),
        }, PanelIcon));

        ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab', key: PANEL_ID, locale: NS,
          inject: () => ({ openSession }),
        }, AsidePanel));

        ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
          name: 'sidebar.right.pane.tab.title', key: PANEL_ID, locale: NS,
        }, () => h('span', null, t('panel'))));

        if (ctx.sidebarRightTabs && typeof ctx.sidebarRightTabs.register === 'function') {
          ctx.effect(() => ctx.sidebarRightTabs.register({
            id: PANEL_ID,
            kind: PANEL_ID,
            title: () => t('panel'),
            guide: [{
              id: 'panel',
              commandId: `${PANEL_ID}.panel`,
              order: 32,
              title: () => t('panel'),
              description: () => t('description'),
              icon: () => h(PanelIcon, { size: 16 }),
            }],
          }), 'agent-workflow-board: right tab type');
        }
      },
    };
  },
});
