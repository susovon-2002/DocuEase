import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function RemovePagesPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Remove Pages"
        description="Easily delete one or more pages from your PDF file. A simple way to clean up your documents."
      />
    </div>
  );
}
