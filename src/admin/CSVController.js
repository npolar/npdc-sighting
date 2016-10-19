'use strict';
/* Admin module */

/*Controller for CSV print */
// @ngInject
//var CSVController = function($scope, CSVService, IsAdmin) {
var CSVController = function($scope, CSVService, Sighting, NpolarApiSecurity) {

// $scope.security = NpolarApiSecurity;
    $scope.resource = Sighting;
    $scope.security = NpolarApiSecurity;

    $scope.isAdmin = function(){
      const base = NpolarApiSecurity.canonicalUri('/sighting/admin');
      var ret = $scope.security.isAuthorized('create', base);
      return (ret);
    };

	//Admin logon?
   // $scope.isAdmin = IsAdmin.entryObject['data'];
 //  $scope.isAdmin = IsAdmin.entryObject.data;
    $scope.entries = CSVService.entryObject;
};

module.exports = CSVController;