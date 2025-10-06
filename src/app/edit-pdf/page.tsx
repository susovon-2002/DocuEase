import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function EditPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Edit PDF"
        description="Modify text, images, and links directly in your PDF. A simple and effective online editor."
      />
    </div>
  );
}
