window.__ModuleLoader__.load({
  id: '@local/quick-notes',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'quick-notes';
    const PANEL_ID = 'quick-notes';
    const STORAGE_KEY = 'dsh.local.quick-notes.tasks';
    const LEGACY_NOTE_KEY = 'dsh.local.quick-notes.text';

    const VIEWS = ['all', 'today', 'upcoming', 'important', 'completed'];
    const PRIORITY_KEYS = ['priority0', 'priority1', 'priority2', 'priority3', 'priority4'];
    const PRIORITY_COLORS = [
      'var(--dsw-alias-label-secondary)',
      'var(--dsw-alias-state-idle-primary)',
      'var(--dsw-alias-brand-primary)',
      'var(--dsw-alias-state-warn-primary)',
      'var(--dsw-alias-state-error-primary)',
    ];
    const DUE_QUICK = ['today', 'tomorrow', 'nextweek'];
    const WEEKDAYS = {
      '!monday': 1, '!tuesday': 2, '!wednesday': 3, '!thursday': 4, '!friday': 5, '!saturday': 6, '!sunday': 0,
      '!周一': 1, '!周二': 2, '!周三': 3, '!周四': 4, '!周五': 5, '!周六': 6, '!周日': 0, '!星期天': 0,
    };
    const EMPTY_KEYS = {
      all: ['emptyAllTitle', 'emptyAllText'],
      today: ['emptyTodayTitle', 'emptyTodayText'],
      upcoming: ['emptyUpcomingTitle', 'emptyUpcomingText'],
      important: ['emptyImportantTitle', 'emptyImportantText'],
      completed: ['emptyCompletedTitle', 'emptyCompletedText'],
    };

    const CSS = `
.todo-root { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-size: 14px; }
.todo-root *, .todo-root *::before, .todo-root *::after { box-sizing: border-box; }
.todo-header { padding: 20px 24px 10px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.todo-titleRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.todo-title { margin: 0; font-size: 20px; font-weight: 600; line-height: 28px; letter-spacing: -0.01em; }
.todo-subtitle { margin: 3px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.todo-progress { display: flex; align-items: center; gap: 8px; flex: none; }
.todo-progressText { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.todo-views { display: flex; gap: 4px; padding: 10px 24px 6px; overflow-x: auto; scrollbar-width: none; }
.todo-views::-webkit-scrollbar { display: none; }
.todo-view { display: inline-flex; align-items: center; gap: 5px; border: none; border-radius: 999px; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 18px; padding: 4px 10px; cursor: pointer; white-space: nowrap; }
.todo-view:hover { background: var(--dsw-alias-bg-layer-2); }
.todo-viewActive { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); font-weight: 500; }
.todo-viewCount { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.todo-add { padding: 6px 24px 8px; }
.todo-addRow { display: flex; align-items: center; gap: 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 10px; background: var(--dsw-alias-bg-layer-1); padding: 3px 3px 3px 12px; }
.todo-addRow:focus-within { border-color: var(--dsw-alias-brand-primary); }
.todo-addInput { flex: 1 1 auto; min-width: 0; border: none; background: transparent; color: inherit; font: inherit; font-size: 14px; line-height: 32px; outline: none; }
.todo-addInput::placeholder { color: var(--dsw-alias-label-secondary); }
.todo-addButton { border: none; border-radius: 8px; background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-base); font: inherit; font-size: 13px; line-height: 20px; padding: 6px 14px; cursor: pointer; }
.todo-addButton:disabled { opacity: 0.45; cursor: default; }
.todo-hint { margin: 6px 0 0; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.todo-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
.todo-task { display: flex; align-items: flex-start; gap: 10px; padding: 7px 24px; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.todo-task:hover { background: var(--dsw-alias-bg-layer-1); }
.todo-check { flex: none; width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--dsw-alias-border-l2); background: transparent; display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; margin-top: 1px; transition: background 0.15s ease, border-color 0.15s ease; }
.todo-check:hover { border-color: var(--dsw-alias-brand-primary); }
.todo-checkDone { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-base); }
.todo-checkDone svg { animation: todo-pop 0.18s ease-out; }
@keyframes todo-pop { 0% { transform: scale(0.5); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
.todo-body { flex: 1 1 auto; min-width: 0; }
.todo-text { font-size: 14px; line-height: 22px; overflow-wrap: anywhere; white-space: pre-wrap; }
.todo-textDone { color: var(--dsw-alias-label-secondary); text-decoration: line-through; }
.todo-edit { width: 100%; border: 1px solid var(--dsw-alias-brand-primary); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit; font-size: 14px; line-height: 22px; padding: 2px 6px; outline: none; }
.todo-meta { display: flex; align-items: center; gap: 8px; margin-top: 2px; flex-wrap: wrap; }
.todo-subProgress { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.todo-subs { margin-top: 2px; }
.todo-sub { display: flex; align-items: center; gap: 8px; padding: 2px 0; }
.todo-subCheck { flex: none; width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid var(--dsw-alias-border-l2); background: transparent; display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; }
.todo-subCheck:hover { border-color: var(--dsw-alias-brand-primary); }
.todo-subCheckDone { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-bg-base); }
.todo-subText { flex: 1 1 auto; min-width: 0; font-size: 13px; line-height: 20px; overflow-wrap: anywhere; }
.todo-subTextDone { color: var(--dsw-alias-label-secondary); text-decoration: line-through; }
.todo-subDelete { flex: none; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 14px; line-height: 16px; padding: 0 2px; cursor: pointer; opacity: 0; }
.todo-task:hover .todo-subDelete { opacity: 1; }
.todo-subAdd { display: flex; align-items: center; gap: 8px; padding: 3px 0 3px 23px; }
.todo-subInput { flex: 1 1 auto; min-width: 0; border: none; background: transparent; color: inherit; font: inherit; font-size: 13px; line-height: 20px; outline: none; }
.todo-subInput::placeholder { color: var(--dsw-alias-label-secondary); }
.todo-actions { display: flex; align-items: center; gap: 2px; flex: none; margin-top: 1px; }
.todo-iconButton { display: inline-flex; align-items: center; justify-content: center; gap: 4px; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 18px; padding: 3px 6px; border-radius: 6px; cursor: pointer; }
.todo-iconButton:hover { background: var(--dsw-alias-bg-layer-2); }
.todo-dueToday { color: var(--dsw-alias-brand-primary); }
.todo-dueOverdue { color: var(--dsw-alias-state-error-primary); }
.todo-delete { opacity: 0; }
.todo-task:hover .todo-delete { opacity: 1; }
.todo-empty { padding: 48px 24px; text-align: center; }
.todo-emptyTitle { font-size: 14px; line-height: 22px; color: var(--dsw-alias-label-primary); margin-bottom: 4px; }
.todo-emptyText { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.todo-popover { position: fixed; z-index: 1000; background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 6px; }
.todo-popoverRow { display: flex; align-items: center; gap: 8px; width: 100%; border: none; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; line-height: 20px; padding: 6px 8px; border-radius: 6px; cursor: pointer; text-align: left; }
.todo-popoverRow:hover { background: var(--dsw-alias-bg-layer-2); }
.todo-popoverLabel { padding: 4px 8px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.todo-popoverDivider { height: 1px; background: var(--dsw-alias-border-l1); margin: 4px 0; }
.todo-dateInput { width: 100%; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit; font-size: 13px; line-height: 20px; padding: 5px 8px; margin: 4px 0; outline: none; }
.todo-clear { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 24px; border-bottom: 1px solid var(--dsw-alias-border-l1); font-size: 12px; color: var(--dsw-alias-label-secondary); }
.todo-clearButton { border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; line-height: 18px; cursor: pointer; padding: 2px 6px; border-radius: 5px; }
.todo-clearButton:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
`;

    const dictionaries = {
      en: {
        panel: 'To-Do',
        title: 'To-Do',
        description: 'Priorities, due dates, subtasks and smart views — saved in this browser.',
        addPlaceholder: 'Add a task…',
        add: 'Add',
        quickAddHint: 'Quick add: !p1–!p4 priority, !today / !tomorrow / !nextweek / !monday due date',
        all: 'All',
        today: 'Today',
        upcoming: 'Upcoming',
        important: 'Important',
        completed: 'Completed',
        priorityLabel: 'Priority',
        priority0: 'None',
        priority1: 'Low',
        priority2: 'Medium',
        priority3: 'High',
        priority4: 'Urgent',
        priorityTip: 'Priority — click to change',
        dueLabel: 'Due date',
        dueToday: 'Today',
        dueTomorrow: 'Tomorrow',
        dueNextWeek: 'Next week',
        dueClear: 'Clear date',
        dueSet: 'Set due date',
        subtaskProgress: '{done}/{total} subtasks',
        addSubtask: 'Add a subtask…',
        editHint: 'Double-click to edit',
        editPlaceholder: 'Task text',
        markDone: 'Mark as done',
        markOpen: 'Mark as open',
        deleteTask: 'Delete task',
        progressText: '{done}/{total} done',
        clearCompleted: 'Clear completed',
        completedCount: '{count} completed',
        emptyAllTitle: 'No tasks yet',
        emptyAllText: 'Add your first task above.',
        emptyTodayTitle: 'Nothing due today',
        emptyTodayText: 'Enjoy the calm, or plan ahead.',
        emptyUpcomingTitle: 'Nothing scheduled',
        emptyUpcomingText: 'Add a due date to see what is coming.',
        emptyImportantTitle: 'No important tasks',
        emptyImportantText: 'Mark a task High or Urgent to keep it here.',
        emptyCompletedTitle: 'Nothing completed yet',
        emptyCompletedText: 'Finished tasks will gather here.',
      },
      zh: {
        panel: '待办事项',
        title: '待办事项',
        description: '优先级、截止日期、子任务与智能视图 —— 保存在当前浏览器。',
        addPlaceholder: '添加一个任务…',
        add: '添加',
        quickAddHint: '快速添加：!p1–!p4 优先级，!今天 / !明天 / !下周 / !周一 截止日期',
        all: '全部',
        today: '今天',
        upcoming: '即将到来',
        important: '重要',
        completed: '已完成',
        priorityLabel: '优先级',
        priority0: '无',
        priority1: '低',
        priority2: '中',
        priority3: '高',
        priority4: '紧急',
        priorityTip: '优先级 —— 点击切换',
        dueLabel: '截止日期',
        dueToday: '今天',
        dueTomorrow: '明天',
        dueNextWeek: '下周',
        dueClear: '清除日期',
        dueSet: '设置截止日期',
        subtaskProgress: '{done}/{total} 子任务',
        addSubtask: '添加子任务…',
        editHint: '双击编辑',
        editPlaceholder: '任务内容',
        markDone: '标记为完成',
        markOpen: '标记为未完成',
        deleteTask: '删除任务',
        progressText: '已完成 {done}/{total}',
        clearCompleted: '清除已完成',
        completedCount: '已完成 {count} 项',
        emptyAllTitle: '还没有任务',
        emptyAllText: '在上方添加你的第一个任务。',
        emptyTodayTitle: '今天没有到期任务',
        emptyTodayText: '享受这份清闲，或提前规划。',
        emptyUpcomingTitle: '还没有安排',
        emptyUpcomingText: '给任务加上截止日期，就能看到接下来的安排。',
        emptyImportantTitle: '没有重要任务',
        emptyImportantText: '把任务标为「高」或「紧急」就会出现在这里。',
        emptyCompletedTitle: '还没有已完成的事',
        emptyCompletedText: '完成的任务会汇总在这里。',
      },
    };

    function createId() {
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function isTask(value) {
      return typeof value === 'object' && value !== null
        && typeof value.id === 'string' && typeof value.text === 'string' && typeof value.done === 'boolean'
        && typeof value.priority === 'number' && (value.due === null || typeof value.due === 'string')
        && Array.isArray(value.subtasks);
    }

    /** Local calendar date as `YYYY-MM-DD`, the form a date input and the store use. */
    function toISO(date) {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${date.getFullYear()}-${month}-${day}`;
    }

    function todayISO() {
      return toISO(new Date());
    }

    function addDays(iso, amount) {
      const date = new Date(`${iso}T00:00:00`);
      date.setDate(date.getDate() + amount);
      return toISO(date);
    }

    /** The next occurrence of a weekday index (0 = Sunday), today when it already is that day. */
    function nextWeekday(target) {
      const date = new Date();
      const delta = (target - date.getDay() + 7) % 7;
      date.setDate(date.getDate() + delta);
      return toISO(date);
    }

    function quickDate(key) {
      if (key === 'today') return todayISO();
      if (key === 'tomorrow') return addDays(todayISO(), 1);
      if (key === 'nextweek') return addDays(todayISO(), 7);
      return null;
    }

    /**
     * Split a quick-add draft into text, priority and due date. `!p1`–`!p4` set the
     * priority; `!today`/`!tomorrow`/`!nextweek` and weekday names set the date.
     * @param raw - the text typed into the add field.
     * @returns the parsed task fields.
     */
    function parseDraft(raw) {
      const result = { text: raw, priority: 0, due: null };
      const kept = [];
      for (const word of raw.split(/\s+/)) {
        const lower = word.toLowerCase();
        if (/^!p[1-4]$/.test(lower)) {
          result.priority = Number(lower.slice(2));
          continue;
        }
        if (lower === '!today' || lower === '!今天') {
          result.due = todayISO();
          continue;
        }
        if (lower === '!tomorrow' || lower === '!明天') {
          result.due = addDays(todayISO(), 1);
          continue;
        }
        if (lower === '!nextweek' || lower === '!下周') {
          result.due = addDays(todayISO(), 7);
          continue;
        }
        const weekday = WEEKDAYS[lower];
        if (weekday !== undefined) {
          result.due = nextWeekday(weekday);
          continue;
        }
        kept.push(word);
      }
      result.text = kept.join(' ').trim();
      return result;
    }

    /** The earlier Quick Notes text, imported once: every non-empty line becomes an open task. */
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
        priority: 0,
        due: null,
        subtasks: [],
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

    function CheckIcon({ size = 12, color = 'currentColor' }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M3 8.5l3.2 3L13 4.5', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function FlagIcon({ color }) {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M4 1.5v13', stroke: color, strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('path', { d: 'M4 2h8l-2.2 2.75L12 7.5H4z', fill: color }));
    }

    function CalendarIcon() {
      return h('svg', { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('rect', { x: 2, y: 3, width: 12, height: 11, rx: 2, stroke: 'currentColor', strokeWidth: 1.2 }),
        h('path', { d: 'M2 6.5h12', stroke: 'currentColor', strokeWidth: 1.2 }),
        h('path', { d: 'M5 1.5v3M11 1.5v3', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }));
    }

    function PlusIcon() {
      return h('svg', { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M8 3v10M3 8h10', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }));
    }

    function TrashIcon() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 9h5.6l.7-9', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function ProgressRing({ value }) {
      const radius = 9;
      const circumference = 2 * Math.PI * radius;
      const clamped = Math.max(0, Math.min(1, value));
      return h('svg', { width: 28, height: 28, viewBox: '0 0 28 28', 'aria-hidden': true },
        h('circle', { cx: 14, cy: 14, r: radius, fill: 'none', stroke: 'var(--dsw-alias-bg-layer-2)', strokeWidth: 3 }),
        h('circle', {
          cx: 14, cy: 14, r: radius, fill: 'none', stroke: 'var(--dsw-alias-brand-primary)', strokeWidth: 3,
          strokeLinecap: 'round', strokeDasharray: `${circumference * clamped} ${circumference}`,
          transform: 'rotate(-90 14 14)',
        }));
    }

    /** A small fixed card anchored under the control that opened it. */
    function Popover({ anchor, width = 200, onClose, children }) {
      const ref = React.useRef(null);
      const [style, setStyle] = React.useState(null);
      React.useEffect(() => {
        if (anchor === null) return;
        const rect = anchor.getBoundingClientRect();
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
        setStyle({ position: 'fixed', top: rect.bottom + 6, left, width, zIndex: 1000 });
        const onPointerDown = (event) => {
          if (ref.current !== null && ref.current.contains(event.target)) return;
          if (anchor.contains(event.target)) return;
          onClose();
        };
        const onScroll = () => onClose();
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('scroll', onScroll, true);
        return () => {
          document.removeEventListener('pointerdown', onPointerDown);
          document.removeEventListener('scroll', onScroll, true);
        };
      }, [anchor, width, onClose]);
      if (anchor === null || style === null) return null;
      return h('div', {
        ref,
        className: 'todo-popover',
        style,
      }, children);
    }

    function TaskRow(props) {
      const { t, task, today } = props;
      const [subDraft, setSubDraft] = React.useState('');
      const subDone = task.subtasks.filter((sub) => sub.done).length;
      const dueState = task.due === null ? 'none'
        : task.due === today ? 'today'
        : task.due === addDays(today, 1) ? 'tomorrow'
        : task.due < today ? 'overdue' : 'future';
      const dueLabel = task.due === null ? null
        : dueState === 'today' ? t('dueToday')
        : dueState === 'tomorrow' ? t('dueTomorrow')
        : `${Number(task.due.slice(5, 7))}/${Number(task.due.slice(8, 10))}`;
      const dueClass = dueState === 'today' ? 'todo-iconButton todo-dueToday'
        : dueState === 'overdue' ? 'todo-iconButton todo-dueOverdue' : 'todo-iconButton';
      const submitSubtask = () => {
        const text = subDraft.trim();
        if (text === '') return;
        props.onAddSubtask(text);
        setSubDraft('');
      };
      return h('div', { className: 'todo-task' }, [
        h('button', {
          type: 'button',
          className: task.done ? 'todo-check todo-checkDone' : 'todo-check',
          onClick: props.onToggle,
          'aria-label': task.done ? t('markOpen') : t('markDone'),
          'aria-pressed': task.done,
        }, task.done ? h(CheckIcon, { size: 12 }) : null),
        h('div', { className: 'todo-body' }, [
          props.editing
            ? h('input', {
                className: 'todo-edit',
                value: props.editText,
                placeholder: t('editPlaceholder'),
                autoFocus: true,
                onChange: (event) => props.onChangeEdit(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter') props.onSaveEdit();
                  else if (event.key === 'Escape') props.onCancelEdit();
                },
                onBlur: props.onSaveEdit,
                'aria-label': t('editPlaceholder'),
              })
            : h('div', {
                className: task.done ? 'todo-text todo-textDone' : 'todo-text',
                onDoubleClick: props.onStartEdit,
                title: t('editHint'),
              }, task.text),
          task.subtasks.length === 0 ? null : h('div', { className: 'todo-meta' },
            h('span', { className: 'todo-subProgress' }, t('subtaskProgress', { done: subDone, total: task.subtasks.length }))),
          h('div', { className: 'todo-subs' }, task.subtasks.map((sub) => h('div', { key: sub.id, className: 'todo-sub' }, [
            h('button', {
              type: 'button',
              className: sub.done ? 'todo-subCheck todo-subCheckDone' : 'todo-subCheck',
              onClick: () => props.onToggleSubtask(sub.id),
              'aria-label': sub.done ? t('markOpen') : t('markDone'),
              'aria-pressed': sub.done,
            }, sub.done ? h(CheckIcon, { size: 9 }) : null),
            h('span', { className: sub.done ? 'todo-subText todo-subTextDone' : 'todo-subText' }, sub.text),
            h('button', {
              type: 'button',
              className: 'todo-subDelete',
              onClick: () => props.onDeleteSubtask(sub.id),
              'aria-label': t('deleteTask'),
            }, '×'),
          ]))),
          h('div', { className: 'todo-subAdd' }, [
            h(PlusIcon),
            h('input', {
              className: 'todo-subInput',
              value: subDraft,
              placeholder: t('addSubtask'),
              onChange: (event) => setSubDraft(event.target.value),
              onKeyDown: (event) => { if (event.key === 'Enter') submitSubtask(); },
              'aria-label': t('addSubtask'),
            }),
          ]),
        ]),
        h('div', { className: 'todo-actions' }, [
          h('button', {
            type: 'button',
            className: 'todo-iconButton',
            onClick: props.onOpenPriority,
            title: `${t('priorityLabel')}: ${t(PRIORITY_KEYS[task.priority])}`,
            'aria-label': `${t('priorityLabel')}: ${t(PRIORITY_KEYS[task.priority])}`,
          }, h(FlagIcon, { color: PRIORITY_COLORS[task.priority] })),
          h('button', {
            type: 'button',
            className: dueClass,
            onClick: props.onOpenDue,
            title: task.due === null ? t('dueSet') : t('dueLabel'),
            'aria-label': task.due === null ? t('dueSet') : `${t('dueLabel')}: ${dueLabel}`,
          }, [h(CalendarIcon), dueLabel === null ? null : h('span', {}, dueLabel)]),
          h('button', {
            type: 'button',
            className: 'todo-iconButton todo-delete',
            onClick: props.onDelete,
            'aria-label': t('deleteTask'),
            title: t('deleteTask'),
          }, h(TrashIcon)),
        ]),
      ]);
    }

    function TodoPanel({ t }) {
      const [tasks, setTasks] = React.useState(loadTasks);
      const [view, setView] = React.useState('all');
      const [draft, setDraft] = React.useState('');
      const [editingId, setEditingId] = React.useState(null);
      const [editText, setEditText] = React.useState('');
      const [popover, setPopover] = React.useState(null);
      const cancelEditRef = React.useRef(false);

      React.useEffect(() => { saveTasks(tasks); }, [tasks]);

      const today = todayISO();

      const addTask = () => {
        const parsed = parseDraft(draft);
        if (parsed.text === '') return;
        setTasks((current) => [...current, {
          id: createId(), text: parsed.text, done: false, priority: parsed.priority,
          due: parsed.due, subtasks: [], createdAt: Date.now(),
        }]);
        setDraft('');
      };

      const toggleTask = (id) => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
      const deleteTask = (id) => setTasks((current) => current.filter((task) => task.id !== id));
      const setPriority = (id, priority) => setTasks((current) => current.map((task) => task.id === id ? { ...task, priority } : task));
      const setDue = (id, due) => setTasks((current) => current.map((task) => task.id === id ? { ...task, due } : task));
      const toggleSubtask = (id, subId) => setTasks((current) => current.map((task) => task.id === id
        ? { ...task, subtasks: task.subtasks.map((sub) => sub.id === subId ? { ...sub, done: !sub.done } : sub) }
        : task));
      const addSubtask = (id, text) => setTasks((current) => current.map((task) => task.id === id
        ? { ...task, subtasks: [...task.subtasks, { id: createId(), text, done: false }] }
        : task));
      const deleteSubtask = (id, subId) => setTasks((current) => current.map((task) => task.id === id
        ? { ...task, subtasks: task.subtasks.filter((sub) => sub.id !== subId) }
        : task));
      const clearCompleted = () => setTasks((current) => current.filter((task) => !task.done));

      const startEdit = (task) => {
        cancelEditRef.current = false;
        setEditingId(task.id);
        setEditText(task.text);
      };
      const saveEdit = (id) => {
        if (cancelEditRef.current) {
          cancelEditRef.current = false;
          return;
        }
        const text = editText.trim();
        setTasks((current) => current.map((task) => task.id === id && text !== '' ? { ...task, text } : task));
        setEditingId(null);
      };
      const cancelEdit = () => {
        cancelEditRef.current = true;
        setEditingId(null);
      };

      const togglePopover = (kind, taskId) => (event) => {
        const anchor = event.currentTarget;
        setPopover((current) => current !== null && current.kind === kind && current.taskId === taskId
          ? null
          : { kind, taskId, anchor });
      };
      const closePopover = React.useCallback(() => setPopover(null), []);

      const counts = {
        all: tasks.filter((task) => !task.done).length,
        today: tasks.filter((task) => !task.done && task.due !== null && task.due <= today).length,
        upcoming: tasks.filter((task) => !task.done && task.due !== null && task.due > today).length,
        important: tasks.filter((task) => !task.done && task.priority >= 3).length,
        completed: tasks.filter((task) => task.done).length,
      };
      const visible = tasks.filter((task) => {
        if (view === 'completed') return task.done;
        if (task.done) return false;
        if (view === 'today') return task.due !== null && task.due <= today;
        if (view === 'upcoming') return task.due !== null && task.due > today;
        if (view === 'important') return task.priority >= 3;
        return true;
      }).sort((left, right) => {
        if (left.done !== right.done) return left.done ? 1 : -1;
        if (right.priority !== left.priority) return right.priority - left.priority;
        if (left.due !== right.due) {
          if (left.due === null) return 1;
          if (right.due === null) return -1;
          return left.due < right.due ? -1 : 1;
        }
        return left.createdAt - right.createdAt;
      });

      const doneCount = counts.completed;
      const progress = tasks.length === 0 ? 0 : doneCount / tasks.length;
      const emptyKeys = EMPTY_KEYS[view];

      const duePopover = (taskId) => {
        const task = tasks.find((item) => item.id === taskId);
        return [
          h('div', { className: 'todo-popoverLabel', key: 'label' }, t('dueLabel')),
          ...DUE_QUICK.map((key) => h('button', {
            type: 'button', className: 'todo-popoverRow', key,
            onClick: () => { setDue(taskId, quickDate(key)); setPopover(null); },
          }, t(key === 'today' ? 'dueToday' : key === 'tomorrow' ? 'dueTomorrow' : 'dueNextWeek'))),
          h('div', { className: 'todo-popoverDivider', key: 'divider' }),
          h('input', {
            type: 'date', className: 'todo-dateInput', key: 'date',
            value: task === undefined ? '' : (task.due ?? ''),
            onChange: (event) => {
              setDue(taskId, event.target.value === '' ? null : event.target.value);
              setPopover(null);
            },
            'aria-label': t('dueLabel'),
          }),
          task !== undefined && task.due !== null
            ? h('button', {
                type: 'button', className: 'todo-popoverRow', key: 'clear',
                onClick: () => { setDue(taskId, null); setPopover(null); },
              }, t('dueClear'))
            : null,
        ];
      };

      const priorityPopover = (taskId) => [
        h('div', { className: 'todo-popoverLabel', key: 'label' }, t('priorityLabel')),
        ...[0, 1, 2, 3, 4].map((priority) => h('button', {
          type: 'button', className: 'todo-popoverRow', key: priority,
          onClick: () => { setPriority(taskId, priority); setPopover(null); },
        }, [
          h('span', { style: { width: 10, height: 10, borderRadius: 3, background: PRIORITY_COLORS[priority], flex: 'none' } }),
          h('span', {}, t(PRIORITY_KEYS[priority])),
        ])),
      ];

      return h('div', { className: 'todo-root' }, [
        h('style', {}, CSS),
        h('header', { className: 'todo-header' }, [
          h('div', { className: 'todo-titleRow' }, [
            h('div', {}, [
              h('h1', { className: 'todo-title' }, t('title')),
              h('p', { className: 'todo-subtitle' }, t('description')),
            ]),
            h('div', { className: 'todo-progress' }, [
              h('span', { className: 'todo-progressText' }, t('progressText', { done: doneCount, total: tasks.length })),
              h(ProgressRing, { value: progress }),
            ]),
          ]),
          h('div', { className: 'todo-views' }, VIEWS.map((key) => h('button', {
            type: 'button',
            key,
            className: view === key ? 'todo-view todo-viewActive' : 'todo-view',
            onClick: () => setView(key),
            'aria-pressed': view === key,
          }, [
            h('span', {}, t(key)),
            h('span', { className: 'todo-viewCount' }, String(counts[key])),
          ]))),
        ]),
        h('div', { className: 'todo-add' }, [
          h('div', { className: 'todo-addRow' }, [
            h('input', {
              className: 'todo-addInput',
              value: draft,
              placeholder: t('addPlaceholder'),
              onChange: (event) => setDraft(event.target.value),
              onKeyDown: (event) => { if (event.key === 'Enter') addTask(); },
              'aria-label': t('addPlaceholder'),
            }),
            h('button', {
              type: 'button',
              className: 'todo-addButton',
              onClick: addTask,
              disabled: draft.trim() === '',
            }, t('add')),
          ]),
          h('p', { className: 'todo-hint' }, t('quickAddHint')),
        ]),
        view === 'completed' && counts.completed > 0
          ? h('div', { className: 'todo-clear' }, [
              h('span', {}, t('completedCount', { count: counts.completed })),
              h('button', { type: 'button', className: 'todo-clearButton', onClick: clearCompleted }, t('clearCompleted')),
            ])
          : null,
        h('div', { className: 'todo-list' }, visible.length === 0
          ? h('div', { className: 'todo-empty' }, [
              h('div', { className: 'todo-emptyTitle' }, t(emptyKeys[0])),
              h('div', { className: 'todo-emptyText' }, t(emptyKeys[1])),
            ])
          : visible.map((task) => h(TaskRow, {
              key: task.id,
              t,
              task,
              today,
              editing: editingId === task.id,
              editText,
              onStartEdit: () => startEdit(task),
              onChangeEdit: setEditText,
              onSaveEdit: () => saveEdit(task.id),
              onCancelEdit: cancelEdit,
              onToggle: () => toggleTask(task.id),
              onDelete: () => deleteTask(task.id),
              onOpenPriority: togglePopover('priority', task.id),
              onOpenDue: togglePopover('due', task.id),
              onToggleSubtask: (subId) => toggleSubtask(task.id, subId),
              onAddSubtask: (text) => addSubtask(task.id, text),
              onDeleteSubtask: (subId) => deleteSubtask(task.id, subId),
            }))),
        popover === null
          ? null
          : h(Popover, {
              anchor: popover.anchor,
              onClose: closePopover,
            }, popover.kind === 'due' ? duePopover(popover.taskId) : priorityPopover(popover.taskId)),
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
        }, function TodoIcon({ size }) {
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
        }));
      },
    };
  },
});
