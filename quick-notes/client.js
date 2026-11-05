window.__ModuleLoader__.load({
  id: '@local/quick-notes',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'quick-notes';
    const PANEL_ID = 'quick-notes';
    const STORAGE_KEY = 'dsh.local.quick-notes.text';

    const dictionaries = {
      en: {
        panel: 'Quick Notes',
        title: 'Quick Notes',
        description: 'A scratch pad that stays in this browser.',
        placeholder: 'Write a note…',
        empty: 'No note yet',
        characters: '{count} characters',
        clear: 'Clear',
      },
      zh: {
        panel: '便签',
        title: '便签',
        description: '留在当前浏览器中的随手笔记。',
        placeholder: '写点什么…',
        empty: '还没有笔记',
        characters: '{count} 个字符',
        clear: '清空',
      },
    };

    function readNote() {
      try {
        const value = window.localStorage.getItem(STORAGE_KEY);
        return typeof value === 'string' ? value : '';
      } catch {
        return '';
      }
    }

    function NotesIcon({ size }) {
      return h('svg', {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block' },
      }, [
        h('path', {
          d: 'M3.5 2.5h6l3 3v7a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z',
          stroke: 'currentColor',
          strokeWidth: 1.1,
          strokeLinejoin: 'round',
        }),
        h('path', { d: 'M9.5 2.5v3h3', stroke: 'currentColor', strokeWidth: 1.1, strokeLinejoin: 'round' }),
        h('path', { d: 'M5.5 8h5M5.5 10.5h3', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round' }),
      ]);
    }

    function NotesPanel({ t }) {
      const [text, setText] = React.useState(readNote);
      React.useEffect(() => {
        try {
          window.localStorage.setItem(STORAGE_KEY, text);
        } catch {
          // Storage can be unavailable (private mode, quota); the note still works in memory.
        }
      }, [text]);
      const count = text.length;
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
          style: {
            padding: '20px 24px 12px',
            borderBottom: '1px solid var(--dsw-alias-border-l1)',
          },
        }, [
          h('h1', { style: { margin: 0, fontSize: 18, fontWeight: 600, lineHeight: '26px' } }, t('title')),
          h('p', {
            style: {
              margin: '4px 0 0',
              fontSize: 13,
              lineHeight: '20px',
              color: 'var(--dsw-alias-label-secondary)',
            },
          }, t('description')),
        ]),
        h('textarea', {
          value: text,
          onChange: (event) => setText(event.target.value),
          placeholder: t('placeholder'),
          'aria-label': t('title'),
          style: {
            flex: '1 1 auto',
            minHeight: 0,
            resize: 'none',
            border: 'none',
            outline: 'none',
            padding: '16px 24px',
            background: 'transparent',
            color: 'inherit',
            fontFamily: 'inherit',
            fontSize: 14,
            lineHeight: '22px',
          },
        }),
        h('footer', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 24px',
            borderTop: '1px solid var(--dsw-alias-border-l1)',
            fontSize: 12,
            lineHeight: '18px',
            color: 'var(--dsw-alias-label-secondary)',
          },
        }, [
          h('span', {}, count === 0 ? t('empty') : t('characters', { count })),
          h('button', {
            type: 'button',
            onClick: () => setText(''),
            disabled: count === 0,
            style: {
              border: '1px solid var(--dsw-alias-border-l2)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--dsw-alias-label-primary)',
              font: 'inherit',
              fontSize: 12,
              lineHeight: '18px',
              padding: '4px 10px',
              cursor: count === 0 ? 'default' : 'pointer',
              opacity: count === 0 ? 0.5 : 1,
            },
          }, t('clear')),
        ]),
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
        }, NotesPanel));
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 20,
          locale: NS,
          label: () => t('panel'),
        }, NotesIcon));
      },
    };
  },
});
