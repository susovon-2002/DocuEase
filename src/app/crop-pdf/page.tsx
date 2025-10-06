import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function CropPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Crop PDF"
        description="Easily trim the margins of your PDF pages to focus on the content that matters."
      />
    </div>
  );
}
