import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Menggunakan email default onboarding dari Resend, atau domain custom bila tersedia di ENV
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function sendAttendanceReminder(to: string, name: string, type: 'pagi' | 'sore') {
  if (!resend) {
    console.warn(`[Mock Email] Resend API Key is not configured. Could not send ${type} reminder to ${to}`);
    return { success: false, error: 'Resend API Key not configured' };
  }

  try {
    let subject = '';
    let html = '';

    if (type === 'pagi') {
      subject = 'Pengingat Absensi PKL';
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2563eb;">Pengingat Absensi PKL</h2>
          <p>Halo <strong>${name}</strong>,</p>
          <p>Kami mendeteksi bahwa Anda belum melakukan <strong>Absensi Masuk</strong> hari ini.</p>
          <p>Silakan segera melakukan absensi melalui aplikasi sebelum batas waktu yang ditentukan (09.00 WIB).</p>
          <br/>
          <p>Terima kasih,</p>
          <p>Tim NeboTrack</p>
        </div>
      `;
    } else {
      subject = 'Pengingat Penyelesaian PKL Hari Ini';
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #ea580c;">Pengingat Penyelesaian PKL Hari Ini</h2>
          <p>Halo <strong>${name}</strong>,</p>
          <p>Anda belum menyelesaikan aktivitas PKL hari ini.</p>
          <p>Silakan:</p>
          <ul>
            <li>Mengisi Logbook</li>
            <li>Melakukan Absen Pulang</li>
          </ul>
          <p>sebelum pukul 18.00 WIB hari ini.</p>
          <br/>
          <p>Terima kasih,</p>
          <p>Tim NeboTrack</p>
        </div>
      `;
    }

    const data = await resend.emails.send({
      from: `NeboTrack <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    });

    if (data.error) {
      console.error('Failed to send email:', data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}
