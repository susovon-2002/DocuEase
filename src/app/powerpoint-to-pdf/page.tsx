import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';
import { ToolAuthWrapper } from '@/components/ToolAuthWrapper';

export default function PowerpointToPdfPage() {
  return (
    <ToolAuthWrapper>
      <div className="py-12">
        <FileUploadPlaceholder
          title="PowerPoint to PDF"
          description="Convert your PowerPoint presentations to PDF for easy sharing and viewing."
        />
      </div>
    </ToolAuthWrapper>
  );
}
