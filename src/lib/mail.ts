/**
 * Optional Resend integration. Set RESEND_API_KEY and MAIL_FROM in production.
 */
export async function sendPlainEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    return {
      ok: false,
      message: "メール送信は未設定です（RESEND_API_KEY / MAIL_FROM を .env に追加してください）",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, message: body || res.statusText };
  }

  return { ok: true };
}
