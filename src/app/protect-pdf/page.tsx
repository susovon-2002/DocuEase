import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function ProtectPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Protect PDF"
        description="Encrypt your PDF with a password to prevent unauthorized access."
      />
    </div>
  );
}
