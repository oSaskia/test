// Initialize the map
const mymap = L.map('map').setView([50.932188, 10.583255], 7);

// Base layers for the map
const openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright' target='_blank'>OpenStreetMap</a> contributors",
    maxZoom: 19
}).addTo(mymap);

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

L.control.layers(baseMaps).addTo(mymap);
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
let wikipediaMarkers = L.markerClusterGroup({ disableClusteringAtZoom: 15 });
let loadedArticles = new Set();
let currentLang = 'en';

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
    loadWikipediaMarkers(center, currentLang);
});

// Initialize with the current map center
loadWikipediaMarkers(mymap.getCenter(), currentLang);

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
L.control.locate({
    position: 'topright',
    setView: 'always',
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
        alert("You seem located outside the boundaries of the map.");
    },
    locateOptions: {
        maxZoom: 16,
        watch: true,
        enableHighAccuracy: true
    }
}).addTo(mymap);

// Function to show the device's location
function showDeviceLocation() {
    mymap.locate({ setView: true, maxZoom: 16 });
}

// Add the language switcher control to the map
const LanguageControl = L.Control.extend({
    onAdd: function(map) {
        const div = L.DomUtil.create('div', 'leaflet-control-custom');
        div.innerHTML = `
            <div class="language-switch">
                <input type="radio" id="lang-de" name="language" value="de">
                <label for="lang-de">DE</label>
                <input type="radio" id="lang-en" name="language" value="en" checked>
                <label for="lang-en">EN</label>
            </div>
        `;
        L.DomEvent.disableClickPropagation(div);
        return div;
    }
});

mymap.addControl(new LanguageControl({ position: 'bottomright' }));

// Handle language switch
document.querySelectorAll('input[name="language"]').forEach(input => {
    input.addEventListener('change', function() {
        currentLang = this.value;
        loadedArticles.clear(); // Clear the set of loaded articles
        wikipediaMarkers.clearLayers(); // Clear the existing markers
        loadWikipediaMarkers(mymap.getCenter(), currentLang); // Load markers for the new language
    });
});
