import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function MergePdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="Merge PDF"
        description="Combine multiple PDF documents into one. Rearrange and organize files as you like."
      />
    </div>
  );
}
