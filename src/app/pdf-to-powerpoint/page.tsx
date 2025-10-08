import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function PdfToPowerpointPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <FileUploadPlaceholder
          title="PDF to PowerPoint"
          description="Turn your PDF presentations into editable PowerPoint slides."
        />
      </div>
    </ToolAuthWrapper>
  );
}
