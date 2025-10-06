import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function SplitPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Split PDF"
        description="Separate one page or a whole set for easy conversion into independent PDF files."
      />
    </div>
  );
}
