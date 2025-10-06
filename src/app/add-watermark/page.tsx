import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function AddWatermarkPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Add Watermark"
        description="Stamp an image or text over your PDF in seconds. Choose the typography, transparency, and position."
      />
    </div>
  );
}
