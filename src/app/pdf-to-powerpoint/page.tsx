import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function PdfToPowerpointPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="PDF to PowerPoint"
        description="Turn your PDF presentations into editable PowerPoint slides."
      />
    </div>
  );
}
