import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function PdfToPdfaPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="PDF to PDF/A"
        description="Convert your PDF files to PDF/A, the ISO-standardized version of PDF for long-term archiving."
      />
    </div>
  );
}
