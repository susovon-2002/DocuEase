import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function OcrPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="OCR PDF"
        description="Recognize text in your scanned PDFs to make them searchable and editable."
      />
    </div>
  );
}
