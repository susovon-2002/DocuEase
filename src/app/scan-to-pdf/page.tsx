import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function ScanToPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Scan to PDF"
        description="Convert your physical documents into digital PDF files using your scanner."
      />
    </div>
  );
}
