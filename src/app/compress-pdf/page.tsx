import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function CompressPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Compress PDF"
        description="Reduce the file size of your PDF while optimizing for maximal quality."
      />
    </div>
  );
}
