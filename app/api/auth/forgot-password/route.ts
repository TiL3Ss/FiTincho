// app/api/auth/forgot-password/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Cliente de Turso
const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: Request) {
  try {
    // Debug de variables de entorno
    console.log('Variables de entorno:', {
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 3),
      fromEmail: process.env.FROM_EMAIL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
      hasSmtpConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      hasTursoConfig: !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN)
    });

    const { email } = await req.json();

    // Validación del email
    if (!email || !email.trim()) {
      return NextResponse.json(
        { message: 'El correo electrónico es obligatorio.' },
        { status: 400 }
      );
    }

    // Validación del formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'El formato del correo electrónico no es válido.' },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe
    const userResult = await tursoClient.execute({
      sql: 'SELECT id, email, username FROM users WHERE email = ?',
      args: [email]
    });

    // Por seguridad, siempre devolvemos el mismo mensaje
    const successMessage = 'Si el correo existe en nuestros registros, recibirás un enlace de recuperación.';

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      );
    }

    const user = userResult.rows[0];

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora de expiración

    // Guardar el token en la base de datos
    await tursoClient.execute({
      sql: 'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      args: [resetToken, resetTokenExpiry.toISOString(), user.id]
    });

    // Crear enlace de recuperación
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // ===== MODO DESARROLLO: MOSTRAR EN CONSOLA =====
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔗 ENLACE DE RECUPERACIÓN (DESARROLLO):');
      console.log(`Usuario: ${user.username} (${email})`);
      console.log(`Enlace: ${resetLink}`);
      console.log('⏰ Expira en 1 hora\n');
    }

    // ===== INTENTAR ENVIAR EMAIL =====
    let emailSent = false;
    let emailError = null;

    // 1. Intentar con SMTP (Gmail) primero
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendEmailWithSMTP(email, user.username as string, resetLink);
        emailSent = true;
        console.log('✅ Email enviado exitosamente con SMTP');
      } catch (error) {
        console.error('❌ Error enviando email con SMTP:', error);
        emailError = error;
      }
    }

    // 2. Si SMTP falla, intentar con Resend
    if (!emailSent && process.env.RESEND_API_KEY) {
      try {
        await sendEmailWithResend(email, user.username as string, resetLink);
        emailSent = true;
        console.log('✅ Email enviado exitosamente con Resend');
      } catch (error) {
        console.error('❌ Error enviando email con Resend:', error);
        emailError = error;
      }
    }

    // 3. Si Resend falla, intentar con SendGrid
    if (!emailSent && process.env.SENDGRID_API_KEY) {
      try {
        await sendEmailWithSendGrid(email, user.username as string, resetLink);
        emailSent = true;
        console.log('✅ Email enviado exitosamente con SendGrid');
      } catch (error) {
        console.error('❌ Error enviando email con SendGrid:', error);
        emailError = error;
      }
    }

    // ===== RESPUESTA FINAL =====
    if (process.env.NODE_ENV === 'development') {
      // En desarrollo, siempre devolver éxito pero incluir info del enlace
      return NextResponse.json(
        { 
          message: successMessage,
          resetLink: resetLink,
          devMode: true,
          emailSent,
          emailError: emailError?.message || null
        },
        { status: 200 }
      );
    }

    // En producción, fallar si no se pudo enviar el email
    if (!emailSent) {
      console.error('No se pudo enviar el email con ningún método');
      return NextResponse.json(
        { message: 'Error temporal del servicio. Inténtalo más tarde.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: successMessage },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en forgot-password:', error);
    
    // Manejo específico de errores de Turso
    if (error instanceof Error) {
      if (error.message.includes('SQLITE_READONLY')) {
        return NextResponse.json(
          { message: 'Error de configuración de base de datos.' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('no such table')) {
        return NextResponse.json(
          { message: 'Error de configuración de base de datos.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

// Función para enviar email con SMTP (Gmail)
async function sendEmailWithSMTP(email: string, username: string, resetLink: string) {
  console.log('Intentando enviar email con SMTP...');

  // Crear transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verificar conexión
  await transporter.verify();

  // Enviar email
  const info = await transporter.sendMail({
    from: `"FiTincho" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: 'Recuperación de Contraseña - FiTincho',
    html: generateEmailHTML(username, resetLink),
  });

  console.log('SMTP Email enviado:', info.messageId);
}

// Función auxiliar para Resend
async function sendEmailWithResend(email: string, username: string, resetLink: string) {
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  
  console.log('Intentando enviar email con Resend...', {
    from: fromEmail,
    to: email,
  });

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: 'Recuperación de Contraseña - FiTincho',
      html: generateEmailHTML(username, resetLink),
    }),
  });

  if (!resendResponse.ok) {
    const errorData = await resendResponse.text();
    throw new Error(`Error enviando email con Resend: ${resendResponse.status} - ${errorData}`);
  }

  const resendData = await resendResponse.json();
  console.log('Resend Email enviado:', resendData);
}

// Función auxiliar para SendGrid
async function sendEmailWithSendGrid(email: string, username: string, resetLink: string) {
  const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: email }],
        subject: 'Recuperación de Contraseña - FiTincho'
      }],
      from: {
        email: process.env.FROM_EMAIL || 'noreply@tudominio.com',
        name: 'FiTincho'
      },
      content: [{
        type: 'text/html',
        value: generateEmailHTML(username, resetLink)
      }]
    }),
  });

  if (!sendGridResponse.ok) {
    const errorText = await sendGridResponse.text();
    throw new Error(`Error enviando email con SendGrid: ${sendGridResponse.status} - ${errorText}`);
  }
}

// Función auxiliar para generar HTML del email
function generateEmailHTML(username: string, resetLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
      <div style="background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; font-size: 28px; margin: 0;">FiTincho</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Domina tu entrenamiento</p>
        </div>
        
        <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px;">Recuperación de Contraseña</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">Hola <strong>${username}</strong>,</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en FiTincho.</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetLink}" 
             style="background-color: #059669; color: white; padding: 16px 32px; 
                    text-decoration: none; border-radius: 25px; font-weight: bold;
                    font-size: 16px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 30px 0;">
          <p style="color: #92400e; margin: 0; font-weight: bold;">⏰ Este enlace expirará en 1 hora.</p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">Si no solicitaste este cambio, puedes ignorar este email de forma segura.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
          <a href="${resetLink}" style="color: #059669; word-break: break-all;">${resetLink}</a>
        </p>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            © 2025 FiTincho. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  `;
}