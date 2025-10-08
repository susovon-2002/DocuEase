import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function RedactPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <FileUploadPlaceholder
          title="Redact PDF"
          description="Permanently remove sensitive text and images from your PDF document. This feature is not yet available."
        />
      </div>
    </ToolAuthWrapper>
  );
}
