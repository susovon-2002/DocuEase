export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to DocuEase ("we," "our," or "us"). By accessing or using our
          website and services, you agree to be bound by these Terms of Service.
        </p>

        <h2>2. Use of Services</h2>
        <p>
          You agree to use our services only for lawful purposes. You are
          responsible for any content you upload and process. We are not liable
          for the content of your documents.
        </p>

        <h2>3. Document Processing and Storage</h2>
        <p>
          While we take measures to secure your documents during processing, we
          do not permanently store your files on our servers. Files are
          temporarily held for processing and are automatically deleted
          thereafter.
        </p>

        <h2>4. Disclaimer of Warranties</h2>
        <p>
          Our services are provided "as is" without any warranties, express or
          implied. We do not guarantee that the services will be error-free or
          uninterrupted.
        </p>

        <h2>5. Limitation of Liability</h2>
        <p>
          In no event shall DocuEase be liable for any indirect, incidental,
          special, consequential, or punitive damages arising out of your use of
          the service.
        </p>

        <h2>6. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. We will notify
          you of any changes by posting the new Terms of Service on this page.
        </p>

        <h2>7. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us through
          our contact page.
        </p>
      </div>
    </div>
  );
}
