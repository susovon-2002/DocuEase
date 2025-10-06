import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function UnlockPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Unlock PDF"
        description="Remove password protection from your PDF files to easily access and edit them."
      />
    </div>
  );
}
