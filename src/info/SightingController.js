'use strict';

var SightingController = function($controller, $routeParams, $scope, $q, Sighting, NpolarApiSecurity, npdcAppConfig, $http, SPECIES, NpolarLang ) {
    'ngInject';

    $scope.species = SPECIES;
    $scope.security = NpolarApiSecurity;

    // Sighting -> npolarApiResource -> ngResource
    $scope.resource = Sighting;

    $scope.check_lang = NpolarLang.getLang() === 'en' ? true : false;

};


module.exports = SightingController;