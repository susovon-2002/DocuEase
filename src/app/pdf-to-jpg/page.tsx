import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function PdfToJpgPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="PDF to JPG"
        description="Convert each page of your PDF into high-quality JPG images."
      />
    </div>
  );
}
