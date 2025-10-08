import { AddPageNumbersClient } from './AddPageNumbersClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function AddPageNumbersPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <AddPageNumbersClient />
      </div>
    </ToolAuthWrapper>
  );
}
