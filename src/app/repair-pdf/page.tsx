import { RepairPdfClient } from './RepairPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function RepairPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <RepairPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
