import { NextRequest, NextResponse } from 'next/server';
import { calculateEstimate, validateServiceZip, getOrCreatePricingMatrix } from '@/lib/agent/pricingEngine';
import { createExecutionLog, saveLog } from '@/lib/agent/logger';
import { createStripeDepositInvoice } from '@/lib/agent/stripeService';
import { getAvailableCalendarSlots, invokeCalendarEventsInsert } from '@/lib/agent/calendarService';
import { Lead } from '@/types/agent';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      full_name = 'Customer',
      email = 'customer@example.com',
      phone = '555-0199',
      zip_code = '12202',
      industry_category = 'Software & Tech',
      project_type = 'General Inquiry',
      preferred_timeline = 'ASAP, this week',
      scope = 'General project service inquiry',
      photo_url,
      business_name
    } = body;

    // Dynamically retrieve or construct matrix for ANY category input
    const pricing_matrix = body.pricing_matrix || getOrCreatePricingMatrix(industry_category);
    const resolvedBusinessName = business_name || `AutonomOps (${pricing_matrix.industry_category})`;

    const customerId = `cust_${email.replace(/[^a-zA-Z0-9]/g, '')}_${zip_code}`;

    // 1. DISCOVERY & INTAKE AGENT (Gemini Flash simulation)
    const isZipValid = validateServiceZip(zip_code, pricing_matrix.service_zip_codes);

    if (!isZipValid) {
      const declineLog = createExecutionLog(
        'discovery',
        customerId,
        'ZIP_OUT_OF_SERVICE_AREA',
        {},
        `Politely declined intake for location ${zip_code}. Provided regional partner network referral info.`,
        [],
        false
      );
      saveLog(declineLog);

      return NextResponse.json({
        success: false,
        status: 'declined_out_of_area',
        message: `Thank you for reaching out to ${resolvedBusinessName}. Unfortunately, location / ZIP ${zip_code} is outside our current active service coverage (${pricing_matrix.service_zip_codes.join(', ')}). We recommend checking our partner alliance network.`,
        log: declineLog
      });
    }

    // Intake Success Log
    const intakeLog = createExecutionLog(
      'discovery',
      customerId,
      'INTAKE_SUCCESS',
      {},
      `Validated customer location (${zip_code}) for category [${pricing_matrix.industry_category}]. Extracted scope "${project_type}".`
    );
    saveLog(intakeLog);

    // 2. ESTIMATION ENGINE AGENT (Gemini Pro multimodal analysis)
    const assessment = calculateEstimate(scope, project_type, pricing_matrix);

    const estimatorLog = createExecutionLog(
      'estimator',
      customerId,
      assessment.dispatchPath === 'AUTO' ? 'ESTIMATE_APPROVED_AUTO' : 'ESTIMATE_FLAGGED_HUMAN_REVIEW',
      assessment.pricingBreakdown,
      `Calculated estimate quote $${assessment.pricingBreakdown.min_quote} - $${assessment.pricingBreakdown.max_quote} for [${pricing_matrix.industry_category}] (Base: $${assessment.pricingBreakdown.base_fee}, Hours: ${assessment.pricingBreakdown.estimated_hours}h, Multiplier: ${assessment.pricingBreakdown.complexity_factor}x). Decision rationale: ${assessment.decisionReason}`,
      assessment.safetyFlags
    );
    saveLog(estimatorLog);

    // 3. OPERATIONS & TRANSACTIONS AGENT
    let stripeInvoice = null;
    let calendarSlots = getAvailableCalendarSlots();
    let autoReservedSlot = null;

    if (assessment.dispatchPath === 'AUTO') {
      stripeInvoice = createStripeDepositInvoice(
        customerId,
        email,
        assessment.pricingBreakdown.deposit_amount,
        resolvedBusinessName
      );

      // Auto reserve default slot
      if (calendarSlots.length > 0) {
        autoReservedSlot = invokeCalendarEventsInsert({
          summary: `${project_type} - ${full_name} (${resolvedBusinessName})`,
          location: `ZIP / Remote ${zip_code}`,
          description: `Category: ${pricing_matrix.industry_category}. Scope: ${scope}. Estimated Range: $${assessment.pricingBreakdown.min_quote}-$${assessment.pricingBreakdown.max_quote}`,
          startTime: calendarSlots[0].iso,
          endTime: new Date(new Date(calendarSlots[0].iso).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          attendeeEmail: email
        });
      }

      const opsLog = createExecutionLog(
        'operations',
        customerId,
        'DEPOSIT_INVOICE_GENERATED',
        {
          min_quote: assessment.pricingBreakdown.min_quote,
          deposit_amount: assessment.pricingBreakdown.deposit_amount
        },
        `Invoked stripe.invoices.create for ${pricing_matrix.deposit_percentage}% deposit ($${assessment.pricingBreakdown.deposit_amount}). Reserved booking slot ${autoReservedSlot?.formatted_time}.`
      );
      saveLog(opsLog);
    } else {
      const opsLog = createExecutionLog(
        'operations',
        customerId,
        'ROUTED_TO_OWNER_REVIEW_QUEUE',
        assessment.pricingBreakdown,
        `Flagged for owner review. Reason: ${assessment.decisionReason}. Escalation alert dispatched to owner dashboard.`
      );
      saveLog(opsLog);
    }

    const lead: Lead = {
      id: `lead_${Date.now()}`,
      customer_id: customerId,
      full_name,
      email,
      phone,
      zip_code,
      industry_category: pricing_matrix.industry_category,
      project_type,
      preferred_timeline,
      scope,
      photo_url,
      dispatch_path: assessment.dispatchPath,
      status: assessment.dispatchPath === 'AUTO' ? 'estimate_delivered' : 'escalated',
      pricing_breakdown: assessment.pricingBreakdown,
      safety_flags: assessment.safetyFlags,
      stripe_payment_link: stripeInvoice?.checkout_url,
      stripe_invoice_id: stripeInvoice?.invoice_id,
      calendar_slot: autoReservedSlot?.formatted_time,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      lead,
      assessment,
      stripeInvoice,
      calendarSlots,
      autoReservedSlot
    });
  } catch (error: any) {
    console.error('Error in intake route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
