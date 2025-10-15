import { PdfToPdfaClient } from './PdfToPdfaClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function PdfToPdfaPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <PdfToPdfaClient />
      </div>
    </ToolAuthWrapper>
  );
}
