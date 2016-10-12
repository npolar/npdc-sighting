'use strict';

var SightingShowController = function($controller, $routeParams, $scope, $q, Sighting, Expedition, npdcAppConfig, NpolarTranslate) {
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


  let show = function() {

    $scope.show().$promise.then((sighting) => {

      var lat = $scope.document.latitude;
     var lng = $scope.document.longitude;

       //Loading leaflet
    var L = require('leaflet');
   // L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images';
    var map2 = L.map('mapid2', {
      fullscreenControl: true,
      fullscreenControlOptions: {
      position: 'topleft'
      }}).setView([lat, lng], 4);


    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
      maxZoom: 18,
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
      id: 'mapbox.streets'
    }).addTo(map2);


     var markerIcon = L.icon({
      iconUrl:  'admin/img/marker2.png',
     iconSize: [50, 50]
    });


    var marker2 = L.marker([lat, lng], {icon: markerIcon}).addTo(map2);
    marker2.bindPopup($scope.document['@placename']).openPopup();


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

      $scope.uri = uri(sighting);

    });

  };


  show();

};

/* convert from camelCase to lower case text*/
function convert(str) {
       var  positions = '';

       for(var i=0; i<(str).length; i++){
           if(str[i].match(/[A-Z]/) !== null){
             positions += " ";
             positions += str[i].toLowerCase();
        } else {
            positions += str[i];
        }
      }
        return positions;
}

module.exports = SightingShowController;
