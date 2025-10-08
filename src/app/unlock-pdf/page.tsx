import { UnlockPdfClient } from './UnlockPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function UnlockPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <UnlockPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
