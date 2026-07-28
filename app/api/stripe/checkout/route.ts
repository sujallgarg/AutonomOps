import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, title, email, name, type, leadId, returnUrl } = body;

    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    const paymentLink = process.env.STRIPE_PAYMENT_LINK || process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || '';
    const origin = req.nextUrl.origin || 'http://localhost:3000';

    // 1. If user pasted a direct Stripe Payment Link (e.g. https://buy.stripe.com/...)
    const isValidPaymentLink = paymentLink.startsWith('http://') || paymentLink.startsWith('https://');
    const isPlaceholderPaymentLink = paymentLink.includes('your_custom_stripe_payment_link');

    if (isValidPaymentLink && !isPlaceholderPaymentLink) {
      return NextResponse.json({
        success: true,
        isCustomLink: true,
        url: paymentLink
      });
    }

    // 2. Check if user has pasted a real valid Stripe Secret Key in .env.local
    const isRealStripeKeyConfigured = secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_');
    const isPlaceholderKey = secretKey.includes('YOUR_STRIPE_SECRET_KEY');

    if (isRealStripeKeyConfigured && !isPlaceholderKey) {
      try {
        const stripe = new Stripe(secretKey, {
          apiVersion: '2024-04-10' as any
        });

        // Create Official Real Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: title || 'AutonomOps Service Payment',
                  description: `AutonomOps Enterprise Payment - ${type}`
                },
                unit_amount: Math.round((Number(amount) || 5.0) * 100)
              },
              quantity: 1
            }
          ],
          mode: 'payment',
          customer_email: email || undefined,
          success_url: `${origin}/checkout/stripe?payment=success&type=${type || 'subscription'}&amount=${amount || 5.0}&leadId=${leadId || ''}&email=${encodeURIComponent(email || '')}&name=${encodeURIComponent(name || '')}&returnUrl=${encodeURIComponent(returnUrl || '/dashboard')}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}${returnUrl || '/dashboard'}?payment=cancelled`
        });

        return NextResponse.json({
          success: true,
          isRealStripe: true,
          url: session.url
        });
      } catch (stripeErr: any) {
        console.warn('Stripe SDK Initialization Warning (Falling back to Gateway UI):', stripeErr.message);
      }
    }

    // Fallback response when key is not yet pasted in .env.local
    const fallbackCheckoutUrl = `${origin}/checkout/stripe?type=${type || 'subscription'}&amount=${amount || 5.0}&title=${encodeURIComponent(title || 'Service Payment')}&email=${encodeURIComponent(email || '')}&name=${encodeURIComponent(name || '')}&leadId=${leadId || ''}&returnUrl=${encodeURIComponent(returnUrl || '/dashboard')}`;

    return NextResponse.json({
      success: true,
      isRealStripe: false,
      url: fallbackCheckoutUrl,
      message: 'Paste your STRIPE_SECRET_KEY in .env.local to enable Hosted Stripe Checkout redirection.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
