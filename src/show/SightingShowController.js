'use strict';

var SightingShowController = function($controller, $routeParams,
  $scope, $q, Sighting, npdcAppConfig) {
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

  let show = function() {

    $scope.show().$promise.then((sighting) => {
      $scope.document.research_type =  convert($scope.document.research_type);


      //Location on map should be
   /*   var bounds =[];
      switch($scope.document.research_station) {
        case 'sverdrup':
            bounds = [[[78.91,11.93],[78.91,11.93]]];
            break;
        case 'norvegia':
           // bounds = [[[-54.40, 3.28],[-54.40, 3.28]]];
             bounds = [[[-54.4097, 3.2886889],[-54.4097, 3.2886889]]];
            break;
        default: //troll
            bounds = [[[-72.01, 2.53],[-72.01, 2.53]]];
      } */
      $scope.mapOptions.coverage = bounds;
      $scope.mapOptions.geojson = "geojson";

      $scope.links = sighting.links.filter(l => (l.rel !== "alternate" && l.rel !== "edit") && l.rel !== "data");
      $scope.data = sighting.links.filter(l => l.rel === "data");
      // or in files

      $scope.alternate = sighting.links.filter(l => ((l.rel === "alternate") || l.rel === "edit")).concat({
        href: `https://api.npolar.no/sighting/?q=&filter-id=${sighting.id}&format=json`,
        title: "DCAT (JSON-LD)",
        type: "application/ld+json"
      });

      $scope.authors = authors(sighting).map(a => {
        if (!a.name && a.first_name) {
          a.name = `${a.first_name} ${a.last_name}`;
        }
        return a;
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
