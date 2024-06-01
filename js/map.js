var mymap = L.map('map').setView([51.0897904,14.6926595], 10);

var openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
    maxZoom: 19
}).addTo(mymap);

var openTopoMapLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors, &copy; <a href='https://opentopomap.org' target='_blank'>OpenTopoMap</a> (CC-BY-SA)",
    maxZoom: 17
});

var googleSatLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: "&copy; <a href='https://www.google.com/maps' target='_blank'>Google Maps</a>"
});

var baseMaps = {
    "OpenStreetMap": openStreetMapLayer,
    "OpenTopoMap": openTopoMapLayer,
    "Luftbilder": googleSatLayer
};

var layer_routenroute_1 = new L.geoJson(json_routenroute_1, {
    attribution: '',
    interactive: false,
    dataVar: 'json_routenroute_1',
    layerName: 'layer_routenroute_1',
    style: getStyle(mymap.getZoom())
});
mymap.addLayer(layer_routenroute_1);

function getStyle(zoom) {
    if (zoom >= 14) {
        return {
            opacity: 1,
            color: 'rgba(190,45,45,1.0)', // Rote Farbe
            dashArray: '5, 12', // Muster für größere Punkte: 0 Pixel Linie (Punkt), 20 Pixel Lücke
            lineCap: 'round', // Enden der Linie sind rund, um Punkte zu erzeugen
            lineJoin: 'round', // Ecken der Linie sind rund
            weight: 5.0, // Breite der Linie, um die Größe der Punkte anzupassen
            fillOpacity: 0,
            interactive: true,
        };
    } else {
        return {
            opacity: 1,
            color: 'rgba(190,45,45,1.0)', // Rote Farbe
            dashArray: '0, 0', // Muster für kleinere Punkte: 0 Pixel Linie (Punkt), 10 Pixel Lücke
            lineCap: 'round', // Enden der Linie sind rund, um Punkte zu erzeugen
            lineJoin: 'round', // Ecken der Linie sind rund
            weight: 3.0, // Breite der Linie, um die Größe der Punkte anzupassen
            fillOpacity: 0,
            interactive: true,
        };
    }
}

mymap.on('zoomend', function() {
    layer_routenroute_1.setStyle(getStyle(mymap.getZoom()));
});

var orangeIcon = L.icon({
    iconUrl: './js/marker-icon-orange.png',
    iconSize: [25, 41], // Größe des Icons
    iconAnchor: [13, 42], // Punkt, der dem Marker auf der Karte entspricht
    popupAnchor: [2, -35], // Punkt, von dem aus der Popup ausgeht
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png', // Standard-Shadow von Leaflet
    shadowSize: [41, 41], // Größe des Schattens
    shadowAnchor: [13, 41] // Punkt, der dem Schatten auf der Karte entspricht
});

L.control.layers(baseMaps).addTo(mymap);

L.control.scale({
    metric: true, 
    imperial: false 
}).addTo(mymap);

// Geosearch mit OpenStreetMap-Geocoder hinzufügen
const search = new GeoSearch.GeoSearchControl({
    provider: new GeoSearch.OpenStreetMapProvider(),
    autoComplete: true, // Automatische Vervollständigung aktivieren
    autoCompleteDelay: 250, // Verzögerung in Millisekunden
    showMarker: true, // Zeigt einen Marker für das Suchergebnis an
    showPopup: false, // Deaktiviert das Popup für den Marker
});

mymap.addControl(search);




function openFullscreen(element) {
    const img = element;
    let panzoom;

    // Funktion zum Initialisieren von Panzoom
    function initializePanzoom() {
        panzoom = Panzoom(img, {
            maxScale: 3,
            minScale: 1,
            contain: 'inside'
        });
        img.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);
    }

    // Funktion zum Zurücksetzen des Zooms
    function resetZoom() {
        if (panzoom) {
            panzoom.reset();
            panzoom.destroy();
        }
        img.style.transform = '';
    }

    // Event Listener zum Zurücksetzen des Zooms beim Verlassen des Vollbildmodus hinzufügen
    function handleFullscreenChange() {
        if (!document.fullscreenElement &&
            !document.mozFullScreenElement &&
            !document.webkitFullscreenElement &&
            !document.msFullscreenElement) {
            resetZoom();
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Vollbildmodus öffnen
    if (img.requestFullscreen) {
        img.requestFullscreen().then(initializePanzoom);
    } else if (img.mozRequestFullScreen) { /* Firefox */
        img.mozRequestFullScreen().then(initializePanzoom);
    } else if (img.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        img.webkitRequestFullscreen().then(initializePanzoom);
    } else if (img.msRequestFullscreen) { /* IE/Edge */
        img.msRequestFullscreen().then(initializePanzoom);
    } else {
        initializePanzoom(); // Fallback falls Vollbildmodus nicht unterstützt wird
    }
}








