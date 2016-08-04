'use strict';


var SightingSearchController = function ($scope, $location, $controller, $filter, Sighting, npdcAppConfig,  NpdcSearchService, NpolarTranslate) {
  'ngInject';

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Sighting;


  /* npdcAppConfig.search.local.results.detail = (entry) => {
     let updatedText = NpolarTranslate.translate('Last updated');
     let r = "  " + updatedText +":";
     let eventDateText = NpolarTranslate.translate('Event date');
     let e =  eventDateText +":";

     if (entry.event_date && entry.event_date !== null) {
         return  e+` ${(entry.event_date.split('T')[0])}` + r+` ${(entry.updated.split('T')[0])}`;
     } else {
        return 'No dates';
     }
};


  npdcAppConfig.cardTitle = "Marine mammal sighting";

  //Get title and subtitle
  npdcAppConfig.search.local.results.title = "title";
  npdcAppConfig.search.local.results.subtitle = "species"; */


  let query = function() {
    let defaults = {
      limit: "50",
      sort: "-updated",
      fields: 'title,event_date,species,habitat,updated,id,locality',
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

