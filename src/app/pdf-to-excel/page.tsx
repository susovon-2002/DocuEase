import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function PdfToExcelPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <FileUploadPlaceholder
          title="PDF to Excel"
          description="Extract tables and data from your PDFs and convert them into editable Excel spreadsheets."
        />
      </div>
    </ToolAuthWrapper>
  );
}
