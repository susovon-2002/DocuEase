
import { ProtectPdfClient } from './ProtectPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function ProtectPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <ProtectPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
