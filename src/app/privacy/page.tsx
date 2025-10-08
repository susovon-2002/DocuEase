export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Introduction</h2>
        <p>
          DocuEase ("we," "our," or "us") is committed to protecting your
          privacy. This Privacy Policy explains how we collect, use, and
          disclose your information.
        </p>

        <h2>2. Information We Collect</h2>
        <p>
          We may collect personal information that you provide to us, such as
          your name and email address when you register for an account. We also
          temporarily process the documents you upload to provide our services.
        </p>

        <h2>3. How We Use Your Information</h2>
        <p>
          We use your personal information to provide and improve our services,
          communicate with you, and for security purposes. Document content is
          processed solely to perform the requested tool's function and is not
          stored or analyzed for other purposes.
        </p>

        <h2>4. Document Security and Retention</h2>
        <p>
          We use industry-standard security measures to protect your documents
          during upload and processing. All uploaded files are automatically
          deleted from our servers shortly after processing is complete.
        </p>

        <h2>5. Third-Party Services</h2>
        <p>
          We may use third-party services for analytics or payment processing.
          These services have their own privacy policies, and we recommend you
          review them.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          You have the right to access, update, or delete your personal
          information. You can manage your account information through your
          dashboard.
        </p>

        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by posting the new policy on this page.
        </p>
      </div>
    </div>
  );
}
