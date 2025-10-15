import { PptxToPdfClient } from './PptxToPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function PowerpointToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <PptxToPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
