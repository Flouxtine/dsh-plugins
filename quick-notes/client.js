window.__ModuleLoader__.load({
  id: '@local/quick-notes',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'quick-notes';
    const PANEL_ID = 'quick-notes';
    const STORAGE_KEY = 'dsh.local.quick-notes.tasks';
    const LEGACY_NOTE_KEY = 'dsh.local.quick-notes.text';
    const FILTERS = ['all', 'active', 'done'];

    const dictionaries = {
      en: {
        panel: 'To-Do',
        title: 'To-Do',
        description: 'A simple task list that stays in this browser.',
        addPlaceholder: 'Add a task…',
        add: 'Add',
        all: 'All',
        active: 'Active',
        done: 'Done',
        empty: 'No tasks yet',
        emptyActive: 'Nothing left to do',
        emptyDone: 'No completed tasks',
        clearDone: 'Clear completed',
        remaining: '{count} left',
        toggleTask: 'Toggle task',
        deleteTask: 'Delete task',
      },
      zh: {
        panel: '待办事项',
        title: '待办事项',
        description: '留在当前浏览器中的简单任务清单。',
        addPlaceholder: '添加一个任务…',
        add: '添加',
        all: '全部',
        active: '未完成',
        done: '已完成',
        empty: '还没有任务',
        emptyActive: '没有未完成的任务',
        emptyDone: '没有已完成的任务',
        clearDone: '清除已完成',
        remaining: '还剩 {count} 项',
        toggleTask: '切换任务状态',
        deleteTask: '删除任务',
      },
    };

    function createId() {
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function isTask(value) {
      return typeof value === 'object' && value !== null
        && typeof value.id === 'string' && typeof value.text === 'string' && typeof value.done === 'boolean';
    }

    /**
     * One-time import of the earlier Quick Notes text: every non-empty line becomes an
     * open task, so nothing typed into the old panel is lost.
     * @returns the migrated tasks, or an empty list when there was no note.
     */
    function migrateLegacyNote() {
      let note;
      try {
        note = window.localStorage.getItem(LEGACY_NOTE_KEY);
      } catch {
        return [];
      }
      if (typeof note !== 'string' || note.trim() === '') return [];
      try {
        window.localStorage.removeItem(LEGACY_NOTE_KEY);
      } catch {
        // When it cannot be removed it is simply read again on the next load.
      }
      const now = Date.now();
      return note.split('\n').map((line) => line.trim()).filter(Boolean).map((text, index) => ({
        id: `${createId()}${index}`,
        text,
        done: false,
        createdAt: now + index,
      }));
    }

    function loadTasks() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed.filter(isTask);
        }
      } catch {
        // Unreadable or malformed storage falls through to the legacy import.
      }
      return migrateLegacyNote();
    }

    function saveTasks(tasks) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      } catch {
        // Storage can be unavailable (private mode, quota); the list still works in memory.
      }
    }

    function TodoIcon({ size }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block' },
      }, [
        h('rect', { x: 1.8, y: 1.8, width: 3.4, height: 3.4, rx: 0.9, stroke: 'currentColor', strokeWidth: 1.1 }),
        h('path', { d: 'M2.7 3.5l0.7 0.7 1.2-1.3', stroke: 'currentColor', strokeWidth: 1, strokeLinecap: 'round', strokeLinejoin: 'round' }),
        h('path', { d: 'M6.8 3.5h7.4', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round' }),
        h('rect', { x: 1.8, y: 10.8, width: 3.4, height: 3.4, rx: 0.9, stroke: 'currentColor', strokeWidth: 1.1 }),
        h('path', { d: 'M6.8 12.5h7.4', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round' }),
      ]);
    }

    function TodoPanel({ t }) {
      const [tasks, setTasks] = React.useState(loadTasks);
      const [draft, setDraft] = React.useState('');
      const [filter, setFilter] = React.useState('all');

      React.useEffect(() => { saveTasks(tasks); }, [tasks]);

      const addTask = () => {
        const text = draft.trim();
        if (text === '') return;
        setTasks((current) => [...current, { id: createId(), text, done: false, createdAt: Date.now() }]);
        setDraft('');
      };
      const toggleTask = (id) => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
      const deleteTask = (id) => setTasks((current) => current.filter((task) => task.id !== id));
      const clearCompleted = () => setTasks((current) => current.filter((task) => !task.done));

      const remaining = tasks.reduce((count, task) => count + (task.done ? 0 : 1), 0);
      const completed = tasks.length - remaining;
      const visible = tasks.filter((task) => filter === 'all' ? true : filter === 'active' ? !task.done : task.done);

      return h('div', {
        style: {
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--dsw-alias-bg-base)',
          color: 'var(--dsw-alias-label-primary)',
        },
      }, [
        h('header', {
          style: { padding: '20px 24px 12px', borderBottom: '1px solid var(--dsw-alias-border-l1)' },
        }, [
          h('h1', { style: { margin: 0, fontSize: 18, fontWeight: 600, lineHeight: '26px' } }, t('title')),
          h('p', { style: { margin: '4px 0 0', fontSize: 13, lineHeight: '20px', color: 'var(--dsw-alias-label-secondary)' } }, t('description')),
        ]),
        h('div', { style: { display: 'flex', gap: 8, padding: '12px 24px 0' } }, [
          h('input', {
            type: 'text',
            value: draft,
            onChange: (event) => setDraft(event.target.value),
            onKeyDown: (event) => { if (event.key === 'Enter') addTask(); },
            placeholder: t('addPlaceholder'),
            'aria-label': t('addPlaceholder'),
            style: {
              flex: '1 1 auto',
              minWidth: 0,
              border: '1px solid var(--dsw-alias-border-l2)',
              borderRadius: 6,
              background: 'var(--dsw-alias-bg-layer-1)',
              color: 'inherit',
              font: 'inherit',
              fontSize: 14,
              lineHeight: '22px',
              padding: '6px 10px',
            },
          }),
          h('button', {
            type: 'button',
            onClick: addTask,
            disabled: draft.trim() === '',
            style: {
              border: '1px solid var(--dsw-alias-border-l2)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--dsw-alias-label-primary)',
              font: 'inherit',
              fontSize: 14,
              lineHeight: '22px',
              padding: '6px 14px',
              cursor: draft.trim() === '' ? 'default' : 'pointer',
              opacity: draft.trim() === '' ? 0.5 : 1,
            },
          }, t('add')),
        ]),
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 24px',
            borderBottom: '1px solid var(--dsw-alias-border-l1)',
          },
        }, [
          h('div', { style: { display: 'flex', gap: 4 } }, FILTERS.map((key) => h('button', {
            type: 'button',
            key,
            onClick: () => setFilter(key),
            'aria-pressed': filter === key,
            style: {
              border: 'none',
              borderRadius: 5,
              background: filter === key ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
              color: filter === key ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
              font: 'inherit',
              fontSize: 12,
              lineHeight: '18px',
              padding: '3px 8px',
              cursor: 'pointer',
            },
          }, t(key)))),
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12,
              lineHeight: '18px',
              color: 'var(--dsw-alias-label-secondary)',
            },
          }, [
            h('span', {}, t('remaining', { count: remaining })),
            h('button', {
              type: 'button',
              onClick: clearCompleted,
              disabled: completed === 0,
              style: {
                border: 'none',
                background: 'transparent',
                color: 'var(--dsw-alias-label-secondary)',
                font: 'inherit',
                fontSize: 12,
                lineHeight: '18px',
                padding: 0,
                cursor: completed === 0 ? 'default' : 'pointer',
                opacity: completed === 0 ? 0.5 : 1,
              },
            }, t('clearDone')),
          ]),
        ]),
        h('ul', {
          style: {
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            listStyle: 'none',
            margin: 0,
            padding: 0,
          },
        }, visible.length === 0
          ? h('li', {
              style: {
                padding: '32px 24px',
                textAlign: 'center',
                fontSize: 13,
                lineHeight: '20px',
                color: 'var(--dsw-alias-label-secondary)',
              },
            }, t(filter === 'done' ? 'emptyDone' : filter === 'active' ? 'emptyActive' : 'empty'))
          : visible.map((task) => h('li', {
              key: task.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 24px',
                borderBottom: '1px solid var(--dsw-alias-border-l1)',
              },
            }, [
              h('input', {
                type: 'checkbox',
                checked: task.done,
                onChange: () => toggleTask(task.id),
                'aria-label': t('toggleTask'),
                style: {
                  flex: 'none',
                  width: 15,
                  height: 15,
                  accentColor: 'var(--dsw-alias-brand-primary)',
                  cursor: 'pointer',
                },
              }),
              h('span', {
                style: {
                  flex: '1 1 auto',
                  minWidth: 0,
                  fontSize: 14,
                  lineHeight: '22px',
                  overflowWrap: 'anywhere',
                  color: task.done ? 'var(--dsw-alias-label-secondary)' : 'inherit',
                  textDecoration: task.done ? 'line-through' : 'none',
                },
              }, task.text),
              h('button', {
                type: 'button',
                onClick: () => deleteTask(task.id),
                'aria-label': t('deleteTask'),
                title: t('deleteTask'),
                style: {
                  flex: 'none',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--dsw-alias-label-secondary)',
                  font: 'inherit',
                  fontSize: 16,
                  lineHeight: '18px',
                  padding: '0 4px',
                  cursor: 'pointer',
                },
              }, '×'),
            ]))),
      ]);
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, dictionaries), 'quick-notes: dictionaries');
        const t = ctx.locale.bind(NS);
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, TodoPanel));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 20,
          locale: NS,
          label: () => t('panel'),
        }, TodoIcon));
      },
    };
  },
});
