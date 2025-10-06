import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function OptimizePdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Optimize PDF"
        description="Optimize your PDF for fast web viewing, ensuring a smooth experience for your readers."
      />
    </div>
  );
}
