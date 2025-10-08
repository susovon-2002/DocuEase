import { SplitPdfClient } from './SplitPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function SplitPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <SplitPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
