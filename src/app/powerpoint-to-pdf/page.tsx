import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function PowerpointToPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="PowerPoint to PDF"
        description="Convert your PowerPoint presentations to PDF for easy sharing and viewing."
      />
    </div>
  );
}
