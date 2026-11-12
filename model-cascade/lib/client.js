window.__ModuleLoader__.load({
  id: '@local/model-cascade',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useRef, useState } = React;

    const NS = 'model-cascade';
    const PANEL_ID = 'model-cascade';
    const API = '/api/model-cascade';
    const MAX_PROMPT_CHARS = 20000;

    const DEFAULT_SETTINGS = {
      enabled: true,
      decision: { provider: '', model: '' },
      complex: { provider: '', model: '' },
      simple: { provider: '', model: '' },
    };

    const CSS = `
.mc-root { flex: 1 1 auto; min-height: 0; display: flex; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-size: 14px; }
.mc-root *, .mc-root *::before, .mc-root *::after { box-sizing: border-box; }
.mc-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 18px 22px 28px; }
.mc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
.mc-title { margin: 0; font-size: 20px; font-weight: 650; line-height: 26px; letter-spacing: -0.015em; }
.mc-subtitle { margin: 3px 0 0; font-size: 12.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.mc-card { border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); padding: 14px 16px; margin-bottom: 12px; }
.mc-cardTitle { margin: 0 0 11px; font-size: 11.5px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dsw-alias-label-secondary); }
.mc-field { margin-bottom: 11px; }
.mc-field:last-of-type { margin-bottom: 0; }
.mc-label { display: block; font-size: 12.5px; line-height: 18px; margin-bottom: 5px; }
.mc-picker { display: flex; gap: 8px; }
.mc-picker .mc-select { flex: 1 1 0; min-width: 0; }
.mc-select, .mc-textarea { width: 100%; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; line-height: 20px; padding: 6px 9px; outline: none; }
.mc-select:focus-visible, .mc-textarea:focus-visible { border-color: var(--dsw-alias-brand-primary); }
.mc-select:disabled { opacity: 0.55; cursor: default; }
.mc-textarea { min-height: 74px; resize: vertical; margin-bottom: 10px; }
.mc-textarea::placeholder { color: var(--dsw-alias-label-secondary); }
.mc-runRow { display: flex; align-items: center; gap: 12px; }
.mc-button { border: none; border-radius: 9px; background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-base); font: inherit; font-size: 13.5px; font-weight: 550; line-height: 20px; padding: 8px 16px; cursor: pointer; }
.mc-button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.mc-button:disabled { opacity: 0.45; cursor: default; }
.mc-hint { margin: 9px 0 0; font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); }
.mc-runRow .mc-hint { margin: 0; }
.mc-error { margin: 0; font-size: 12.5px; line-height: 18px; color: var(--dsw-alias-state-error-primary); }
.mc-notice { margin: 0; font-size: 12.5px; line-height: 18px; color: var(--dsw-alias-state-success-primary); }
.mc-empty { padding: 20px 10px; text-align: center; font-size: 12.5px; line-height: 19px; color: var(--dsw-alias-label-secondary); }
.mc-loading { padding: 30px 12px; text-align: center; font-size: 12.5px; line-height: 19px; color: var(--dsw-alias-label-secondary); }
.mc-switch { position: relative; width: 40px; height: 22px; flex: none; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-2); cursor: pointer; padding: 0; }
.mc-switch:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.mc-switchKnob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--dsw-alias-label-secondary); transition: transform 0.15s ease, background 0.15s ease; }
.mc-switchOn { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.mc-switchOn .mc-switchKnob { transform: translateX(18px); background: var(--dsw-alias-bg-base); }
.mc-flow { display: flex; flex-direction: column; align-items: center; padding: 4px 0 2px; }
.mc-node { min-width: 168px; max-width: 100%; text-align: center; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); }
.mc-nodeTitle { font-size: 13px; font-weight: 600; line-height: 18px; }
.mc-nodeSub { margin-top: 2px; font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-connector { width: 2px; height: 16px; background: var(--dsw-alias-border-l2); }
.mc-branches { display: flex; gap: 26px; }
.mc-branch { display: flex; flex-direction: column; align-items: center; }
.mc-nodeActiveSimple { border-color: var(--dsw-alias-state-success-primary); background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 13%, transparent); }
.mc-nodeActiveComplex { border-color: var(--dsw-alias-brand-primary); background: color-mix(in srgb, var(--dsw-alias-brand-primary) 13%, transparent); }
.mc-resultHead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.mc-badge { display: inline-flex; align-items: center; border-radius: 999px; padding: 2px 9px; font-size: 11.5px; font-weight: 550; line-height: 17px; }
.mc-badgeSimple { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent); color: var(--dsw-alias-state-success-primary); }
.mc-badgeComplex { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 16%, transparent); color: var(--dsw-alias-brand-primary); }
.mc-badgeError { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 16%, transparent); color: var(--dsw-alias-state-error-primary); }
.mc-resultMeta { font-size: 11.5px; line-height: 17px; color: var(--dsw-alias-label-secondary); }
.mc-reason { margin: 10px 0 0; font-size: 12.5px; line-height: 19px; color: var(--dsw-alias-label-secondary); }
.mc-reasonLabel { color: var(--dsw-alias-label-primary); font-weight: 550; }
.mc-details { margin-top: 10px; }
.mc-detailsSummary { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); cursor: pointer; }
.mc-detailsSummary:hover { color: var(--dsw-alias-label-primary); }
.mc-answer { margin: 10px 0 0; padding: 10px 12px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2); font: inherit; font-size: 13px; line-height: 20px; white-space: pre-wrap; overflow-wrap: anywhere; max-height: 260px; overflow-y: auto; }
.mc-stats { display: flex; gap: 10px; flex-wrap: wrap; }
.mc-stat { flex: 1 1 96px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); padding: 9px 12px; }
.mc-statValue { font-size: 17px; font-weight: 650; line-height: 23px; }
.mc-statLabel { font-size: 11px; line-height: 15px; color: var(--dsw-alias-label-secondary); }
.mc-history { display: flex; flex-direction: column; gap: 4px; }
.mc-historyRow { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 8px; }
.mc-historyRow:hover { background: var(--dsw-alias-bg-layer-2); }
.mc-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.mc-dotSimple { background: var(--dsw-alias-state-success-primary); }
.mc-dotComplex { background: var(--dsw-alias-brand-primary); }
.mc-dotError { background: var(--dsw-alias-state-error-primary); }
.mc-historyPrompt { flex: 1 1 auto; min-width: 0; font-size: 12.5px; line-height: 18px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-historyTime { flex: none; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
`;

    const dictionaries = {
      en: {
        panel: 'Model Cascade',
        subtitle: 'A strong model decides the route, then a small or strong model executes the task.',
        toggleRouting: 'Enable routing',
        flowTitle: 'Cascade',
        router: 'Router',
        routerSub: 'reads the decision',
        decision: 'Decision model',
        complex: 'Complex model',
        simple: 'Simple model',
        model: 'model',
        unset: 'Not set',
        noProviders: 'No providers available',
        modelsTitle: 'Models',
        configureHint: 'The decision model classifies each task; the complex and simple models do the work.',
        runTitle: 'Run a task',
        promptPlaceholder: 'Describe the task…',
        run: 'Run cascade',
        running: 'Running…',
        runHint: '⌘/Ctrl + Enter to run',
        resultTitle: 'Result',
        routeSimple: 'simple',
        routeComplex: 'complex',
        routeError: 'error',
        reason: 'Reason',
        duration: 'Duration',
        usage: 'Tokens',
        decisionTokens: 'decision tokens',
        statsTitle: 'Stats',
        runs: 'Runs',
        simpleRuns: 'Routed simple',
        complexRuns: 'Routed complex',
        tokens: 'Execution tokens',
        historyTitle: 'History',
        emptyHistory: 'No runs yet. Run a task to see the cascade.',
        loading: 'Loading…',
        rawDecision: 'Raw decision',
        saved: 'Settings saved.',
        llmUnavailable: 'The LLM service is unavailable in this profile.',
        justNow: 'just now',
        minutesAgo: '{count} min ago',
        hoursAgo: '{count} h ago',
        daysAgo: '{count} d ago',
      },
      zh: {
        panel: '模型级联',
        subtitle: '强模型决定路线，再由小模型或强模型执行任务。',
        toggleRouting: '启用路由',
        flowTitle: '级联流程',
        router: '路由器',
        routerSub: '读取决策结果',
        decision: '决策模型',
        complex: '复杂模型',
        simple: '简单模型',
        model: '模型',
        unset: '未设置',
        noProviders: '没有可用提供商',
        modelsTitle: '模型',
        configureHint: '决策模型负责给任务分类，复杂模型与简单模型负责执行。',
        runTitle: '运行任务',
        promptPlaceholder: '描述任务…',
        run: '运行级联',
        running: '运行中…',
        runHint: '⌘/Ctrl + Enter 运行',
        resultTitle: '结果',
        routeSimple: '简单',
        routeComplex: '复杂',
        routeError: '错误',
        reason: '原因',
        duration: '耗时',
        usage: 'Token 数',
        decisionTokens: '决策 Token',
        statsTitle: '统计',
        runs: '运行次数',
        simpleRuns: '走简单路线',
        complexRuns: '走复杂路线',
        tokens: '执行 Token',
        historyTitle: '历史',
        emptyHistory: '还没有运行记录。运行一个任务即可看到级联效果。',
        loading: '加载中…',
        rawDecision: '原始决策',
        saved: '设置已保存。',
        llmUnavailable: '当前配置文件中没有可用的 LLM 服务。',
        justNow: '刚刚',
        minutesAgo: '{count} 分钟前',
        hoursAgo: '{count} 小时前',
        daysAgo: '{count} 天前',
      },
    };

    function errorMessage(error) {
      if (error instanceof Error && error.message !== '') return error.message;
      return String(error);
    }

    function totalTokens(usage) {
      if (usage === null || typeof usage !== 'object') return 0;
      if (Number.isFinite(usage.totalTokens)) return usage.totalTokens;
      const input = Number.isFinite(usage.inputTokens) ? usage.inputTokens : 0;
      const output = Number.isFinite(usage.outputTokens) ? usage.outputTokens : 0;
      return input + output;
    }

    function targetName(target, t) {
      if (target === null || typeof target !== 'object') return t('unset');
      const provider = typeof target.provider === 'string' ? target.provider : '';
      const model = typeof target.model === 'string' ? target.model : '';
      if (provider === '' || model === '') return t('unset');
      return `${provider}/${model}`;
    }

    /** A failed run never reaches an executor, so its route is unknown, not empty. */
    function executorLabel(run, t) {
      if (run.executorProvider === '' || run.executorModel === '') return t('unset');
      return `${run.executorProvider}/${run.executorModel}`;
    }

    function formatTime(timestamp, t) {
      const diff = Date.now() - timestamp;
      const minute = 60 * 1000;
      if (diff < minute) return t('justNow');
      if (diff < 60 * minute) return t('minutesAgo', { count: Math.floor(diff / minute) });
      if (diff < 24 * 60 * minute) return t('hoursAgo', { count: Math.floor(diff / (60 * minute)) });
      return t('daysAgo', { count: Math.floor(diff / (24 * 60 * minute)) });
    }

    function CascadeIcon({ size }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block' },
      }, [
        h('circle', { cx: 8, cy: 3.2, r: 1.8, stroke: 'currentColor', strokeWidth: 1.1 }),
        h('path', { d: 'M8 5v2', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round' }),
        h('path', { d: 'M8 7c0 2.2-2.6 2-2.6 4.2V12', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round' }),
        h('path', { d: 'M8 7c0 2.2 2.6 2 2.6 4.2V12', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round' }),
        h('circle', { cx: 5.4, cy: 13.2, r: 1.6, stroke: 'currentColor', strokeWidth: 1.1 }),
        h('circle', { cx: 10.6, cy: 13.2, r: 1.6, stroke: 'currentColor', strokeWidth: 1.1 }),
      ]);
    }

    function FlowDiagram({ t, route, settings }) {
      return h('div', { className: 'mc-flow', 'aria-hidden': true }, [
        h('div', { className: 'mc-node' }, [
          h('div', { className: 'mc-nodeTitle' }, t('decision')),
          h('div', { className: 'mc-nodeSub' }, targetName(settings.decision, t)),
        ]),
        h('div', { className: 'mc-connector' }),
        h('div', { className: 'mc-node' }, [
          h('div', { className: 'mc-nodeTitle' }, t('router')),
          h('div', { className: 'mc-nodeSub' }, t('routerSub')),
        ]),
        h('div', { className: 'mc-branches' }, [
          h('div', { className: 'mc-branch' }, [
            h('div', { className: 'mc-connector' }),
            h('div', { className: route === 'complex' ? 'mc-node mc-nodeActiveComplex' : 'mc-node' }, [
              h('div', { className: 'mc-nodeTitle' }, t('complex')),
              h('div', { className: 'mc-nodeSub' }, targetName(settings.complex, t)),
            ]),
          ]),
          h('div', { className: 'mc-branch' }, [
            h('div', { className: 'mc-connector' }),
            h('div', { className: route === 'simple' ? 'mc-node mc-nodeActiveSimple' : 'mc-node' }, [
              h('div', { className: 'mc-nodeTitle' }, t('simple')),
              h('div', { className: 'mc-nodeSub' }, targetName(settings.simple, t)),
            ]),
          ]),
        ]),
      ]);
    }

    function TargetPicker({ t, id, label, value, providers, models, onChange }) {
      const modelList = Array.isArray(models[value.provider]) ? models[value.provider] : [];
      const providerOptions = providers.length === 0
        ? [h('option', { value: '', key: 'empty' }, t('noProviders'))]
        : [
            h('option', { value: '', key: 'unset' }, t('unset')),
            ...providers.map((provider) => h('option', { value: provider.id, key: provider.id }, provider.name)),
          ];
      return h('div', { className: 'mc-field' }, [
        h('label', { className: 'mc-label', htmlFor: `mc-${id}-provider` }, label),
        h('div', { className: 'mc-picker' }, [
          h('select', {
            id: `mc-${id}-provider`,
            className: 'mc-select',
            value: value.provider,
            onChange: (event) => onChange({ provider: event.target.value, model: '' }),
          }, providerOptions),
          h('select', {
            className: 'mc-select',
            value: value.model,
            disabled: value.provider === '',
            onChange: (event) => onChange({ ...value, model: event.target.value }),
            'aria-label': `${label} ${t('model')}`,
          }, [
            h('option', { value: '', key: 'unset' }, t('unset')),
            ...modelList.map((model) => h('option', { value: model.id, key: model.id }, model.name)),
          ]),
        ]),
      ]);
    }

    function ResultCard({ t, run }) {
      const badgeClass = run.route === 'simple'
        ? 'mc-badge mc-badgeSimple'
        : run.route === 'complex'
        ? 'mc-badge mc-badgeComplex'
        : 'mc-badge mc-badgeError';
      const routeLabel = run.route === 'simple'
        ? t('routeSimple')
        : run.route === 'complex'
        ? t('routeComplex')
        : t('routeError');
      const tokens = totalTokens(run.usage);
      const decisionTokens = totalTokens(run.decisionUsage);
      return h('div', { className: 'mc-card', 'aria-live': 'polite' }, [
        h('h2', { className: 'mc-cardTitle' }, t('resultTitle')),
        h('div', { className: 'mc-resultHead' }, [
          h('span', { className: badgeClass }, routeLabel),
          h('span', { className: 'mc-resultMeta' }, executorLabel(run, t)),
          h('span', { className: 'mc-resultMeta' }, `${t('duration')}: ${(run.durationMs / 1000).toFixed(1)}s`),
        ]),
        run.reason === '' ? null : h('p', { className: 'mc-reason' }, [
          h('span', { className: 'mc-reasonLabel' }, `${t('reason')}: `),
          run.reason,
        ]),
        run.error === '' ? null : h('p', { className: 'mc-error' }, run.error),
        run.answer === '' ? null : h('pre', { className: 'mc-answer' }, run.answer),
        run.decisionText === '' ? null : h('details', { className: 'mc-details' }, [
          h('summary', { className: 'mc-detailsSummary' }, t('rawDecision')),
          h('pre', { className: 'mc-answer' }, run.decisionText),
        ]),
        h('p', { className: 'mc-hint' }, `${t('usage')}: ${tokens}${decisionTokens > 0 ? ` + ${decisionTokens} ${t('decisionTokens')}` : ''}`),
      ]);
    }

    function StatsRow({ t, stats }) {
      const cells = [
        ['runs', stats.runs, t('runs')],
        ['simple', stats.simple, t('simpleRuns')],
        ['complex', stats.complex, t('complexRuns')],
        ['tokens', stats.tokens, t('tokens')],
        ['decisionTokens', stats.decisionTokens, t('decisionTokens')],
      ];
      return h('div', { className: 'mc-stats' }, cells.map(([key, value, label]) => h('div', { className: 'mc-stat', key }, [
        h('div', { className: 'mc-statValue' }, String(value)),
        h('div', { className: 'mc-statLabel' }, label),
      ])));
    }

    function HistoryList({ t, runs }) {
      return h('div', { className: 'mc-history' }, runs.map((run) => h('div', {
        className: 'mc-historyRow',
        key: run.id,
        title: run.prompt,
      }, [
        h('span', {
          className: run.route === 'simple'
            ? 'mc-dot mc-dotSimple'
            : run.route === 'complex'
            ? 'mc-dot mc-dotComplex'
            : 'mc-dot mc-dotError',
          'aria-hidden': true,
        }),
        h('span', { className: 'mc-historyPrompt' }, run.prompt),
        h('span', { className: 'mc-historyTime' }, formatTime(run.createdAt, t)),
      ])));
    }

    function CascadePanel({ t }) {
      const [state, setState] = useState({
        loading: true,
        settings: DEFAULT_SETTINGS,
        providers: [],
        models: {},
        history: [],
        stats: null,
        llmAvailable: true,
        error: '',
      });
      const [draft, setDraft] = useState('');
      const [running, setRunning] = useState(false);
      const [notice, setNotice] = useState('');
      const [last, setLast] = useState(null);
      const settingsRef = useRef(state.settings);
      const runAbortRef = useRef(null);

      // Leaving the panel must not leave a paid model call running.
      useEffect(() => () => {
        if (runAbortRef.current !== null) runAbortRef.current.abort();
      }, []);

      const reload = async () => {
        try {
          const response = await fetch(`${API}/state`, { cache: 'no-store' });
          const data = await response.json();
          const nextSettings = data.settings !== null && typeof data.settings === 'object' ? data.settings : DEFAULT_SETTINGS;
          settingsRef.current = nextSettings;
          setState({
            loading: false,
            settings: nextSettings,
            providers: Array.isArray(data.providers) ? data.providers : [],
            models: data.models !== null && typeof data.models === 'object' ? data.models : {},
            history: Array.isArray(data.history) ? data.history : [],
            stats: data.stats !== null && typeof data.stats === 'object' ? data.stats : null,
            llmAvailable: data.llmAvailable !== false,
            error: '',
          });
        } catch (error) {
          setState((current) => ({ ...current, loading: false, error: errorMessage(error) }));
        }
      };

      useEffect(() => { void reload(); }, []);

      const save = async (next) => {
        setNotice('');
        try {
          const response = await fetch(`${API}/settings`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(next),
          });
          const data = await response.json();
          if (data.ok === true) {
            settingsRef.current = data.settings;
            setState((current) => ({ ...current, settings: data.settings, error: '' }));
            setNotice(t('saved'));
          } else {
            setState((current) => ({ ...current, error: data.error !== undefined ? String(data.error) : 'save-failed' }));
          }
        } catch (error) {
          setState((current) => ({ ...current, error: errorMessage(error) }));
        }
      };

      /**
       * Compose every change through a ref, so two quick edits cannot each post
       * a stale whole-settings object and let the later response win.
       */
      const updateSettings = (patch) => {
        const next = { ...settingsRef.current, ...patch };
        settingsRef.current = next;
        setState((current) => ({ ...current, settings: next }));
        void save(next);
      };

      const run = async () => {
        const prompt = draft.trim();
        if (prompt === '' || running) return;
        setRunning(true);
        setNotice('');
        const controller = new AbortController();
        runAbortRef.current = controller;
        try {
          const response = await fetch(`${API}/run`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ prompt }),
            signal: controller.signal,
          });
          const data = await response.json();
          if (data.ok === true) {
            setLast(data.run);
            setState((current) => ({ ...current, error: '', stats: data.stats !== undefined ? data.stats : current.stats }));
            await reload();
          } else {
            setState((current) => ({ ...current, error: data.error !== undefined ? String(data.error) : 'run-failed' }));
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
          setState((current) => ({ ...current, error: errorMessage(error) }));
        } finally {
          if (runAbortRef.current === controller) runAbortRef.current = null;
          setRunning(false);
        }
      };

      const settings = state.settings;
      const route = last === null ? null : last.route;
      return h('div', { className: 'mc-root' }, [
        h('style', {}, CSS),
        h('div', { className: 'mc-scroll' }, [
          state.loading ? h('div', { className: 'mc-card' }, h('p', { className: 'mc-loading' }, t('loading'))) : null,
          h('div', { className: 'mc-header' }, [
            h('div', null, [
              h('h1', { className: 'mc-title' }, t('panel')),
              h('p', { className: 'mc-subtitle' }, t('subtitle')),
            ]),
            h('button', {
              type: 'button',
              role: 'switch',
              'aria-checked': settings.enabled === true,
              className: settings.enabled === true ? 'mc-switch mc-switchOn' : 'mc-switch',
              onClick: () => updateSettings({ enabled: settings.enabled !== true }),
              title: t('toggleRouting'),
            }, h('span', { className: 'mc-switchKnob' })),
          ]),
          h('div', { className: 'mc-card' }, [
            h('h2', { className: 'mc-cardTitle' }, t('flowTitle')),
            h(FlowDiagram, { t, route, settings }),
          ]),
          h('div', { className: 'mc-card' }, [
            h('h2', { className: 'mc-cardTitle' }, t('modelsTitle')),
            h(TargetPicker, {
              t, id: 'decision', label: t('decision'), value: settings.decision, providers: state.providers, models: state.models,
              onChange: (value) => updateSettings({ decision: value }),
            }),
            h(TargetPicker, {
              t, id: 'complex', label: t('complex'), value: settings.complex, providers: state.providers, models: state.models,
              onChange: (value) => updateSettings({ complex: value }),
            }),
            h(TargetPicker, {
              t, id: 'simple', label: t('simple'), value: settings.simple, providers: state.providers, models: state.models,
              onChange: (value) => updateSettings({ simple: value }),
            }),
            state.llmAvailable ? null : h('p', { className: 'mc-error' }, t('llmUnavailable')),
            h('p', { className: 'mc-hint' }, t('configureHint')),
          ]),
          h('div', { className: 'mc-card' }, [
            h('h2', { className: 'mc-cardTitle' }, t('runTitle')),
            h('textarea', {
              className: 'mc-textarea',
              value: draft,
              placeholder: t('promptPlaceholder'),
              maxLength: MAX_PROMPT_CHARS,
              onChange: (event) => setDraft(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) run();
              },
              'aria-label': t('runTitle'),
            }),
            h('div', { className: 'mc-runRow' }, [
              h('button', {
                type: 'button',
                className: 'mc-button',
                onClick: run,
                disabled: running || draft.trim() === '',
              }, running ? t('running') : t('run')),
              h('span', { className: 'mc-hint' }, t('runHint')),
            ]),
          ]),
          state.error === '' ? null : h('div', { className: 'mc-card', role: 'alert' }, h('p', { className: 'mc-error' }, state.error)),
          notice === '' ? null : h('div', { className: 'mc-card' }, h('p', { className: 'mc-notice' }, notice)),
          last === null ? null : h(ResultCard, { t, run: last }),
          state.stats === null ? null : h('div', { className: 'mc-card' }, [
            h('h2', { className: 'mc-cardTitle' }, t('statsTitle')),
            h(StatsRow, { t, stats: state.stats }),
          ]),
          h('div', { className: 'mc-card' }, [
            h('h2', { className: 'mc-cardTitle' }, t('historyTitle')),
            state.history.length === 0
              ? h('p', { className: 'mc-empty' }, t('emptyHistory'))
              : h(HistoryList, { t, runs: state.history }),
          ]),
        ]),
      ]);
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dictionaries), 'model-cascade: dictionaries');
        const t = ctx.locale.bind(NS);
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, CascadePanel));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 32,
          locale: NS,
          label: () => t('panel'),
        }, CascadeIcon));
      },
    };
  },
});
