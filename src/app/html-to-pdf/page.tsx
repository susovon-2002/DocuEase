import { HtmlToPdfClient } from './HtmlToPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function HtmlToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <HtmlToPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
