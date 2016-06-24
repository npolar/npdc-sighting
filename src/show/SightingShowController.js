'use strict';

var SightingShowController = function($controller, $routeParams,
  $scope, $q, Sighting, Expedition, npdcAppConfig) {
    'ngInject';


  $controller('NpolarBaseController', {
    $scope: $scope
  });
  $scope.resource = Sighting;


  let uri = (sighting) => {
    let link = sighting.links.find(l => {
      return l.rel === "alternate" && (/html$/).test(l.type);
    });
    if (link) {
      return link.href.replace(/^http:/, "https:");
    } else {
      return `https://data.npolar.no/sighting/${ sighting.id }`;
    }
  };

  $scope.mapOptions = {};
  $scope.mapOptions.initcoord = [78.223333, 15.646944];

  let show = function() {

    $scope.show().$promise.then((sighting) => {

     let lat = null;
     let lng = null;
     if ($scope.document.latitude) { lat = $scope.document.latitude; }
     if ($scope.document.longitude) { lng = $scope.document.longitude; }

     $scope.mapOptions.coverage = [[[lat, lng ],[lat,lng]]];
     $scope.mapOptions.geojson = "geojson";

     $scope.links = sighting.links.filter(l => (l.rel !== "alternate" && l.rel !== "edit") && l.rel !== "data");
     $scope.data = sighting.links.filter(l => l.rel === "data");

      // or in files

      $scope.alternate = sighting.links.filter(l => ((l.rel === "alternate") || l.rel === "edit")).concat({
        href: `https://api.npolar.no/sighting/?q=&filter-id=${sighting.id}&format=json`,
        title: "DCAT (JSON-LD)",
        type: "application/ld+json"
      });



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
