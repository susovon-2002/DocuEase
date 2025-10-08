import { EditPdfClient } from './EditPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function EditPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12 w-full">
        <EditPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
