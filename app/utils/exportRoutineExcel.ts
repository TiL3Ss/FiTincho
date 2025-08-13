// utils/exportRoutineExcel.tsx
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { RoutineDay, MuscleGroup, Exercise } from '../types';

function getGroupColor(groupName: string) {
  switch (groupName.toLowerCase()) {
    case 'pecho':
      return 'E43636'; // rojo
    case 'espalda':
      return '0D5EA6'; // azul
    case 'piernas':
      return '239BA7'; // verde
    case 'hombros':
      return 'EAA64D'; // amarillo
    case 'brazos':
      return '725CAD'; // morado
    case 'abdomen':
      return 'DB8DD0'; // rosa
    default:
      return 'B2C6D5'; // gris
  }
}

export async function exportRoutineExcel(
  weekNumber: number,
  routineDays: RoutineDay[],
  userName: string
) {
  const workbook = new ExcelJS.Workbook();

  routineDays.forEach(day => {
    const worksheet = workbook.addWorksheet(`${day.day} - Semana ${weekNumber}`);

    worksheet.columns = [
      { header: 'Grupo Muscular', key: 'grupoMuscular', width: 25 },
      { header: 'Ejercicio', key: 'ejercicio', width: 30 },
      { header: 'Variante', key: 'variante', width: 25 },
      { header: 'Series', key: 'series', width: 10 },
      { header: 'Peso (kg)', key: 'peso', width: 12 },
      { header: 'Repeticiones', key: 'repeticiones', width: 15 },
      { header: 'Descanso (s)', key: 'descanso', width: 12 },
      { header: 'Progresión', key: 'progresion', width: 20 },
    ];

    // Estilos para encabezados
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF228B22' }, // verde oscuro
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 20;
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Borde grueso externo inicial: se aplicará después de llenar datos
    const totalColumns = worksheet.columns.length;

    let currentRowNum = 2;

    day.muscleGroups.forEach((group: MuscleGroup) => {
      // Calcular cuántas filas abarca el grupo muscular +1 para el espacio extra
      const totalExerciseRows = group.exercises.reduce((acc, ex) => acc + (ex.data.length || 1), 0);

      const startRow = currentRowNum;
      const endRow = startRow + totalExerciseRows - 1;

      // Merge vertical para grupo muscular en columna A
      worksheet.mergeCells(`A${startRow}:A${endRow}`);

      // Estilo grupo muscular
      const groupCell = worksheet.getCell(`A${startRow}`);
      groupCell.value = group.name;
      groupCell.font = { bold: true };
      groupCell.alignment = { vertical: 'middle', horizontal: 'center' };
      groupCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: getGroupColor(group.name) },
      };
      groupCell.border = {
        left: { style: 'thin', color: { argb: 'FF000000' } },
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };

      // Por cada ejercicio
      group.exercises.forEach((exercise, exIndex) => {
        const exerciseRows = exercise.data.length || 1;

        exercise.data.forEach((data, serieIndex) => {
          const row = worksheet.getRow(currentRowNum);

          // Nombre ejercicio y variante solo en la primera serie del ejercicio
          row.getCell('ejercicio').value = serieIndex === 0 ? exercise.name : '';
          row.getCell('variante').value = serieIndex === 0 ? exercise.variant : '';

          // Datos con colores específicos
          // Series (celeste bg, azul oscuro text)
          row.getCell('series').value = data.series;
          row.getCell('series').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFB3E5FC' }, // celeste claro
          };
          row.getCell('series').font = { color: { argb: 'FF01579B' }, bold: true }; // azul oscuro
          row.getCell('series').alignment = { horizontal: 'center', vertical: 'middle' };

          // Peso (gris bg, gris oscuro text)
          row.getCell('peso').value = data.weight;
          row.getCell('peso').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD6D6D6' }, // gris claro
          };
          row.getCell('peso').font = { color: { argb: 'FF424242' }, bold: true }; // gris oscuro
          row.getCell('peso').alignment = { horizontal: 'center', vertical: 'middle' };

          // Repeticiones (naranja bg, naranja oscuro text)
          row.getCell('repeticiones').value = data.reps;
          row.getCell('repeticiones').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCC80' }, // naranja claro
          };
          row.getCell('repeticiones').font = { color: { argb: 'FFEF6C00' }, bold: true }; // naranja oscuro
          row.getCell('repeticiones').alignment = { horizontal: 'center', vertical: 'middle' };

          // Descanso (morado bg, morado oscuro text)
          row.getCell('descanso').value = data.rest;
          row.getCell('descanso').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE1BEE7' }, // morado claro
          };
          row.getCell('descanso').font = { color: { argb: 'FF6A1B9A' }, bold: true }; // morado oscuro
          row.getCell('descanso').alignment = { horizontal: 'center', vertical: 'middle' };

          // Progresión (fondo blanco, texto según valor)
          row.getCell('progresion').value = data.progress;
          row.getCell('progresion').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' }, // blanco
          };
          if (data.progress > 0) {
            row.getCell('progresion').font = { color: { argb: 'FF81C784' }, bold: true }; // text-green-300
          } else if (data.progress < 0) {
            row.getCell('progresion').font = { color: { argb: 'FFE57373' }, bold: true }; // text-red-300
          } else {
            row.getCell('progresion').font = { color: { argb: 'FF000000' }, bold: true }; // negro
          }
          row.getCell('progresion').alignment = { horizontal: 'center', vertical: 'middle' };

          // Centramos y ponemos negrita a columnas Ejercicio y Variante también
          ['ejercicio', 'variante'].forEach(key => {
            const cell = row.getCell(key);
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { bold: true };
          });

          // Bordes a cada celda
          row.eachCell(cell => {
            const isLastSerie = serieIndex === exercise.data.length - 1;
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFBDBDBD' } },
              left: { style: 'thin', color: { argb: 'FFBDBDBD' } },
              right: { style: 'thin', color: { argb: 'FFBDBDBD' } },
              bottom: isLastSerie ? { style: 'thick', color: { argb: 'FF000000' } } : { style: 'thin', color: { argb: 'FFBDBDBD' } },
            };
          });

          currentRowNum++;
        });

        // Fila vacía entre ejercicios para separación (excepto después del último ejercicio)
        if (exIndex < group.exercises.length - 1) {
          const spacerRow = worksheet.getRow(currentRowNum);
          spacerRow.height = 5;
          spacerRow.eachCell(cell => {
            cell.border = {
              bottom: { style: 'thick', color: { argb: 'FF000000' } },
            };
          });
          currentRowNum++;
        }
      });
    });

    // Aplicar borde externo grueso a toda la tabla
    const lastRow = currentRowNum - 1;
    for (let col = 1; col <= totalColumns; col++) {
      // borde superior fila 1
      worksheet.getCell(1, col).border = {
        ...worksheet.getCell(1, col).border,
        top: { style: 'thick', color: { argb: 'FF000000' } },
      };
      // borde inferior fila lastRow
      worksheet.getCell(lastRow, col).border = {
        ...worksheet.getCell(lastRow, col).border,
        bottom: { style: 'thick', color: { argb: 'FF000000' } },
      };
    }
    for (let row = 1; row <= lastRow; row++) {
      // borde izquierdo columna 1
      worksheet.getCell(row, 1).border = {
        ...worksheet.getCell(row, 1).border,
        left: { style: 'thick', color: { argb: 'FF000000' } },
      };
      // borde derecho columna totalColumns
      worksheet.getCell(row, totalColumns).border = {
        ...worksheet.getCell(row, totalColumns).border,
        right: { style: 'thick', color: { argb: 'FF000000' } },
      };
    }

  });

  // Guardar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `Rutina_${userName.replace(/\s+/g, '_')}_Semana_${weekNumber}.xlsx`;
  saveAs(blob, fileName);
}
