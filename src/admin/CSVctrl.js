'use strict';
/* Admin module */

/*Controller for CSV print */
// @ngInject
var CSVCtrl = function($scope, CSVService, IsAdmin) {

	//Admin logon?
   // $scope.isAdmin = IsAdmin.entryObject['data'];
   $scope.isAdmin = IsAdmin.entryObject.data;
    $scope.entries = CSVService.entryObject;
};

module.exports = CSVCtrl;