const token = 'pk.eyJ1IjoiY3JlYXRpdmUtdnJ0bndzIiwiYSI6ImNtYXV1bjV3NTAwd3Qya3NmcnNtMWFjcHIifQ.F8f25tcyZ6iml6Q0USz1Jg';
mapboxgl.accessToken = token;

const dropdown = document.getElementById('map-style');
const captureArea = document.getElementById('capture-area');

// This GeoJSON object will hold our marker points canvas-side
let markerData = {
    "type": "FeatureCollection",
    "features": []
};

const map = new mapboxgl.Map({
    container: 'map',
    style: dropdown.value,
    center: [139.766591, 35.680193], 
    zoom: 15.3,                      
    scrollZoom: true,                
    preserveDrawingBuffer: true      
});

// Function to setup the marker engine layers inside the Mapbox canvas
function initMarkerLayers() {
    // Check if source exists, if not create it
    if (!map.getSource('my-markers')) {
        map.addSource('my-markers', {
            type: 'geojson',
            data: markerData
        });

        // Layer 1: Outer white border for the marker dots
        map.addLayer({
            id: 'marker-glow',
            type: 'circle',
            source: 'my-markers',
            paint: {
                'circle-radius': 10,
                'circle-color': '#ffffff',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#d2d2d7'
            }
        });

        // Layer 2: Main crisp red marker dot
        map.addLayer({
            id: 'marker-core',
            type: 'circle',
            source: 'my-markers',
            paint: {
                'circle-radius': 7,
                'circle-color': '#ff3b30'
            }
        });
    }
}

// When map styles change, canvas objects drop out and must be re-initialized
map.on('style.data', () => {
    initMarkerLayers();
});

map.on('load', () => {
    initMarkerLayers();

    // Click Event: Add or Delete markers natively inside the WebGL map canvas
    map.on('click', (e) => {
        // Check if user clicked an existing dot to delete it
        const features = map.queryRenderedFeatures(e.point, { layers: ['marker-core', 'marker-glow'] });
        
        if (features.length) {
            // Clicked an existing marker -> Delete it
            const clickedId = features[0].properties.id;
            markerData.features = markerData.features.filter(f => f.properties.id !== clickedId);
        } else {
            // Clicked empty space -> Create a new marker feature
            const newFeature = {
                "type": "Feature",
                "properties": { "id": Date.now() },
                "geometry": {
                    "type": "Point",
                    "coordinates": [e.lngLat.lng, e.lngLat.lat]
                }
            };
            markerData.features.push(newFeature);
        }

        // Feed the updated data back into the canvas renderer
        map.getSource('my-markers').setData(markerData);
    });
});

// Search Bar configuration
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false,
    placeholder: 'Search location or address...'
});
map.addControl(geocoder, 'top-left');
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

// Dropdown Style Switcher
dropdown.addEventListener('change', (e) => {
    map.setStyle(e.target.value);
});

// Image Exporter
document.getElementById('export-png').addEventListener('click', () => {
    captureArea.classList.add('hide-for-export');
    map.resize(); 

    setTimeout(() => {
        const canvas = map.getCanvas();
        const dataUrl = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = 'mapbox-snapshot-1080x1080.png';
        link.href = dataUrl;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        captureArea.classList.remove('hide-for-export');
    }, 60);
});