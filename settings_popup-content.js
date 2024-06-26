// Settings, default coordinates and zoom level
const defaultCenterCoordinates = [50.5762814, 9.1919403];
const defaultMapZoom = 14;
const defaultWikiStatus = 'Off'; // Default wiki status: 'DE', 'EN', 'ES', 'FR', 'RU', 'IT', 'AR', 'NL', 'CEB', 'SV', or 'Off'
const showCustomMarkers = false; // Control to show/hide custom markers

// Data for the markers on the map
const markersData = [
    {
        coordinates: "52.46650, 13.43371",
        date: "17.05.2024",
        title: "Aufbruch",
        mediaType: "video",
        mediaSrc: "./media/2024-05-17-1.mp4",
        description: "Bester Ort der Welt!",
        "map-center": false,
        "markerType": "orange"
    },
    {
        coordinates: "52.112028, 13.762333",
        date: "18.05.2024",
        title: "Mittagessen",
        mediaType: "image",
        mediaSrc: "./media/2024-05-18.jpg",
        description: "Lecker!",
        "map-center": false,
        "markerType": "blue"
    }
    // Additional markers can be added here
];
