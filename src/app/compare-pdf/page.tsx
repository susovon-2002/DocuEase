import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function ComparePdfPage() {
  return (
      <div className="py-12">
        <FileUploadPlaceholder
          title="Compare PDF"
          description="Upload two PDF files to see the differences in their content and layout side-by-side."
        />
      </div>
  );
}
