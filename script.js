// Function to set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

// Function to get a cookie
function getCookie(name) {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(nameEQ)) return cookie.substring(nameEQ.length);
    }
    return null;
}

// Initialize the map
const savedCenter = getCookie("mapCenter");
const savedZoom = getCookie("mapZoom");
const savedLanguage = getCookie("mapLanguage") || "en";
const savedBasemap = getCookie("mapBasemap") || "OpenStreetMap";

// Set default map center and zoom level
const mapCenter = savedCenter ? JSON.parse(savedCenter) : [50.932188, 10.583255];
const mapZoom = savedZoom ? parseInt(savedZoom) : 6;

const map = L.map('map').setView(mapCenter, mapZoom);

// Base map layers
const openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
});

const openTopoMapLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: "&copy; OpenStreetMap contributors, &copy; OpenTopoMap (CC-BY-SA)",
    maxZoom: 17
});

const googleSatLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 19,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: "&copy; Google Maps"
});

// Base map selection
const baseMaps = {
    "OpenStreetMap": openStreetMapLayer,
    "OpenTopoMap": openTopoMapLayer,
    "Luftbilder": googleSatLayer
};

baseMaps[savedBasemap].addTo(map);
L.control.layers(baseMaps).addTo(map);
L.control.scale({ metric: true, imperial: false }).addTo(map);

// GeoSearch control for searching locations
const searchControl = new GeoSearch.GeoSearchControl({
    provider: new GeoSearch.OpenStreetMapProvider(),
    autoComplete: true,
    autoCompleteDelay: 250
});
map.addControl(searchControl);

// Custom yellow marker icon
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
let wikipediaEnabled = true;

// Function to add Wikipedia markers on the map
function loadWikipediaMarkers(center, lang = 'en') {
    const { lat, lng } = center;
    
    if (!wikipediaEnabled) {
        wikipediaMarkers.clearLayers();
        return;
    }

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
                            const page = Object.values(detailData.query.pages)[0];
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

// Add Wikipedia markers to the map
map.addLayer(wikipediaMarkers);

// Load Wikipedia markers on map move end
map.on('moveend', () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    setCookie("mapCenter", JSON.stringify(center), 7);
    setCookie("mapZoom", zoom, 7);
    if (wikipediaEnabled) {
        loadWikipediaMarkers(center, currentLang);
    }
});

// Initialize with the current map center
if (wikipediaEnabled) {
    loadWikipediaMarkers(map.getCenter(), currentLang);
}

// Save base map selection in cookies
map.on('baselayerchange', (e) => {
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

// Add location control to the map
L.control.locate({
    strings: { title: "Show me where I am" }
}).addTo(map);

// Add cascade buttons to control Wikipedia functionality
new L.cascadeButtons([
    {
        icon: 'fa-brands fa-wikipedia-w', 
        items: [
            {
                icon: '', 
                text: 'Off', 
                command: () => {
                    wikipediaEnabled = false;
                    wikipediaMarkers.clearLayers();
                    loadedArticles.clear();
                    console.log('Wikipedia-Funktion deaktiviert');
                }
            },
            {
                icon: '', 
                text: 'DE', 
                command: () => {
                    wikipediaEnabled = true;
                    wikipediaMarkers.clearLayers();
                    loadedArticles.clear();
                    currentLang = 'de';
                    setCookie("mapLanguage", 'de', 7);
                    loadWikipediaMarkers(map.getCenter(), 'de');
                    console.log('Wikipedia-Sprache auf Deutsch gesetzt');
                }
            },
            {
                icon: '', 
                text: 'EN', 
                command: () => {
                    wikipediaEnabled = true;
                    wikipediaMarkers.clearLayers();
                    loadedArticles.clear();
                    currentLang = 'en';
                    setCookie("mapLanguage", 'en', 7);
                    loadWikipediaMarkers(map.getCenter(), 'en');
                    console.log('Wikipedia-Sprache auf Englisch gesetzt');
                }
            },
        ]
    }
], { position: 'topright', direction: 'horizontal' }).addTo(map);
