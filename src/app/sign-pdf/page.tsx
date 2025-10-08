import { SignPdfClient } from './SignPdfClient';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function SignPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <SignPdfClient />
      </div>
    </ToolAuthWrapper>
  );
}
