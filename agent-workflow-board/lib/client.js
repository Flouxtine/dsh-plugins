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
    const WIDE_MIN = 360;
    const ACTIVE_MS = 2 * 60 * 60 * 1000;
    const RUNS_API = '/api/agent-workflow-board/runs';
    const NODE_W = 248;
    const NODE_H = 106;
    const STAGE_H = 64;
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
        'graph.mode.canvas': 'Canvas',
        'graph.mode.tree': 'Tree',
        'graph.zoomIn': 'Zoom in',
        'graph.zoomOut': 'Zoom out',
        'graph.zoomReset': 'Reset zoom',
        'graph.stage.workspace': 'Workspace',
        'graph.stage.lead': 'Main sessions',
        'graph.stage.sub': 'Subagents',
        'graph.stage.gen': 'Generation {n}',
        'graph.stage.agents': '{count} agents',
        'graph.empty': 'No sessions yet.\nOpen a conversation or spawn a subagent to see the workflow graph.',
        'graph.showAll': 'Show all',
        'graph.activeOnly': 'Active only',
        'graph.hidden': '{count} idle hidden',
        'graph.root': 'Root session',
        'graph.all': 'All sessions',
        'graph.sessions': '{count} sessions',
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
        'timeline.summary': 'Run summary',
        'timeline.totalAgents': '{count} agents',
        'timeline.totalTokens': '{value} tokens',
        'timeline.jump': 'Open',
        'drawer.title': 'Agent details',
        'drawer.status': 'Status',
        'drawer.model': 'Model',
        'drawer.mode': 'Mode',
        'drawer.tokens': 'Tokens',
        'drawer.duration': 'Duration',
        'drawer.parent': 'Parent',
        'drawer.children': 'Children',
        'drawer.workspace': 'Workspace',
        'drawer.activity': 'Last activity',
        'drawer.sessionId': 'Session ID',
        'drawer.open': 'Open conversation',
        'drawer.copy': 'Copy ID',
        'drawer.copied': 'Copied',
        'drawer.noParent': 'None (root)',
        'drawer.noChildren': 'None',
        'drawer.workspaceNode': 'Workspace',
        'drawer.noModel': 'No model route',
        'drawer.stage': 'Stage',
        'approval.title': 'Pending approvals',
        'approval.empty': 'No pending approvals.',
        'approval.tool': 'Tool',
        'approval.reason': 'Reason',
        'approval.gate': 'Approval pending',
        'approval.open': 'Open session',
        'compare.title': 'Compare runs',
        'compare.hint': 'Pick two runs to compare',
        'compare.metric': 'Metric',
        'compare.runA': 'Run A',
        'compare.runB': 'Run B',
        'compare.status': 'Status',
        'compare.agents': 'Agents',
        'compare.tokens': 'Tokens',
        'compare.duration': 'Duration',
        'compare.phases': 'Phases',
        'compare.clear': 'Clear selection',
        'compare.close': 'Close comparison',
        'retry.times': 'retry ×{count}',
        'retry.attempt': 'Attempt {n}',
        'stage.reset': 'Reset arrangement',
        'stage.hint': 'Drag a stage header to reorder columns, or drag an agent card onto another stage. Saved in this browser.',
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
        'graph.mode.canvas': '画布',
        'graph.mode.tree': '树形',
        'graph.zoomIn': '放大',
        'graph.zoomOut': '缩小',
        'graph.zoomReset': '重置缩放',
        'graph.stage.workspace': '工作区',
        'graph.stage.lead': '主会话',
        'graph.stage.sub': '子代理',
        'graph.stage.gen': '第 {n} 代代理',
        'graph.stage.agents': '{count} 个代理',
        'graph.empty': '还没有会话。\n打开一个对话或派生一个子代理，这里就会显示出工作流关系图。',
        'graph.showAll': '显示全部',
        'graph.activeOnly': '只看活跃',
        'graph.hidden': '已隐藏 {count} 个沉睡节点',
        'graph.root': '根会话',
        'graph.all': '全部会话',
        'graph.sessions': '{count} 个会话',
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
        'timeline.summary': '运行摘要',
        'timeline.totalAgents': '{count} 个子代理',
        'timeline.totalTokens': '{value} Token',
        'timeline.jump': '打开',
        'drawer.title': '代理详情',
        'drawer.status': '状态',
        'drawer.model': '模型',
        'drawer.mode': '模式',
        'drawer.tokens': 'Token',
        'drawer.duration': '耗时',
        'drawer.parent': '父会话',
        'drawer.children': '子代理',
        'drawer.workspace': '工作区',
        'drawer.activity': '最近活动',
        'drawer.sessionId': '会话 ID',
        'drawer.open': '打开会话',
        'drawer.copy': '复制 ID',
        'drawer.copied': '已复制',
        'drawer.noParent': '无（根会话）',
        'drawer.noChildren': '无',
        'drawer.workspaceNode': '工作区',
        'drawer.noModel': '尚未选择模型',
        'drawer.stage': '阶段',
        'approval.title': '待审批卡点',
        'approval.empty': '暂无待审批。',
        'approval.tool': '工具',
        'approval.reason': '原因',
        'approval.gate': '待审批',
        'approval.open': '打开会话',
        'compare.title': '运行对比',
        'compare.hint': '选择两个运行进行对比',
        'compare.metric': '指标',
        'compare.runA': '运行 A',
        'compare.runB': '运行 B',
        'compare.status': '状态',
        'compare.agents': '子代理',
        'compare.tokens': 'Token',
        'compare.duration': '耗时',
        'compare.phases': '阶段数',
        'compare.clear': '清除选择',
        'compare.close': '关闭对比',
        'retry.times': '重试 ×{count}',
        'retry.attempt': '第 {n} 次尝试',
        'stage.reset': '重置编排',
        'stage.hint': '拖动阶段标题可排序列，拖动代理卡片到其它阶段可重新分配；更改保存在当前浏览器。',
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
      '.awb-root{display:flex;flex-direction:column;flex:1 1 auto;height:100%;min-height:0;min-width:0;color:var(--dsw-alias-label-primary);font-size:13px;position:relative}',
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
      '.awb-nodeWorkspace{border-style:dashed;background:var(--dsw-alias-bg-layer-2)}',
      '.awb-nodeIcon{width:18px;height:18px;flex:none;display:inline-flex;align-items:center;justify-content:center;font-size:12px}',
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
      /* canvas / stage lanes */
      '.awb-stage{position:absolute;display:flex;flex-direction:column;gap:2px;padding:6px 8px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);min-width:0;box-sizing:border-box}',
      '.awb-stageTitle{font-size:11px;font-weight:650;letter-spacing:0.02em;color:var(--dsw-alias-label-primary);display:flex;align-items:center;gap:5px}',
      '.awb-stageMeta{font-size:10px;color:var(--dsw-alias-label-secondary);display:flex;gap:6px;flex-wrap:wrap;font-variant-numeric:tabular-nums}',
      '.awb-stageBar{height:3px;border-radius:2px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;display:flex}',
      '.awb-stageBar i{display:block;height:100%}',
      '.awb-stageDrop{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1)}',
      '.awb-stageHint{flex:none;padding:5px 16px 0;font-size:10.5px;color:var(--dsw-alias-label-secondary)}',
      '.awb-column{position:absolute;top:0;bottom:0}',
      '.awb-columnZone{position:absolute;top:0;bottom:0;border-radius:12px}',
      '.awb-columnZone.awb-stageDrop{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 8%,transparent)}',
      '.awb-canvasWrap{height:100%;overflow:auto}',
      '.awb-canvas{position:relative;transform-origin:0 0}',
      '.awb-toolbarSep{width:1px;height:18px;background:var(--dsw-alias-border-l2);margin:0 2px;flex:none}',
      '.awb-zoom{display:inline-flex;align-items:center;gap:2px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:1px;background:var(--dsw-alias-bg-layer-1)}',
      '.awb-zoomBtn{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:16px;width:22px;height:22px;border-radius:6px;cursor:pointer;padding:0}',
      '.awb-zoomBtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.awb-zoomValue{font-size:10.5px;color:var(--dsw-alias-label-secondary);min-width:36px;text-align:center;font-variant-numeric:tabular-nums}',
      '.awb-modeSwitch{display:inline-flex;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:1px;background:var(--dsw-alias-bg-layer-1);gap:1px}',
      '.awb-modeBtn{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11.5px;line-height:18px;padding:2px 8px;border-radius:6px;cursor:pointer}',
      '.awb-modeBtnActive{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}',
      /* node detail drawer */
      '.awb-drawerBackdrop{position:absolute;inset:0;background:rgba(0,0,0,.18);z-index:15}',
      '.awb-drawer{position:absolute;top:0;right:0;bottom:0;width:330px;max-width:92%;background:var(--dsw-alias-bg-overlay);border-left:1px solid var(--dsw-alias-border-l1);box-shadow:-8px 0 24px rgba(0,0,0,.18);display:flex;flex-direction:column;z-index:20}',
      '.awb-drawerHead{display:flex;align-items:center;gap:8px;padding:12px 13px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}',
      '.awb-drawerTitle{flex:1 1 auto;min-width:0;font-size:13.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-drawerClose{border:none;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:14px;line-height:18px;width:24px;height:24px;border-radius:7px;cursor:pointer;flex:none}',
      '.awb-drawerClose:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}',
      '.awb-drawerBody{flex:1 1 auto;min-height:0;overflow:auto;padding:12px 13px}',
      '.awb-kv{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px}',
      '.awb-kvLabel{flex:none;width:92px;color:var(--dsw-alias-label-secondary)}',
      '.awb-kvValue{flex:1 1 auto;min-width:0;word-break:break-word}',
      '.awb-drawerActions{display:flex;gap:6px;flex-wrap:wrap;padding:11px 13px;border-top:1px solid var(--dsw-alias-border-l1);flex:none}',
      '.awb-miniBtn{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:11.5px;line-height:18px;padding:4px 9px;cursor:pointer}',
      '.awb-miniBtn:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.awb-miniBtnActive{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);border-color:transparent}',
      '.awb-stageButtons{display:flex;gap:4px;flex-wrap:wrap}',
      '.awb-sectionLabel{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);letter-spacing:0.04em;text-transform:uppercase;margin:12px 0 5px}',
      /* timeline */
      '.awb-run{border:1px solid var(--dsw-alias-border-l1);border-radius:13px;background:var(--dsw-alias-bg-layer-1);margin-bottom:11px;overflow:hidden}',
      '.awb-runHead{display:flex;align-items:center;gap:9px;padding:10px 13px;cursor:pointer}',
      '.awb-runHead:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.awb-runName{flex:1 1 auto;min-width:0;font-size:13px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.awb-runMeta{font-size:10.5px;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,monospace;white-space:nowrap;font-variant-numeric:tabular-nums}',
      '.awb-runBody{border-top:1px solid var(--dsw-alias-border-l1);padding:11px 13px}',
      '.awb-runSummary{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;margin-bottom:10px}',
      '.awb-btnActive{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}',
      '.awb-compare{border:1px solid var(--dsw-alias-border-l1);border-radius:13px;background:var(--dsw-alias-bg-layer-1);padding:11px 13px;margin-bottom:12px}',
      '.awb-compareHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}',
      '.awb-compareGrid{display:grid;grid-template-columns:minmax(76px,auto) 1fr 1fr;gap:5px 10px;font-size:12px}',
      '.awb-compareMetric{color:var(--dsw-alias-label-secondary)}',
      '.awb-compareCell{min-width:0;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}',
      '.awb-compareHeadCell{font-weight:650;color:var(--dsw-alias-label-primary)}',
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
    const EMPTY_STATUS_MAP = new Map();

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

    const STAGE_STORE_KEY = 'dsh.local.agent-workflow-board.stages.v1';

    /** Manual stage arrangement: column order plus per-Session stage overrides. */
    function loadStagePrefs() {
      try {
        const raw = localStorage.getItem(STAGE_STORE_KEY);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (parsed !== null && typeof parsed === 'object') {
            return {
              order: Array.isArray(parsed.order) ? parsed.order.filter((value) => typeof value === 'number') : [],
              overrides: parsed.overrides !== null && typeof parsed.overrides === 'object' ? parsed.overrides : {},
            };
          }
        }
      } catch {
        // Unreadable storage falls back to the automatic layout.
      }
      return { order: [], overrides: {} };
    }

    function saveStagePrefs(prefs) {
      try {
        localStorage.setItem(STAGE_STORE_KEY, JSON.stringify(prefs));
      } catch {
        // Storage can be unavailable; the arrangement stays in memory.
      }
    }

    /** True when a Session has an approval waiting on a human decision. */
    function pendingApprovalOf(statusMap, sessionId) {
      const status = statusMap instanceof Map ? statusMap.get(sessionId) : undefined;
      const interaction = status ? status.pendingInteraction : undefined;
      return interaction !== undefined && interaction.kind === 'approval'
        ? interaction
        : undefined;
    }

    /** DataTransfer.types is array-like; use whichever membership test it offers. */
    function hasDragType(event, type) {
      const types = event.dataTransfer.types;
      if (types === undefined || types === null) return false;
      if (typeof types.includes === 'function') return types.includes(type);
      if (typeof types.contains === 'function') return types.contains(type);
      return Array.from(types).indexOf(type) !== -1;
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
      const { leadSessionId, snapshot, statusMap, openSession, t, now, runs, runCount, emptyHint } = props;
      const lineage = useMemo(() => buildLineage(snapshot), [snapshot]);
      const stats = useMemo(() => summarize(lineage, now), [lineage, now]);
      const activity = useMemo(() => collectActivity(lineage, 12), [lineage]);
      const approvals = useMemo(() => {
        const found = [];
        if (statusMap instanceof Map) {
          const locale = (typeof navigator !== 'undefined' && navigator.language) || 'en';
          for (const [sessionId, status] of statusMap) {
            const interaction = status !== undefined && status !== null ? status.pendingInteraction : undefined;
            if (interaction !== undefined && interaction.kind === 'approval') {
              const display = interaction.displayReason;
              const localized = typeof display === 'string'
                ? display
                : (display !== undefined && display !== null && typeof display === 'object'
                  ? (display[locale] || display.en || '')
                  : '');
              found.push({
                sessionId,
                toolName: interaction.toolName || '—',
                reason: localized || interaction.reason || '',
              });
            }
          }
        }
        return found;
      }, [statusMap]);
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
              h('div', { className: 'awb-card', key: 'approvals' }, [
                h('div', { className: 'awb-sectionTitle' }, [
                  '🔒',
                  t('approval.title'),
                  h('span', { className: 'awb-count', key: 'count' }, String(approvals.length)),
                ]),
                approvals.length === 0
                  ? h('div', { className: 'awb-meta', key: 'empty' }, t('approval.empty'))
                  : approvals.map((item) => {
                    const rec = lineage.byId[item.sessionId];
                    return h('div', { className: 'awb-member', key: item.sessionId }, [
                      h('span', { className: 'awb-dot awb-dot--waiting', key: 'dot' }),
                      h('span', { className: 'awb-memberName', title: displayTitle(rec), key: 'name' },
                        displayTitle(rec) || item.sessionId),
                      h('span', { className: 'awb-tag', key: 'tool' }, item.toolName),
                      item.reason ? h('span', { className: 'awb-tag', title: item.reason, key: 'reason' }, item.reason) : null,
                      h('button', {
                        type: 'button', className: 'awb-nodeOpen', key: 'open',
                        title: t('approval.open'), 'aria-label': t('approval.open'),
                        onClick: () => openSession(item.sessionId),
                      }, t('approval.open')),
                    ]);
                  }),
              ]),
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

    function workspaceLabel(cwd) {
      if (!cwd) return '';
      const parts = String(cwd).split(/[\\/]/).filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] : String(cwd);
    }

    function NodeCard(props) {
      const { node, info, status, current, t, onOpen, onSelect, draggable, onDragStart, gate } = props;
      if (node.kind === 'workspace') {
        return h('div', {
          className: 'awb-node awb-nodeWorkspace',
          style: { left: node.x, top: node.y, width: NODE_W, height: NODE_H },
        }, [
          h('div', { className: 'awb-nodeHead', key: 'head' }, [
            h('span', { className: 'awb-nodeIcon', key: 'icon' }, '📁'),
            h('span', { className: 'awb-nodeLabel', title: node.cwd, key: 'label' }, workspaceLabel(node.cwd)),
          ]),
          h('div', { className: 'awb-nodeMeta', key: 'meta' }, [
            h('span', { className: 'awb-tag', key: 'count' }, t('graph.sessions', { count: node.childCount })),
          ]),
          h('div', { className: 'awb-nodeMeta', key: 'path' }, [
            h('span', { className: 'awb-tag awb-tagPath', title: node.cwd, key: 'path' }, node.cwd),
          ]),
        ]);
      }
      return h('div', {
        className: `awb-node${current ? ' awb-nodeCurrent' : ''}`,
        style: { left: node.x, top: node.y, width: NODE_W, height: NODE_H, cursor: 'pointer' },
        role: 'button',
        tabIndex: 0,
        title: info.label,
        draggable,
        onDragStart,
        onClick: () => onSelect(node.id),
        onKeyDown: (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(node.id);
          }
        },
      }, [
        h('div', { className: 'awb-nodeHead', key: 'head' }, [
          h(Dot, { status, key: 'dot' }),
          h('span', { className: 'awb-nodeLabel', title: info.label, key: 'label' }, info.label),
          h('button', {
            type: 'button', className: 'awb-nodeOpen', title: t('graph.open'),
            'aria-label': t('graph.open'),
            onClick: (event) => { event.stopPropagation(); onOpen(node.id); },
            key: 'open',
          }, '💬'),
        ]),
        h('div', { className: 'awb-nodeMeta', key: 'meta1' }, [
          h('span', { className: `awb-pill awb-pill--${status}`, key: 'status' }, [
            h('span', { className: `awb-dot awb-dot--${status}`, key: 'pilldot' }),
            h('span', { className: 'awb-pillText', key: 'pilltext' }, t(`status.${status}`)),
          ]),
          current ? h('span', { className: 'awb-tag', key: 'current' }, t('graph.current')) : null,
          gate ? h('span', { className: 'awb-tag', key: 'gate', title: t('approval.gate') }, '🔒') : null,
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

    function Kv(props) {
      const { label, t, children } = props;
      return h('div', { className: 'awb-kv' }, [
        h('span', { className: 'awb-kvLabel', key: 'label' }, label),
        h('span', { className: 'awb-kvValue', key: 'value' }, children),
      ]);
    }

    /**
     * Stage-lane canvas layout: one column per generation, nodes packed top-down.
     * `prefs.overrides` reassigns a Session to another stage; `prefs.order` reorders columns.
     */
    function layoutForest(forest, mode, prefs) {
      const overrides = prefs !== null && typeof prefs.overrides === 'object' ? prefs.overrides : {};
      const order = prefs !== null && Array.isArray(prefs.order) ? prefs.order : [];
      const records = [];
      const edges = [];
      const walk = (node, depth, parentId) => {
        const effective = node.kind === 'workspace'
          ? 0
          : (typeof overrides[node.id] === 'number' ? overrides[node.id] : depth);
        records.push({
          id: node.id, kind: node.kind, cwd: node.cwd, depth: effective,
          childCount: node.kids.length, order: records.length,
        });
        if (parentId !== null) edges.push([parentId, node.id]);
        for (const kid of node.kids) walk(kid, depth + 1, node.id);
      };
      for (const root of forest) walk(root, 0, null);

      const depths = [...new Set(records.map((record) => record.depth))].sort((left, right) => {
        const leftIndex = order.indexOf(left);
        const rightIndex = order.indexOf(right);
        if (leftIndex !== -1 || rightIndex !== -1) {
          return (leftIndex === -1 ? 1e6 : leftIndex) - (rightIndex === -1 ? 1e6 : rightIndex);
        }
        return left - right;
      });

      const laneByDepth = new Map();
      const nodes = records.map((record) => {
        const lane = laneByDepth.get(record.depth) || 0;
        laneByDepth.set(record.depth, lane + 1);
        const orderIndex = mode === 'canvas' ? lane : record.order;
        return {
          id: record.id, kind: record.kind, cwd: record.cwd, depth: record.depth,
          laneIndex: lane, order: record.order,
          x: depths.indexOf(record.depth) * (NODE_W + HGAP),
          y: (mode === 'canvas' ? STAGE_H : 0) + orderIndex * (NODE_H + VGAP),
          childCount: record.childCount,
        };
      });
      const width = nodes.length === 0 ? 0 : Math.max(...nodes.map((node) => node.x + NODE_W));
      const height = nodes.length === 0 ? 0 : Math.max(...nodes.map((node) => node.y + NODE_H));
      return { nodes, edges, depths, width, height };
    }

    function stageLabel(depth, t) {
      if (depth === 0) return t('graph.stage.workspace');
      if (depth === 1) return t('graph.stage.lead');
      if (depth === 2) return t('graph.stage.sub');
      return t('graph.stage.gen', { n: depth });
    }

    function NodeDrawer(props) {
      const {
        rec, info, status, lineage, t, now, onOpen, onClose, onSelect,
        depths, currentStage, onStageChange,
      } = props;
      const [copied, setCopied] = useState(false);
      const parent = rec.parentId !== '' && lineage.byId[rec.parentId] !== undefined
        ? lineage.byId[rec.parentId] : undefined;
      const kids = lineage.children[rec.id] || [];
      const copy = () => {
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(rec.id).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }).catch(() => {});
          }
        } catch {
          // Clipboard can be unavailable; the id stays visible for manual copy.
        }
      };
      return h(React.Fragment, null, [
        h('div', { className: 'awb-drawerBackdrop', onClick: onClose, key: 'backdrop' }),
        h('div', { className: 'awb-drawer', role: 'dialog', 'aria-label': t('drawer.title'), key: 'drawer' }, [
          h('div', { className: 'awb-drawerHead' }, [
            h(Dot, { status, key: 'dot' }),
            h('span', { className: 'awb-drawerTitle', title: info.label, key: 'title' }, info.label),
            h('button', {
              type: 'button', className: 'awb-drawerClose', onClick: onClose,
              'aria-label': 'Close', title: 'Close', key: 'close',
            }, '×'),
          ]),
          h('div', { className: 'awb-drawerBody' }, [
            h(Kv, { label: t('drawer.status'), t, key: 'status' }, [
              h('span', { className: `awb-pill awb-pill--${status}`, key: 'pill' }, [
                h('span', { className: `awb-dot awb-dot--${status}`, key: 'dot' }),
                h('span', { className: 'awb-pillText', key: 'text' }, t(`status.${status}`)),
              ]),
            ]),
            h(Kv, { label: t('drawer.model'), t, key: 'model' }, info.model || t('drawer.noModel')),
            h(Kv, { label: t('drawer.mode'), t, key: 'mode' }, info.mode ? t(`mode.${info.mode}`) : '—'),
            h(Kv, { label: t('drawer.tokens'), t, key: 'tokens' },
              info.tokens !== undefined ? formatTokens(info.tokens) : '—'),
            h(Kv, { label: t('drawer.duration'), t, key: 'duration' },
              info.duration !== undefined ? formatDuration(info.duration) : '—'),
            h(Kv, { label: t('drawer.parent'), t, key: 'parent' }, parent !== undefined
              ? h('button', {
                type: 'button', className: 'awb-miniBtn', key: 'parentBtn',
                onClick: () => onSelect(parent.id),
              }, displayTitle(parent))
              : t('drawer.noParent')),
            h(Kv, { label: t('drawer.children'), t, key: 'children' }, kids.length > 0
              ? h('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap' } }, kids.slice(0, 8).map((kid) => h('button', {
                type: 'button', className: 'awb-miniBtn', key: kid,
                onClick: () => onSelect(kid), title: displayTitle(lineage.byId[kid]),
              }, displayTitle(lineage.byId[kid]))))
              : t('drawer.noChildren')),
            h(Kv, { label: t('drawer.workspace'), t, key: 'cwd' }, rec.cwd || '—'),
            h(Kv, { label: t('drawer.activity'), t, key: 'activity' },
              rec.updatedAt ? formatRelative(rec.updatedAt, now) : '—'),
            h(Kv, { label: t('drawer.sessionId'), t, key: 'id' }, rec.id),
            h(Kv, { label: t('drawer.stage'), t, key: 'stage' }, [
              h('span', { className: 'awb-stageButtons', key: 'buttons' },
                (depths.length > 0 ? depths : [currentStage]).map((depth) => h('button', {
                  type: 'button', key: depth,
                  className: `awb-miniBtn${depth === currentStage ? ' awb-miniBtnActive' : ''}`,
                  onClick: () => onStageChange(depth),
                  title: stageLabel(depth, t),
                }, `${depth + 1}`))),
            ]),
          ]),
          h('div', { className: 'awb-drawerActions' }, [
            h('button', {
              type: 'button', className: 'awb-miniBtn', key: 'open',
              onClick: () => onOpen(rec.id),
            }, t('drawer.open')),
            h('button', {
              type: 'button', className: 'awb-miniBtn', key: 'copy',
              onClick: copy,
            }, copied ? t('drawer.copied') : t('drawer.copy')),
          ]),
        ]),
      ]);
    }

    function TreeNode(props) {
      const { node, lineage, statusOfNode, infoOf, currentId, t, onOpen, depth } = props;
      const isWorkspace = node.kind === 'workspace';
      const info = isWorkspace ? { label: workspaceLabel(node.cwd) } : infoOf(node.id);
      return h('div', { className: 'awb-listNode' }, [
        h('div', { className: 'awb-listRow', style: { marginLeft: depth * 16 }, key: 'row' }, [
          isWorkspace
            ? h('span', { className: 'awb-nodeIcon', key: 'icon' }, '📁')
            : h(Dot, { status: statusOfNode(node.id), key: 'dot' }),
          h('span', { className: 'awb-listLabel', title: info.label, key: 'label' }, info.label),
          !isWorkspace && currentId === node.id
            ? h('span', { className: 'awb-tag', key: 'current' }, t('graph.current'))
            : null,
          !isWorkspace
            ? h('button', {
              type: 'button', className: 'awb-nodeOpen', title: t('graph.open'),
              'aria-label': t('graph.open'), onClick: () => onOpen(node.id), key: 'open',
            }, '💬')
            : null,
        ]),
        node.kids.length > 0
          ? h('div', { className: 'awb-listKids', key: 'kids' }, node.kids.map((kid) => h(TreeNode, {
            key: kid.id, node: kid, lineage, statusOfNode, infoOf, currentId, t, onOpen, depth: depth + 1,
          })))
          : null,
      ]);
    }

    function GraphView(props) {
      const { snapshot, statusMap, openSession, t, now, currentId, emptyHint } = props;
      const [rootId, setRootId] = useState('');
      const [showAll, setShowAll] = useState(false);
      const [wide, setWide] = useState(true);
      const [mode, setMode] = useState('canvas');
      const [zoom, setZoom] = useState(1);
      const [selectedId, setSelectedId] = useState(null);
      const [stagePrefs, setStagePrefs] = useState(loadStagePrefs);
      const [dropDepth, setDropDepth] = useState(null);
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

      useEffect(() => {
        if (selectedId === null) return undefined;
        const onKey = (event) => {
          if (event.key !== 'Escape') return;
          event.stopPropagation();
          setSelectedId(null);
        };
        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
      }, [selectedId]);

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
      const buildTree = (id) => ({ id, kind: 'session', kids: visibleKids(id).map(buildTree) });
      const buildFullTree = (id) => ({ id, kind: 'session', kids: (lineage.children[id] || []).map(buildFullTree) });
      const countNodes = (node) => 1 + node.kids.reduce((sum, kid) => sum + countNodes(kid), 0);

      // No explicit pick means the whole forest: every workspace, its root Sessions
      // and each root's subtree, so a flat session list still reads as one graph.
      const selectValue = rootId !== '' && lineage.byId[rootId] !== undefined ? rootId : '';
      const newestOf = (ids) => ids.reduce((max, id) => Math.max(max, lineage.byId[id] ? lineage.byId[id].updatedAt : 0), 0);
      const forest = [];
      if (selectValue !== '') {
        forest.push(buildTree(selectValue));
      } else {
        const groups = new Map();
        for (const id of lineage.roots) {
          const rec = lineage.byId[id];
          const cwd = rec !== undefined && rec.cwd ? rec.cwd : '';
          if (!groups.has(cwd)) groups.set(cwd, []);
          groups.get(cwd).push(id);
        }
        const ordered = [...groups.entries()].sort((left, right) => newestOf(right[1]) - newestOf(left[1]));
        for (const [cwd, roots] of ordered) {
          if (cwd === '' || roots.length === 0) {
            for (const id of roots) forest.push(buildTree(id));
            continue;
          }
          forest.push({ id: `ws:${cwd}`, kind: 'workspace', cwd, kids: roots.map(buildTree) });
        }
      }
      const hasTree = forest.length > 0;
      let hiddenCount = 0;
      for (const id of lineage.roots) {
        hiddenCount += Math.max(0, countNodes(buildFullTree(id)) - countNodes(buildTree(id)));
      }

      const layout = layoutForest(forest, mode, stagePrefs);
      const { nodes, edges, depths, width, height } = layout;
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

      const stages = depths.map((depth) => {
        const inColumn = nodes.filter((node) => node.depth === depth && node.kind !== 'workspace');
        const counts = { running: 0, done: 0, failed: 0, idle: 0, waiting: 0 };
        let tokens = 0;
        let hasTokens = false;
        for (const node of inColumn) {
          counts[statusOfNode(node.id)] += 1;
          const value = infoOf(node.id).tokens;
          if (value !== undefined) { tokens += value; hasTokens = true; }
        }
        return { depth, count: inColumn.length, counts, tokens, hasTokens };
      });

      const zoomIn = () => setZoom((value) => Math.min(1.6, Math.round((value + 0.2) * 100) / 100));
      const zoomOut = () => setZoom((value) => Math.max(0.5, Math.round((value - 0.2) * 100) / 100));
      const resetZoom = () => setZoom(1);

      const updateStagePrefs = (next) => {
        setStagePrefs(next);
        saveStagePrefs(next);
      };
      const resetStages = () => updateStagePrefs({ order: [], overrides: {} });

      /** Drag a stage header onto another header to reorder the columns. */
      const onStageDragOver = (depth) => (event) => {
        if (!hasDragType(event, 'awb/stage')) return;
        event.preventDefault();
        setDropDepth(depth);
      };
      const onStageDrop = (target) => (event) => {
        event.preventDefault();
        const source = event.dataTransfer.getData('awb/stage');
        setDropDepth(null);
        if (source === '' || Number(source) === target) return;
        const order = depths.filter((depth) => depth !== Number(source));
        order.splice(order.indexOf(target) === -1 ? order.length : order.indexOf(target), 0, Number(source));
        updateStagePrefs({ ...stagePrefs, order });
      };
      const onNodeDrop = (target) => (event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData('awb/node');
        setDropDepth(null);
        if (id === '') return;
        updateStagePrefs({
          ...stagePrefs,
          overrides: { ...stagePrefs.overrides, [id]: target },
        });
      };

      const stageOfSession = (id) => {
        if (typeof stagePrefs.overrides[id] === 'number') return stagePrefs.overrides[id];
        const found = nodes.find((node) => node.id === id);
        return found === undefined ? 0 : found.depth;
      };

      const selectedRec = selectedId !== null && lineage.byId[selectedId] !== undefined
        ? lineage.byId[selectedId] : null;

      const stageBar = (counts) => {
        const total = Math.max(1, counts.running + counts.done + counts.failed + counts.idle + counts.waiting);
        const segment = (value, color, key) => value > 0
          ? h('i', { style: { width: `${(value / total) * 100}%`, background: color }, key })
          : null;
        return h('span', { className: 'awb-stageBar' }, [
          segment(counts.running, 'var(--dsw-alias-brand-primary)', 'running'),
          segment(counts.done, 'var(--dsw-alias-state-success-primary)', 'done'),
          segment(counts.failed, 'var(--dsw-alias-state-error-primary)', 'failed'),
          segment(counts.idle, 'var(--dsw-alias-state-idle-primary)', 'idle'),
          segment(counts.waiting, 'var(--dsw-alias-state-warn-primary)', 'waiting'),
        ]);
      };

      return h('div', { className: 'awb-view', ref: wrapRef }, [
        h('div', { className: 'awb-toolbar', key: 'toolbar' }, [
          h('span', { className: 'awb-toolbarTitle', key: 'title' }, t('graph.title')),
          h('span', { className: 'awb-meta', key: 'summary' },
            `${stats.total} ${t('overview.stats.sessions').toLowerCase()} · ${countAgents(lineage)} ${t('overview.stats.agents').toLowerCase()} · ${stats.running} ${t('status.running').toLowerCase()}`),
          lineage.roots.length > 1
            ? h('select', {
              className: 'awb-select', value: selectValue, title: t('graph.root'),
              onChange: (event) => setRootId(event.target.value), key: 'root',
            }, [
              h('option', { key: '__all', value: '' }, t('graph.all')),
              ...lineage.roots.slice(0, 40).map((id) => h('option', { key: id, value: id }, displayTitle(lineage.byId[id]))),
            ])
            : null,
          h('button', { type: 'button', className: 'awb-btn', onClick: () => setShowAll((value) => !value), key: 'toggle' },
            showAll ? t('graph.activeOnly') : t('graph.showAll')),
          hiddenCount > 0 ? h('span', { className: 'awb-meta', key: 'hidden' }, t('graph.hidden', { count: hiddenCount })) : null,
          h('span', { className: 'awb-toolbarSep', key: 'sep' }),
          h('span', { className: 'awb-modeSwitch', key: 'mode' }, [
            h('button', {
              type: 'button', key: 'canvas',
              className: `awb-modeBtn${mode === 'canvas' ? ' awb-modeBtnActive' : ''}`,
              onClick: () => setMode('canvas'),
            }, t('graph.mode.canvas')),
            h('button', {
              type: 'button', key: 'tree',
              className: `awb-modeBtn${mode === 'tree' ? ' awb-modeBtnActive' : ''}`,
              onClick: () => setMode('tree'),
            }, t('graph.mode.tree')),
          ]),
          h('span', { className: 'awb-zoom', key: 'zoom' }, [
            h('button', {
              type: 'button', className: 'awb-zoomBtn', onClick: zoomOut,
              title: t('graph.zoomOut'), 'aria-label': t('graph.zoomOut'), key: 'out',
            }, '−'),
            h('span', {
              className: 'awb-zoomValue', key: 'value', title: t('graph.zoomReset'),
              onClick: resetZoom, style: { cursor: 'pointer' },
            }, `${Math.round(zoom * 100)}%`),
            h('button', {
              type: 'button', className: 'awb-zoomBtn', onClick: zoomIn,
              title: t('graph.zoomIn'), 'aria-label': t('graph.zoomIn'), key: 'in',
            }, '+'),
          ]),
          h('span', { className: 'awb-legend', key: 'legend' }, [
            h('span', { className: 'awb-dot awb-dot--running', key: 'running' }), t('status.running'),
            h('span', { className: 'awb-dot awb-dot--done', key: 'done' }), t('status.done'),
            h('span', { className: 'awb-dot awb-dot--idle', key: 'idle' }), t('status.idle'),
            h('span', { className: 'awb-dot awb-dot--failed', key: 'failed' }), t('status.failed'),
          ]),
          mode === 'canvas'
            ? h('button', {
              type: 'button', className: 'awb-btn', onClick: resetStages,
              title: t('stage.hint'), key: 'resetStages',
            }, t('stage.reset'))
            : null,
        ]),
        mode === 'canvas'
          ? h('div', { className: 'awb-stageHint', key: 'stageHint' }, t('stage.hint'))
          : null,
        h('div', { className: 'awb-scroll', key: 'scroll' }, [
          !hasTree
            ? EmptyState({ t, message: t('graph.empty'), icon: '🕸', hint: emptyHint })
            : wide
              ? h('div', { className: 'awb-canvasWrap', key: 'wide' }, [
                h('div', { className: 'awb-canvas', style: { width, height, zoom }, key: 'canvas' }, [
                  h('svg', {
                    className: 'awb-graphEdges', width, height,
                    viewBox: `0 0 ${width} ${height}`, fill: 'none',
                    'aria-hidden': true, key: 'edges',
                  }, paths.map((d, index) => h('path', {
                    key: index, d, stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 1.5,
                  }))),
                  mode === 'canvas'
                    ? stages.map((stage) => {
                      const columnIndex = depths.indexOf(stage.depth);
                      const columnNodes = nodes.filter((node) => node.depth === stage.depth);
                      return h('div', {
                        className: `awb-columnZone${dropDepth === stage.depth ? ' awb-stageDrop' : ''}`,
                        key: `zone-${stage.depth}`,
                        style: {
                          left: columnIndex * (NODE_W + HGAP), top: 0,
                          width: NODE_W, height: Math.max(height, STAGE_H),
                        },
                        onDragOver: (event) => {
                          if (!hasDragType(event, 'awb/node')) return;
                          event.preventDefault();
                          setDropDepth(stage.depth);
                        },
                        onDrop: onNodeDrop(stage.depth),
                        onDragLeave: () => setDropDepth((current) => current === stage.depth ? null : current),
                      }, [
                        h('div', {
                          className: `awb-stage${dropDepth === stage.depth ? ' awb-stageDrop' : ''}`,
                          style: {
                            position: 'absolute', left: 0, top: 0,
                            width: NODE_W, height: STAGE_H - 8, cursor: 'grab',
                          },
                          draggable: true,
                          title: t('stage.hint'),
                          onDragStart: (event) => {
                            event.dataTransfer.setData('awb/stage', String(stage.depth));
                            event.dataTransfer.effectAllowed = 'move';
                          },
                          onDragOver: onStageDragOver(stage.depth),
                          onDrop: onStageDrop(stage.depth),
                          onDragLeave: () => setDropDepth((current) => current === stage.depth ? null : current),
                        }, [
                          h('span', { className: 'awb-stageTitle', key: 'title' },
                            `${stage.depth + 1} · ${stageLabel(stage.depth, t)}`),
                          h('span', { className: 'awb-stageMeta', key: 'meta' }, [
                            h('span', { key: 'count' }, t('graph.stage.agents', { count: stage.count })),
                            stage.hasTokens
                              ? h('span', { key: 'tokens' }, `${t('tokens')} ${formatTokens(stage.tokens)}`)
                              : null,
                          ]),
                          stageBar(stage.counts),
                        ]),
                        ...columnNodes.map((node) => h(NodeCard, {
                          key: node.id,
                          node: { ...node, x: 0 },
                          info: node.kind === 'workspace' ? { label: '' } : infoOf(node.id),
                          status: node.kind === 'workspace' ? 'idle' : statusOfNode(node.id),
                          current: currentId === node.id,
                          t, onOpen: openSession, onSelect: setSelectedId,
                          gate: pendingApprovalOf(statusMap, node.id) !== undefined,
                          draggable: node.kind !== 'workspace',
                          onDragStart: (event) => {
                            event.dataTransfer.setData('awb/node', node.id);
                            event.dataTransfer.effectAllowed = 'move';
                          },
                        })),
                      ]);
                    })
                    : nodes.map((node) => h(NodeCard, {
                      key: node.id, node,
                      info: node.kind === 'workspace' ? { label: '' } : infoOf(node.id),
                      status: node.kind === 'workspace' ? 'idle' : statusOfNode(node.id),
                      current: currentId === node.id,
                      t, onOpen: openSession, onSelect: setSelectedId,
                      gate: pendingApprovalOf(statusMap, node.id) !== undefined,
                    })),
                ]),
              ])
              : h('div', { key: 'narrow' }, forest.map((root) => h(TreeNode, {
                key: root.id, node: root, lineage, statusOfNode, infoOf, currentId, t, onOpen: openSession, depth: 0,
              }))),
        ]),
        selectedRec !== null
          ? h(NodeDrawer, {
            rec: selectedRec,
            info: nodeInfo(selectedRec, now),
            status: statusOf(selectedRec),
            lineage, t, now,
            onOpen: openSession,
            onClose: () => setSelectedId(null),
            onSelect: (id) => setSelectedId(id),
            depths,
            currentStage: stageOfSession(selectedRec.id),
            onStageChange: (depth) => updateStagePrefs({
              ...stagePrefs,
              overrides: { ...stagePrefs.overrides, [selectedRec.id]: depth },
            }),
            key: 'drawer',
          })
          : null,
      ]);
    }

    /* ------------------------------------------------------------------ */
    /* timeline view                                                       */
    /* ------------------------------------------------------------------ */

    function RunCard(props) {
      const {
        run, t, openSession, sessionById, now,
        attempt, attempts, compareMode, compareSelected, onToggleCompare,
      } = props;
      const [open, setOpen] = useState(false);
      const agents = Array.isArray(run.agents) ? run.agents : [];
      const failedCount = agents.filter((agent) => agent.status === 'failed').length;
      const runningCount = agents.filter((agent) => agent.status === 'running').length;
      const doneCount = agents.filter((agent) => agent.status === 'done').length;
      const running = !run.endedAt;
      const failed = failedCount > 0 || /error|fail|cancel/i.test(run.stopReason || '');
      const status = running ? 'running' : failed ? 'failed' : 'done';

      const attemptsByKey = new Map();
      for (const agent of agents) {
        const key = `${agent.phase || ''}::${agent.label}`;
        attemptsByKey.set(key, (attemptsByKey.get(key) || 0) + 1);
      }

      let tokens = 0;
      let hasTokens = false;
      const infoOfChild = (childId) => {
        const rec = childId ? sessionById(childId) : undefined;
        return rec === undefined ? { model: undefined, tokens: undefined, duration: undefined } : nodeInfo(rec, now);
      };
      for (const agent of agents) {
        const info = infoOfChild(agent.childId);
        if (info.tokens !== undefined) { tokens += info.tokens; hasTokens = true; }
      }

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
          attempts > 1
            ? h('span', { className: 'awb-tag', key: 'attempt' }, t('retry.attempt', { n: attempt }))
            : null,
          h('span', { className: 'awb-runMeta', key: 'meta' },
            `${time} · ${agents.length} · ${stopLabel(run, t)}`),
          compareMode
            ? h('button', {
              type: 'button', className: 'awb-miniBtn', key: 'compare',
              title: t('compare.title'), 'aria-label': t('compare.title'),
              'aria-pressed': compareSelected,
              onClick: (event) => { event.stopPropagation(); onToggleCompare(run.id); },
            }, compareSelected ? '✓' : '☐')
            : null,
        ]),
        open
          ? h('div', { className: 'awb-runBody', key: 'body' }, [
            h('div', { className: 'awb-runSummary', key: 'summary' }, [
              h('span', { key: 'agents' }, t('timeline.totalAgents', { count: agents.length })),
              h('span', { key: 'done' }, `${doneCount} ✓`),
              h('span', { key: 'running' }, `${runningCount} ◌`),
              failedCount > 0 ? h('span', { key: 'failed', style: { color: 'var(--dsw-alias-state-error-primary)' } }, `${failedCount} ✗`) : null,
              hasTokens
                ? h('span', { key: 'tokens' }, t('timeline.totalTokens', { value: formatTokens(tokens) }))
                : null,
            ]),
            [...byPhase.entries()].map(([phase, list]) => h('div', { className: 'awb-station', key: phase }, [
              h('div', { className: 'awb-stationHead', key: 'head' }, [
                h('span', { key: 'name' }, phase),
                h('span', { className: 'awb-count', key: 'count' }, String(list.length)),
              ]),
              list.map((agent) => {
                const info = infoOfChild(agent.childId);
                const key = `${agent.phase || ''}::${agent.label}`;
                const retries = attemptsByKey.get(key) || 1;
                return h('div', {
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
                  retries > 1
                    ? h('span', { className: 'awb-tag', key: 'retry', title: t('retry.times', { count: retries }) },
                      `↻ ${retries}`)
                    : null,
                  info.model ? h('span', { className: 'awb-tag', key: 'model' }, `⚡ ${info.model}`) : null,
                  info.tokens !== undefined
                    ? h('span', { className: 'awb-tag', key: 'tokens' }, formatTokens(info.tokens))
                    : null,
                  info.duration !== undefined
                    ? h('span', { className: 'awb-tag', key: 'duration' }, formatDuration(info.duration))
                    : null,
                  agent.childId
                    ? h('button', {
                      type: 'button', className: 'awb-nodeOpen', key: 'open',
                      title: t('timeline.jump'), 'aria-label': t('timeline.jump'),
                      onClick: (event) => { event.stopPropagation(); openSession(agent.childId); },
                    }, '💬')
                    : null,
                ]);
              }),
            ])),
            Array.isArray(run.logs) && run.logs.length > 0
              ? h('div', { className: 'awb-taskMeta', key: 'logs' },
                run.logs.slice(-3).map((line, index) => h('span', { key: index }, line)))
              : null,
          ])
          : null,
      ]);
    }

    function CompareTable(props) {
      const { left, right, t, onClose } = props;
      const summarize = (run) => {
        const agents = Array.isArray(run.agents) ? run.agents : [];
        return {
          agents: agents.length,
          done: agents.filter((agent) => agent.status === 'done').length,
          running: agents.filter((agent) => agent.status === 'running').length,
          failed: agents.filter((agent) => agent.status === 'failed').length,
          phases: new Set(agents.map((agent) => agent.phase || '')).size,
          duration: run.endedAt ? Math.max(0, run.endedAt - (run.startedAt || 0)) : 0,
        };
      };
      const leftSum = summarize(left);
      const rightSum = summarize(right);
      const row = (label, a, b, key) => h(React.Fragment, { key }, [
        h('span', { className: 'awb-compareMetric', key: 'metric' }, label),
        h('span', { className: 'awb-compareCell', key: 'a' }, a),
        h('span', { className: 'awb-compareCell', key: 'b' }, b),
      ]);
      return h('div', { className: 'awb-compare' }, [
        h('div', { className: 'awb-compareHead' }, [
          h('span', { className: 'awb-sectionTitle', key: 'title' }, t('compare.title')),
          h('button', {
            type: 'button', className: 'awb-miniBtn', key: 'close',
            onClick: onClose,
          }, t('compare.close')),
        ]),
        h('div', { className: 'awb-compareGrid' }, [
          h('span', { className: 'awb-compareMetric', key: 'h-metric' }, t('compare.metric')),
          h('span', { className: 'awb-compareCell awb-compareHeadCell', key: 'h-a' },
            `${t('compare.runA')} · ${left.name}`),
          h('span', { className: 'awb-compareCell awb-compareHeadCell', key: 'h-b' },
            `${t('compare.runB')} · ${right.name}`),
          row(t('compare.status'), stopLabel(left, t), stopLabel(right, t), 'status'),
          row(t('compare.agents'), String(leftSum.agents), String(rightSum.agents), 'agents'),
          row(t('status.done'), String(leftSum.done), String(rightSum.done), 'done'),
          row(t('status.running'), String(leftSum.running), String(rightSum.running), 'running'),
          row(t('status.failed'), String(leftSum.failed), String(rightSum.failed), 'failed'),
          row(t('compare.phases'), String(leftSum.phases), String(rightSum.phases), 'phases'),
          row(t('compare.duration'), formatDuration(leftSum.duration), formatDuration(rightSum.duration), 'duration'),
        ]),
      ]);
    }

    function TimelineView(props) {
      const { snapshot, openSession, t, now, runs, runOk } = props;
      const lineage = useMemo(() => buildLineage(snapshot), [snapshot]);
      const agentEvents = useMemo(() => collectActivity(lineage, 40).filter((event) => event.kind === 'agent'), [lineage]);
      const sessionById = (id) => lineage.byId[id];
      const totalRunAgents = runs.reduce((total, run) => total + (Array.isArray(run.agents) ? run.agents.length : 0), 0);
      const [compareIds, setCompareIds] = useState([]);
      const [compareEnabled, setCompareEnabled] = useState(false);
      const compareMode = compareEnabled;
      const toggleCompare = (id) => setCompareIds((current) => {
        if (current.includes(id)) return current.filter((value) => value !== id);
        return [...current.slice(-1), id];
      });
      const toggleCompareMode = () => {
        if (compareEnabled) setCompareIds([]);
        setCompareEnabled(!compareEnabled);
      };
      const compareRuns = compareIds
        .map((id) => runs.find((run) => run.id === id))
        .filter((run) => run !== undefined)
        .sort((left, right) => (left.startedAt || 0) - (right.startedAt || 0));
      const attemptsByName = new Map();
      for (const run of runs) attemptsByName.set(run.name, (attemptsByName.get(run.name) || 0) + 1);
      const attemptNumberOf = (run) => runs
        .filter((candidate) => candidate.name === run.name)
        .sort((left, right) => (left.startedAt || 0) - (right.startedAt || 0))
        .findIndex((candidate) => candidate.id === run.id) + 1;

      return h('div', { className: 'awb-view' }, [
        h('div', { className: 'awb-toolbar', key: 'toolbar' }, [
          h('span', { className: 'awb-toolbarTitle', key: 'title' }, t('timeline.title')),
          h('span', { className: 'awb-meta', key: 'meta' },
            `${t('timeline.runs', { count: runs.length })} · ${t('timeline.agents', { count: totalRunAgents })}${runOk ? '' : ` · ${t('timeline.offline')}`}`),
          runs.length > 1
            ? h('button', {
              type: 'button',
              className: `awb-btn${compareMode ? ' awb-btnActive' : ''}`,
              onClick: toggleCompareMode,
              title: t('compare.hint'),
              key: 'compareToggle',
            }, compareMode ? t('compare.clear') : t('compare.title'))
            : null,
        ]),
        h('div', { className: 'awb-scroll', key: 'scroll' }, [
          compareMode && compareRuns.length === 2
            ? h(CompareTable, {
              left: compareRuns[0], right: compareRuns[1], t,
              onClose: () => { setCompareIds([]); setCompareEnabled(false); },
              key: 'compare',
            })
            : null,
          compareMode && compareRuns.length < 2
            ? h('div', { className: 'awb-hint', key: 'compareHint' }, t('compare.hint'))
            : null,
          h('div', { className: 'awb-sectionTitle', key: 'runSection' }, [
            t('timeline.runSection'),
            h('span', { className: 'awb-count', key: 'count' }, String(runs.length)),
          ]),
          runs.length === 0
            ? h('div', { className: 'awb-hint', key: 'runEmpty' }, t('timeline.runEmpty'))
            : runs.slice().reverse().map((run) => h(RunCard, {
              key: run.id, run, t, openSession, sessionById, now,
              attempt: attemptNumberOf(run),
              attempts: attemptsByName.get(run.name) || 1,
              compareMode,
              compareSelected: compareIds.includes(run.id),
              onToggleCompare: toggleCompare,
            })),
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
        useSessions, useSessionStatus, sessionId, leadSessionId, openSession,
      } = props;
      const storeSnapshot = typeof useSessions === 'function' ? useSessions((state) => state) : EMPTY_SNAPSHOT;
      const statusMap = typeof useSessionStatus === 'function'
        ? useSessionStatus((state) => state)
        : EMPTY_STATUS_MAP;
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
              leadSessionId: lead, snapshot, statusMap, openSession, t, now,
              runs, runCount: runs.length, emptyHint, key: 'view',
            })
            : tab === 'graph'
              ? h(GraphView, {
                snapshot, statusMap, openSession, t, now, currentId, emptyHint, key: 'view',
              })
              : tab === 'timeline'
                ? h(TimelineView, { snapshot, openSession, t, now, runs, runOk, key: 'view' })
                : h(TeamView, { leadSessionId: lead, snapshot, openSession, t, now, key: 'view' }),
        ]),
      ]);
    }

    function MainPanel(props) {
      const { useSessions, useSessionStatus, openSession, t } = props;
      const [tab, setTab] = useState('overview');
      const now = useNow(15000);
      const { runs, ok } = useWorkflowRuns();
      return h(PanelBody, {
        tab, setTab, t, now, runs, runOk: ok,
        useSessions, useSessionStatus, openSession,
      });
    }

    function AsidePanel(props) {
      const { useSession, sessionId, useSessions, useSessionStatus, openSession, t } = props;
      const [tab, setTab] = useState('overview');
      const now = useNow(15000);
      const { runs, ok } = useWorkflowRuns();
      const parentSessionId = useSession((state) => (state ? state.subagent && state.subagent.address.parentSessionId : undefined));
      return h(PanelBody, {
        tab, setTab, t, now, runs, runOk: ok, useSessions, useSessionStatus, sessionId,
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
