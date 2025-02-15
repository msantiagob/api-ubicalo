// index.js
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ruta para recibir localización
app.post('/api/location', (req, res) => {
    const location = req.body;
    const timestamp = new Date().toLocaleString();

    console.log('\n=== Nueva Localización ===');
    console.log('Timestamp:', timestamp);
    console.log('Usuario ID:', location.userId);
    console.log('Latitud:', location.latitude);
    console.log('Longitud:', location.longitude);
    console.log('Precisión:', location.accuracy, 'metros');
    console.log('Altitud:', location.altitude, 'metros');
    console.log('========================\n');

    res.json({ message: 'Localización recibida' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
    console.log('Esperando datos de localización...');
});
