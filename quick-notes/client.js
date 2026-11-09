window.__ModuleLoader__.load({
  id: '@local/quick-notes',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'quick-notes';
    const PANEL_ID = 'quick-notes';
    const STORAGE_KEY = 'dsh.local.quick-notes.state.v1';
    const LEGACY_TASKS_KEY = 'dsh.local.quick-notes.tasks';
    const LEGACY_NOTE_KEY = 'dsh.local.quick-notes.text';

    /** Todoist's signature accent, taken from the theme's error colour. */
    const ACCENT = 'var(--dsw-alias-state-error-primary)';
    const FILTERS = [
      { key: 'today', icon: 'sun', labelKey: 'today' },
      { key: 'upcoming', icon: 'calendar', labelKey: 'upcoming' },
      { key: 'important', icon: 'star', labelKey: 'important' },
      { key: 'completed', icon: 'checkCircle', labelKey: 'completed' },
    ];
    const PRIORITY_COLORS = [
      'var(--dsw-alias-state-error-primary)',
      'var(--dsw-alias-state-warn-primary)',
      'var(--dsw-alias-brand-primary)',
      'var(--dsw-alias-state-idle-primary)',
    ];
    const PRIORITY_KEYS = ['priority1', 'priority2', 'priority3', 'priority4'];
    const PALETTE = [
      'var(--dsw-alias-state-error-primary)',
      'var(--dsw-alias-state-warn-primary)',
      'var(--dsw-alias-brand-primary)',
      'var(--dsw-alias-state-success-primary)',
      'var(--dsw-alias-state-idle-primary)',
    ];
    const DUE_QUICK = ['today', 'tomorrow', 'nextweek'];
    const WEEKDAYS = {
      '!monday': 1, '!tuesday': 2, '!wednesday': 3, '!thursday': 4, '!friday': 5, '!saturday': 6, '!sunday': 0,
      '!周一': 1, '!周二': 2, '!周三': 3, '!周四': 4, '!周五': 5, '!周六': 6, '!周日': 0, '!星期天': 0,
    };
    const REPEATS = {
      '!everyday': 'daily', '!每天': 'daily',
      '!everyweek': 'weekly', '!每周': 'weekly',
      '!everymonth': 'monthly', '!每月': 'monthly',
      '!weekdays': 'weekdays', '!工作日': 'weekdays',
    };
    const OLD_PRIORITY_MAP = { 0: 4, 1: 4, 2: 3, 3: 2, 4: 1 };
    const EMPTY_KEYS = {
      today: ['emptyTodayTitle', 'emptyTodayText'],
      upcoming: ['emptyUpcomingTitle', 'emptyUpcomingText'],
      important: ['emptyImportantTitle', 'emptyImportantText'],
      completed: ['emptyCompletedTitle', 'emptyCompletedText'],
      project: ['emptyProjectTitle', 'emptyProjectText'],
      label: ['emptyLabelTitle', 'emptyLabelText'],
    };

    const CSS = `
.todo-root { flex: 1 1 auto; min-height: 0; display: flex; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font-size: 14px; }
.todo-root *, .todo-root *::before, .todo-root *::after { box-sizing: border-box; }
.todo-rail { width: 216px; flex: none; border-right: 1px solid var(--dsw-alias-border-l1); overflow-y: auto; padding: 14px 10px 16px; }
.todo-brand { display: flex; align-items: center; gap: 8px; padding: 0 8px 12px; font-size: 15px; font-weight: 650; letter-spacing: -0.01em; }
.todo-brandMark { width: 18px; height: 18px; border-radius: 5px; background: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-bg-base); display: inline-flex; align-items: center; justify-content: center; flex: none; }
.todo-railSection { padding: 12px 8px 4px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); letter-spacing: 0.06em; text-transform: uppercase; }
.todo-railItem { display: flex; align-items: center; gap: 9px; width: 100%; border: none; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 13.5px; line-height: 22px; padding: 5px 8px; border-radius: 8px; cursor: pointer; text-align: left; }
.todo-railItem:hover { background: var(--dsw-alias-bg-layer-1); }
.todo-railItemActive { background: var(--dsw-alias-bg-layer-2); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent); font-weight: 550; }
.todo-railItemActive .todo-railIcon { color: var(--dsw-alias-state-error-primary); }
.todo-railIcon { width: 16px; height: 16px; flex: none; display: inline-flex; color: var(--dsw-alias-label-secondary); }
.todo-railDot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
.todo-railName { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.todo-railCount { font-size: 11.5px; color: var(--dsw-alias-label-secondary); flex: none; }
.todo-railMenu { border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 14px; line-height: 16px; padding: 0 2px; border-radius: 4px; cursor: pointer; opacity: 0; flex: none; }
.todo-railItem:hover .todo-railMenu { opacity: 1; }
.todo-railAdd { display: flex; align-items: center; gap: 9px; width: 100%; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 13.5px; line-height: 22px; padding: 5px 8px; border-radius: 8px; cursor: pointer; text-align: left; }
.todo-railAdd:hover { background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); }
.todo-railInput { flex: 1 1 auto; min-width: 0; border: 1px solid var(--dsw-alias-state-error-primary); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit; font-size: 13px; line-height: 20px; padding: 4px 8px; outline: none; }
.todo-main { flex: 1 1 auto; min-width: 0; min-height: 0; display: flex; flex-direction: column; }
.todo-mainHeader { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 24px 10px; }
.todo-mainTitle { margin: 0; font-size: 21px; font-weight: 650; line-height: 28px; letter-spacing: -0.015em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.todo-mainCount { font-size: 13px; color: var(--dsw-alias-label-secondary); flex: none; }
.todo-progress { display: flex; align-items: center; gap: 8px; flex: none; }
.todo-progressText { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.todo-add { padding: 0 24px 8px; }
.todo-addRow { display: flex; align-items: center; gap: 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-layer-1); padding: 4px 4px 4px 14px; }
.todo-addRow:focus-within { border-color: var(--dsw-alias-state-error-primary); background: var(--dsw-alias-bg-base); }
.todo-addIcon { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--dsw-alias-border-l2); display: inline-flex; align-items: center; justify-content: center; color: var(--dsw-alias-label-secondary); flex: none; }
.todo-addInput { flex: 1 1 auto; min-width: 0; border: none; background: transparent; color: inherit; font: inherit; font-size: 15px; line-height: 34px; outline: none; }
.todo-addInput::placeholder { color: var(--dsw-alias-label-secondary); }
.todo-addButton { border: none; border-radius: 9px; background: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-bg-base); font: inherit; font-size: 13.5px; font-weight: 550; line-height: 20px; padding: 7px 16px; cursor: pointer; }
.todo-addButton:disabled { opacity: 0.45; cursor: default; }
.todo-hint { margin: 7px 0 0; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.todo-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
.todo-task { display: flex; align-items: flex-start; gap: 11px; padding: 10px 24px 10px 21px; border-bottom: 1px solid var(--dsw-alias-border-l1); border-left: 3px solid transparent; }
.todo-task:hover { background: var(--dsw-alias-bg-layer-1); }
.todo-check { flex: none; width: 21px; height: 21px; border-radius: 50%; border: 1.6px solid var(--dsw-alias-border-l2); background: transparent; display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; margin-top: 1px; transition: background 0.15s ease, border-color 0.15s ease; }
.todo-check:hover { border-color: var(--dsw-alias-state-error-primary); }
.todo-checkDone { background: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-bg-base); }
.todo-checkDone svg { animation: todo-pop 0.18s ease-out; }
@keyframes todo-pop { 0% { transform: scale(0.5); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
.todo-body { flex: 1 1 auto; min-width: 0; }
.todo-text { font-size: 15px; line-height: 22px; overflow-wrap: anywhere; white-space: pre-wrap; }
.todo-textDone { color: var(--dsw-alias-label-secondary); text-decoration: line-through; }
.todo-edit { width: 100%; border: 1px solid var(--dsw-alias-state-error-primary); border-radius: 8px; background: var(--dsw-alias-bg-base); color: inherit; font: inherit; font-size: 15px; line-height: 22px; padding: 2px 8px; outline: none; }
.todo-meta { display: flex; align-items: center; gap: 10px; margin-top: 4px; flex-wrap: wrap; }
.todo-subProgress { font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.todo-subBar { height: 3px; border-radius: 2px; background: var(--dsw-alias-bg-layer-2); margin-top: 5px; overflow: hidden; }
.todo-subBarFill { height: 100%; border-radius: 2px; background: var(--dsw-alias-state-error-primary); }
.todo-labels { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.todo-label { display: inline-flex; align-items: center; gap: 4px; border: none; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); font: inherit; font-size: 11.5px; line-height: 17px; padding: 1px 8px; cursor: pointer; }
.todo-label:hover { background: var(--dsw-alias-bg-layer-1); }
.todo-labelActive { background: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-bg-base); }
.todo-repeat { display: inline-flex; align-items: center; gap: 3px; font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.todo-subs { margin-top: 3px; }
.todo-sub { display: flex; align-items: center; gap: 8px; padding: 2px 0; }
.todo-subCheck { flex: none; width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid var(--dsw-alias-border-l2); background: transparent; display: inline-flex; align-items: center; justify-content: center; padding: 0; cursor: pointer; }
.todo-subCheck:hover { border-color: var(--dsw-alias-state-error-primary); }
.todo-subCheckDone { background: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-bg-base); }
.todo-subText { flex: 1 1 auto; min-width: 0; font-size: 13.5px; line-height: 20px; overflow-wrap: anywhere; }
.todo-subTextDone { color: var(--dsw-alias-label-secondary); text-decoration: line-through; }
.todo-subDelete { flex: none; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 14px; line-height: 16px; padding: 0 2px; cursor: pointer; opacity: 0; }
.todo-task:hover .todo-subDelete { opacity: 1; }
.todo-subAdd { display: flex; align-items: center; gap: 8px; padding: 3px 0 3px 24px; }
.todo-subInput { flex: 1 1 auto; min-width: 0; border: none; background: transparent; color: inherit; font: inherit; font-size: 13.5px; line-height: 20px; outline: none; }
.todo-subInput::placeholder { color: var(--dsw-alias-label-secondary); }
.todo-actions { display: flex; align-items: center; gap: 3px; flex: none; margin-top: 2px; }
.todo-iconButton { display: inline-flex; align-items: center; justify-content: center; gap: 4px; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12.5px; line-height: 18px; padding: 4px 7px; border-radius: 7px; cursor: pointer; }
.todo-iconButton:hover { background: var(--dsw-alias-bg-layer-2); }
.todo-dueToday { color: var(--dsw-alias-state-error-primary); }
.todo-dueOverdue { color: var(--dsw-alias-state-error-primary); font-weight: 550; }
.todo-delete { opacity: 0; }
.todo-task:hover .todo-delete { opacity: 1; }
.todo-empty { padding: 56px 24px; text-align: center; }
.todo-emptyMark { width: 44px; height: 44px; border-radius: 12px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; background: var(--dsw-alias-bg-layer-2); background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent); color: var(--dsw-alias-state-error-primary); }
.todo-emptyTitle { font-size: 15px; line-height: 22px; color: var(--dsw-alias-label-primary); margin-bottom: 4px; }
.todo-emptyText { font-size: 12.5px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.todo-popover { position: fixed; z-index: 1000; background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 6px; }
.todo-popoverRow { display: flex; align-items: center; gap: 8px; width: 100%; border: none; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 13.5px; line-height: 20px; padding: 6px 8px; border-radius: 7px; cursor: pointer; text-align: left; }
.todo-popoverRow:hover { background: var(--dsw-alias-bg-layer-2); }
.todo-popoverLabel { padding: 4px 8px; font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.todo-popoverDivider { height: 1px; background: var(--dsw-alias-border-l1); margin: 4px 0; }
.todo-dateInput { width: 100%; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: inherit; font: inherit; font-size: 13.5px; line-height: 20px; padding: 5px 8px; margin: 4px 0; outline: none; }
.todo-clear { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 24px; border-bottom: 1px solid var(--dsw-alias-border-l1); font-size: 12.5px; color: var(--dsw-alias-label-secondary); }
.todo-clearButton { border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12.5px; line-height: 18px; cursor: pointer; padding: 2px 6px; border-radius: 6px; }
.todo-clearButton:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
`;

    const dictionaries = {
      en: {
        panel: 'To-Do',
        brand: 'To-Do',
        description: 'A Todoist-style task list with projects, labels and recurring tasks.',
        filters: 'Filters',
        projects: 'Projects',
        labels: 'Labels',
        allProjects: 'All projects',
        inbox: 'Inbox',
        newProject: 'New project',
        newProjectPlaceholder: 'Project name',
        renameProject: 'Rename',
        deleteProject: 'Delete project (tasks move to Inbox)',
        projectMenu: 'Project menu',
        addPlaceholder: 'Add a task…',
        add: 'Add task',
        quickAddHint: 'Quick add: !p1–!p4 priority · !today / !tomorrow / !nextweek / !monday due · @label · !everyday / !everyweek / !everymonth repeat',
        today: 'Today',
        upcoming: 'Upcoming',
        important: 'Important',
        completed: 'Completed',
        priorityLabel: 'Priority',
        priority1: 'Priority 1',
        priority2: 'Priority 2',
        priority3: 'Priority 3',
        priority4: 'Priority 4',
        dueLabel: 'Due date',
        dueToday: 'Today',
        dueTomorrow: 'Tomorrow',
        dueNextWeek: 'Next week',
        dueClear: 'Clear date',
        dueSet: 'Set due date',
        repeat_daily: 'Daily',
        repeat_weekly: 'Weekly',
        repeat_monthly: 'Monthly',
        repeat_weekdays: 'Every weekday',
        subtaskProgress: '{done}/{total}',
        addSubtask: 'Add a subtask…',
        editHint: 'Double-click to edit',
        editPlaceholder: 'Task text',
        markDone: 'Mark as done',
        markOpen: 'Mark as open',
        deleteTask: 'Delete task',
        progressText: '{done}/{total} done',
        clearCompleted: 'Clear completed',
        completedCount: '{count} completed',
        labelFilter: 'Label',
        emptyTodayTitle: 'Nothing due today',
        emptyTodayText: 'Enjoy the calm, or plan ahead.',
        emptyUpcomingTitle: 'Nothing scheduled',
        emptyUpcomingText: 'Add a due date to see what is coming.',
        emptyImportantTitle: 'No important tasks',
        emptyImportantText: 'Mark a task P1 or P2 to keep it here.',
        emptyCompletedTitle: 'Nothing completed yet',
        emptyCompletedText: 'Finished tasks will gather here.',
        emptyProjectTitle: 'This project is empty',
        emptyProjectText: 'Add a task to get started.',
        emptyLabelTitle: 'No tasks with this label',
        emptyLabelText: 'Add a @label while creating a task.',
      },
      zh: {
        panel: '待办事项',
        brand: '待办事项',
        description: 'Todoist 风格任务清单：项目、标签与重复任务。',
        filters: '筛选',
        projects: '项目',
        labels: '标签',
        allProjects: '所有项目',
        inbox: '收件箱',
        newProject: '新建项目',
        newProjectPlaceholder: '项目名称',
        renameProject: '重命名',
        deleteProject: '删除项目（任务移入收件箱）',
        projectMenu: '项目菜单',
        addPlaceholder: '添加一个任务…',
        add: '添加任务',
        quickAddHint: '快速添加：!p1–!p4 优先级 · !今天 / !明天 / !下周 / !周一 截止 · @标签 · !每天 / !每周 / !每月 重复',
        today: '今天',
        upcoming: '即将到来',
        important: '重要',
        completed: '已完成',
        priorityLabel: '优先级',
        priority1: '优先级 1',
        priority2: '优先级 2',
        priority3: '优先级 3',
        priority4: '优先级 4',
        dueLabel: '截止日期',
        dueToday: '今天',
        dueTomorrow: '明天',
        dueNextWeek: '下周',
        dueClear: '清除日期',
        dueSet: '设置截止日期',
        repeat_daily: '每天',
        repeat_weekly: '每周',
        repeat_monthly: '每月',
        repeat_weekdays: '每个工作日',
        subtaskProgress: '{done}/{total}',
        addSubtask: '添加子任务…',
        editHint: '双击编辑',
        editPlaceholder: '任务内容',
        markDone: '标记为完成',
        markOpen: '标记为未完成',
        deleteTask: '删除任务',
        progressText: '已完成 {done}/{total}',
        clearCompleted: '清除已完成',
        completedCount: '已完成 {count} 项',
        labelFilter: '标签',
        emptyTodayTitle: '今天没有到期任务',
        emptyTodayText: '享受这份清闲，或提前规划。',
        emptyUpcomingTitle: '还没有安排',
        emptyUpcomingText: '给任务加上截止日期，就能看到接下来的安排。',
        emptyImportantTitle: '没有重要任务',
        emptyImportantText: '把任务标为 P1 或 P2 就会出现在这里。',
        emptyCompletedTitle: '还没有已完成的事',
        emptyCompletedText: '完成的任务会汇总在这里。',
        emptyProjectTitle: '这个项目还没有任务',
        emptyProjectText: '添加一个任务开始吧。',
        emptyLabelTitle: '没有带该标签的任务',
        emptyLabelText: '创建任务时加上 @标签 即可。',
      },
    };

    function createId() {
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function isState(value) {
      return typeof value === 'object' && value !== null
        && Array.isArray(value.projects) && Array.isArray(value.tasks);
    }

    function isTask(value) {
      return typeof value === 'object' && value !== null
        && typeof value.id === 'string' && typeof value.text === 'string' && typeof value.done === 'boolean'
        && typeof value.priority === 'number' && (value.due === null || typeof value.due === 'string')
        && typeof value.projectId === 'string' && Array.isArray(value.labels) && Array.isArray(value.subtasks)
        && (value.repeat === null || typeof value.repeat === 'string');
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

    function isWeekend(iso) {
      const day = new Date(`${iso}T00:00:00`).getDay();
      return day === 0 || day === 6;
    }

    function quickDate(key) {
      if (key === 'today') return todayISO();
      if (key === 'tomorrow') return addDays(todayISO(), 1);
      if (key === 'nextweek') return addDays(todayISO(), 7);
      return null;
    }

    /** The next due date of a recurring rule, from the current one (or today when there is none). */
    function nextRepeatDue(repeat, due) {
      const base = due === null ? todayISO() : due;
      if (repeat === 'daily') return addDays(base, 1);
      if (repeat === 'weekly') return addDays(base, 7);
      if (repeat === 'monthly') {
        const date = new Date(`${base}T00:00:00`);
        const day = date.getDate();
        date.setDate(1);
        date.setMonth(date.getMonth() + 1);
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(day, daysInMonth));
        return toISO(date);
      }
      if (repeat === 'weekdays') {
        let next = addDays(base, 1);
        while (isWeekend(next)) next = addDays(next, 1);
        return next;
      }
      return null;
    }

    /**
     * Split a quick-add draft into text and its Todoist-style attributes: `!p1`–`!p4`
     * priority, `!today`/`!tomorrow`/`!nextweek` and weekday due dates, `@label`, and
     * `!everyday`/`!everyweek`/`!everymonth`/`!weekdays` repetition.
     * @param raw - the text typed into the add field.
     * @returns the parsed task fields.
     */
    function parseDraft(raw) {
      const result = { text: raw, priority: 4, due: null, labels: [], repeat: null };
      const kept = [];
      for (const word of raw.split(/\s+/)) {
        if (word === '') continue;
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
        const repeat = REPEATS[lower];
        if (repeat !== undefined) {
          result.repeat = repeat;
          continue;
        }
        if (word.startsWith('@') && word.length > 1) {
          const label = word.slice(1).trim();
          if (label !== '' && !result.labels.includes(label)) result.labels.push(label);
          continue;
        }
        kept.push(word);
      }
      result.text = kept.join(' ').trim();
      return result;
    }

    /** A stable colour for a label, so the same label always looks the same. */
    function labelColor(label) {
      let hash = 0;
      for (let index = 0; index < label.length; index += 1) {
        hash = (hash * 31 + label.charCodeAt(index)) >>> 0;
      }
      return PALETTE[hash % PALETTE.length];
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
        priority: 4,
        due: null,
        projectId: 'inbox',
        labels: [],
        repeat: null,
        subtasks: [],
        createdAt: now + index,
      }));
    }

    /** The pre-project task array, mapped onto the Inbox project. */
    function loadLegacyTasks() {
      try {
        const raw = window.localStorage.getItem(LEGACY_TASKS_KEY);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed.filter(isTask).map((task) => ({
              id: task.id,
              text: task.text,
              done: task.done,
              priority: OLD_PRIORITY_MAP[task.priority] ?? 4,
              due: task.due,
              subtasks: task.subtasks,
              createdAt: task.createdAt,
              projectId: 'inbox',
              labels: [],
              repeat: null,
            }));
          }
        }
      } catch {
        // Unreadable storage falls through to the note import.
      }
      return migrateLegacyNote();
    }

    function loadState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (isState(parsed)) {
            return {
              projects: parsed.projects.filter((project) => typeof project === 'object' && project !== null && typeof project.id === 'string'),
              tasks: parsed.tasks.filter(isTask),
            };
          }
        }
      } catch {
        // Unreadable or malformed storage falls through to the legacy import.
      }
      return {
        projects: [{ id: 'inbox', name: 'Inbox', colorIndex: 0, createdAt: 0 }],
        tasks: loadLegacyTasks(),
      };
    }

    function saveState(state) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Storage can be unavailable (private mode, quota); the list still works in memory.
      }
    }

    function CheckIcon({ size = 12 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M3 8.5l3.2 3L13 4.5', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function FlagIcon({ color }) {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M4 1.5v13', stroke: color, strokeWidth: 1.4, strokeLinecap: 'round' }),
        h('path', { d: 'M4 2h8l-2.2 2.75L12 7.5H4z', fill: color }));
    }

    function CalendarIcon() {
      return h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('rect', { x: 2, y: 3, width: 12, height: 11, rx: 2, stroke: 'currentColor', strokeWidth: 1.2 }),
        h('path', { d: 'M2 6.5h12', stroke: 'currentColor', strokeWidth: 1.2 }),
        h('path', { d: 'M5 1.5v3M11 1.5v3', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round' }));
    }

    function SunIcon() {
      return h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('circle', { cx: 8, cy: 8, r: 3, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('path', { d: 'M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }));
    }

    function StarIcon() {
      return h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M8 2l1.8 3.7 4.1.6-3 2.9.7 4.1L8 11.5l-3.6 1.8.7-4.1-3-2.9 4.1-.6z', stroke: 'currentColor', strokeWidth: 1.2, strokeLinejoin: 'round' }));
    }

    function CheckCircleIcon() {
      return h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('circle', { cx: 8, cy: 8, r: 6.2, stroke: 'currentColor', strokeWidth: 1.3 }),
        h('path', { d: 'M5.2 8.2l1.9 1.9 3.7-4', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function InboxIcon() {
      return h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M2.5 8.5h3l1 2h3l1-2h3M2.5 8.5L4 3.5h8l1.5 5v3.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function TagIcon({ color = 'currentColor' }) {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M2.5 2.5h4.2l6 6-4.2 4.2-6-6z', stroke: color, strokeWidth: 1.3, strokeLinejoin: 'round' }),
        h('circle', { cx: 5.2, cy: 5.2, r: 1, fill: color }));
    }

    function PlusIcon() {
      return h('svg', { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M8 3v10M3 8h10', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }));
    }

    function TrashIcon() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 9h5.6l.7-9', stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function RepeatIcon() {
      return h('svg', { width: 11, height: 11, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function FilterIcon({ name }) {
      if (name === 'sun') return h(SunIcon);
      if (name === 'calendar') return h(CalendarIcon);
      if (name === 'star') return h(StarIcon);
      return h(CheckCircleIcon);
    }

    function ProgressRing({ value }) {
      const radius = 9;
      const circumference = 2 * Math.PI * radius;
      const clamped = Math.max(0, Math.min(1, value));
      return h('svg', { width: 28, height: 28, viewBox: '0 0 28 28', 'aria-hidden': true },
        h('circle', { cx: 14, cy: 14, r: radius, fill: 'none', stroke: 'var(--dsw-alias-bg-layer-2)', strokeWidth: 3 }),
        h('circle', {
          cx: 14, cy: 14, r: radius, fill: 'none', stroke: 'var(--dsw-alias-state-error-primary)', strokeWidth: 3,
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
      return h('div', { ref, className: 'todo-popover', style }, children);
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
      const dueClass = dueState === 'none' ? 'todo-iconButton'
        : dueState === 'overdue' ? 'todo-iconButton todo-dueOverdue'
        : 'todo-iconButton todo-dueToday';
      const submitSubtask = () => {
        const text = subDraft.trim();
        if (text === '') return;
        props.onAddSubtask(text);
        setSubDraft('');
      };
      return h('div', {
        className: 'todo-task',
        style: { borderLeftColor: PRIORITY_COLORS[task.priority - 1] },
      }, [
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
          h('div', { className: 'todo-meta' }, [
            task.subtasks.length === 0 ? null : h('span', { className: 'todo-subProgress' }, `${subDone}/${task.subtasks.length}`),
            task.repeat === null ? null : h('span', { className: 'todo-repeat' }, [h(RepeatIcon), h('span', {}, t(`repeat_${task.repeat}`))]),
            task.labels.length === 0 ? null : h('span', { className: 'todo-labels' }, task.labels.map((label) => h('button', {
              type: 'button', key: label, className: props.labelFilter === label ? 'todo-label todo-labelActive' : 'todo-label',
              style: { color: labelColor(label) },
              onClick: () => props.onToggleLabel(label),
              title: `${t('labelFilter')}: ${label}`,
            }, label))),
          ]),
          task.subtasks.length === 0 ? null : h('div', { className: 'todo-subBar' },
            h('div', { className: 'todo-subBarFill', style: { width: `${(subDone / task.subtasks.length) * 100}%` } })),
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
              type: 'button', className: 'todo-subDelete',
              onClick: () => props.onDeleteSubtask(sub.id), 'aria-label': t('deleteTask'),
            }, '×'),
          ]))),
          h('div', { className: 'todo-subAdd' }, [
            h(PlusIcon),
            h('input', {
              className: 'todo-subInput', value: subDraft, placeholder: t('addSubtask'),
              onChange: (event) => setSubDraft(event.target.value),
              onKeyDown: (event) => { if (event.key === 'Enter') submitSubtask(); },
              'aria-label': t('addSubtask'),
            }),
          ]),
        ]),
        h('div', { className: 'todo-actions' }, [
          h('button', {
            type: 'button', className: 'todo-iconButton', onClick: props.onOpenPriority,
            title: `${t('priorityLabel')}: ${t(PRIORITY_KEYS[task.priority - 1])}`,
            'aria-label': `${t('priorityLabel')}: ${t(PRIORITY_KEYS[task.priority - 1])}`,
          }, h(FlagIcon, { color: PRIORITY_COLORS[task.priority - 1] })),
          h('button', {
            type: 'button', className: dueClass, onClick: props.onOpenDue,
            title: task.due === null ? t('dueSet') : t('dueLabel'),
            'aria-label': task.due === null ? t('dueSet') : `${t('dueLabel')}: ${dueLabel}`,
          }, [h(CalendarIcon), dueLabel === null ? null : h('span', {}, dueLabel)]),
          h('button', {
            type: 'button', className: 'todo-iconButton todo-delete', onClick: props.onDelete,
            'aria-label': t('deleteTask'), title: t('deleteTask'),
          }, h(TrashIcon)),
        ]),
      ]);
    }

    function TodoPanel({ t }) {
      const [state, setState] = React.useState(loadState);
      const [selection, setSelection] = React.useState({ type: 'project', value: 'all' });
      const [draft, setDraft] = React.useState('');
      const [labelFilter, setLabelFilter] = React.useState(null);
      const [editingId, setEditingId] = React.useState(null);
      const [editText, setEditText] = React.useState('');
      const [popover, setPopover] = React.useState(null);
      const [addingProject, setAddingProject] = React.useState(false);
      const [newProjectName, setNewProjectName] = React.useState('');
      const [renamingId, setRenamingId] = React.useState(null);
      const [renameText, setRenameText] = React.useState('');
      const cancelEditRef = React.useRef(false);

      React.useEffect(() => { saveState(state); }, [state]);

      const today = todayISO();
      const { projects, tasks } = state;
      const labels = [...new Set(tasks.flatMap((task) => task.labels))].sort();
      const projectCount = (id) => tasks.filter((task) => task.projectId === id && !task.done).length;
      const labelCount = (label) => tasks.filter((task) => task.labels.includes(label) && !task.done).length;
      const projectName = (project) => project.id === 'inbox' ? t('inbox') : project.name;

      const addTask = () => {
        const parsed = parseDraft(draft);
        if (parsed.text === '') return;
        const targetProject = selection.type === 'project' && selection.value !== 'all' ? selection.value : 'inbox';
        setState((current) => ({
          ...current,
          tasks: [...current.tasks, {
            id: createId(), text: parsed.text, done: false, priority: parsed.priority,
            due: parsed.due, projectId: targetProject, labels: parsed.labels, repeat: parsed.repeat,
            subtasks: [], createdAt: Date.now(),
          }],
        }));
        setDraft('');
        setLabelFilter(null);
      };

      const toggleTask = (id) => setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => {
          if (task.id !== id) return task;
          if (task.done) return { ...task, done: false };
          if (task.repeat !== null) {
            return { ...task, done: false, due: nextRepeatDue(task.repeat, task.due) };
          }
          return { ...task, done: true };
        }),
      }));
      const deleteTask = (id) => setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
      const setPriority = (id, priority) => setState((current) => ({
        ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, priority } : task),
      }));
      const setDue = (id, due) => setState((current) => ({
        ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, due } : task),
      }));
      const toggleSubtask = (id, subId) => setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => task.id === id
          ? { ...task, subtasks: task.subtasks.map((sub) => sub.id === subId ? { ...sub, done: !sub.done } : sub) }
          : task),
      }));
      const addSubtask = (id, text) => setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => task.id === id
          ? { ...task, subtasks: [...task.subtasks, { id: createId(), text, done: false }] }
          : task),
      }));
      const deleteSubtask = (id, subId) => setState((current) => ({
        ...current,
        tasks: current.tasks.map((task) => task.id === id
          ? { ...task, subtasks: task.subtasks.filter((sub) => sub.id !== subId) }
          : task),
      }));
      const clearCompleted = () => setState((current) => ({ ...current, tasks: current.tasks.filter((task) => !task.done) }));

      const addProject = () => {
        const name = newProjectName.trim();
        if (name === '') return;
        const id = createId();
        setState((current) => ({
          ...current,
          projects: [...current.projects, { id, name, colorIndex: current.projects.length % PALETTE.length, createdAt: Date.now() }],
        }));
        setSelection({ type: 'project', value: id });
        setAddingProject(false);
        setNewProjectName('');
      };
      const renameProject = (id) => {
        const name = renameText.trim();
        setState((current) => ({
          ...current,
          projects: current.projects.map((project) => project.id === id && project.id !== 'inbox' && name !== '' ? { ...project, name } : project),
        }));
        setRenamingId(null);
      };
      const deleteProject = (id) => {
        setState((current) => ({
          ...current,
          projects: current.projects.filter((project) => project.id !== id),
          tasks: current.tasks.map((task) => task.projectId === id ? { ...task, projectId: 'inbox' } : task),
        }));
        if (selection.type === 'project' && selection.value === id) setSelection({ type: 'project', value: 'all' });
      };

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
        setState((current) => ({
          ...current,
          tasks: current.tasks.map((task) => task.id === id && text !== '' ? { ...task, text } : task),
        }));
        setEditingId(null);
      };
      const cancelEdit = () => {
        cancelEditRef.current = true;
        setEditingId(null);
      };

      const togglePopover = (kind, key) => (event) => {
        const anchor = event.currentTarget;
        setPopover((current) => current !== null && current.kind === kind && current.key === key
          ? null
          : { kind, key, anchor });
      };
      const closePopover = React.useCallback(() => setPopover(null), []);

      const filterCounts = {
        today: tasks.filter((task) => !task.done && task.due !== null && task.due <= today).length,
        upcoming: tasks.filter((task) => !task.done && task.due !== null && task.due > today).length,
        important: tasks.filter((task) => !task.done && task.priority <= 2).length,
        completed: tasks.filter((task) => task.done).length,
      };
      const visible = tasks.filter((task) => {
        if (labelFilter !== null && !task.labels.includes(labelFilter)) return false;
        if (selection.type === 'filter') {
          if (selection.value === 'today') return !task.done && task.due !== null && task.due <= today;
          if (selection.value === 'upcoming') return !task.done && task.due !== null && task.due > today;
          if (selection.value === 'important') return !task.done && task.priority <= 2;
          if (selection.value === 'completed') return task.done;
          return true;
        }
        if (selection.type === 'project') {
          return selection.value === 'all' || task.projectId === selection.value;
        }
        return task.labels.includes(selection.value);
      }).sort((left, right) => {
        if (left.done !== right.done) return left.done ? 1 : -1;
        if (left.priority !== right.priority) return left.priority - right.priority;
        if (left.due !== right.due) {
          if (left.due === null) return 1;
          if (right.due === null) return -1;
          return left.due < right.due ? -1 : 1;
        }
        return left.createdAt - right.createdAt;
      });

      const doneCount = tasks.filter((task) => task.done).length;
      const progress = tasks.length === 0 ? 0 : doneCount / tasks.length;
      const emptyKeys = EMPTY_KEYS[selection.type === 'filter' ? selection.value : selection.type];
      const selectionTitle = selection.type === 'filter'
        ? t(FILTERS.find((filter) => filter.key === selection.value).labelKey)
        : selection.type === 'project'
          ? (selection.value === 'all' ? t('allProjects') : selection.value === 'inbox' ? t('inbox') : (projects.find((project) => project.id === selection.value)?.name ?? t('inbox')))
          : `${t('labelFilter')}: ${selection.value}`;

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
        ...[1, 2, 3, 4].map((priority) => h('button', {
          type: 'button', className: 'todo-popoverRow', key: priority,
          onClick: () => { setPriority(taskId, priority); setPopover(null); },
        }, [
          h('span', { style: { width: 10, height: 10, borderRadius: 3, background: PRIORITY_COLORS[priority - 1], flex: 'none' } }),
          h('span', {}, t(PRIORITY_KEYS[priority - 1])),
        ])),
      ];

      const projectPopover = (id) => {
        const project = projects.find((item) => item.id === id);
        return [
          h('button', {
            type: 'button', className: 'todo-popoverRow', key: 'rename',
            onClick: () => {
              setRenamingId(id);
              setRenameText(project === undefined ? '' : project.name);
              setPopover(null);
            },
          }, t('renameProject')),
          h('button', {
            type: 'button', className: 'todo-popoverRow', key: 'delete',
            onClick: () => { deleteProject(id); setPopover(null); },
          }, t('deleteProject')),
        ];
      };

      const railRow = (id, icon, label, count, active, onSelect, menu) => h('div', {
        className: active ? 'todo-railItem todo-railItemActive' : 'todo-railItem',
        onClick: onSelect,
      }, [
        h('span', { className: 'todo-railIcon' }, icon),
        h('span', { className: 'todo-railName' }, label),
        h('span', { className: 'todo-railCount' }, String(count)),
        menu === undefined ? null : h('button', {
          type: 'button', className: 'todo-railMenu',
          onClick: (event) => { event.stopPropagation(); togglePopover('project', id)(event); },
          'aria-label': t('projectMenu'), title: t('projectMenu'),
        }, '⋯'),
      ]);

      return h('div', { className: 'todo-root' }, [
        h('style', {}, CSS),
        h('div', { className: 'todo-rail' }, [
          h('div', { className: 'todo-brand' }, [
            h('span', { className: 'todo-brandMark' }, h(CheckIcon, { size: 11 })),
            h('span', {}, t('brand')),
          ]),
          h('div', { className: 'todo-railSection' }, t('filters')),
          ...FILTERS.map((filter) => railRow(
            filter.key,
            h(FilterIcon, { name: filter.icon }),
            t(filter.labelKey),
            filterCounts[filter.key],
            selection.type === 'filter' && selection.value === filter.key,
            () => { setSelection({ type: 'filter', value: filter.key }); setLabelFilter(null); },
          )),
          h('div', { className: 'todo-railSection' }, t('projects')),
          railRow('all', h(InboxIcon), t('allProjects'), tasks.filter((task) => !task.done).length,
            selection.type === 'project' && selection.value === 'all',
            () => { setSelection({ type: 'project', value: 'all' }); setLabelFilter(null); }),
          railRow('inbox', h(InboxIcon), t('inbox'), projectCount('inbox'),
            selection.type === 'project' && selection.value === 'inbox',
            () => { setSelection({ type: 'project', value: 'inbox' }); setLabelFilter(null); }),
          ...projects.filter((project) => project.id !== 'inbox').map((project) => h('div', {
            key: project.id, className: selection.type === 'project' && selection.value === project.id ? 'todo-railItem todo-railItemActive' : 'todo-railItem',
            onClick: () => { setSelection({ type: 'project', value: project.id }); setLabelFilter(null); },
          }, [
            h('span', { className: 'todo-railDot', style: { background: PALETTE[project.colorIndex % PALETTE.length] } }),
            renamingId === project.id
              ? h('input', {
                  className: 'todo-railInput', value: renameText, autoFocus: true,
                  onClick: (event) => event.stopPropagation(),
                  onChange: (event) => setRenameText(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') renameProject(project.id);
                    else if (event.key === 'Escape') setRenamingId(null);
                  },
                  onBlur: () => renameProject(project.id),
                  'aria-label': t('renameProject'),
                })
              : h('span', { className: 'todo-railName' }, project.name),
            h('span', { className: 'todo-railCount' }, String(projectCount(project.id))),
            h('button', {
              type: 'button', className: 'todo-railMenu',
              onClick: (event) => { event.stopPropagation(); togglePopover('project', project.id)(event); },
              'aria-label': t('projectMenu'), title: t('projectMenu'),
            }, '⋯'),
          ])),
          addingProject
            ? h('input', {
                className: 'todo-railInput', value: newProjectName, autoFocus: true,
                placeholder: t('newProjectPlaceholder'),
                onChange: (event) => setNewProjectName(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === 'Enter') addProject();
                  else if (event.key === 'Escape') { setAddingProject(false); setNewProjectName(''); }
                },
                onBlur: () => { if (newProjectName.trim() === '') setAddingProject(false); },
                'aria-label': t('newProjectPlaceholder'),
              })
            : h('button', { type: 'button', className: 'todo-railAdd', onClick: () => { setAddingProject(true); setNewProjectName(''); } },
                [h(PlusIcon), h('span', {}, t('newProject'))]),
          labels.length === 0 ? null : h('div', { className: 'todo-railSection' }, t('labels')),
          ...labels.map((label) => railRow(
            label,
            h(TagIcon, { color: labelColor(label) }),
            label,
            labelCount(label),
            selection.type === 'label' && selection.value === label,
            () => { setSelection({ type: 'label', value: label }); setLabelFilter(label); },
          )),
        ]),
        h('div', { className: 'todo-main' }, [
          h('div', { className: 'todo-mainHeader' }, [
            h('div', { style: { minWidth: 0 } }, [
              h('h1', { className: 'todo-mainTitle' }, selectionTitle),
              h('span', { className: 'todo-mainCount' }, selection.type === 'project'
                ? `${visible.filter((task) => task.done).length}/${visible.length}`
                : String(visible.length)),
            ]),
            h('div', { className: 'todo-progress' }, [
              h('span', { className: 'todo-progressText' }, t('progressText', { done: doneCount, total: tasks.length })),
              h(ProgressRing, { value: progress }),
            ]),
          ]),
          h('div', { className: 'todo-add' }, [
            h('div', { className: 'todo-addRow' }, [
              h('span', { className: 'todo-addIcon' }, h(PlusIcon)),
              h('input', {
                className: 'todo-addInput', value: draft, placeholder: t('addPlaceholder'),
                onChange: (event) => setDraft(event.target.value),
                onKeyDown: (event) => { if (event.key === 'Enter') addTask(); },
                'aria-label': t('addPlaceholder'),
              }),
              h('button', {
                type: 'button', className: 'todo-addButton', onClick: addTask, disabled: draft.trim() === '',
              }, t('add')),
            ]),
            h('p', { className: 'todo-hint' }, t('quickAddHint')),
          ]),
          selection.type === 'filter' && selection.value === 'completed' && filterCounts.completed > 0
            ? h('div', { className: 'todo-clear' }, [
                h('span', {}, t('completedCount', { count: filterCounts.completed })),
                h('button', { type: 'button', className: 'todo-clearButton', onClick: clearCompleted }, t('clearCompleted')),
              ])
            : null,
          h('div', { className: 'todo-list' }, visible.length === 0
            ? h('div', { className: 'todo-empty' }, [
                h('div', { className: 'todo-emptyMark' }, h(CheckCircleIcon)),
                h('div', { className: 'todo-emptyTitle' }, t(emptyKeys[0])),
                h('div', { className: 'todo-emptyText' }, t(emptyKeys[1])),
              ])
            : visible.map((task) => h(TaskRow, {
                key: task.id, t, task, today, labelFilter,
                editing: editingId === task.id, editText,
                onStartEdit: () => startEdit(task),
                onChangeEdit: setEditText,
                onSaveEdit: () => saveEdit(task.id),
                onCancelEdit: cancelEdit,
                onToggle: () => toggleTask(task.id),
                onDelete: () => deleteTask(task.id),
                onOpenPriority: togglePopover('priority', task.id),
                onOpenDue: togglePopover('due', task.id),
                onToggleLabel: (label) => setLabelFilter((current) => current === label ? null : label),
                onToggleSubtask: (subId) => toggleSubtask(task.id, subId),
                onAddSubtask: (text) => addSubtask(task.id, text),
                onDeleteSubtask: (subId) => deleteSubtask(task.id, subId),
              }))),
        ]),
        popover === null
          ? null
          : h(Popover, {
              anchor: popover.anchor, onClose: closePopover,
            }, popover.kind === 'due'
              ? duePopover(popover.key)
              : popover.kind === 'priority'
                ? priorityPopover(popover.key)
                : projectPopover(popover.key)),
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
