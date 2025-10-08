import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function HtmlToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <FileUploadPlaceholder
          title="HTML to PDF"
          description="Convert web pages to PDF documents. Enter a URL or upload an HTML file."
        />
      </div>
    </ToolAuthWrapper>
  );
}
