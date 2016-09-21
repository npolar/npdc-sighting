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

  //Creating intial coord for disply map
  $scope.mapOptions = {};
  $scope.mapOptions.initcoord = [79.004959, 17.666016];
  $scope.mapOptions.color = "#ff0000";
  $scope.mapOptions.weight = 10;

  let show = function() {

    $scope.show().$promise.then((sighting) => {

     if (typeof $scope.document.latitude !== 'undefined' && typeof $scope.document.longitude !== 'undefined') {
            var lat = $scope.document.latitude;
            var lng = $scope.document.longitude;
            $scope.mapOptions.coverage = [[[lat, lng],[lat,lng]]];
            $scope.mapOptions.geojson = "geojson";
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
