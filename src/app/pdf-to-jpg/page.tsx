import { PdfToJpgClient } from './PdfToJpgClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function PdfToJpgPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <PdfToJpgClient />
      </div>
    </ToolAuthWrapper>
  );
}
