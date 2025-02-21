const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Almacenar las últimas ubicaciones recibidas y solicitudes de viaje
let locationHistory = [];
let travelRequests = [];

// Función para obtener la hora de Colombia
function getColombianTime() {
    const options = {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    return new Date().toLocaleString('es-CO', options);
}

// Ruta para servir la página web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para obtener el historial de ubicaciones
app.get('/api/locations', (req, res) => {
    res.json(locationHistory);
});

// Ruta para obtener todas las solicitudes de viaje
app.get('/api/travel-requests', (req, res) => {
    res.json(travelRequests);
});

// Ruta para recibir localización
app.post('/api/location', async (req, res) => {
    try {
        const location = req.body;
        const timestamp = getColombianTime();

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
            address: nominatimResponse.data.display_name,
            city: nominatimResponse.data.address.city ||
                  nominatimResponse.data.address.town ||
                  nominatimResponse.data.address.village
        };

        // Guardar en el historial
        locationHistory.unshift(locationData);
        // Mantener solo las últimas 10 ubicaciones
        if (locationHistory.length > 10) {
            locationHistory = locationHistory.slice(0, 10);
        }

        console.log('\n=== Nueva Localización ===');
        console.log('Timestamp (COL):', timestamp);
        console.log('Usuario ID:', location.userId);
        console.log('Ciudad:', locationData.city);
        console.log('Latitud:', location.latitude);
        console.log('Longitud:', location.longitude);
        console.log('Precisión:', location.accuracy, 'metros');
        console.log('Altitud:', location.altitude, 'metros');
        console.log('Dirección:', locationData.address);
        console.log('========================\n');

        res.json({
            message: 'Localización recibida',
            address: locationData.address,
            city: locationData.city,
            timestamp
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error al procesar la localización' });
    }
});

// Ruta para crear una solicitud de viaje
app.post('/api/travel-requests', async (req, res) => {
    try {
        const { userId, originCity, destinationCity, date, notes } = req.body;

        // Validar datos requeridos
        if (!userId || !originCity || !destinationCity || !date) {
            return res.status(400).json({
                error: 'Faltan datos requeridos (userId, originCity, destinationCity, date)'
            });
        }

        const travelRequest = {
            id: Date.now().toString(),
            userId,
            originCity,
            destinationCity,
            date,
            notes: notes || '',
            status: 'pending',
            timestamp: getColombianTime(),
            matches: [] // Usuarios que coinciden con la ciudad de origen o destino
        };

        // Buscar usuarios que estén en la ciudad de origen o destino
        const potentialMatches = locationHistory.filter(location =>
            location.city &&
            (location.city.toLowerCase() === originCity.toLowerCase() ||
             location.city.toLowerCase() === destinationCity.toLowerCase()) &&
            location.userId !== userId
        );

        travelRequest.matches = potentialMatches.map(match => ({
            userId: match.userId,
            city: match.city,
            timestamp: match.timestamp
        }));

        // Guardar la solicitud
        travelRequests.push(travelRequest);

        console.log('\n=== Nueva Solicitud de Viaje ===');
        console.log('ID:', travelRequest.id);
        console.log('Usuario:', userId);
        console.log('Origen:', originCity);
        console.log('Destino:', destinationCity);
        console.log('Fecha:', date);
        console.log('Timestamp (COL):', travelRequest.timestamp);
        console.log('Coincidencias encontradas:', travelRequest.matches.length);
        console.log('============================\n');

        res.json({
            message: 'Solicitud de viaje creada',
            travelRequest
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Error al procesar la solicitud de viaje' });
    }
});

// Ruta para obtener solicitudes de viaje por usuario
app.get('/api/travel-requests/:userId', (req, res) => {
    const { userId } = req.params;
    const userRequests = travelRequests.filter(request =>
        request.userId === userId ||
        request.matches.some(match => match.userId === userId)
    );
    res.json(userRequests);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT} - ${getColombianTime()}`);
    console.log('Esperando datos de localización y solicitudes de viaje...');
});
