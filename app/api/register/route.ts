// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '../../lib/db_ticho';
import bcrypt from 'bcryptjs';
import { parsePhoneNumber, AsYouType } from 'libphonenumber-js';

export async function POST(req: Request) {
  try {
    const { username, email, password, phone, firstName, lastName } = await req.json();

    // Validación de campos obligatorios
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios: nombre de usuario, correo electrónico o contraseña.' },
        { status: 400 }
      );
    }

    let formattedPhone = null;
    // Validación y formateo del teléfono
    if (phone) {
      try {
        const phoneNumber = parsePhoneNumber(phone);
        
        if (!phoneNumber.isValid()) {
          return NextResponse.json(
            { message: 'El número de teléfono no es válido. Use formato internacional: +[código][número]' },
            { status: 400 }
          );
        }

        // Formatear al estándar chileno: +569 XXXXXXXX
        if (phoneNumber.country === 'CL') {
          // Aseguramos el formato +569 seguido de 8 dígitos
          formattedPhone = phoneNumber.number.replace(/(\+56)(9\d{8})/, '$1$2');
          
          // Validación específica para números móviles chilenos
          if (!phoneNumber.number.match(/^\+569\d{8}$/)) {
            return NextResponse.json(
              { message: 'El número chileno debe ser móvil (+569 seguido de 8 dígitos)' },
              { status: 400 }
            );
          }
        } else {
          // Para otros países, mantener el formato internacional
          formattedPhone = phoneNumber.number;
        }
        
      } catch (error) {
        return NextResponse.json(
          { message: 'Formato de teléfono inválido. Use formato internacional: +[código][número]' },
          { status: 400 }
        );
      }
    }

    const db = await getDb();

    // Verifica si ya existe un usuario con el mismo username o email
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?', 
      [username, email]
    );

    if (existingUser) {
      const message = existingUser.email === email 
        ? 'El correo electrónico ya está registrado.' 
        : 'El nombre de usuario ya está en uso.';
      
      return NextResponse.json(
        { message },
        { status: 409 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Inserción del nuevo usuario
    const result = await db.run(
      `INSERT INTO users (
        username, 
        email, 
        password, 
        phone, 
        first_name, 
        last_name
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username, 
        email, 
        hashedPassword,
        formattedPhone, // Usamos el teléfono formateado
        firstName || null,
        lastName || null
      ]
    );

    if (result.lastID) {
      return NextResponse.json(
        { 
          message: 'Usuario registrado exitosamente.',
          userId: result.lastID 
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { message: 'No se pudo registrar el usuario.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en la ruta de registro:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor al intentar registrar el usuario.' },
      { status: 500 }
    );
  }
}