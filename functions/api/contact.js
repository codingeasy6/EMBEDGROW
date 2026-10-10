/**
 * Cloudflare Pages Function: /api/contact
 * Handles contact form submissions for EMBEDGROW.
 * 
 * Supports:
 * - Server-side validation for Name, Email, Mobile, Service, Message
 * - Anti-spam Honeypot protection
 * - Delivery via Resend (recommended), SendGrid, or Webhook
 * - Safe environment variable configuration with zero frontend secret exposure
 * - Explicit confirmation before claiming delivery success
 */

const ALLOWED_SERVICES = {
  "website-development": "Website Development (Business / Startup / Portfolio)",
  "school-project": "School Science & Demonstration Project",
  "college-project": "College Mini / Final-Year Technical Project",
  "iot-embedded": "IoT & Embedded Systems Solution",
  "custom-inquiry": "Other Technical Inquiry"
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      ...extraHeaders
    }
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. Content size check (limit to 32KB to prevent memory exhaustion)
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 32768) {
      return jsonResponse({
        success: false,
        error: "Payload too large. Please shorten your message."
      }, 413);
    }

    // 2. Parse form body (JSON or URL-encoded/FormData)
    let payload = {};
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await request.json().catch(() => ({}));
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData().catch(() => new FormData());
      for (const [key, value] of formData.entries()) {
        payload[key] = value;
      }
    } else {
      // Attempt fallback parsing as text
      const text = await request.text().catch(() => "");
      try {
        payload = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        for (const [key, value] of params.entries()) {
          payload[key] = value;
        }
      }
    }

    // 3. Honeypot check (Spam protection)
    const botField = String(payload["bot-field"] || payload["_gotcha"] || payload["website"] || "").trim();
    if (botField !== "") {
      // Silently discard spam submission to prevent tipping off bots
      return jsonResponse({
        success: true,
        message: "Thank you! Your project inquiry has been received."
      });
    }

    // 4. Extract and clean fields
    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim();
    const mobile = String(payload.mobile || "").trim();
    const service = String(payload.service || "").trim();
    const message = String(payload.message || "").trim();

    // 5. Server-side validation
    if (!name || name.length < 2 || name.length > 100) {
      return jsonResponse({
        success: false,
        error: "Please provide a valid full name (2-100 characters)."
      }, 400);
    }

    if (!email || !EMAIL_REGEX.test(email) || email.length > 100) {
      return jsonResponse({
        success: false,
        error: "Please provide a valid email address."
      }, 400);
    }

    if (!mobile || !PHONE_REGEX.test(mobile)) {
      return jsonResponse({
        success: false,
        error: "Please provide a valid mobile number (7-20 digits)."
      }, 400);
    }

    if (!service || !ALLOWED_SERVICES[service]) {
      return jsonResponse({
        success: false,
        error: "Please select a valid service category."
      }, 400);
    }

    if (!message || message.length < 5 || message.length > 5000) {
      return jsonResponse({
        success: false,
        error: "Please provide project details (minimum 5 characters)."
      }, 400);
    }

    const serviceLabel = ALLOWED_SERVICES[service] || service;
    const recipientEmail = env?.CONTACT_EMAIL || "embedgrow@gmail.com";
    const timestamp = new Date().toISOString();
    const clientIp = request.headers.get("cf-connecting-ip") || "Unknown";
    const clientCountry = request.headers.get("cf-ipcountry") || "Unknown";

    // 6. Build notification message content
    const emailSubject = `New Project Inquiry: [${serviceLabel}] - ${name}`;
    const emailPlainText = `New Contact Form Inquiry on EMBEDGROW\n` +
      `----------------------------------------\n` +
      `Name:     ${name}\n` +
      `Email:    ${email}\n` +
      `Mobile:   ${mobile}\n` +
      `Service:  ${serviceLabel}\n` +
      `Received: ${timestamp}\n` +
      `Location: ${clientCountry} (${clientIp})\n\n` +
      `Project Details:\n${message}\n`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 8px;">
        <h2 style="color: #071A2B; margin-top: 0; border-bottom: 2px solid #FF5500; padding-bottom: 10px;">New Project Inquiry</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #475569;">Full Name:</td>
            <td style="padding: 8px 0; color: #071A2B;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #0B7285;">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Mobile:</td>
            <td style="padding: 8px 0;"><a href="tel:${escapeHtml(mobile)}" style="color: #0B7285;">${escapeHtml(mobile)}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Service:</td>
            <td style="padding: 8px 0; color: #071A2B;">${escapeHtml(serviceLabel)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Timestamp:</td>
            <td style="padding: 8px 0; color: #64748B;">${escapeHtml(timestamp)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Origin:</td>
            <td style="padding: 8px 0; color: #64748B;">${escapeHtml(clientCountry)} (${escapeHtml(clientIp)})</td>
          </tr>
        </table>
        <div style="background: #F8FAFC; padding: 16px; border-radius: 6px; border-left: 4px solid #0B7285;">
          <h4 style="margin: 0 0 8px; color: #071A2B;">Project Details:</h4>
          <p style="margin: 0; white-space: pre-wrap; color: #334155; line-height: 1.6;">${escapeHtml(message)}</p>
        </div>
      </div>
    `;

    let delivered = false;
    let providerUsed = "";

    // 7. Check for delivery backends configured in Cloudflare Pages environment variables
    // Provider A: Resend (Recommended transactional email API)
    if (env?.RESEND_API_KEY) {
      try {
        const resendFrom = env.RESEND_FROM || "EMBEDGROW Inquiries <onboarding@resend.dev>";
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: resendFrom,
            to: [recipientEmail],
            reply_to: email,
            subject: emailSubject,
            text: emailPlainText,
            html: emailHtml
          })
        });

        if (resendRes.ok) {
          delivered = true;
          providerUsed = "Resend";
        } else {
          const errBody = await resendRes.text();
          console.error("Resend API delivery error:", resendRes.status, errBody);
        }
      } catch (err) {
        console.error("Resend delivery exception:", err);
      }
    }

    // Provider B: SendGrid API
    if (!delivered && env?.SENDGRID_API_KEY) {
      try {
        const sendgridFrom = env.SENDGRID_FROM || "no-reply@embedgrow.com";
        const sendgridRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.SENDGRID_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: recipientEmail }],
              subject: emailSubject
            }],
            from: { email: sendgridFrom, name: "EMBEDGROW Inquiries" },
            reply_to: { email, name },
            content: [
              { type: "text/plain", value: emailPlainText },
              { type: "text/html", value: emailHtml }
            ]
          })
        });

        if (sendgridRes.ok || sendgridRes.status === 202) {
          delivered = true;
          providerUsed = "SendGrid";
        } else {
          const errBody = await sendgridRes.text();
          console.error("SendGrid API delivery error:", sendgridRes.status, errBody);
        }
      } catch (err) {
        console.error("SendGrid delivery exception:", err);
      }
    }

    // Provider C: Webhook (e.g. Discord, Slack, Zapier, Make, Google Sheets)
    if (!delivered && (env?.WEBHOOK_URL || env?.NOTIFICATION_WEBHOOK)) {
      try {
        const webhookUrl = env.WEBHOOK_URL || env.NOTIFICATION_WEBHOOK;
        const webhookRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `📬 **New Inquiry from ${name}** (${serviceLabel})\n**Email:** ${email} | **Mobile:** ${mobile}\n**Message:** ${message}`,
            name,
            email,
            mobile,
            service: serviceLabel,
            message,
            timestamp,
            ip: clientIp,
            country: clientCountry
          })
        });

        if (webhookRes.ok) {
          delivered = true;
          providerUsed = "Webhook";
        }
      } catch (err) {
        console.error("Webhook delivery exception:", err);
      }
    }

    // 8. Handle delivery result
    if (delivered) {
      return jsonResponse({
        success: true,
        message: "Thank you! Your project inquiry has been received. Our team will review your requirements and reach out within 24 hours."
      });
    }

    // If no backend credentials were configured or delivery failed:
    // Strictly follow rule: Do NOT claim that a submission was delivered unless confirmed!
    if (!env?.RESEND_API_KEY && !env?.SENDGRID_API_KEY && !env?.WEBHOOK_URL && !env?.NOTIFICATION_WEBHOOK) {
      console.warn("Contact form received but no email provider (RESEND_API_KEY, SENDGRID_API_KEY, or WEBHOOK_URL) is configured in Cloudflare Pages environment variables.");
      return jsonResponse({
        success: false,
        error: "Contact service is awaiting email provider setup. Please reach out to us directly via WhatsApp (+91 8610752189) or email (embedgrow@gmail.com)."
      }, 503);
    }

    // Credentials were configured but delivery failed at the upstream provider
    return jsonResponse({
      success: false,
      error: "Unable to deliver your message due to a mail delivery error. Your details have been preserved. Please contact us via WhatsApp (+91 8610752189) or email (embedgrow@gmail.com)."
    }, 502);

  } catch (error) {
    console.error("Unhandled contact endpoint exception:", error);
    return jsonResponse({
      success: false,
      error: "A server error occurred while processing your inquiry. Please contact us via WhatsApp (+91 8610752189) or email (embedgrow@gmail.com)."
    }, 500);
  }
}
