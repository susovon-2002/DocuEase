
export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Return &amp; Refund Policy</h1>
      <div className="prose dark:prose-invert max-w-none">
        <h2>Return Policy</h2>
        <ul>
          <li>Returns are accepted within 7 days of delivery for damaged or defective items.</li>
          <li>Items must be unused and returned in their original packaging.</li>
          <li>Proof of damage (photo/video) may be required for return approval.</li>
        </ul>

        <h2>Exchange / Replacement Policy</h2>
        <ul>
          <li>Exchange or replacement requests must be made within 7 days of delivery.</li>
          <li>Once approved, the exchanged or replaced product will be dispatched within 2–3 business Days and delivered with in 3-7 business days after the returned item is received and inspected.</li>
          <li>Delivery timelines may vary depending on location, but typically replacements will reach you within 7–10 business days.</li>
        </ul>
        
        <h2>Refund Policy</h2>
        <ul>
            <li>Once a return request is approved, we will process the refund within 3–5 business days.</li>
            <li>After processing, the refund will be credited to the original mode of payment within 7–10 business days, depending on the payment provider/bank.</li>
            <li>Shipping charges are non-refundable.</li>
        </ul>
      </div>
    </div>
  );
}
