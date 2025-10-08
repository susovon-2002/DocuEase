import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function ComparePdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <FileUploadPlaceholder
          title="Compare PDF"
          description="Upload two PDF files to see the differences in their content and layout side-by-side."
        />
      </div>
    </ToolAuthWrapper>
  );
}
