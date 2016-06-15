'use strict';

var LoginController = function ($scope, $route, Gouncer, NpolarMessage, NpolarApiSecurity) {
  'ngInject';

  $scope.security = NpolarApiSecurity;

  $scope.error = () => $scope._error;

  // After login: store user and JWT in local storage
  $scope.onLogin = function(response) {

    NpolarApiSecurity.setJwt(response.data.token);
    NpolarMessage.login(NpolarApiSecurity.getUser());

  };

  $scope.onLoginError = function(response) {
    $route.reload();
  };

  // Login (using username and password)
  $scope.login = function(email, password) {
    Gouncer.authenticate(email, password).then($scope.onLogin, $scope.onLoginError);
  };

  $scope.logout = function() {
    NpolarApiSecurity.logout();
    $route.reload();
  };

};

module.exports = LoginController;
