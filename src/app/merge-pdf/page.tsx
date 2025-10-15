import { MergePdfClient } from './MergePdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function MergePdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <MergePdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
