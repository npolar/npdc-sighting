'use strict';

var SightingController = function($controller, $routeParams, $scope, $q, Sighting, npdcAppConfig, $http, SPECIES ) {
    'ngInject';

    $scope.species = SPECIES;
};


module.exports = SightingController;