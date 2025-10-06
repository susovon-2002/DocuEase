import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function JpgToPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="JPG to PDF"
        description="Combine one or more JPG images into a single, easy-to-share PDF file."
      />
    </div>
  );
}
