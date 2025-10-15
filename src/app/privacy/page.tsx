
export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p>
          This Privacy Policy outlines how personal information is collected, used, and safeguarded when you interact with this website. By accessing or using the website, you agree to the practices described below.
        </p>

        <h2>1. Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul>
          <li>
            <strong>Personal Information:</strong> Name, phone number, email address, billing/shipping address.
          </li>
          <li>
            <strong>Payment Information:</strong> Used to process orders securely through third-party payment gateways.
          </li>
          <li>
            <strong>Technical Information:</strong> IP address, browser type, device information, and usage data via cookies or similar technologies.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To process and deliver orders.</li>
          <li>To send transactional communications such as order updates or shipping alerts.</li>
          <li>To respond to customer inquiries or service requests.</li>
          <li>To improve website functionality, services, and user experience.</li>
          <li>For marketing purposes (only with your explicit consent).</li>
        </ul>

        <h2>3. Data Sharing</h2>
        <ul>
          <li>We do not sell, rent, or trade your personal data.</li>
          <li>
            We may share necessary information with third-party service providers such as payment gateways, delivery partners, or IT service providers — only to fulfill your order or maintain the website.
          </li>
          <li>
            Personal information may be disclosed if required by law or legal proceedings.
          </li>
        </ul>

        <h2>4. Data Security</h2>
        <ul>
          <li>
            We implement reasonable security measures to protect your data from unauthorized access, alteration, or disclosure.
          </li>
          <li>
            However, no online transmission is 100% secure. You acknowledge this risk when using the site.
          </li>
        </ul>

        <h2>5. Cookies and Tracking Technologies</h2>
        <ul>
            <li>Cookies are used to personalize your experience, analyze site traffic, and provide relevant ads.</li>
            <li>You can manage or disable cookies via your browser settings, although this may affect site functionality.</li>
        </ul>

        <h2>6. Third-Party Links</h2>
        <p>
          This website may contain links to third-party websites. We are not responsible for the privacy practices or content of those websites.
        </p>

        <h2>7. Your Rights</h2>
        <ul>
            <li>You may request access to or correction of your personal data.</li>
            <li>You may opt out of marketing communications at any time.</li>
        </ul>

        <h2>8. Changes to This Policy</h2>
        <p>
          This privacy policy may be updated periodically. Continued use of the website after changes indicates acceptance of the revised policy.
        </p>
      </div>
    </div>
  );
}
