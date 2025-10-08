import { ExtractPagesClient } from './ExtractPagesClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function ExtractPagesPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <ExtractPagesClient />
      </div>
    </ToolAuthWrapper>
  );
}
