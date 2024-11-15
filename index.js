// Configurer l'accès à Mapbox
mapboxgl.accessToken = "pk.eyJ1IjoiaGlkZGVubWFuIiwiYSI6ImNrODdjeGVudjBlMDMzZXBybTl5a2xhbmMifQ.cwmOFowbDFc7tI-AL1GruA";

// Initialiser la carte
const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/traffic-day-v2",
    center: [1.5659361596150514, 43.716215961673356],
    zoom: 8.5
});


// Configurer un objet pour suivre l'état et les données de l'application
const isoAppData = {
    params: {
        urlBase: "https://api.mapbox.com/isochrone/v1/mapbox/",
        profile: "driving-traffic/",
        minutes: 15,
        vehicle_weight: 30000 // poids en kilogrammes (30 tonnes)
    },
    origins: {
        a: [1.5659361596150514, 43.716215961673356]
    },
    isos: {
        a: {}
    }
};

// Ajouter des contrôles de navigation et de géolocalisation
var nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-right');

var geoControl = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
});
map.addControl(geoControl);

// Obtenir une isochrone pour une position donnée et renvoyer le GeoJSON
// Obtenir une isochrone pour une position donnée et renvoyer le GeoJSON
const getIso = function (position) {
    // Récupérer la sélection du profil de transport
    const profileSelect = document.getElementById("profile-select");
    const selectedProfile = profileSelect.value;

    // Vérifier que le profil est sélectionné
    if (!selectedProfile) {
        console.error("Aucun profil de transport sélectionné.");
        return;
    }

    // Construire l'URL de l'isochrone
    const isoUrl = `https://api.mapbox.com/isochrone/v1/mapbox/${selectedProfile}/${position.join(",")}?contours_minutes=${isoAppData.params.minutes}&polygons=true&access_token=${mapboxgl.accessToken}`;

    console.log("Isochrone URL: ", isoUrl); // Affiche l'URL pour débogage

    // Effectuer la requête fetch
    return fetch(isoUrl)
        .then((res) => {
            if (!res.ok) {
                throw new Error("Error fetching isochrone data: " + res.statusText);
            }
            return res.json();
        })
        .then((data) => {
            // Vérifier si les données d'isochrone sont disponibles
            if (!data.features || data.features.length === 0) {
                console.error("No isochrone data returned.");
                return;
            }
            return data; // Renvoie les données GeoJSON
        })
        .catch((error) => {
            console.error("Error in fetching isochrone:", error);
        });
};


// Mettre à jour les sources de la carte afin que les isochrones soient dessinés
const setIsos = function (isos) {
    isoAppData.isos.a = isos[0];
    if (map.getSource("isoSource")) {
        map.getSource("isoSource").setData(isoAppData.isos.a);
    } else {
        console.error("Isochrone source not found on the map.");
    }
};

// Obtenir les données d'isochrone de l'API, puis mettre à jour la carte
const renderIso = function () {
    const isochroneA = getIso(isoAppData.origins.a);

    Promise.all([isochroneA]).then((values) => {
        if (values && values[0]) {
            setIsos(values);
        } else {
            console.error("No isochrone data returned.");
        }
    });
};

map.on('load', function () {
    console.log("Map is ready");

    // Ajouter la source d'isochrone
    map.addSource("isoSource", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: []
        }
    });

    // Ajouter la couche d'isochrone
    map.addLayer({
        id: "isoLayer",
        type: "fill",
        source: "isoSource",
        layout: {},
        paint: {
            "fill-color": "#5a3fc0",
            "fill-opacity": 0.3
        }
    });

    renderIso();

// Initialiser les bornes pour inclure tous les marqueurs
const bounds = new mapboxgl.LngLatBounds();

// Ajouter des marqueurs pour les sites
const sites = [
    { latitude: 43.71432, longitude: 1.35963, site: "Gagnac" },
    { latitude: 43.7767, longitude: 1.3055, site: "Ondes" },
    { latitude: 43.9041888, longitude: 1.95924, site: "Carrière de Brens" },
    { latitude: 43.925468, longitude: 1.8273, site: "Gradilles" },
    { latitude: 43.853916, longitude: 1.7829, site: "isle-sur-Tarn" },
    { latitude: 43.93030, longitude: 2.1941, site: "Albi" },
    { latitude: 44.018238, longitude: 2.0269, site: "Villeneuve-sur-Vère" },
    { latitude: 43.865014, longitude: 2.4604, site: "Paulinet" },
    { latitude: 44.140343, longitude: 1.9302, site: "Sablière de Lexos" },
    { latitude: 43.84527, longitude: 1.2729, site: "Verdun" },
];

// Charger une icône GODO personnalisée
    const gdoIcon = document.createElement('img');
    gdoIcon.src = 'img/gdo.png'; 
    gdoIcon.style.width = '45px'; 
    gdoIcon.style.height = '45px';

// Fonction pour ajouter les marqueurs sur la carte
const addMarkers = (sites) => {
    sites.forEach(({ latitude, longitude, site }) => {
        //const marker = new mapboxgl.Marker({ color: "blue", anchor: "bottom" }) // Marqueur gdo
        const marker = new mapboxgl.Marker({ element: gdoIcon.cloneNode(true), anchor: "bottom" }) // Utiliser l'icône de camion
            .setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup().setText(site)) // Ajouter un popup avec le nom du site
            .addTo(map);
        
        // Ajouter les coordonnées du marqueur aux bornes
        bounds.extend([longitude, latitude]);
    });
};

// Appeler la fonction pour ajouter les marqueurs
addMarkers(sites);

// Ajuster la carte pour inclure tous les marqueurs
map.fitBounds(bounds, {
    padding: { top: 20, bottom: 20, left: 20, right: 20 } // Optionnel : ajouter du rembourrage
});
    // Appeler la fonction pour ajouter les marqueurs
    addMarkers(sites);


// Charger une icône de camion personnalisée
    const camionIcon = document.createElement('img');
    camionIcon.src = 'img/benne.png'; 
    camionIcon.style.width = '45px'; 
    camionIcon.style.height = '45px';

    // Ajouter des marqueurs pour les transporteurs
    const transporters = [
        { longitude: 1.9097776, latitude: 43.8783046, name: "TAF" },
        { longitude: 2.3704101, latitude: 43.8991847, name: "CHOIZIT" },
        { longitude: 2.3439499, latitude: 44.0095606, name: "DELISLE" },
        { longitude: 1.3270619, latitude: 43.7192096, name: "TVG PAULIN" },
        { longitude: 1.398196, latitude:  44.0289235, name: "PAULIN" },
        { longitude: 2.4486202, latitude: 43.8872531, name: "FAGES" },
        { longitude: 2.1877417, latitude: 43.9329187, name: "SEMALEX" },
        { longitude: 2.0291484, latitude: 44.0763605, name: "GAUD" },
        { longitude: 1.843232, latitude: 43.8413384, name: "MAUREL" },
        { longitude: 1.3148897, latitude: 43.8189302, name: "GOMILA MAUREL" }
    ];

    // Stocker les marqueurs de transporteurs pour référence ultérieure
    const transporterMarkers = [];

    // Fonction pour ajouter les marqueurs pour les transporteurs
    const addTransporterMarkers = (transporters) => {
        transporters.forEach(({ latitude, longitude, name }) => {
          //  const marker = new mapboxgl.Marker({ color: "blue", anchor: "bottom" }) // Marqueur bleu
              const marker = new mapboxgl.Marker({ element: camionIcon.cloneNode(true), anchor: "bottom" }) // Utiliser l'icône de camion
                .setLngLat([longitude, latitude])
                .setPopup(new mapboxgl.Popup().setText(name)) // Ajouter un popup avec le nom du transporteur
                .addTo(map);
            transporterMarkers.push({ marker, name, longitude, latitude }); // Stocker le marqueur pour une référence ultérieure
        });
    };

    // Appeler la fonction pour ajouter les marqueurs des transporteurs
    addTransporterMarkers(transporters);




// Définir les marqueurs de concurrence
   const gravelIcon = document.createElement('img');
   gravelIcon.src = 'img/conc.png'; 
    gravelIcon.style.width = '45px'; 
   gravelIcon.style.height = '45px';

const competitors = [
    { latitude: 43.7908, longitude: 1.3158,  name: "Carrière Castelnau MGM" },
    { latitude: 44.1495, longitude: 1.9493,  name: "Carrière Laguépie Eiffage" },
    { latitude: 43.7650, longitude: 2.2621,  name: "Carrière Peyrebrune Colas" },
    { latitude: 43.9023, longitude: 2.1293,  name: "Carrière d'Albi Cemex" },
    { latitude: 43.9515, longitude: 2.4379,  name: "Carrière d'Assac Vigroux" },
    { latitude: 43.7797,  longitude: 2.1813, name: "Carrière Réalmont Bessac" },
    { latitude: 43.5236,  longitude: 1.3833, name: "Carrière Portet Malet" },
    { latitude: 43.2251,  longitude: 1.6130, name: "Carrière Lafarge Saverdun" }


];

// Fonction pour ajouter des marqueurs de concurrence (vert)
const addCompetitorMarkers = (competitors) => {
    competitors.forEach(({ latitude, longitude, name }) => {
         new mapboxgl.Marker({ element: gravelIcon.cloneNode(true), anchor: "bottom" }) // Utiliser l'icône de sable
     //  new mapboxgl.Marker({ color: "gray", anchor: "bottom" }) // Marqueur 
            .setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup().setText(name)) // Ajouter un popup avec le nom de la concurrence
            .addTo(map);
    });
};

addCompetitorMarkers(competitors);   // Marqueurs de concurrence (oranges)


    // Configurer le marqueur d'origine et son interactivité
    const originPoint = new mapboxgl.Marker({
        draggable: true,
       color: "purple" // Changer la couleur du marqueur d'origine en rouge
    })
        .setLngLat(isoAppData.origins.a)
        .addTo(map);

    function onDragEndA() {
        const lngLat = originPoint.getLngLat();
        isoAppData.origins.a = [lngLat.lng, lngLat.lat];
        renderIso();
    }

    originPoint.on("dragend", onDragEndA);

    // Fonction pour géocoder l'entrée de la ville
    const geocodeCity = function(city) {
    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?country=FR&proximity=1.4442,43.6045&bbox=1.0012,42.2429,4.8449,45.0042&access_token=${mapboxgl.accessToken}`;

    return fetch(geocodeUrl)
        .then(res => {
            if (!res.ok) {
                throw new Error("Error fetching geocode data: " + res.statusText);
            }
            return res.json();
        })
        .then(data => {
            if (data.features.length > 0) {
                const { center } = data.features[0];
                isoAppData.origins.a = center;
                originPoint.setLngLat(center);
                renderIso();
            } else {
                console.error("No geocode data found for the city.");
            }
        })
        .catch(error => {
            console.error("Error in geocoding:", error);
        });
};




    // Ajouter un événement au bouton de mise à jour pour géocoder la ville et calculer la distance et le temps
 // Ajouter un événement au bouton de mise à jour pour géocoder la ville et calculer la distance et le temps

document.getElementById("updateButton").addEventListener("click", function() {
//remonte les résultats
 // Faire défiler jusqu'aux résultats après l'envoi
        document.getElementById('resultats').scrollIntoView({
            behavior: 'smooth', // Option pour un défilement fluide
            block: 'start' // Aligner avec le début de la zone de résultats
        });


    const cityInput = document.getElementById("cityInput").value.trim(); // Enlève les espaces inutiles
    const selectedSite = document.getElementById("siteSelect").value;

    // Vérifie si un site est sélectionné et si la ville est saisie
    if (selectedSite !== "Sélectionnez un site" && cityInput) {
        // Obtenir les coordonnées du site sélectionné
        const siteCoordinates = sites.find(site => site.site === selectedSite);
        
        // Vérifiez si les coordonnées du site existent
        if (siteCoordinates) {
            const sitePosition = [siteCoordinates.longitude, siteCoordinates.latitude];

            // Affichage des coordonnées pour le débogage
            console.log("Coordonnées de depart site:", sitePosition);
            

            // Appeler la fonction pour géocoder la ville
            geocodeCity(cityInput)
                .then(() => {
                    // Une fois la ville géocodée, calculer la distance et le temps
                     console.log("Coordonnées de la destination:", isoAppData.origins.a);
              
                    return calculateDistanceAndTime(isoAppData.origins.a, sitePosition);
           
                })
                .then(() => {
               
                    
                 // Vérifiez si les coordonnées sont valides
          const coordinates = isoAppData.origins.a; 
         if (coordinates && coordinates.length === 2) {
        const [lng, lat] = coordinates; // Ordre [longitude, latitude]

        // Centrer la carte et zoomer
        map.flyTo({
            center: [lng, lat], // Centre sur les coordonnées
            zoom: 11, // Niveau de zoom (ajustez selon vos besoins)
            essential: true // Utilisez un vol essentiel pour des performances optimales
        });
    } else {
        console.error("Coordonnées invalides:", coordinates);
    }

                    // Calculer le coût par tonne après avoir calculé la distance et le temps
                    const distance = document.getElementById("distance").value;
                   const distanceG = document.getElementById("distanceG").value;
                    const prixTransportParJour = parseFloat(document.getElementById('prixTransport').value);
                    const tours = parseInt(document.getElementById('numToursInt').value);
                    
                    if (!isNaN(tours) && tours > 0) {
                        calculerCoutParTonne(tours, distance, prixTransportParJour);
                    } else {
                        console.error("Le nombre de tours est invalide.");
                    }
                })
                .catch(error => {
                    console.error("Erreur dans le géocodage ou le calcul de la distance:", error);
                });
        } else {
            console.error("Le site sélectionné n'a pas été trouvé. Vérifiez la liste des sites.");
        }
    } else {
        console.error("Veuillez sélectionner un site et entrer une ville.");
       showError("Veuillez sélectionner un site ou entrer une ville.");
    }
});

// Ajouter une fonction pour calculer la distance et le temps
const calculateDistanceAndTime = (origin, siteCoordinates) => {
    
// Récupérer la valeur sélectionnée dans le sélecteur
    const profileSelect = document.getElementById("profile-select");
    const selectedProfile = profileSelect.value;

    // Construire l'URL en fonction du profil sélectionné
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/${selectedProfile}/${origin.join(",")};${siteCoordinates.join(",")}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
   
    return fetch(directionsUrl)
        .then(res => {
            if (!res.ok) {
                throw new Error("Error fetching directions: " + res.statusText);
            }
            return res.json();
        })
        .then(data => {
            if (data.routes.length > 0) {
                const distance = (data.routes[0].distance / 1000).toFixed(2); // Convertir en km
                const duration = (data.routes[0].duration / 60).toFixed(0); // Convertir en minutes
                document.getElementById("distance").value = `${distance} km`;
                document.getElementById("distanceG").value = `${distance} km`;
                document.getElementById("time").value = `${duration} minutes`;

             // Appeler la fonction pour afficher la route entre l'origine et le site
                displayRoute(origin, siteCoordinates);

                // Calculer le nombre de tours en fonction de la distance et du poids du véhicule
                calculateTours(duration, isoAppData.params.vehicle_weight); // Passer la durée en minutes
            } else {
                console.error("No route found.");
            }
        })
        .catch(error => {
            console.error("Error in fetching directions:", error);
        });
};
// Ajouter une fonction pour calculer le nombre de tours
function calculateTours(duration, vehicleWeight) {
    const tempsTravail = parseFloat(document.getElementById('tempsTravail').value) || 480; // minutes
    const tempsArret = parseFloat(document.getElementById('tempsArret').value) || 15; // minutes

    // Calculer le temps total pour un tour
    const tempsParTour = (parseFloat(duration) * 2) + tempsArret; // en minutes

    // Calculer le nombre de tours
    const tours = Math.floor(tempsTravail / tempsParTour); // en minutes

//pour decimal log 
// Calculer le temps total pour un tour
    const tempsParTourMax = (parseFloat(duration) * 2) + tempsArret; // en minutes
    const toursMax = tempsTravail / tempsParTour; // cela peut donner un résultat décimal


    console.log(`Nombre de tours : ${tours}`); // Cela affichera le nombre total de tours
    console.log("Nombre de tours max :", toursMax.toFixed(2)); // Affichage avec 2 décimales

    // Afficher le résultat dans le champ Tours
    // Afficher le résultat dans les champs appropriés
    document.getElementById('numToursInt').value = Math.floor(tours); // Tours entiers
    document.getElementById('numToursDecimal').value = toursMax.toFixed(2); // Tours avec décimales

    // Calculer le coût par tonne
    calculerCoutParTonne(tours);
}

function calculerCoutParTonne(tours) {
    const quantiteElement = document.getElementById('quantite');
    const prixTransportElement = document.getElementById('prixTransport');
    const coutParTonneElement = document.getElementById('coutParTonne');
    const coutParTonneDoubleFret = document.getElementById('coutParTonneDoubleFret'); 
   const coutParTonneDoubleFretMax = document.getElementById('coutParTonneDoubleFretMax'); 
    const couttoursAvecUnPlus = document.getElementById('couttoursAvecUnPlus'); // Ajoutez cette ligne

    if (!quantiteElement || !prixTransportElement || !coutParTonneElement) {
        console.error("Un ou plusieurs éléments nécessaires n'existent pas.");
        return; // Sortir de la fonction si les éléments ne sont pas trouvés
    }

    const quantite = parseFloat(quantiteElement.value);
    const prixTransportParJour = parseFloat(prixTransportElement.value);

    // Vérifiez si le nombre de tours est 0
    if (tours <= 0) {
        coutParTonneElement.value = (0).toFixed(2);
        coutParTonneDoubleFret.value = (0).toFixed(2);
        coutParTonneDoubleFretMax.value = (0).toFixed(2);
        couttoursAvecUnPlus.value = (0).toFixed(2); // Réinitialiser le champ pour le coût avec un tour supplémentaire
        return; // Sortir de la fonction si les tours sont 0
    }

    if (isNaN(quantite) || isNaN(prixTransportParJour)) {
        console.error("Données invalides pour le calcul du coût.");
        return; // Sortir de la fonction si les données sont invalides
    }

    if (!quantite) {
        alert("Veuillez entrer une quantité.");
        return; // Sortir de la fonction si la quantité est manquante
    }

    let poidsVehiculeLivraison;

    // Récupérer la valeur de la radio box sélectionnée
    const radioBoxValue = document.querySelector('input[name="poids"]:checked');
    if (!radioBoxValue) {
        console.error("Aucun poids de véhicule sélectionné.");
        return; // Sortir de la fonction si aucun poids n'est sélectionné
    }

    const poidsValue = radioBoxValue.id.replace('t', '');

    // Déterminer le poids de véhicule selon la sélection
    switch (poidsValue) {
        case '30':
            poidsVehiculeLivraison = 30; // Capacité de chargement nette
            break;
        case '16':
            poidsVehiculeLivraison = 16; 
            break;
        case '13':
            poidsVehiculeLivraison = 13; 
            break;
        default:
            poidsVehiculeLivraison = 0; // Pas de poids
            break;
    }

    // Calculer le nombre de jours pour livraison
    const joursPourLivraison = Math.ceil(quantite / (tours * poidsVehiculeLivraison));

    // Calculer le coût par tonne livrée
    const coutParTonne = (prixTransportParJour * joursPourLivraison) / quantite;

    // Afficher le coût par tonne
    coutParTonneElement.value = coutParTonne.toFixed(2); // Affiche uniquement le coût
    coutParTonneDoubleFret.value = (coutParTonne / 2).toFixed(2); // Affiche uniquement le coût double fret
    
    // Calculer le coût par tonne avec un tour supplémentaire
    const toursAvecUnPlus = tours + 1; // Ajouter un tour
    const joursPourLivraisonAvecUnPlus = Math.ceil(quantite / (toursAvecUnPlus * poidsVehiculeLivraison));
    const coutParTonneAvecUnPlus = (prixTransportParJour * joursPourLivraisonAvecUnPlus) / quantite;


    // Afficher le coût par tonne avec un tour supplémentaire
    couttoursAvecUnPlus.value = coutParTonneAvecUnPlus.toFixed(2); // Affiche le coût avec un tour de plus
     coutParTonneDoubleFretMax.value = (coutParTonneAvecUnPlus/ 2).toFixed(2);  // Affiche uniquement le coût double fret Max

    console.log("Quantité Element:", quantite);
    console.log("Prix Transport Element:", prixTransportParJour);
    console.log("Coût Par Tonne Element:", coutParTonne);
    console.log("Nombre de jours:", joursPourLivraison);



// Calcul du coût par tonne bascule (proportionnel)
const quantiteVirtuelle = (poidsVehiculeLivraison * tours);
console.log("quantiteVirtuelle:", quantiteVirtuelle);
const coutParTonneBasculeV = (prixTransportParJour /  quantiteVirtuelle);
const forfaitTonneBasculeV = (prixTransportParJour /  quantiteVirtuelle) * quantite;
console.log("forfaitTonneBasculeV:", forfaitTonneBasculeV);
const coutParTonneBascule = (prixTransportParJour * joursPourLivraison) /  quantiteVirtuelle;


document.getElementById("forfaitoneshot").value = forfaitTonneBasculeV.toFixed(2);
document.getElementById("jours").textContent = `Nombre de jours : ${joursPourLivraison}`;

}

// Fonction pour afficher le message d'erreur et scroller vers l'erreur
function showError(message) {
    const errorMessage = document.getElementById("error-message");

    // Mettre à jour le texte du message d'erreur
    errorMessage.innerText = message;
    
    // Afficher le message d'erreur
    errorMessage.style.display = "block";

    // Faire défiler jusqu'au message d'erreur
    errorMessage.scrollIntoView({
        behavior: 'smooth', // Pour un défilement fluide
        block: 'center'     // Centrer le message d'erreur dans la fenêtre
    });

    // Cacher le message d'erreur après 10 secondes
    setTimeout(() => {
        errorMessage.style.display = "none";
    }, 10000); // Cache le message après 10 secondes
}

// Ajouter une fonction pour afficher la route entre le point de départ et le site sélectionné
    const displayRoute = (origin, destination) => {
   // original // const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.join(",")};${destination.join(",")}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
   // Récupérer la valeur sélectionnée dans le sélecteur
    const profileSelect = document.getElementById("profile-select");
    const selectedProfile = profileSelect.value;
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/${selectedProfile}/${origin.join(",")};${destination.join(",")}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
   
 return fetch(directionsUrl)
        .then(res => res.json())
        .then(data => {
            if (data.routes.length > 0) {
                const route = data.routes[0].geometry;

                // Si la source de la route existe déjà, on met simplement à jour les données
                if (map.getSource("route")) {
                    map.getSource("route").setData({
                        type: "Feature",
                        geometry: route
                    });
                } else {
                    // Sinon, on ajoute une nouvelle source et une couche pour la route
                    map.addSource("route", {
                        type: "geojson",
                        data: {
                            type: "Feature",
                            geometry: route
                        }
                    });

                    map.addLayer({
                        id: "route",
                        type: "line",
                        source: "route",
                        layout: {
                            "line-join": "round",
                            "line-cap": "round"
                        },
                        paint: {
                            "line-color": "#007bff", // Rouge #ff0000 pour la route  ou bleu
                            "line-width": 4
                        }
                    });
                }
            } else {
                console.error("Aucune route trouvée.");
            }
        })
        .catch(error => console.error("Erreur lors de la récupération des directions:", error));
};

// Changer le profil de conduite
document.getElementById("profile-select").addEventListener("change", function () {
    isoAppData.params.profile = this.value; // Mettre à jour le profil sélectionné
    renderIso(); // Rendre à nouveau l'isochrone avec le nouveau profil
});

  // Mettre à jour l'isochrone lorsque la limite de temps change
  document.getElementById("timelimit").addEventListener("change", (e) => {
    isoAppData.params.minutes = e.target.value;
    renderIso();
  });
});
