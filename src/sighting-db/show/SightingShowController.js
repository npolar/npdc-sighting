'use strict';

var SightingShowController = function($controller, $routeParams, $scope, $q, Sighting, SightingExcel, NpolarApiSecurity, Expedition, npdcAppConfig, NpolarTranslate) {
    'ngInject';

  $controller('NpolarBaseController', {
    $scope: $scope
  });
  $scope.resource = Sighting;

  //Find link for file downloads
  let uri = (sighting) => {
    let link = null;
    if (sighting.links) {
         link = sighting.links.find(l => {
         return l.rel === "alternate" && (/html$/).test(l.type);
    });
    }
    if (link !== null) {
      return link.href.replace(/^http:/, "https:");
    } else {
      return `https://data.npolar.no/sighting/${ sighting.id }`;
    }
  };

   $scope.admin = NpolarApiSecurity.canonicalUri('/sighting/admin');
   console.log($scope.admin);


  let show = function() {

    $scope.show().$promise.then((sighting) => {

      //If lat lng does not exist, we need a stanrad map without markers. Use Svalbard centerpoints.
      var center_lat = 78.22;
      var center_lng = 15.63;
      var lat = $scope.document.latitude;
      var lng = $scope.document.longitude;

       if ((lat) && (lng)) {
            center_lat = lat;
            center_lng = lng;
       }

       //Loading leaflet
    var L = require('leaflet');
   // L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images';
    var map2 = L.map('mapid2', {
      fullscreenControl: true,
      fullscreenControlOptions: {
      position: 'topleft'
      }}).setView([center_lat, center_lng], 4);

    L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}/', {
       maxZoom: 18,
      attribution: 'Esmapri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community'
    }).addTo(map2);


     var markerIcon = L.icon({
      iconUrl:  'admin/img/marker2.png',
     iconSize: [50, 50]
    });

     //Draw marker if we have lat and lng coords
     if ((lat) && (lng)) {
       var marker2 = L.marker([lat, lng], {icon: markerIcon}).addTo(map2);
       marker2.bindPopup($scope.document['@placename']).openPopup();
     }

     if (sighting.links && sighting.links !== null) {
     $scope.links = sighting.links.filter(l => (l.rel !== "alternate" && l.rel !== "edit") && l.rel !== "data");
     $scope.data = sighting.links.filter(l => l.rel === "data");
      // or in files
     $scope.alternate = sighting.links.filter(l => ((l.rel === "alternate") || l.rel === "edit")).concat({
        href: `https://api.npolar.no/sighting/?q=&filter-id=${sighting.id}&format=json`,
        title: "DCAT (JSON-LD)",
        type: "application/ld+json"
      });
   }

     //Fetch the key function from the login key in order to download images and excel files
    $scope.key = get_key(NpolarApiSecurity, Sighting.path);
    $scope.excel_key = get_key(NpolarApiSecurity, SightingExcel.path);

      $scope.uri = uri(sighting);

    });

  };


  show();

};

//Fetch the key function from the login key in order to download images and excel files
function get_key(NpolarApiSecurity,path) {
      let system = NpolarApiSecurity.getSystem('read', path);
      console.log(system.key);
      if (system.key) {
        return system.key;
      }
}

module.exports = SightingShowController;