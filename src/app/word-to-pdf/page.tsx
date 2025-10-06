import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function WordToPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Word to PDF"
        description="Convert your Microsoft Word documents to PDF format with high fidelity."
      />
    </div>
  );
}
