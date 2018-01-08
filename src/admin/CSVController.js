'use strict';
/* Admin module */

/*Controller for CSV print */
// @ngInject
//var CSVController = function($scope, CSVService, IsAdmin) {
var CSVController = function($scope, CSVService, Sighting, NpolarApiSecurity) {

// $scope.security = NpolarApiSecurity;
    $scope.resource = Sighting;
    $scope.security = NpolarApiSecurity;

    $scope.authorized = NpolarApiSecurity.isAuthorized('create', 'https:' + $scope.resource.path + '/admin');


	//Admin logon?
    $scope.entries = CSVService.entryObject;
};

module.exports = CSVController;