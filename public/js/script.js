document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log(`Sending location: ${latitude}, ${longitude}`);
                socket.emit('send-location', { latitude, longitude });
            },
            (error) => {
                console.error(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 1000,
                maximumAge: 0,
            }
        );
    } else {
        console.error('Geolocation is not supported by this browser.');
    }

    // Initialize the map
    const map = L.map('map').setView([0, 0], 2);

    // Add tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Devraj Goswami',
    }).addTo(map);

    const markers = {};

    socket.on('receive-location', (data) => {
        const { id, latitude, longitude } = data;
        console.log(`Received location from ${id}: ${latitude}, ${longitude}`);
        if (markers[id]) {
            markers[id].setLatLng([latitude, longitude]);
        } else {
            markers[id] = L.marker([latitude, longitude]).addTo(map);
        }
        fitBoundsToMarkers();
    });

    socket.on('user-disconnected', (id) => {
        if (markers[id]) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
        fitBoundsToMarkers();
    });

    function fitBoundsToMarkers() {
        const bounds = new L.LatLngBounds();
        for (let id in markers) {
            bounds.extend(markers[id].getLatLng());
        }
        if (bounds.isValid()) {
            map.fitBounds(bounds);
        }
    }
});
