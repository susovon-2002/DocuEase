import { CompressPdfClient } from './CompressPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function CompressPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <CompressPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
