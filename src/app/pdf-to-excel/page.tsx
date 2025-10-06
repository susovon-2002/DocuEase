import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function PdfToExcelPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="PDF to Excel"
        description="Extract tables and data from your PDFs and convert them into editable Excel spreadsheets."
      />
    </div>
  );
}
