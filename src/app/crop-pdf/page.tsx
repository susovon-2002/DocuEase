import { CropPdfClient } from './CropPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function CropPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <CropPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
