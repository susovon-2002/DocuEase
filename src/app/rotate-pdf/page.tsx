import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function RotatePdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Rotate PDF"
        description="Rotate one or all pages in your PDF. You can rotate them 90 degrees clockwise, counter-clockwise, or 180 degrees."
      />
    </div>
  );
}
