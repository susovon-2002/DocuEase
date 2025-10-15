import { PdfToWordClient } from './PdfToWordClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function PdfToWordPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <PdfToWordClient />
      </div>
    </ToolAuthWrapper>
  );
}
