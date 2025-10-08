import { AddWatermarkClient } from './AddWatermarkClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function AddWatermarkPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <AddWatermarkClient />
      </div>
    </ToolAuthWrapper>
  );
}
