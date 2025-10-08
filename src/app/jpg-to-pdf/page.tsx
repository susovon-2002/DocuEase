import { JpgToPdfClient } from './JpgToPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function JpgToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <JpgToPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
