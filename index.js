require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
dayjs.extend(utc);
dayjs.extend(timezone);

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  timezone: 'Z',
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos');
});

// Ruta de prueba en la raíz "/"
app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

// Endpoint para registrar los datos del sensor
app.post('/sensor_datos', (req, res) => {
  const { ldr, modo_operacion } = req.body;
  // Almacena la hora en UTC
  const utcTime = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');

  // Query para insertar en registros_sensor6
  const query1 = `INSERT INTO registros_sensor6 (valor_fotoresistor, tiempo_registro, modo_operacion) VALUES (?, ?, ?)`;
  
  // Query para insertar en registro_actuador2
  const query2 = `INSERT INTO registro_actuador2 (intensidad, tiempo_registro) VALUES (?, ?)`;

  // Ejecutar ambas consultas
  db.query(query1, [ldr, utcTime, modo_operacion], (err1, results1) => {
    if (err1) {
      console.error('Error al insertar en registros_sensor6:', err1);
      res.status(500).json({ error: 'Error al insertar en registros_sensor6' });
      return;
    }

    db.query(query2, [modo_operacion, utcTime], (err2, results2) => {
      if (err2) {
        console.error('Error al insertar en registro_actuador2:', err2);
        res.status(500).json({ error: 'Error al insertar en registro_actuador2' });
        return;
      }

      res.status(200).json({ message: 'Datos insertados exitosamente en ambas tablas' });
    });
  });
});


// Endpoint para obtener los datos del sensor
app.get('/sensor_datos', (req, res) => {
  // Query para seleccionar todos los registros de la tabla
  const query = 'SELECT * FROM registros_sensor6 ORDER BY tiempo_registro DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los datos:', err);
      res.status(500).json({ error: 'Error al obtener los datos' });
    } else {
      // Convierte los tiempos UTC a hora local
      const formattedResults = results.map((record) => ({
        ...record,
        tiempo_registro: dayjs.utc(record.tiempo_registro).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss'),
      }));
      res.status(200).json(formattedResults); // Enviar los datos con formato local
    }
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
