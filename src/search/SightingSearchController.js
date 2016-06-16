'use strict';


var SightingSearchController = function ($scope, $location, $controller, $filter, Sighting, npdcAppConfig,  NpdcSearchService, NpolarTranslate) {
  'ngInject';

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Sighting;


   npdcAppConfig.search.local.results.detail = (entry) => {
     let updatedText = NpolarTranslate.translate('updated');
      let r = updatedText +":";
     return r+` ${(entry.updated.split('T')[0])}`;
};


  npdcAppConfig.cardTitle = "Marine mammal sighting";
  npdcAppConfig.search.local.results.subtitle = "species";


  let query = function() {
    let defaults = {
      limit: "50",
      sort: "-updated",
      fields: 'event_date,species,habitat,updated',
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

