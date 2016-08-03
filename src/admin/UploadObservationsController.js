'use strict';
/* User module */

//Controller for Excel file upload
// @ngInject
var UploadObservationsController = function($scope, $http, $location, $controller, $routeParams, formula, NpolarApiSecurity,
  npolarApiConfig, npdcAppConfig, fileFunnelService, chronopicService, Sighting) {

     $scope.security = NpolarApiSecurity;

     console.log("testt");

     $controller('NpolarEditController', { $scope: $scope });

     // Sighting -> npolarApiResource -> ngResource
     $scope.resource = Sighting;

      let templates = [];

      console.log("test2");

  $scope.formula = formula.getInstance({
    schema: '//api.npolar.no/schema/sighting',
    form: 'partials/admin/formula.json',
    templates: npdcAppConfig.formula.templates.concat(templates)
   });

  console.log($scope.formula);
  console.log("test3");

  chronopicService.defineOptions({ match: 'released', format: '{date}'});
  chronopicService.defineOptions({ match(field) {
    return field.path.match(/^#\/activity\/\d+\/.+/);
  }, format: '{date}'});


 console.log("test4");
  // edit (or new) action
  $scope.edit();


     // Dataset -> npolarApiResource -> ngResource
    //$scope.resource = Sighting;
    $scope.submit = function() {
       console.log("scope after submit", $scope);
    };


};

module.exports = UploadObservationsController;





/*'use strict';
// User module

//Controller for Excel file upload
// @ngInject
var UploadImagesCtrl = function($scope, $http, formula,  npolarApiConfig,
 npdcAppConfig, Sighting,  fileFunnelService, NpolarApiSecurity, chronopicService) {
     $scope.security = NpolarApiSecurity;


       $scope.resource = Sighting;

        let templates = [];

  $scope.formula = formula.getInstance({
    schema: '//api.npolar.no/schema/sighting',
    form: 'formula.json',
    templates: npdcAppConfig.formula.templates.concat(templates)
   });

  chronopicService.defineOptions({ match: 'released', format: '{date}'});
  chronopicService.defineOptions({ match(field) {
    return field.path.match(/^#\/activity\/\d+\/.+/);
  }, format: '{date}'});


   function initFileUpload(formula) {

    let server = `${NpolarApiSecurity.canonicalUri($scope.resource.path)}/:id/_file`;
    fileFunnelService.fileUploader({
      match(field) {
        return field.id === "files";
      },
      server,
      multiple: true,
      progress: false,
      restricted: function () {
        return !formula.getModel().license;
      },
      fileToValueMapper: Publication.fileObject,
      valueToFileMapper: Publication.hashiObject,
      fields: [] // 'type', 'hash'
    }, formula);
  }


  try {
    initFileUpload($scope.formula);
    // edit (or new) action
    $scope.edit();
  } catch (e) {
    NpolarMessage.error(e);
  }
}


    //$scope.resource = Sighting;
  //  $scope.submit = function() {
  //     console.log("scope after submit", $scope);
  //  };


};

module.exports = UploadImagesCtrl;*/