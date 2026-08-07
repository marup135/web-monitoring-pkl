import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAttendanceReminder(to: string, name: string, type: 'pagi' | 'sore') {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Mock Email] RESEND_API_KEY is not configured. Could not send ${type} reminder to ${to}`);
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

    const { data, error: sendError } = await resend.emails.send({
      from: 'NeboTrack <noreply@nebotrack.my.id>',
      to: [to],
      subject,
      html,
    });

    if (sendError) {
      console.error('Error sending email:', sendError);
      return { success: false, error: sendError.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}


export async function sendAdminApprovalEmail(to: string, name: string, institutionName: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Mock Email] RESEND_API_KEY is not configured. Could not send approval email to ${to}`);
    return { success: false, error: 'Resend API Key not configured' };
  }

  try {
    const subject = 'Akun Admin Institusi Disetujui - NeboTrack';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #2563eb; margin: 0;">NeboTrack</h1>
        </div>
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
          <h2 style="color: #0f172a; margin-top: 0;">Pendaftaran Institusi Disetujui!</h2>
          <p>Halo <strong>${name}</strong>,</p>
          <p>Selamat! Pendaftaran institusi <strong>${institutionName}</strong> di platform NeboTrack telah disetujui oleh Super Admin.</p>
          <p>Akun admin Anda sekarang sudah <strong>aktif</strong>. Anda sudah dapat masuk (login) ke dalam sistem dan mulai mendaftarkan pembimbing serta siswa dari institusi Anda.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://nebotrack.my.id" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Masuk ke NeboTrack</a>
          </div>

          <p style="font-size: 14px; color: #64748b;">
            Jika Anda mengalami kendala saat masuk, silakan hubungi tim dukungan kami atau gunakan fitur Lupa Password.
          </p>
        </div>
        <div style="text-align: center; padding-top: 20px; font-size: 12px; color: #94a3b8;">
          <p>&copy; ${new Date().getFullYear()} NeboTrack. All rights reserved.</p>
        </div>
      </div>
    `;

    const { data, error: sendError } = await resend.emails.send({
      from: 'NeboTrack <noreply@nebotrack.my.id>',
      to: [to],
      subject,
      html,
    });

    if (sendError) {
      console.error('Error sending approval email:', sendError);
      return { success: false, error: sendError.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error('Error sending approval email:', error);
    return { success: false, error: error.message };
  }
}
