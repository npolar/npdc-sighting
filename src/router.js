'use strict';

var router = function($routeProvider, $locationProvider) {
  'ngInject';

  $locationProvider.html5Mode(true).hashPrefix('!');

  $routeProvider.when('/:id', {
    templateUrl: 'show/show-sighting.html',
    controller: 'SightingShowController'
  }).when('/:id/edit', {
    template: '<npdc:formula></npdc:formula>',
    controller: 'SightingEditController'
  }).when('/', {
    templateUrl: 'search/search.html',
    controller: 'SightingSearchController',
    reloadOnSearch: false
  });
};

module.exports = router;
