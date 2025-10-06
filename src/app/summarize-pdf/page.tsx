import SummarizeForm from './SummarizeForm';

export default function SummarizePdfPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Smart PDF Summarizer</h1>
          <p className="text-muted-foreground mt-2">
            Upload your PDF and let our AI provide a concise summary. Choose your desired length.
          </p>
        </div>
        <SummarizeForm />
      </div>
    </div>
  );
}
