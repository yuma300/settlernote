import {
  TiptapLink,
  UpdatedImage,
  TaskList,
  TaskItem,
  HorizontalRule,
  StarterKit,
  Placeholder,
  Command,
  renderItems,
  TiptapUnderline,
} from 'novel'
import Heading from '@tiptap/extension-heading'

// Suggestion items for slash commands
export const suggestionItems = [
  {
    title: '段落',
    description: '通常のテキスト',
    searchTerms: ['paragraph', 'p'],
    icon: <span>¶</span>,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('paragraph').run()
    },
  },
  {
    title: '見出し 1',
    description: '大見出し',
    searchTerms: ['heading', 'h1'],
    icon: <span>H1</span>,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
  },
  {
    title: '見出し 2',
    description: '中見出し',
    searchTerms: ['heading', 'h2'],
    icon: <span>H2</span>,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
  },
  {
    title: '見出し 3',
    description: '小見出し',
    searchTerms: ['heading', 'h3'],
    icon: <span>H3</span>,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
    },
  },
  {
    title: '箇条書きリスト',
    description: '箇条書き',
    searchTerms: ['bullet', 'list', 'ul'],
    icon: <span>•</span>,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: '番号付きリスト',
    description: '番号付き',
    searchTerms: ['numbered', 'list', 'ol'],
    icon: <span>1.</span>,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'タスクリスト',
    description: 'チェックボックス',
    searchTerms: ['task', 'todo', 'checkbox'],
    icon: <span>☐</span>,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: '引用',
    description: '引用ブロック',
    searchTerms: ['quote', 'blockquote'],
    icon: <span>"</span>,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'コードブロック',
    description: 'コード',
    searchTerms: ['code', 'codeblock'],
    icon: <span>{`</>`}</span>,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: '水平線',
    description: '区切り線',
    searchTerms: ['hr', 'divider', '線'],
    icon: <span>―</span>,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: '目次',
    description: '見出しの一覧',
    searchTerms: ['toc', 'table of contents', '目次'],
    icon: <span>📑</span>,
    command: ({ editor, range }: any) => {
      // 目次を表すカスタムコンテンツを挿入
      const tocContent = {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [{ type: 'bold' }],
            text: '📑 目次',
          },
        ],
      }

      const bulletList = {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'ドキュメント内の見出しがここに自動的に表示されます',
                  },
                ],
              },
            ],
          },
        ],
      }

      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent([tocContent, bulletList])
        .run()
    },
  },
]

// 見出しにIDを付与するカスタムHeading拡張
const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('id'),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {}
          }
          return {
            id: attributes.id,
          }
        },
      },
    }
  },
})

// デフォルトの拡張機能セット
export const defaultExtensions = [
  StarterKit.configure({
    heading: false, // StarterKitのHeadingを無効化
  }),
  CustomHeading.configure({
    levels: [1, 2, 3, 4, 5, 6],
  }),
  Placeholder,
  TiptapLink,
  TiptapUnderline,
  UpdatedImage,
  TaskList,
  TaskItem,
  HorizontalRule,
  Command.configure({
    suggestion: {
      items: () => suggestionItems,
      render: renderItems,
    },
  }),
]
