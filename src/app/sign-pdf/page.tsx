import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function SignPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Sign PDF"
        description="Sign your PDF documents online. Create your signature, upload it, or draw it."
      />
    </div>
  );
}
