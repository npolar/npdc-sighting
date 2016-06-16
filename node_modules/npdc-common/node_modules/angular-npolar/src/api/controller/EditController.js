'use strict';
/**
 * NpolarEditController extends [NpolarBaseController](https://github.com/npolar/angular-npolar/blob/master/src/api/controller/BaseController.js) with scope methods for REST-style document editing (using ngResource)
 * and [formula](https://github.com/npolar/formula)-bound controller action methods, like $scope.edit()
 *
 * For following ngResource-bound scope methods are defined
 * - create()
 * - update()
 * - delete()
 * - save()
 *
 * Usage example: https://github.com/npolar/npdc-dataset/blob/ae0dc74d33708c76ac88fc8f0f492ac14759cae7/src/edit/DatasetEditController.js
 *
 */

let EditController = function($scope, $location, $route, $routeParams, $controller, $q,
  Gouncer, npolarApiConfig, NpolarApiSecurity, NpolarMessage) {
    'ngInject';

  // Extend NpolarBaseController
  $controller('NpolarBaseController', {
    $scope: $scope
  });

  $scope.document = null;
  $scope._error = false;

  // Refresh JWT
  let refreshJwt = function() {
    if (NpolarApiSecurity.isAuthenticated()) {
      Gouncer.authenticate().then(function(response) {
        NpolarApiSecurity.setJwt(response.data.token);
      }, function (reason) {
        NpolarApiSecurity.logout("Could not refresh jwt");
      });
    }
  };

  // Formula compatible save
  // SHOULD NOT BE CALLED DIRECTLY, FORMULA DOES THE VALIDATION!!
  let save = function (model) {
    if (!model._rev) {
      return $scope.create(model);
    } else {
      return $scope.update(model);
    }
  };

  // Set formula model
  let updateFormulaInstance = function (model) {
    $scope.formula.setModel(model);
  };

  // Create action, ie. save document and redirect to new URI
  $scope.create = function(model) {
    $scope._error = false;
    return $scope.resource.save(model, function(doc) {
      let uri = $location.path().replace(/\/__new(\/edit)?$/, '/' + document.id + '/edit');
      updateFormulaInstance(doc);
      $scope.document = doc;
      refreshJwt();
      $location.path(uri);
    }, function(errorData) {
      $scope._error = errorData.statusText;
    });
  };

  // Edit action, ie. fetch document and edit with formula
  $scope.editAction = function() {
    $scope._error = false;
    return $scope.resource.fetch($routeParams, function(doc) {
      updateFormulaInstance(doc);
      $scope.document = doc;
    }, function(errorData) {
      $scope._error = errorData.statusText;
    });
  };

  // New action, ie. create new document and edit with formula
  // New document templates may be provided as an argument,
  // otherwise the create() function on the resource is called
  $scope.newAction = function(doc={}) {
    let deferred = $q.defer();
    if (Object.keys(document).length === 0) {
      if (typeof $scope.resource.create === "function") {
        doc = $scope.resource.create();
      }
    }
    let resource = new $scope.resource(doc);
    $scope.document = resource;
    updateFormulaInstance(resource);
    deferred.resolve(resource);
    resource.$promise = deferred.promise; // for consistency with editAction api..
    return resource;
  };

  // Edit (or new) action
  $scope.edit = function() {
    $scope.formula.setOnSave(save);
    $scope._error = false;

    if ($routeParams.id === '__new') {
      return $scope.newAction();
    } else {
      return $scope.editAction();
    }
  };

  // PUT document, ie resource update
  $scope.update = function(model) {
    $scope._error = false;
    return $scope.resource.update(model, function(doc) {
      updateFormulaInstance(doc);
      $scope.document = doc;
      $scope.i = 0;
      refreshJwt();
      $route.reload();
    }, function(errorData) {
      $scope._error = errorData.statusText;
    });
  };

  // DELETE document, ie. resource remove
  $scope.delete = function() {
    let id = $scope.document.id;
    $scope._error = false;
    return $scope.resource.remove({id}, function() {
      refreshJwt();
      $location.path('/');
      $route.reload();
    }, function(errorData) {
      $scope._error = errorData.statusText;
    });
  };

  $scope.save = function () {
    try {
      $scope.formula.save();
    } catch (e) {
      NpolarMessage.error("Document not valid, please review " + (e || []).join(", "));
    }
  };

};

module.exports = EditController;
