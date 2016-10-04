'use strict';
/* Admin module */

/*Controller for CSV print */
// @ngInject
//var CSVController = function($scope, CSVService, IsAdmin) {
var CSVController = function($scope, CSVService) {

	//Admin logon?
   // $scope.isAdmin = IsAdmin.entryObject['data'];
 //  $scope.isAdmin = IsAdmin.entryObject.data;
    $scope.entries = CSVService.entryObject;
};

module.exports = CSVController;