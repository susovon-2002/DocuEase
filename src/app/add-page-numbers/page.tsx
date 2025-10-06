import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function AddPageNumbersPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Add Page Numbers"
        description="Insert page numbers into your PDF with ease. Customize position, format, and range."
      />
    </div>
  );
}
