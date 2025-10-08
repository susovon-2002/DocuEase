import { ScanToPdfClient } from './ScanToPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function ScanToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <ScanToPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
