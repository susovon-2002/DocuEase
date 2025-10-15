import { ExcelToPdfClient } from './ExcelToPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function ExcelToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <ExcelToPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
