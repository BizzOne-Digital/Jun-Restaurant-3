/**
 * Email helper — server-side only.
 * Never import this file from client components.
 *
 * Supported providers (EMAIL_PROVIDER):
 *   mailgun  — uses MAILGUN_API_KEY + MAILGUN_DOMAIN
 *   resend   — uses RESEND_API_KEY
 *   smtp     — uses SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
 *
 * Routing env vars:
 *   RESTAURANT_ID              — identifier used in log prefixes
 *   RESTAURANT_ORDER_EMAIL     — primary merchant recipient for new orders
 *   ADMIN_ORDER_EMAIL          — admin copy (can differ from order email)
 *   ORDER_CC_EMAIL             — CC address on all outgoing emails
 *   ORDER_SEND_CUSTOMER_CONFIRMATION — set "false" to skip customer emails
 *   ORDER_EMAIL_TRACE_LOG      — set "1" to enable verbose trace logging
 *   RESTAURANT_LOGO_URL        — Cloudinary/HTTPS logo URL for HTML emails
 */

import type { IOrder } from '@/types'
import { RESTAURANT_INFO } from '@/lib/constants'

// ── Config helpers ─────────────────────────────────────────────────────────────

const RESTAURANT_NAME = RESTAURANT_INFO.name

function traceLog(...args: unknown[]): void {
  if (process.env.ORDER_EMAIL_TRACE_LOG === '1') {
    const id = process.env.RESTAURANT_ID ?? 'restaurant'
    console.log(`[email:${id}]`, ...args)
  }
}

function getFromAddress(): string {
  // Prefer explicit MAILGUN_FROM (full RFC format), then MAILGUN_FROM_EMAIL
  if (process.env.MAILGUN_FROM) return process.env.MAILGUN_FROM
  const name = process.env.MAILGUN_FROM_NAME || RESTAURANT_NAME
  const email = process.env.MAILGUN_FROM_EMAIL ?? 'orders@merchantorders.io'
  return `${name} <${email}>`
}

function getMerchantRecipients(): string[] {
  // RESTAURANT_ORDER_EMAIL is primary; ADMIN_ORDER_EMAIL is secondary (deduplicated)
  const recipients = new Set<string>()
  if (process.env.RESTAURANT_ORDER_EMAIL) recipients.add(process.env.RESTAURANT_ORDER_EMAIL)
  if (process.env.ADMIN_ORDER_EMAIL) recipients.add(process.env.ADMIN_ORDER_EMAIL)
  // Fallback to legacy var or hardcoded default
  if (recipients.size === 0) {
    recipients.add(process.env.MAILGUN_ORDERS_EMAIL ?? 'orders@merchantorders.io')
  }
  return [...recipients]
}

function getCcAddress(): string | undefined {
  return process.env.ORDER_CC_EMAIL || undefined
}

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function logoHtml(): string {
  const logoUrl = process.env.RESTAURANT_LOGO_URL
  if (!logoUrl) return ''
  return `<div style="text-align:center;margin-bottom:24px;">
  <img src="${logoUrl}" alt="${RESTAURANT_NAME} logo" style="max-width:160px;height:auto;" />
</div>`
}

// ── Provider: send via Mailgun ─────────────────────────────────────────────────

async function sendViaMailgun(params: {
  from: string
  to: string[]
  cc?: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN

  if (!apiKey || !domain) {
    console.warn('[email] MAILGUN_API_KEY or MAILGUN_DOMAIN is not set — skipping')
    return
  }

  const Mailgun = (await import('mailgun.js')).default
  const FormData = (await import('form-data')).default
  const mg = new Mailgun(FormData)
  const client = mg.client({ username: 'api', key: apiKey })

  const payload: Record<string, unknown> = {
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  }
  if (params.cc) payload['cc'] = params.cc

  traceLog('sendViaMailgun →', { to: params.to, cc: params.cc, subject: params.subject })
  await client.messages.create(domain, payload as Parameters<typeof client.messages.create>[1])
}

// ── Provider: send via Resend ──────────────────────────────────────────────────

async function sendViaResend(params: {
  from: string
  to: string[]
  cc?: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY is not set — skipping')
    return
  }

  traceLog('sendViaResend →', { to: params.to, cc: params.cc, subject: params.subject })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      cc: params.cc ? [params.cc] : undefined,
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error ${res.status}: ${body}`)
  }
}

// ── Provider: send via SMTP ────────────────────────────────────────────────────

async function sendViaSmtp(params: {
  from: string
  to: string[]
  cc?: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    console.warn('[email] SMTP_HOST/PORT/USER/PASS not fully set — skipping')
    return
  }

  // nodemailer is not installed by default — install it if you want SMTP support:
  //   npm install nodemailer @types/nodemailer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nodemailer: any
  try {
    nodemailer = await import('nodemailer' as string)
  } catch {
    console.error('[email] nodemailer is not installed. Run: npm install nodemailer')
    return
  }

  traceLog('sendViaSmtp →', { to: params.to, cc: params.cc, subject: params.subject })

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  })

  await transporter.sendMail({
    from: params.from,
    to: params.to.join(', '),
    cc: params.cc,
    subject: params.subject,
    html: params.html,
    text: params.text,
  })
}

// ── Unified send dispatcher ────────────────────────────────────────────────────

async function sendEmail(params: {
  from: string
  to: string[]
  cc?: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER ?? 'mailgun').toLowerCase()

  traceLog(`dispatch via provider="${provider}"`, { to: params.to, subject: params.subject })

  switch (provider) {
    case 'resend':
      return sendViaResend(params)
    case 'smtp':
      return sendViaSmtp(params)
    case 'mailgun':
    default:
      return sendViaMailgun(params)
  }
}

// ── Email templates ────────────────────────────────────────────────────────────

function buildMerchantEmailContent(order: IOrder): { html: string; text: string } {
  const customerName = order.customerName ?? order.deliveryAddress?.fullName ?? 'Unknown'
  const customerEmail = order.customerEmail ?? 'Not provided'
  const customerPhone = order.customerPhone ?? order.deliveryAddress?.phone ?? 'Not provided'
  const isPickup = order.orderType === 'pickup'
  const orderTypeLabel = isPickup ? 'Pickup' : 'Delivery'

  const deliveryInfo = isPickup
    ? `<strong>Pickup</strong> — ${RESTAURANT_INFO.address}`
    : order.deliveryAddress
      ? [
          order.deliveryAddress.fullName,
          order.deliveryAddress.streetAddress,
          `${order.deliveryAddress.suburb} ${order.deliveryAddress.state} ${order.deliveryAddress.postcode}`,
          order.deliveryAddress.phone,
          order.deliveryAddress.notes ? `Notes: ${order.deliveryAddress.notes}` : '',
        ]
          .filter(Boolean)
          .join('<br />')
      : 'Not provided'

  const itemsHtml = order.items
    .map(
      (item) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${item.nameSnapshot}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.priceSnapshot)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.priceSnapshot * item.quantity)}</td>
      </tr>`
    )
    .join('')

  const itemsText = order.items
    .map((item) => `  ${item.nameSnapshot} x${item.quantity} — ${formatPrice(item.priceSnapshot * item.quantity)}`)
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#c0392b;padding:24px 32px;text-align:center;">
      ${logoHtml()}
      <h1 style="color:#fff;margin:0;font-size:22px;">New Order Received</h1>
      <p style="color:#ffd5d5;margin:8px 0 0;font-size:14px;">${RESTAURANT_NAME}</p>
    </div>
    <div style="padding:32px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;color:#666;width:40%;">Order Number</td><td style="padding:8px 0;font-weight:bold;color:#c0392b;font-family:monospace;">#${order.orderNumber}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Order Date</td><td style="padding:8px 0;">${formatDate(order.createdAt)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Order Type</td><td style="padding:8px 0;">${orderTypeLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Payment Status</td><td style="padding:8px 0;font-weight:bold;color:#27ae60;">${order.paymentStatus === 'paid' ? '✅ Paid' : order.paymentStatus}</td></tr>
        ${order.paymentIntentId ? `<tr><td style="padding:8px 0;color:#666;">Stripe ID</td><td style="padding:8px 0;font-family:monospace;font-size:12px;">${order.paymentIntentId}</td></tr>` : ''}
      </table>

      <h2 style="font-size:16px;border-bottom:2px solid #eee;padding-bottom:8px;margin-bottom:16px;">Customer Details</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#666;width:40%;">Name</td><td style="padding:6px 0;">${customerName}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;">${customerEmail}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Phone</td><td style="padding:6px 0;">${customerPhone}</td></tr>
      </table>

      <h2 style="font-size:16px;border-bottom:2px solid #eee;padding-bottom:8px;margin-bottom:16px;">${orderTypeLabel} Details</h2>
      <p style="margin:0 0 24px;color:#333;line-height:1.6;">${deliveryInfo}</p>

      <h2 style="font-size:16px;border-bottom:2px solid #eee;padding-bottom:8px;margin-bottom:16px;">Items Ordered</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="padding:8px;text-align:left;font-size:13px;color:#666;">Item</th>
            <th style="padding:8px;text-align:center;font-size:13px;color:#666;">Qty</th>
            <th style="padding:8px;text-align:right;font-size:13px;color:#666;">Unit Price</th>
            <th style="padding:8px;text-align:right;font-size:13px;color:#666;">Line Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#666;">Subtotal</td><td style="padding:6px 0;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Tip (${order.tipPercentage}%)</td><td style="padding:6px 0;text-align:right;">${formatPrice(order.tipAmount)}</td></tr>
        <tr style="border-top:2px solid #eee;">
          <td style="padding:10px 0;font-weight:bold;font-size:16px;">Total</td>
          <td style="padding:10px 0;text-align:right;font-weight:bold;font-size:16px;color:#c0392b;">${formatPrice(order.total)} AUD</td>
        </tr>
      </table>
    </div>
    <div style="background:#f9f9f9;padding:16px 32px;text-align:center;font-size:12px;color:#999;">
      ${RESTAURANT_NAME} · ${RESTAURANT_INFO.address}
    </div>
  </div>
</body>
</html>`

  const deliveryTextBlock = isPickup
    ? `Pickup at: ${RESTAURANT_INFO.address}`
    : order.deliveryAddress
      ? [
          order.deliveryAddress.fullName,
          order.deliveryAddress.streetAddress,
          `${order.deliveryAddress.suburb} ${order.deliveryAddress.state} ${order.deliveryAddress.postcode}`,
          `Phone: ${order.deliveryAddress.phone}`,
          order.deliveryAddress.notes ? `Notes: ${order.deliveryAddress.notes}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      : 'Not provided'

  const text = `NEW ORDER RECEIVED — ${RESTAURANT_NAME}
${'='.repeat(50)}

Order Number: #${order.orderNumber}
Order Date:   ${formatDate(order.createdAt)}
Order Type:   ${orderTypeLabel}
Payment:      ${order.paymentStatus === 'paid' ? 'PAID' : order.paymentStatus}
${order.paymentIntentId ? `Stripe ID:    ${order.paymentIntentId}` : ''}

CUSTOMER
--------
Name:  ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}

${orderTypeLabel.toUpperCase()} DETAILS
${'-'.repeat(orderTypeLabel.length + 9)}
${deliveryTextBlock}

ITEMS ORDERED
-------------
${itemsText}

TOTALS
------
Subtotal: ${formatPrice(order.subtotal)}
Tip (${order.tipPercentage}%): ${formatPrice(order.tipAmount)}
Total: ${formatPrice(order.total)} AUD
`

  return { html, text }
}

function buildCustomerEmailContent(order: IOrder): { html: string; text: string } {
  const customerName = order.customerName ?? order.deliveryAddress?.fullName ?? 'Valued Customer'
  const isPickup = order.orderType === 'pickup'
  const orderTypeLabel = isPickup ? 'Pickup' : 'Delivery'

  const pickupDeliveryHtml = isPickup
    ? `<p style="margin:0;"><strong>Pickup Location:</strong><br />${RESTAURANT_INFO.address}</p>`
    : order.deliveryAddress
      ? `<p style="margin:0;"><strong>Delivery Address:</strong><br />
          ${order.deliveryAddress.streetAddress}<br />
          ${order.deliveryAddress.suburb} ${order.deliveryAddress.state} ${order.deliveryAddress.postcode}
        </p>`
      : ''

  const itemsHtml = order.items
    .map(
      (item) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${item.nameSnapshot}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.priceSnapshot * item.quantity)}</td>
      </tr>`
    )
    .join('')

  const itemsText = order.items
    .map((item) => `  ${item.nameSnapshot} x${item.quantity} — ${formatPrice(item.priceSnapshot * item.quantity)}`)
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#c0392b;padding:24px 32px;text-align:center;">
      ${logoHtml()}
      <h1 style="color:#fff;margin:0;font-size:22px;">Order Confirmed!</h1>
      <p style="color:#ffd5d5;margin:8px 0 0;font-size:14px;">Thank you for your order, ${customerName}</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#333;margin:0 0 24px;line-height:1.6;">
        We've received your order and we're getting it ready. Here's a summary of what you ordered.
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;color:#666;width:40%;">Order Number</td><td style="padding:8px 0;font-weight:bold;color:#c0392b;font-family:monospace;">#${order.orderNumber}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Order Date</td><td style="padding:8px 0;">${formatDate(order.createdAt)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Order Type</td><td style="padding:8px 0;">${orderTypeLabel}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Payment</td><td style="padding:8px 0;font-weight:bold;color:#27ae60;">${order.paymentStatus === 'paid' ? '✅ Paid' : order.paymentStatus}</td></tr>
      </table>

      <div style="background:#fff8f0;border:1px solid #ffe0b2;border-radius:8px;padding:16px;margin-bottom:24px;">
        ${pickupDeliveryHtml}
        <p style="margin:${isPickup || order.deliveryAddress ? '12px' : '0'} 0 0;color:#e65100;font-size:14px;">
          ⏱️ Estimated ${isPickup ? 'pickup' : 'delivery'} time: <strong>20–35 minutes</strong>
        </p>
      </div>

      <h2 style="font-size:16px;border-bottom:2px solid #eee;padding-bottom:8px;margin-bottom:16px;">Your Order</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="padding:8px;text-align:left;font-size:13px;color:#666;">Item</th>
            <th style="padding:8px;text-align:center;font-size:13px;color:#666;">Qty</th>
            <th style="padding:8px;text-align:right;font-size:13px;color:#666;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#666;">Subtotal</td><td style="padding:6px 0;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Tip (${order.tipPercentage}%)</td><td style="padding:6px 0;text-align:right;">${formatPrice(order.tipAmount)}</td></tr>
        <tr style="border-top:2px solid #eee;">
          <td style="padding:10px 0;font-weight:bold;font-size:16px;">Total</td>
          <td style="padding:10px 0;text-align:right;font-weight:bold;font-size:16px;color:#c0392b;">${formatPrice(order.total)} AUD</td>
        </tr>
      </table>

      <p style="color:#666;font-size:13px;margin:0;">
        Questions? Contact us at ${RESTAURANT_INFO.address}.
      </p>
    </div>
    <div style="background:#f9f9f9;padding:16px 32px;text-align:center;font-size:12px;color:#999;">
      ${RESTAURANT_NAME} · ${RESTAURANT_INFO.address}
    </div>
  </div>
</body>
</html>`

  const pickupDeliveryText = isPickup
    ? `PICKUP LOCATION\n---------------\n${RESTAURANT_INFO.address}`
    : order.deliveryAddress
      ? `DELIVERY ADDRESS\n----------------\n${order.deliveryAddress.streetAddress}\n${order.deliveryAddress.suburb} ${order.deliveryAddress.state} ${order.deliveryAddress.postcode}`
      : ''

  const text = `ORDER CONFIRMED — ${RESTAURANT_NAME}
${'='.repeat(50)}

Hi ${customerName},

Thank you for your order! Here's your confirmation.

Order Number: #${order.orderNumber}
Order Date:   ${formatDate(order.createdAt)}
Order Type:   ${orderTypeLabel}
Payment:      ${order.paymentStatus === 'paid' ? 'PAID' : order.paymentStatus}

${pickupDeliveryText}

Estimated ${isPickup ? 'pickup' : 'delivery'} time: 20–35 minutes

YOUR ORDER
----------
${itemsText}

TOTALS
------
Subtotal: ${formatPrice(order.subtotal)}
Tip (${order.tipPercentage}%): ${formatPrice(order.tipAmount)}
Total: ${formatPrice(order.total)} AUD

Thank you for choosing ${RESTAURANT_NAME}!
`

  return { html, text }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Send new order notification to merchant (RESTAURANT_ORDER_EMAIL + ADMIN_ORDER_EMAIL).
 * CC goes to ORDER_CC_EMAIL if set.
 */
export async function sendMerchantOrderEmail(order: IOrder): Promise<void> {
  const to = getMerchantRecipients()
  const cc = getCcAddress()
  const from = getFromAddress()
  const { html, text } = buildMerchantEmailContent(order)
  const subject = `New order received - ${RESTAURANT_NAME} - Order #${order.orderNumber}`

  traceLog('sendMerchantOrderEmail', { to, cc, subject })

  try {
    await sendEmail({ from, to, cc, subject, html, text })
    console.log(`[email] Merchant order email sent for order #${order.orderNumber} → ${to.join(', ')}${cc ? ` (cc: ${cc})` : ''}`)
  } catch (err) {
    console.error(`[email] Failed to send merchant order email for #${order.orderNumber}:`, err)
    throw err
  }
}

/**
 * Send order confirmation to the customer.
 * Skipped if ORDER_SEND_CUSTOMER_CONFIRMATION=false or customer email is missing.
 * CC goes to ORDER_CC_EMAIL if set.
 */
export async function sendCustomerConfirmationEmail(order: IOrder): Promise<void> {
  if (process.env.ORDER_SEND_CUSTOMER_CONFIRMATION === 'false') {
    traceLog('sendCustomerConfirmationEmail skipped — ORDER_SEND_CUSTOMER_CONFIRMATION=false')
    return
  }

  const customerEmail = order.customerEmail
  if (!customerEmail) {
    console.warn(`[email] No customer email on order #${order.orderNumber} — skipping customer confirmation`)
    return
  }

  const cc = getCcAddress()
  const from = getFromAddress()
  const { html, text } = buildCustomerEmailContent(order)
  const subject = `Your ${RESTAURANT_NAME} order confirmation - Order #${order.orderNumber}`

  traceLog('sendCustomerConfirmationEmail', { to: customerEmail, cc, subject })

  try {
    await sendEmail({ from, to: [customerEmail], cc, subject, html, text })
    console.log(`[email] Customer confirmation email sent to ${customerEmail} for order #${order.orderNumber}`)
  } catch (err) {
    console.error(`[email] Failed to send customer confirmation email for #${order.orderNumber}:`, err)
    throw err
  }
}
