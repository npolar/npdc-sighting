'use strict';

var SightingController = function($controller, $routeParams, $scope, $q, Sighting, NpolarApiSecurity, npdcAppConfig, $http, SPECIES, NpolarLang ) {
    'ngInject';

    $scope.species = SPECIES;
    $scope.security = NpolarApiSecurity;

    // Sighting -> npolarApiResource -> ngResource
    $scope.resource = Sighting;

    $scope.check_lang = NpolarLang.getLang() === 'en' ? true : false;

   //Control whether to see the Norwegian or English info page
  /*  if ((NpolarLang.getLang()) === 'en') {
        $scope.check_lang = true;
    } else {
    	$scope.check_lang = false;
    } */

};


module.exports = SightingController;