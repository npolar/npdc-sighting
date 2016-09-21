'use strict';


var SightingSearchController = function ($scope, $location, $controller, $filter, Sighting, npdcAppConfig,  NpdcSearchService, NpolarTranslate) {
  'ngInject';

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Sighting;



  //Get title and subtitle
  //npdcAppConfig.search.local.results.title = "species";
  //npdcAppConfig.search.local.results.subtitle = "@placename";


  let query = function() {
    let defaults = {
      limit: "50",
      sort: "-updated",
      fields: 'species,event_date,updated,id,habitat,@placename',
      facets: 'draft'};

    let invariants = $scope.security.isAuthenticated() ? {} : {} ;
    return Object.assign({}, defaults, invariants);
  };

  $scope.search(query());


  $scope.$on('$locationChangeSuccess', (event, data) => {
    $scope.search(query());
  });

};

module.exports = SightingSearchController;

