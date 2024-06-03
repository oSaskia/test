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
                <div class="text-container">${this.description}</div>
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

async function fetchTextContent(url) {
    const response = await fetch(url);
    const text = await response.text();
    return text.split('\n\n').map(paragraph => `<p>${paragraph}</p>`).join('');
}

async function createMarkers() {
    const markersData = [
        {
            lat: 50.9555981,
            lng: 14.5500692,
            date: '30.05 - 02.06.2024',
            title: 'Schlafplatz',
            mediaType: 'video',
            mediaSrc: './media/2024-05-31.mp4',
            textFile: './texts/description_20240531.txt'
        },
        {
            lat: 51.0897904,
            lng: 14.6926595,
            date: '29.05.2024',
            title: 'Schlafplatz',
            mediaType: 'image',
            mediaSrc: './media/2024-05-29.jpg',
            textFile: './texts/description_20240529.txt'
        }
        // Weitere Marker hier hinzufügen
    ];

    for (const data of markersData) {
        const description = await fetchTextContent(data.textFile);
        const marker = new MarkerContent(data.lat, data.lng, data.date, data.title, data.mediaType, data.mediaSrc, description);
        marker.addToMap(mymap);
    }
}

createMarkers();
