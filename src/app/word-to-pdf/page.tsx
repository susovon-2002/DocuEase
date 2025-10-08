import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function WordToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <FileUploadPlaceholder
          title="Word to PDF"
          description="Convert your Microsoft Word documents to PDF format with high fidelity."
        />
      </div>
    </ToolAuthWrapper>
  );
}
