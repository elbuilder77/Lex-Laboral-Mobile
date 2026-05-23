import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Falta configuración de Supabase (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

if (!geminiApiKey) {
  console.error('Error: Falta GEMINI_API_KEY en las variables de entorno.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

const genAI = new GoogleGenerativeAI(geminiApiKey);

// Artículos de conocimiento iniciales (Ley Federal del Trabajo - México)
const ARTICLES = [
  {
    title: 'Artículo 47 LFT: Rescisión de la relación de trabajo sin responsabilidad para el patrón',
    content: `El Artículo 47 de la Ley Federal del Trabajo (LFT) de México enumera las causas justificadas de rescisión de la relación de trabajo sin responsabilidad para el patrón:
1. Engañar el trabajador al patrón con certificados falsos o referencias en los que se atribuyan capacidades que carece.
2. Incurrir el trabajador durante sus labores en faltas de probidad u honradez, en actos de violencia, amagos, injurias o malos tratamientos contra el patrón, sus familiares o el personal directivo.
3. Cometer el trabajador contra alguno de sus compañeros cualquiera de los actos anteriores, si altera la disciplina del lugar de trabajo.
4. Incurrir en actos delictivos o faltas graves fuera del servicio contra el patrón o directivos.
5. Ocasionar el trabajador intencionalmente perjuicios materiales en edificios, obras, maquinaria y herramientas.
6. Ocasionar perjuicios graves por negligencia inexcusable.
7. Comprometer el trabajador la seguridad del establecimiento o de las personas por imprudencia o descuido inexcusable.
8. Cometer el trabajador actos inmorales o de hostigamiento y/o acoso sexual contra cualquier persona en el establecimiento o lugar de trabajo.
9. Revelar los secretos de fabricación o asuntos de carácter reservado con perjuicio de la empresa.
10. Tener el trabajador más de tres faltas de asistencia en un período de treinta días, sin permiso del patrón o sin causa justificada (despido justificado por ausentismo).
11. Desobedecer el trabajador al patrón o a sus representantes sin causa justificada, siempre que se trate del trabajo contratado.
12. Negarse el trabajador a adoptar las medidas preventivas o a seguir los procedimientos indicados para evitar accidentes o enfermedades.
13. Concurrir el trabajador a sus labores en estado de embriaguez o bajo la influencia de algún narcótico.
14. Sentencia ejecutoriada que imponga al trabajador una pena de prisión que le impida el cumplimiento de la relación de trabajo.
El patrón que despida a un trabajador deberá darle aviso por escrito en el que refiera claramente la conducta o conductas que motivan la rescisión y las fechas en que se cometieron.`
  },
  {
    title: 'Artículo 48 y 50 LFT: Indemnización Constitucional y Salarios Vencidos',
    content: `En caso de despido injustificado, el trabajador tiene derecho a solicitar la reinstalación o la indemnización constitucional consistente en:
1. Tres meses de salario diario integrado (SDI). Esto cubre el concepto básico de Indemnización Constitucional (Artículo 48).
2. Salarios vencidos computados desde la fecha del despido hasta por un período máximo de doce meses. Si al término de este plazo no se ha resuelto el juicio, se pagarán también los intereses que se generen sobre el importe de quince meses de salario, a razón del dos por ciento mensual, capitalizable al momento del pago.
3. En caso de que el patrón quede eximido de la obligación de reinstalar al trabajador (según Artículo 49), las indemnizaciones consistirán en (Artículo 50):
   a) Si la relación de trabajo fuere por tiempo determinado menor de un año, en una cantidad igual al importe de los salarios de la mitad del tiempo de servicios prestados; si excediere de un año, en una cantidad igual al importe de los salarios de seis meses por el primer año y de veinte días por cada uno de los años siguientes.
   b) Si la relación de trabajo fuere por tiempo indeterminado, la indemnización consistirá en veinte días de salario por cada uno de los años de servicios prestados (los famosos "20 días por año" aplicables solo bajo exención de reinstalación o rescisión imputable al patrón).`
  },
  {
    title: 'Artículo 76 a 81 LFT: Vacaciones y Prima Vacacional obligatorias',
    content: `Las vacaciones en México son un derecho irrenunciable regulado por la Ley Federal del Trabajo. Desde la reforma de "Vacaciones Dignas" vigente:
1. Los trabajadores que tengan más de un año de servicios disfrutarán de un período anual de vacaciones pagadas, que en ningún caso podrá ser inferior a doce días laborables, y que aumentará en dos días laborables, hasta llegar a veinte, por cada año subsecuente de servicios. A partir del sexto año, el período de vacaciones aumentará en dos días por cada cinco de servicios.
   - Año 1: 12 días
   - Año 2: 14 días
   - Año 3: 16 días
   - Año 4: 18 días
   - Año 5: 20 días
   - Años 6 a 10: 22 días
   - Años 11 a 15: 24 días
2. Las vacaciones no podrán compensarse con una remuneración económica. Deben disfrutarse efectivamente.
3. Prima Vacacional: Los trabajadores tendrán derecho a una prima no menor de veinticinco por ciento (25%) sobre los salarios que les correspondan durante el período de vacaciones.
4. Plazo de concesión: Las vacaciones deberán concederse a los trabajadores dentro de los seis meses siguientes al cumplimiento del año de servicios.`
  },
  {
    title: 'Artículo 87 LFT: Aguinaldo Anual Obligatorio',
    content: `El aguinaldo es una prestación obligatoria en México regulada por el Artículo 87 de la Ley Federal del Trabajo:
1. Los trabajadores tendrán derecho a un aguinaldo anual que deberá pagarse antes del día veinte de diciembre, equivalente a quince días de salario, por lo menos.
2. Los que no hayan cumplido un año de servicios, independientemente de que se encuentren laborando o no en la fecha de liquidación del aguinaldo, tendrán derecho a que se les pague la parte proporcional del mismo, conforme al tiempo trabajado (aguinaldo proporcional).
El aguinaldo se calcula con base en el salario diario cuota diaria (salario base ordinario sin integraciones, a menos que el contrato colectivo establezca lo contrario).`
  },
  {
    title: 'Artículos 58 a 68 LFT: Horas Extras y Jornadas de Trabajo',
    content: `La Ley Federal del Trabajo regula la duración máxima de la jornada de trabajo y el pago de tiempo extraordinario:
1. Jornadas Máximas:
   - Diurna: 8 horas (entre las 6:00 y las 20:00 horas). Límite de 48 horas semanales.
   - Nocturna: 7 horas (entre las 20:00 y las 6:00 horas). Límite de 42 horas semanales.
   - Mixta: 7.5 horas (comprende períodos diurnos y nocturnos, siempre que el período nocturno sea menor de tres horas y media). Límite de 45 horas semanales.
2. Horas Extras (Prolongación de la jornada):
   - Las horas de trabajo extraordinario se pagarán con un ciento por ciento más del salario que corresponda a las horas de la jornada (pago doble) para las primeras 9 horas extras a la semana (hasta 3 horas diarias y hasta 3 veces en una semana, según Artículo 66 LFT).
   - El excedente de 9 horas extras semanales (es decir, a partir de la décima hora extra) se pagará con un doscientos por ciento más del salario que corresponda a las horas de la jornada (pago triple, según Artículo 68 LFT).
   - Los trabajadores no están obligados a prestar sus servicios por un tiempo mayor del permitido de 3 horas diarias y 3 veces por semana.`
  },
  {
    title: 'Artículo 27 LSS: Integración del Salario Base de Cotización (SBC) IMSS',
    content: `El Artículo 27 de la Ley del Seguro Social (LSS) establece cómo se integra el Salario Base de Cotización (SBC) para el cálculo de las cuotas obrero-patronales en México.
El SBC se integra con los pagos hechos en efectivo por cuota diaria, gratificaciones, percepciones, alimentación, habitación, primas, comisiones, prestaciones en especie y cualquiera otra cantidad o prestación que se entregue al trabajador por su trabajo. Se excluyen los siguientes conceptos dada su naturaleza:
1. Instrumentos de trabajo tales como herramientas, ropa y otros similares.
2. El ahorro, cuando se integre por un depósito semanal, mensual o anual en partes iguales del trabajador y la empresa (bipartita).
3. Las aportaciones voluntarias y adicionales de retiro.
4. Las aportaciones al INFONAVIT y las participaciones en las utilidades de la empresa (PTU).
5. La alimentación y la habitación cuando se entreguen en forma onerosa (el trabajador pague por ellas al menos el veinte por ciento del salario mínimo general diario).
6. Las despensas en especie o en dinero que no rebasen el cuarenta por ciento del valor de la UMA vigente.
7. Los premios por puntualidad y asistencia, siempre que el importe de cada uno de estos conceptos no rebase el diez por ciento del SBC.
8. Las aportaciones para fines sociales o planes de pensiones complementarios.
9. El tiempo extraordinario dentro de los márgenes señalados en la Ley Federal del Trabajo (hasta 3 horas diarias, 3 veces por semana).`
  },
  {
    title: 'Artículos 11 y 12 LSS: Régimen Obligatorio del Seguro Social y Ramos de Aseguramiento',
    content: `La Ley del Seguro Social de México regula el Régimen Obligatorio que ampara a los trabajadores y sus familias:
1. Ramos de Aseguramiento del Régimen Obligatorio (Artículo 11 LSS):
   - Riesgos de Trabajo (RT): Cubre accidentes de trabajo y enfermedades profesionales. Otorga asistencia médica integral y subsidios al 100% del SBC en caso de incapacidad temporal.
   - Enfermedades y Maternidad (EM): Brinda atención médica, quirúrgica, farmacéutica y hospitalaria. Por enfermedad general, paga un subsidio del 60% del SBC a partir del cuarto día de incapacidad.
   - Invalidez y Vida (IV): Protege contra riesgos de accidentes y enfermedades no profesionales que impidan al asegurado procurarse su sustento mediante un trabajo regular (otorga pensión de invalidez o de viudez/orfandad en caso de muerte).
   - Retiro, Cesantía en Edad Avanzada y Vejez (RCV): Pensionamiento y ahorro para el retiro del trabajador por edad avanzada.
   - Guarderías y Prestaciones Sociales (GPS): Servicio de guardería infantil y prestaciones de fomento a la salud y bienestar social.
2. Sujetos de Aseguramiento Obligatorio (Artículo 12 LSS): Las personas que presten un servicio personal subordinado a otra física o moral bajo una relación laboral subordinada; socios de sociedades cooperativas; y personas determinadas por decretos.`
  },
  {
    title: 'Artículos 154 y 162 LSS: Pensiones por Cesantía en Edad Avanzada y Vejez (IMSS)',
    content: `La Ley del Seguro Social regula el retiro y pensiones de vejez y cesantía bajo el Régimen Obligatorio:
1. Cesantía en Edad Avanzada (Artículo 154 LSS):
   - Ocurre cuando el asegurado quede privado de trabajos remunerados a partir de los sesenta años de edad.
   - Requiere que el asegurado tenga reconocidas por el IMSS un mínimo de semanas de cotización. Bajo el régimen de la Ley de 1973, se requiere un mínimo de 500 semanas de cotización. Bajo el régimen de la Ley de 1997, el mínimo inició en 750 semanas en 2021 y se incrementa en 25 semanas cada año hasta alcanzar las 1,000 semanas en el año 2031.
   - El porcentaje de la pensión calculado oscila entre el 75% a los 60 años y va aumentando anualmente un 5% hasta llegar al 95% a los 64 años.
2. Vejez (Artículo 162 LSS):
   - Da derecho al asegurado al cumplir sesenta y cinco años de edad, siempre que reúna los mismos requisitos de semanas cotizadas solicitadas en cesantía.
   - Otorga el 100% de la cuantía determinada para la pensión por vejez.`
  }
];

async function seed() {
  console.log('Iniciando carga de Base de Conocimiento RAG...');
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  for (const article of ARTICLES) {
    try {
      console.log(`\nGenerando embedding para: "${article.title}"...`);
      const result = await model.embedContent(article.content);
      const embedding = result.embedding.values;

      console.log(`Insertando en la base de datos...`);
      const { data, error } = await supabase
        .from('kb_articles')
        .insert({
          title: article.title,
          content: article.content,
          embedding: embedding
        });

      if (error) {
        console.error(`Error al insertar "${article.title}":`, error.message);
      } else {
        console.log(`Éxito: "${article.title}" cargado correctamente.`);
      }
    } catch (err) {
      console.error(`Fallo crítico cargando "${article.title}":`, err.message || err);
    }
  }

  console.log('\nProceso de carga sembrada completado.');
}

seed();
