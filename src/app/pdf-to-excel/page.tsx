import { PdfToExcelClient } from './PdfToExcelClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function PdfToExcelPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <PdfToExcelClient />
      </div>
    </ToolAuthWrapper>
  );
}
