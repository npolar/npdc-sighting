'use strict';


var SightingSearchController = function ($scope, $location, $controller, $filter, Sighting, npdcAppConfig,  NpdcSearchService, NpolarTranslate) {
  'ngInject';

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Sighting;



  let query = function() {
    let defaults = {
      limit: "50",
      sort: "-updated",
      fields: 'species,event_date,total,updated,id,habitat,@placename',
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

