// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Function to get a cookie
function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
        let c = cookieArray[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cname) === 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}

// Initialize the map
const savedCenter = getCookie("mapCenter");
const savedZoom = getCookie("mapZoom");
const savedLanguage = getCookie("mapLanguage") || "de";
const savedBasemap = getCookie("mapBasemap") || "OpenStreetMap";

const mapCenter = savedCenter ? JSON.parse(savedCenter) : [50.932188, 10.583255];
const mapZoom = savedZoom ? parseInt(savedZoom) : 6;

const mymap = L.map('map').setView(mapCenter, mapZoom);

// Base layers for the map
const openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
    maxZoom: 19
});

const openTopoMapLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors, &copy; <a href='https://opentopomap.org' target='_blank'>OpenTopoMap</a> (CC-BY-SA)",
    maxZoom: 17
});

const googleSatLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: "&copy; <a href='https://www.google.com/maps' target='_blank'>Google Maps</a>"
});

const baseMaps = {
    "OpenStreetMap": openStreetMapLayer,
    "OpenTopoMap": openTopoMapLayer,
    "Luftbilder": googleSatLayer
};

const selectedBasemap = baseMaps[savedBasemap];
selectedBasemap.addTo(mymap);

const layerControl = L.control.layers(baseMaps).addTo(mymap);
L.control.scale({ metric: true, imperial: false }).addTo(mymap);

const search = new GeoSearch.GeoSearchControl({
    provider: new GeoSearch.OpenStreetMapProvider(),
    autoComplete: true,
    autoCompleteDelay: 250,
    showMarker: true,
    showPopup: false,
});

mymap.addControl(search);

// Custom marker icons
const yellowIcon = L.icon({
    iconUrl: './media/marker-icon-yellow.png',
    iconSize: [25, 41],
    iconAnchor: [13, 42],
    popupAnchor: [2, -35],
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [13, 41]
});

// Store Wikipedia markers to enable toggling
let wikipediaMarkers = L.markerClusterGroup({ disableClusteringAtZoom: 17 });
let loadedArticles = new Set();
let currentLang = savedLanguage;

// Function to add or remove Wikipedia markers on the map
function loadWikipediaMarkers(center, lang = 'en') {
    const { lat, lng } = center;

    fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=10000&gslimit=500&format=json&origin=*`)
        .then(response => response.json())
        .then(data => {
            if (!data.query) {
                console.error('No query property in the Wikipedia API response:', data);
                return;
            }
            data.query.geosearch.forEach(article => {
                if (!loadedArticles.has(article.pageid)) {
                    loadedArticles.add(article.pageid);
                    fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&exintro&explaintext&piprop=thumbnail&pithumbsize=600&titles=${article.title}&format=json&origin=*`)
                        .then(response => response.json())
                        .then(detailData => {
                            const pages = detailData.query.pages;
                            const page = Object.values(pages)[0];
                            const imageUrl = page.thumbnail ? page.thumbnail.source : '';
                            const readMoreText = lang === 'en' ? 'Read more' : 'Mehr lesen';
                            const marker = L.marker([article.lat, article.lon], { icon: yellowIcon });
                            marker.bindPopup(`
                                <div class="popup-content">
                                    ${imageUrl ? `<img src="${imageUrl}" alt="${article.title}" class="popup-image" onclick="openFullscreen(this)">` : ''}
                                    <h3>${article.title}</h3>
                                    <div class="text-container">
                                        ${page.extract}
                                        <a href="https://${lang}.wikipedia.org/wiki/${article.title}" target="_blank">${readMoreText}</a>
                                    </div>
                                </div>
                            `);
                            wikipediaMarkers.addLayer(marker);
                        })
                        .catch(error => console.error('Error fetching Wikipedia article details:', error));
                }
            });
        })
        .catch(error => console.error('Error fetching Wikipedia articles:', error));
}

mymap.addLayer(wikipediaMarkers);

mymap.on('moveend', function() {
    const center = mymap.getCenter();
    const zoom = mymap.getZoom();
    setCookie("mapCenter", JSON.stringify(center), 7);
    setCookie("mapZoom", zoom, 7);
    loadWikipediaMarkers(center, currentLang);
});

// Initialize with the current map center
loadWikipediaMarkers(mymap.getCenter(), currentLang);

// Save basemap selection
mymap.on('baselayerchange', function(e) {
    setCookie("mapBasemap", e.name, 7);
});

// Function to open an image in fullscreen mode
function openFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) { /* Firefox */
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { /* IE/Edge */
        element.msRequestFullscreen();
    }
}

// Add the locate control to the map
let firstLocationFound = false; // Flag to check if the location was found for the first time

L.control.locate({
    position: 'topright',
    setView: true,  // Initially set the view to the user's location
    keepCurrentZoomLevel: false,
    drawCircle: true,
    follow: false,
    markerStyle: {
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.8
    },
    circleStyle: {
        color: '#136AEC',
        fillColor: '#136AEC',
        fillOpacity: 0.15,
        weight: 2,
        opacity: 0.5
    },
    icon: 'fas fa-location-arrow',  // FontAwesome icon
    metric: true,
    onLocationError: function(e) {
        alert(e.message);
    },
    onLocationOutsideMapBounds: function(context) { // If the location is outside map bounds
        context.stop();
        alert("Sie scheinen sich außerhalb der Grenzen der Karte zu befinden.");
    },
    locateOptions: {
        maxZoom: 16,
        watch: true,
        enableHighAccuracy: true
    }
}).on('locationfound', function(e) {
    if (!firstLocationFound) {
        mymap.setView(e.latlng, 16);  // Set the view to the user's location and zoom level 16
        firstLocationFound = true;  // Set the flag to true after the first location is found
    }
}).addTo(mymap);

// Funktion, um den Standort des Geräts zu zeigen
function showDeviceLocation() {
    mymap.locate({ setView: true, maxZoom: 16 });
}

// Sprachumschalter-Steuerung zur Karte hinzufügen
const LanguageControl = L.Control.extend({
    onAdd: function(map) {
        const div = L.DomUtil.create('div', 'leaflet-control-custom');
        div.innerHTML = `
            <div class="language-switch">
                <input type="radio" id="lang-de" name="language" value="de">
                <label for="lang-de">DE</label>
                <input type="radio" id="lang-en" name="language" value="en" ${currentLang === "en" ? "checked" : ""}>
                <label for="lang-en">EN</label>
            </div>
        `;
        L.DomEvent.disableClickPropagation(div);
        return div;
    }
});

mymap.addControl(new LanguageControl({ position: 'bottomright' }));

// Sprachwechsel-Handling
document.querySelectorAll('input[name="language"]').forEach(input => {
    input.addEventListener('change', function() {
        currentLang = this.value;
        setCookie("mapLanguage", currentLang, 7);
        loadedArticles.clear(); // Lösche die geladenen Artikel
        wikipediaMarkers.clearLayers(); // Lösche die vorhandenen Marker
        loadWikipediaMarkers(mymap.getCenter(), currentLang); // Lade die Marker für die neue Sprache
    });
});