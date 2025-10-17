
export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Shipping Policy</h1>
      <div className="prose dark:prose-invert max-w-none">
        <p>Orders are typically processed within 1–3 business days.</p>

        <h2>Delivery Time</h2>
        <ul>
          <li><strong>Standard:</strong> 5–10 business days.</li>
          <li><strong>Express:</strong> 3-5 business days.</li>
        </ul>

        <p>Tracking details are shared once the order is shipped.</p>

        <p>The business is not responsible for delays due to courier services or unforeseen circumstances.</p>
      </div>
    </div>
  );
}
