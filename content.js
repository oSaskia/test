class MarkerContent {
    constructor(lat, lng, date, title, mediaType, mediaSrc, description, icon) {
        this.lat = lat;
        this.lng = lng;
        this.date = date;
        this.title = title;
        this.mediaType = mediaType;
        this.mediaSrc = mediaSrc;
        this.description = description;
        this.icon = icon || orangeIcon; // Default icon
    }

    generateContent() {
        let mediaElement;
        if (this.mediaType === 'video') {
            mediaElement = `<video controls><source src="${this.mediaSrc}" type="video/mp4">Your browser does not support the video tag.</video>`;
        } else if (this.mediaType === 'image') {
            mediaElement = `<img src="${this.mediaSrc}" alt="Foto" class="popup-image" onclick="openFullscreen(this)">`;
        }

        return `
            <div class="popup-content">
                ${mediaElement}
                <h3>${this.title}</h3>
                <div class="date">${this.date}</div>
                <div class="text-container">${this.description.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('')}</div>
                <div class="links-container">
                    <a href="https://www.google.com/maps?q=${this.lat},${this.lng}" target="_blank" class="link-button">Google Maps</a>
                    <a href="https://en.wikipedia.org/wiki/Special:Nearby#/coord/${this.lat},${this.lng}" target="_blank" class="link-button">Wiki Nearby (EN)</a>
                    <a href="https://de.wikipedia.org/wiki/Spezial:In_der_N%C3%A4he#/coord/${this.lat},${this.lng}" target="_blank" class="link-button">Wiki Nearby (DE)</a>
                </div>
            </div>
        `;
    }

    addToMap(map) {
        const content = this.generateContent();
        L.marker([this.lat, this.lng], { icon: this.icon })
            .addTo(map)
            .bindPopup(content)
            .closePopup();
    }
}

async function fetchJsonContent(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function createMarkers() {
    const data = await fetchJsonContent('./descriptions.json');
    const markersData = data.markers;

    for (const markerData of markersData) {
        const [lat, lng] = markerData.coordinates.split(',').map(Number);
        const marker = new MarkerContent(
            lat,
            lng,
            markerData.date,
            markerData.title,
            markerData.mediaType,
            markerData.mediaSrc,
            markerData.description
        );
        marker.addToMap(mymap);
    }
}

createMarkers();
