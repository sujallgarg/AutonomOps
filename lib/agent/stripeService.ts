export interface StripeInvoiceResponse {
  invoice_id: string;
  checkout_url: string;
  deposit_amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid';
  expires_at: string;
}

export function createStripeDepositInvoice(
  customerId: string,
  customerEmail: string,
  depositAmount: number,
  businessName: string
): StripeInvoiceResponse {
  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  // Simulated Stripe Checkout session URL
  const checkoutUrl = `https://checkout.stripe.com/pay/${invoiceId}?amount=${Math.round(depositAmount * 100)}&desc=${encodeURIComponent(
    `Deposit for ${businessName} Service Booking`
  )}`;

  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    invoice_id: invoiceId,
    checkout_url: checkoutUrl,
    deposit_amount: depositAmount,
    currency: 'usd',
    status: 'open',
    expires_at: expires
  };
}

export function processStripeWebhookSimulation(invoiceId: string) {
  return {
    event: 'checkout.session.completed',
    invoice_id: invoiceId,
    payment_status: 'paid',
    timestamp: new Date().toISOString()
  };
}
