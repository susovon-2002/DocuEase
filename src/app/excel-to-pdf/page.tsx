import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function ExcelToPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Excel to PDF"
        description="Convert your Excel spreadsheets into professional PDF documents."
      />
    </div>
  );
}
