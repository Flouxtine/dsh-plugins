/**
 * Client half of the Agent Workflow Board bundle.
 *
 * Three views over one multi-agent workspace:
 *  - Graph: the session lineage as a live agent DAG (Lead -> members -> grandchildren).
 *  - Timeline: durable workflow runs reconstructed from the Host's `workflow/*` feed.
 *  - Team: the Agent Team roster and shared task board of the lead Session.
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
    const WIDE_MIN = 720;
    const ACTIVE_MS = 2 * 60 * 60 * 1000;
    const RUNS_API = '/api/agent-workflow-board/runs';
    const NODE_W = 212;
    const NODE_H = 78;
    const HGAP = 54;
    const VGAP = 14;

    const dictionaries = {
      en: {
        panel: 'Agent workflow',
        description: 'Live multi-agent workflow board: agent lineage graph, workflow run timeline and Agent Team task board.',
        'tab.graph': 'Graph',
        'tab.timeline': 'Timeline',
        'tab.team': 'Team',
        'graph.title': 'Agent graph',
        'graph.empty': 'No sessions yet.\nOpen a conversation or spawn a subagent to see the workflow graph.',
        'graph.showAll': 'Show all',
        'graph.activeOnly': 'Active only',
        'graph.hidden': '{count} idle hidden',
        'graph.root': 'Root session',
        'graph.open': 'Open conversation',
        'graph.children': '{count} agents',
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
        'task.pending': 'Pending',
        'task.in_progress': 'In progress',
        'task.completed': 'Completed',
      },
      zh: {
        panel: '代理工作流',
        description: '实时多 Agent 工作流面板：代理代际关系图、工作流运行时间线、Agent 团队任务板。',
        'tab.graph': '关系图',
        'tab.timeline': '时间线',
        'tab.team': '团队',
        'graph.title': '代理关系图',
        'graph.empty': '还没有会话。\n打开一个对话或派生一个子代理，这里就会显示出工作流关系图。',
        'graph.showAll': '显示全部',
        'graph.activeOnly': '只看活跃',
        'graph.hidden': '已隐藏 {count} 个沉睡节点',
        'graph.root': '根会话',
        'graph.open': '打开会话',
        'graph.children': '{count} 个子代理',
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
        'task.pending': '待处理',
        'task.in_progress': '进行中',
        'task.completed': '已完成',
      },
    };

    const CSS = [
      '.awb-root{display:flex;flex-direction:column;height:100%;min-height:0;min-width:0;color:var(--dsw-alias-label-primary);font-size:13px}',
      '.awb-view{display:flex;flex-direction:column;flex:1 1 auto;min-height:0;min-width:0}',
      '.awb-tabs{display:flex;gap:4px;padding:10px 14px 0;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}',
      '.awb-tab{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:20px;padding:6px 10px;border-radius:8px;cursor:pointer}',
      '.awb-tab:hover{background:var(--dsw-alias-bg-layer-1)}',
      '.awb-tabActive{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:550}',
      '.awb-body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column}',
      '.awb-toolbar{display:flex;align-items:center;gap:8px;padding:10px 14px;flex:none;flex-wrap:wrap}',
      '.awb-toolbarTitle{font-size:14px;font-weight:600}',
      '.awb-meta{font-size:11.5px;color:var(--dsw-alias-label-secondary)}',
      '.awb-select{border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;padding:3px 6px;max-width:220px}',
      '.awb-btn{border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;padding:3px 9px;cursor:pointer}',
      '.awb-btn:hover{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}',
      '.awb-scroll{flex:1 1 auto;min-height:0;overflow:auto;padding:4px 14px 18px}',
      '.awb-empty{padding:48px 16px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12.5px;white-space:pre-line}',
      '.awb-legend{display:flex;gap:8px;align-items:center;font-size:11px;color:var(--dsw-alias-label-secondary);margin-left:auto}',
      '.awb-graphScroll{height:100%;overflow:auto}',
      '.awb-graphCanvas{position:relative}',
      '.awb-graphEdges{position:absolute;left:0;top:0;pointer-events:none}',
      '.awb-node{position:absolute;display:flex;flex-direction:column;gap:3px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1);padding:7px 9px;box-sizing:border-box;overflow:hidden}',
      '.awb-node:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}',
      '.awb-nodeHead{display:flex;align-items:center;gap:6px;min-width:0}',
      '.awb-nodeLabel{flex:1 1 auto;min-width:0;font-size:12.5px;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-nodeOpen{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:16px;padding:1px 4px;border-radius:5px;cursor:pointer;flex:none}',
      '.awb-nodeOpen:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.awb-nodeMeta{display:flex;gap:4px;flex-wrap:wrap;min-width:0}',
      '.awb-tag{font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border-radius:5px;padding:0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
      '.awb-dot{width:8px;height:8px;border-radius:50%;flex:none}',
      '.awb-dot--running{background:var(--dsw-alias-brand-primary)}',
      '.awb-dot--done{background:var(--dsw-alias-state-success-primary)}',
      '.awb-dot--idle{background:var(--dsw-alias-state-idle-primary)}',
      '.awb-dot--failed{background:var(--dsw-alias-state-error-primary)}',
      '.awb-dot--waiting{background:var(--dsw-alias-state-warn-primary)}',
      '.awb-listNode{margin:2px 0}',
      '.awb-listRow{display:flex;align-items:center;gap:7px;padding:5px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1)}',
      '.awb-listRow:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.awb-listLabel{flex:1 1 auto;min-width:0;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-listKids{margin-left:14px;border-left:1px solid var(--dsw-alias-border-l1);padding-left:8px}',
      '.awb-run{border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-alias-bg-layer-1);margin-bottom:10px;overflow:hidden}',
      '.awb-runHead{display:flex;align-items:center;gap:8px;padding:9px 12px;cursor:pointer}',
      '.awb-runHead:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.awb-runName{flex:1 1 auto;min-width:0;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-runMeta{font-size:10.5px;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,monospace;white-space:nowrap}',
      '.awb-runBody{border-top:1px solid var(--dsw-alias-border-l1);padding:10px 12px}',
      '.awb-station{margin-bottom:12px}',
      '.awb-station:last-child{margin-bottom:0}',
      '.awb-stationHead{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;margin-bottom:6px}',
      '.awb-stationCount{font-size:10.5px;color:var(--dsw-alias-label-secondary);font-weight:400}',
      '.awb-pill{display:flex;align-items:center;gap:7px;padding:4px 8px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);margin-bottom:5px;font-size:12px}',
      '.awb-pill:last-child{margin-bottom:0}',
      '.awb-pillClick{cursor:pointer}',
      '.awb-pillClick:hover{background:var(--dsw-alias-bg-layer-1)}',
      '.awb-pillLabel{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-section{margin-bottom:16px}',
      '.awb-sectionTitle{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;margin-bottom:8px}',
      '.awb-count{font-size:11px;color:var(--dsw-alias-label-secondary);font-weight:400}',
      '.awb-member{display:flex;align-items:center;gap:8px;padding:6px 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);margin-bottom:5px}',
      '.awb-memberName{flex:1 1 auto;min-width:0;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-task{border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-1);padding:7px 9px;margin-bottom:6px}',
      '.awb-taskTitle{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:550;margin-bottom:3px}',
      '.awb-taskSubject{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-taskMeta{display:flex;gap:5px;flex-wrap:wrap;font-size:10.5px;color:var(--dsw-alias-label-secondary)}',
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
      if (ms === undefined || ms === null) return '';
      const total = Math.max(0, Math.floor(ms / 1000));
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      if (minutes === 0) return `${seconds}s`;
      return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
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

    function statusOf(rec, running) {
      if (running === true) return 'running';
      if (rec.lastTurnCompleted === true) return 'done';
      if (rec.lastTurnCompleted === false) return 'failed';
      if (rec.blank) return 'idle';
      return 'waiting';
    }

    function displayTitle(rec) {
      if (rec === undefined) return '';
      return rec.title || rec.displayTitle || rec.id;
    }

    /** Build the parent/child lineage from the shared Session list snapshot. */
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
      const subagent = rec.values.subagent;
      return {
        label: rec.title || (subagent && subagent.label) || rec.displayTitle || rec.id.slice(0, 8),
        model: rec.values.modelSelection ? rec.values.modelSelection.next && rec.values.modelSelection.next.model : undefined,
        mode: subagent ? subagent.mode : undefined,
        tokens: tokenTotal(rec.values.tokenUsage),
        duration: timingDuration(rec.values, now),
      };
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
      if (run.endedAt === 0) return t('timeline.running');
      const reason = run.stopReason || 'completed';
      const key = `timeline.${reason}`;
      return key in dictionaries.en ? t(key) : t('timeline.completed');
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
    /* graph view                                                          */
    /* ------------------------------------------------------------------ */

    function NodeCard(props) {
      const { node, info, status, t, onOpen } = props;
      return h('div', {
        className: 'awb-node',
        style: { left: node.x, top: node.y, width: NODE_W, height: NODE_H },
      }, [
        h('div', { className: 'awb-nodeHead', key: 'head' }, [
          h('span', { className: `awb-dot awb-dot--${status}`, title: t(`status.${status}`), key: 'dot' }),
          h('span', { className: 'awb-nodeLabel', title: info.label, key: 'label' }, info.label),
          h('button', {
            type: 'button', className: 'awb-nodeOpen', title: t('graph.open'),
            'aria-label': t('graph.open'), onClick: () => onOpen(node.id), key: 'open',
          }, '💬'),
        ]),
        h('div', { className: 'awb-nodeMeta', key: 'meta1' }, [
          info.model ? h('span', { className: 'awb-tag', title: info.model, key: 'model' }, `⚡ ${info.model}`) : null,
          info.mode ? h('span', { className: 'awb-tag', key: 'mode' }, t(`mode.${info.mode}`)) : null,
          node.childCount > 0 ? h('span', { className: 'awb-tag', key: 'children' }, t('graph.children', { count: node.childCount })) : null,
        ]),
        h('div', { className: 'awb-nodeMeta', key: 'meta2' }, [
          info.tokens !== undefined ? h('span', { className: 'awb-tag', key: 'tokens' }, `${t('tokens')} ${formatTokens(info.tokens)}`) : null,
          info.duration !== undefined ? h('span', { className: 'awb-tag', key: 'duration' }, `${t('duration')} ${formatDuration(info.duration)}`) : null,
        ]),
      ]);
    }

    function ListTree(props) {
      const { root, lineage, statusOfNode, infoOf, t, onOpen, depth } = props;
      return h('div', { className: 'awb-listNode' }, [
        h('div', { className: 'awb-listRow', style: { marginLeft: depth * 16 }, key: 'row' }, [
          h('span', { className: `awb-dot awb-dot--${statusOfNode(root.id)}`, key: 'dot' }),
          h('span', { className: 'awb-listLabel', title: infoOf(root.id).label, key: 'label' }, infoOf(root.id).label),
          h('button', {
            type: 'button', className: 'awb-nodeOpen', title: t('graph.open'),
            'aria-label': t('graph.open'), onClick: () => onOpen(root.id), key: 'open',
          }, '💬'),
        ]),
        root.kids.length > 0
          ? h('div', { className: 'awb-listKids', key: 'kids' }, root.kids.map((kid) => h(ListTree, {
            key: kid.id, root: kid, lineage, statusOfNode, infoOf, t, onOpen, depth: depth + 1,
          })))
          : null,
      ]);
    }

    function GraphView(props) {
      const { useSessions, useSessionStatus, openSession, t } = props;
      const snapshot = useSessions((state) => state);
      const statusMap = useSessionStatus((state) => state);
      const [rootId, setRootId] = useState('');
      const [showAll, setShowAll] = useState(false);
      const [wide, setWide] = useState(true);
      const [now, setNow] = useState(() => Date.now());
      const wrapRef = useRef(null);

      useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 5000);
        return () => clearInterval(timer);
      }, []);

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
      const infoOf = (id) => nodeInfo(lineage.byId[id], now);
      const statusOfNode = (id) => statusOf(lineage.byId[id], statusMap.get(id) ? statusMap.get(id).running : undefined);

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
            ? h('div', { className: 'awb-empty', key: 'empty' }, t('graph.empty'))
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
                    status: statusOfNode(node.id), t, onOpen: openSession,
                  })),
                ]),
              ])
              : h('div', { key: 'narrow' }, h(ListTree, {
                root: tree, lineage, statusOfNode, infoOf, t, onOpen: openSession, depth: 0,
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
          h('span', { className: `awb-dot awb-dot--${status}`, key: 'dot' }),
          h('span', { className: 'awb-runName', title: run.name, key: 'name' }, run.name),
          h('span', { className: 'awb-runMeta', key: 'meta' },
            `${time} · ${agents.length} · ${stopLabel(run, t)}`),
        ]),
        open
          ? h('div', { className: 'awb-runBody', key: 'body' }, [
            [...byPhase.entries()].map(([phase, list]) => h('div', { className: 'awb-station', key: phase }, [
              h('div', { className: 'awb-stationHead', key: 'head' }, [
                h('span', { key: 'name' }, phase),
                h('span', { className: 'awb-stationCount', key: 'count' }, String(list.length)),
              ]),
              list.map((agent) => h('div', {
                key: agent.seq,
                className: `awb-pill${agent.childId ? ' awb-pillClick' : ''}`,
                title: agent.childId ? t('timeline.open') : undefined,
                onClick: agent.childId ? () => openSession(agent.childId) : undefined,
              }, [
                h('span', { className: `awb-dot awb-dot--${agent.status === 'done' ? 'done' : agent.status === 'failed' ? 'failed' : 'running'}`, key: 'dot' }),
                h('span', { className: 'awb-pillLabel', key: 'label' }, agent.label),
              ])),
            ])),
            Array.isArray(run.logs) && run.logs.length > 0
              ? h('div', { className: 'awb-taskMeta', key: 'logs' }, run.logs.slice(-3).map((line, index) => h('span', { key: index }, line)))
              : null,
          ])
          : null,
      ]);
    }

    function TimelineView(props) {
      const { openSession, t } = props;
      const [data, setData] = useState({ runs: [], ok: false });

      useEffect(() => {
        let stop = false;
        const tick = () => {
          fetch(RUNS_API, { cache: 'no-store' })
            .then((response) => (response.ok ? response.json() : null))
            .then((json) => {
              if (!stop && json !== null) setData({ runs: Array.isArray(json.runs) ? json.runs : [], ok: true });
            })
            .catch(() => {
              if (!stop) setData((current) => ({ runs: current.runs, ok: false }));
            });
        };
        tick();
        const timer = setInterval(tick, 2000);
        return () => { stop = true; clearInterval(timer); };
      }, []);

      const runs = data.runs;
      const totalAgents = runs.reduce((total, run) => total + (Array.isArray(run.agents) ? run.agents.length : 0), 0);

      return h('div', { className: 'awb-view' }, [
        h('div', { className: 'awb-toolbar', key: 'toolbar' }, [
          h('span', { className: 'awb-toolbarTitle', key: 'title' }, t('timeline.title')),
          h('span', { className: 'awb-meta', key: 'meta' },
            `${t('timeline.runs', { count: runs.length })} · ${t('timeline.agents', { count: totalAgents })}${data.ok ? '' : ` · ${t('timeline.offline')}`}`),
        ]),
        h('div', { className: 'awb-scroll', key: 'scroll' }, [
          runs.length === 0
            ? h('div', { className: 'awb-empty', key: 'empty' }, t('timeline.empty'))
            : runs.slice().reverse().map((run) => h(RunCard, { key: run.id, run, t, openSession })),
        ]),
      ]);
    }

    /* ------------------------------------------------------------------ */
    /* team view                                                           */
    /* ------------------------------------------------------------------ */

    function TeamView(props) {
      const { leadSessionId, useSessions, useSessionStatus, openSession, t } = props;
      const snapshot = useSessions((state) => state);
      const statusMap = useSessionStatus((state) => state);
      const team = leadSessionId !== '' && snapshot.projectionsBySession[leadSessionId] !== undefined
        ? snapshot.projectionsBySession[leadSessionId].values.agentTeam
        : undefined;
      const members = team && Array.isArray(team.members) ? team.members : [];
      const tasks = team && Array.isArray(team.tasks) ? team.tasks : [];
      const modelOf = (id) => {
        const values = snapshot.projectionsBySession[id] ? snapshot.projectionsBySession[id].values : undefined;
        return values && values.modelSelection && values.modelSelection.next ? values.modelSelection.next.model : undefined;
      };

      return h('div', { className: 'awb-view' }, [
        h('div', { className: 'awb-toolbar', key: 'toolbar' }, [
          h('span', { className: 'awb-toolbarTitle', key: 'title' }, t('team.title')),
          team !== undefined
            ? h('span', { className: 'awb-meta', key: 'meta' },
              `${t('team.roster')} ${members.length} · ${t('team.tasks')} ${tasks.length}`)
            : null,
        ]),
        h('div', { className: 'awb-scroll', key: 'scroll' }, [
          team === undefined
            ? h('div', { className: 'awb-empty', key: 'empty' }, t('team.empty'))
            : [
              team.failure ? h('div', { className: 'awb-empty', key: 'failure' }, team.failure) : null,
              h('div', { className: 'awb-section', key: 'roster' }, [
                h('div', { className: 'awb-sectionTitle', key: 'rosterTitle' }, [
                  t('team.roster'),
                  h('span', { className: 'awb-count', key: 'count' }, String(members.length)),
                ]),
                members.length === 0
                  ? h('div', { className: 'awb-empty', key: 'rosterEmpty' }, t('team.empty'))
                  : members.map((member) => h('div', { key: member.id, className: 'awb-member' }, [
                    h('span', { className: `awb-dot awb-dot--${memberStatus(member, statusMap.get(member.id) ? statusMap.get(member.id).running : undefined)}`, key: 'dot' }),
                    h('span', { className: 'awb-memberName', title: member.name, key: 'name' }, member.name),
                    h('span', { className: 'awb-tag', key: 'role' }, t(member.role === 'lead' ? 'team.lead' : 'team.member')),
                    modelOf(member.id) ? h('span', { className: 'awb-tag', key: 'model' }, `⚡ ${modelOf(member.id)}`) : null,
                    h('button', {
                      type: 'button', className: 'awb-nodeOpen', title: t('team.open'),
                      'aria-label': t('team.open'), onClick: () => openSession(member.id), key: 'open',
                    }, '💬'),
                  ])),
              ]),
              h('div', { className: 'awb-section', key: 'tasks' }, [
                h('div', { className: 'awb-sectionTitle', key: 'tasksTitle' }, [
                  t('team.tasks'),
                  h('span', { className: 'awb-count', key: 'count' }, String(tasks.length)),
                ]),
                tasks.length === 0
                  ? h('div', { className: 'awb-empty', key: 'tasksEmpty' }, t('team.empty'))
                  : tasks.map((task) => h('div', { key: task.id, className: 'awb-task' }, [
                    h('div', { className: 'awb-taskTitle', key: 'title' }, [
                      h('span', { className: `awb-dot awb-dot--${taskStatus(task)}`, key: 'dot' }),
                      h('span', { className: 'awb-taskSubject', title: task.subject, key: 'subject' }, task.subject),
                    ]),
                    h('div', { className: 'awb-taskMeta', key: 'meta' }, [
                      h('span', { key: 'status' }, t(`task.${task.status}`)),
                      h('span', { key: 'owner' }, `${t('team.owner')}: ${task.ownerName || t('team.unowned')}`),
                      task.status === 'pending' ? h('span', { key: 'ready' }, task.ready ? t('team.ready') : t('team.blocked')) : null,
                      task.blockedBy && task.blockedBy.length > 0 ? h('span', { key: 'blockedBy' }, `${t('team.blockedBy')}: ${task.blockedBy.length}`) : null,
                      task.writeScopes && task.writeScopes.length > 0 ? h('span', { key: 'writeScopes' }, `${t('team.writeScopes')}: ${task.writeScopes.join(', ')}`) : null,
                    ]),
                  ])),
              ]),
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
        ['graph', t('tab.graph')],
        ['timeline', t('tab.timeline')],
        ['team', t('tab.team')],
      ];
      return h('div', { className: 'awb-tabs' }, tabs.map(([key, label]) => h('button', {
        type: 'button', key, className: `awb-tab${tab === key ? ' awb-tabActive' : ''}`,
        onClick: () => setTab(key),
      }, label)));
    }

    function MainPanel(props) {
      const { useSessions, useSessionStatus, openSession, t } = props;
      const [tab, setTab] = useState('graph');
      const snapshot = useSessions((state) => state);
      const lineage = useMemo(() => buildLineage(snapshot), [snapshot]);
      // The team view follows the Session shown in the main column, else the newest root.
      const mainId = Object.values(snapshot.byId)
        .find((rec) => rec.retainedBy && rec.retainedBy.mainView > 0);
      const lead = (mainId && mainId.id) || lineage.roots[0] || '';

      return h('div', { className: 'awb-root' }, [
        h('style', { dangerouslySetInnerHTML: { __html: CSS }, key: 'style' }),
        h(TabBar, { tab, setTab, t, key: 'tabs' }),
        h('div', { className: 'awb-body', key: 'body' }, [
          tab === 'graph'
            ? h(GraphView, { useSessions, useSessionStatus, openSession, t, key: 'view' })
            : tab === 'timeline'
              ? h(TimelineView, { openSession, t, key: 'view' })
              : h(TeamView, { leadSessionId: lead, useSessions, useSessionStatus, openSession, t, key: 'view' }),
        ]),
      ]);
    }

    function AsidePanel(props) {
      const { useSession, sessionId, useSessions, useSessionStatus, openSession, t } = props;
      const [tab, setTab] = useState('graph');
      const parentSessionId = useSession((state) => (state ? state.subagent && state.subagent.address.parentSessionId : undefined));
      const lead = parentSessionId || sessionId || '';

      return h('div', { className: 'awb-root' }, [
        h('style', { dangerouslySetInnerHTML: { __html: CSS }, key: 'style' }),
        h(TabBar, { tab, setTab, t, key: 'tabs' }),
        h('div', { className: 'awb-body', key: 'body' }, [
          tab === 'graph'
            ? h(GraphView, { useSessions, useSessionStatus, openSession, t, key: 'view' })
            : tab === 'timeline'
              ? h(TimelineView, { openSession, t, key: 'view' })
              : h(TeamView, { leadSessionId: lead, useSessions, useSessionStatus, openSession, t, key: 'view' }),
        ]),
      ]);
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
