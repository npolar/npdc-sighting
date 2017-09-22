'use strict';


var SightingSearchController = function ($scope, $location, $controller, $filter, Sighting, npdcAppConfig,  NpolarLang, NpolarApiSecurity, NpdcSearchService, NpolarTranslate) {
  'ngInject';

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Sighting;

  $scope.security = NpolarApiSecurity;
  let user = NpolarApiSecurity.getUser();

  $scope.base_user = NpolarApiSecurity.canonicalUri('/sighting');

  $scope.check_lang = NpolarLang.getLang() === 'en' ? true : false;

  //Different views depending on admin or ordinary user
  var isAdmin = function(){
      const base = NpolarApiSecurity.canonicalUri('/sighting/admin');
      var ret = $scope.security.isAuthorized('create', base);
      return (ret);
  };
   $scope.isAdmin = isAdmin();


   //Draft is true or false?
   var evaluate2 = function(){

     // let ret = draft === 'yes' ? true : false;
      return true;
  };




  let query = function() {

    let defaults;

    if (isAdmin()) {
      //Administrators should see all entries
      defaults = {
        limit: "50",
        sort: "-updated",
        fields: 'species,event_date,total,updated,id,habitat,@placename,draft,recorded_by',
        'filter-draft':'no',
        facets: 'draft'};
    } else {
       //A user should see his/hers entries
        defaults = {
        limit: "50",
        sort: "-updated",
        fields: 'species,event_date,total,updated,id,habitat,@placename,draft,recorded_by',
        'filter-recorded_by': user.email,
     //   'filter-draft':'yes',
        facets: 'draft'};
    }

    let invariants = $scope.security.isAuthenticated() ? {} : {} ;
    return Object.assign({}, defaults, invariants);
  };

  $scope.search(query());

  $scope.$on('$locationChangeSuccess', (event, data) => {
    $scope.search(query());
  });

};

module.exports = SightingSearchController;

