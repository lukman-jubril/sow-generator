// components/MarkdownViewer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = { markdown: string };

export default function MarkdownViewer({ markdown }: Props) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {markdown}
    </ReactMarkdown>
  );
}