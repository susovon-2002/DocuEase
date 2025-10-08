import { OcrPdfClient } from './OcrPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function OcrPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <OcrPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
