import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInvoiceEmailOptions {
  to: string;
  clientName: string;
  invoiceNumber: string;
  invoiceTotal: string;
  dueDate: string | null;
  businessName: string;
  businessEmail: string;
  pdfBuffer: Buffer;
}

export async function sendInvoiceEmail({
  to,
  clientName,
  invoiceNumber,
  invoiceTotal,
  dueDate,
  businessName,
  businessEmail,
  pdfBuffer,
}: SendInvoiceEmailOptions) {
  const from = process.env.RESEND_FROM ?? `noreply@${process.env.NEXTAUTH_URL?.replace(/https?:\/\//, "") ?? "yourdomain.com"}`;

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Invoice ${invoiceNumber}</title>
    </head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:#0f172a;padding:32px 40px;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">${businessName}</h1>
        </div>
        <div style="padding:40px;">
          <p style="color:#64748b;margin:0 0 8px 0;font-size:14px;">Kepada Yth.</p>
          <h2 style="color:#0f172a;margin:0 0 32px 0;font-size:20px;font-weight:600;">${clientName},</h2>
          <p style="color:#374151;line-height:1.7;margin:0 0 24px 0;">
            Berikut kami lampirkan invoice untuk layanan yang telah diberikan. Mohon untuk melakukan pembayaran sebelum tanggal jatuh tempo.
          </p>
          <div style="background:#f1f5f9;border-radius:8px;padding:24px;margin-bottom:32px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="color:#64748b;font-size:13px;padding:4px 0;">Nomor Invoice</td>
                <td style="color:#0f172a;font-weight:600;font-size:13px;text-align:right;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding:4px 0;">Jatuh Tempo</td>
                <td style="color:#dc2626;font-weight:600;font-size:13px;text-align:right;">${dueDate ?? "—"}</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0;">
                <td style="color:#64748b;font-size:15px;padding:12px 0 4px 0;font-weight:600;">Total Tagihan</td>
                <td style="color:#0f172a;font-weight:700;font-size:18px;text-align:right;padding-top:12px;">${invoiceTotal}</td>
              </tr>
            </table>
          </div>
          <p style="color:#374151;line-height:1.7;margin:0 0 32px 0;">
            Invoice terlampir dalam format PDF. Jika ada pertanyaan, jangan ragu untuk menghubungi kami.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;" />
          <p style="color:#64748b;font-size:13px;margin:0;">Salam,</p>
          <p style="color:#0f172a;font-weight:600;margin:4px 0 0 0;">${businessName}</p>
          <p style="color:#64748b;font-size:13px;margin:4px 0 0 0;">${businessEmail}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const { error } = await resend.emails.send({
    from: `${businessName} <${from}>`,
    to,
    subject: `Invoice ${invoiceNumber} dari ${businessName}`,
    html,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(error.message);
  }
}
