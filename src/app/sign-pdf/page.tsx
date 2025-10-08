import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function SignPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <FileUploadPlaceholder
          title="Sign PDF"
          description="Sign your PDF documents online. Create your signature, upload it, or draw it."
        />
      </div>
    </ToolAuthWrapper>
  );
}
