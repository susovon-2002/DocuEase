import { RemovePagesClient } from './RemovePagesClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function RemovePagesPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <RemovePagesClient />
      </div>
    </ToolAuthWrapper>
  );
}
