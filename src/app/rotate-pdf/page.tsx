import { RotatePdfClient } from './RotatePdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function RotatePdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <RotatePdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
