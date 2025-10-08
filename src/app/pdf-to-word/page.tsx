import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function PdfToWordPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <FileUploadPlaceholder
          title="PDF to Word"
          description="Convert your PDFs to editable Word documents with accurate text recognition."
        />
      </div>
    </ToolAuthWrapper>
  );
}
