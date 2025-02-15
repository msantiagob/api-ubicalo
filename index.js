// index.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Almacenar las últimas ubicaciones recibidas
let locationHistory = [];

// Ruta para servir la página web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para obtener el historial de ubicaciones
app.get('/api/locations', (req, res) => {
    res.json(locationHistory);
});

// Ruta para recibir localización
app.post('/api/location', async (req, res) => {
    try {
        const location = req.body;
        const timestamp = new Date().toLocaleString();

        // Obtener información de dirección usando Nominatim
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json`;
        const nominatimResponse = await axios.get(nominatimUrl, {
            headers: {
                'User-Agent': 'LocationTracker/1.0'
            }
        });

        const locationData = {
            timestamp,
            userId: location.userId,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            altitude: location.altitude,
            address: nominatimResponse.data.display_name
        };

        // Guardar en el historial
        locationHistory.unshift(locationData);
        // Mantener solo las últimas 10 ubicaciones
        if (locationHistory.length > 10) {
            locationHistory = locationHistory.slice(0, 10);
        }

        console.log('\n=== Nueva Localización ===');
        console.log('Timestamp:', timestamp);
        console.log('Usuario ID:', location.userId);
        console.log('Latitud:', location.latitude);
        console.log('Longitud:', location.longitude);
        console.log('Precisión:', location.accuracy, 'metros');
        console.log('Altitud:', location.altitude, 'metros');
        console.log('Dirección:', locationData.address);
        console.log('========================\n');

        res.json({
            message: 'Localización recibida',
            address: locationData.address
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error al procesar la localización' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
    console.log('Esperando datos de localización...');
});
