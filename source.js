mapboxgl.accessToken = 'ACCESS-TOKEN-HERE';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [0, 0],
  zoom: 2
});

map.on('load', () => {
  map.addSource('countries', {
    'type': 'vector',
    'url': 'mapbox://mapbox.country-boundaries-v1'
  });
  });

  const mapboxAccessToken = mapboxgl.accessToken;
  const reliefWebApiUrl = 'https://api.reliefweb.int/v1/countries?appname=safereach&profile=list&preset=latest&slim=1&query%5Bvalue%5D=status%3Acurrent&query%5Boperator%5D=AND&limit=100';
  // Fetch data from ReliefWeb API
  fetch(reliefWebApiUrl)
    .then(response => response.json())
    .then(data => {
      // Process each country data from ReliefWeb
      data.data.forEach(country => {
        const countryName = country.fields.name;
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(countryName)}.json?access_token=${mapboxAccessToken}`;
  
        // Geocode the country name using Mapbox Geocoding API
        fetch(geocodingUrl)
          .then(response => response.json())
          .then(geocodingData => {
            // Extract the coordinates from the geocoding response
            if (geocodingData.features && geocodingData.features.length > 0) {
              const coordinates = geocodingData.features[0].center;
  
              const countryInfo = country.fields.url
              const marker = document.createElement('div');
              marker.className = 'markerrfweb';
              // Create a marker and add it to the map
              new mapboxgl.Marker(marker)
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<h3>${countryName}</h3><a href="${countryInfo}" target="_blank">Ongoing Humanitarian Situation</a>`))
                .addTo(map);
            } else {
              console.error('No coordinates found for the location:', countryName);
            }
          })
          .catch(error => {
            console.error('Error geocoding country:', error);
          });
      });
    })
    .catch(error => {
      console.error('Error fetching data from ReliefWeb:', error);
    });
  
  // Fetch data from FEMA API
  fetch('https://www.fema.gov/api/open/v1/FemaWebDisasterDeclarations?$filter=declarationDate%20gt%20%272024-05-01T04:00:00.000z%27%20and%20incidentEndDate%20eq%20null&$format=json')
    .then(response => response.json())
    .then(data => {
      // Process each disaster data from FEMA
      data.FemaWebDisasterDeclarations.forEach(disaster => {
        const disasterPlace = disaster.stateName.trim(); // Trim whitespace from state name
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(disasterPlace)}.json?access_token=${mapboxAccessToken}`;
  
        // Geocode the state name using Mapbox Geocoding API
        fetch(geocodingUrl)
          .then(response => response.json())
          .then(geocodingData => {
            // Extract the coordinates from the geocoding response
            if (geocodingData.features && geocodingData.features.length > 0) {
              const coordinates = geocodingData.features[0].center;
  
              const marker = document.createElement('div');
              marker.className = 'markerfema';
              // Create a marker and add it to the map
              new mapboxgl.Marker(marker)
                .setLngLat(coordinates)
                .setPopup(new mapboxgl.Popup().setHTML(`<h3>${disasterPlace}</h3><p>${disaster.disasterName}</p>`))
                .addTo(map);
            } else {
              console.error('No coordinates found for the location:', disasterPlace);
            }
          })
          .catch(error => {
            console.error('Error geocoding state:', error);
          });
      });
    })
    .catch(error => {
      console.error('Error fetching data from FEMA:', error);
    });



// Income level colors
const incomeColors = {
  'HIC': 'red', // High income (HIC)
  'UMC': 'indigo', // Upper middle income (UMC)
  'LMC': 'green', // Lower middle income (LMC)
  'LIC': 'yellow', // Low income (LIC)
  'INX': 'red', // Not classified
  'LMY': 'orange', // Low & middle income
  'MIC': 'blue', // Middle income
  'NA': 'white' // Not available
};

const countryIncomeLevels = {};
// Fetch economic growth data from World Bank API
  for (x = 0; x < 7; ++x) {
    fetch('https://api.worldbank.org/v2/country?format=json&date=latest&page='+x)
    .then(response => response.json())
    .then(data => {
      // Process the data
      data[1].forEach(country => {
        if (country.incomeLevel && country.incomeLevel.id) {
          countryIncomeLevels[country.id.toUpperCase()] = country.incomeLevel.id;
        }
      });
    })
    .catch(error => {
      console.error('Error fetching data from World Bank:', error);
    });
  }

    // Add the choropleth layer to the map
    map.on('load', () => {
      map.addLayer({
        'id': 'country-income-level',
        'type': 'fill',
        'source': 'countries',
        'source-layer': 'country_boundaries',
        'paint': {
          'fill-color': [
            'match',
            ['get', 'iso_3166_1_alpha_3'],
            Object.keys(countryIncomeLevels),
            ...Object.values(incomeColors) // Colors based on income levels
          ],
          'fill-opacity': 0.4
        }
      });
      console.log(countryIncomeLevels)
      // Log the initial visibility after the map has finished rendering
      console.log('Layer Visibility:', map.getLayoutProperty('country-income-level', 'visibility'));
    });

// Wait for the DOM content to be fully loaded before adding the event listener
document.addEventListener('DOMContentLoaded', () => {
  // Add a toggle button to enable/disable the layer
  document.getElementById('egrowthBtn').addEventListener('click', () => {
    const visibility = map.getLayoutProperty('country-income-level', 'visibility');
    if (visibility === 'visible') {
      map.setLayoutProperty('country-income-level', 'visibility', 'none');
    } else {
      map.setLayoutProperty('country-income-level', 'visibility', 'visible');
    }
    console.log('Layer Visibility:', map.getLayoutProperty('country-income-level', 'visibility'));
  });
});