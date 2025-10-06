import { FileUploadPlaceholder } from '@/components/FileUploadPlaceholder';

export default function HtmlToPdfPage() {
  return (
    <div className="py-12">
      <FileUploadPlaceholder
        title="HTML to PDF"
        description="Convert web pages to PDF documents. Enter a URL or upload an HTML file."
      />
    </div>
  );
}
