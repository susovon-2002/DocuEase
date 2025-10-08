import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function ExcelToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <FileUploadPlaceholder
          title="Excel to PDF"
          description="Convert your Excel spreadsheets into professional PDF documents."
        />
      </div>
    </ToolAuthWrapper>
  );
}
