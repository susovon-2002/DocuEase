import { WordToPdfClient } from './WordToPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function WordToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <WordToPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
