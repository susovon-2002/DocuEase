import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function ExtractPagesPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Extract Pages"
        description="Select and extract specific pages from a PDF to create a new, smaller document."
      />
    </div>
  );
}
