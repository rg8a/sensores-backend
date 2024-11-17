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
    const localTime = dayjs().tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');

    const query = `INSERT INTO registros_sensor6 (valor_fotoresistor, tiempo_registro, modo_operacion) VALUES (?, ?, ?)`;
    db.query(query, [ldr, localTime, modo_operacion], (err, results) => {
        if (err) {
            console.error('Error al insertar los datos:', err);
            res.status(500).json({ error: 'Error al insertar los datos' });
        } else {
            res.status(200).json({ message: 'Datos insertados exitosamente' });
        }
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
        res.status(200).json(results); // Enviar los datos al frontend en formato JSON
      }
    });
  }); 

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
