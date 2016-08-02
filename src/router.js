'use strict';

var router = function($routeProvider, $locationProvider) {
  'ngInject';

  $locationProvider.html5Mode(true).hashPrefix('!');

  console.log($routeProvider);
  console.log($locationProvider);
  //console.log($location);
  console.log(".......");

  $routeProvider.when('/:id', {
    templateUrl: 'show/show-sighting.html',
    controller: 'SightingShowController'
  }).when('/:id/edit', {
    template: '<npdc:formula></npdc:formula>',
    controller: 'SightingEditController'
  }).when('/observe', {
    templateUrl: 'show/observe.html',
    controller: 'SightingController'
  }).when('/learn', {
    templateUrl: 'info/learn.html',
    controller: 'SightingController'
  }).when('/', {
    templateUrl: 'search/search.html',
    controller: 'SightingSearchController',
    reloadOnSearch: false
  });
};

module.exports = router;
