import { PdfToPowerpointClient } from './PdfToPowerpointClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function PdfToPowerpointPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <PdfToPowerpointClient />
      </div>
    </ToolAuthWrapper>
  );
}
