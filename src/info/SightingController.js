'use strict';

var SightingController = function($controller, $routeParams, $scope, $q, Sighting, npdcAppConfig, $http, SPECIES, NpolarLang ) {
    'ngInject';

    $scope.species = SPECIES;

   //Control whether to see the Norwegian or English info page
    if ((NpolarLang.getLang()) === 'en') {
        $scope.check_lang = true;
    } else {
    	$scope.check_lang = false;
    }


};


module.exports = SightingController;