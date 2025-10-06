import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function PdfToWordPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="PDF to Word"
        description="Convert your PDFs to editable Word documents with accurate text recognition."
      />
    </div>
  );
}
