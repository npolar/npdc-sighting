'use strict';

function Sighting(SightingResource) {
  'ngInject';

  const schema = 'http://api.npolar.no/schema/sighting';

  return Object.assign(SightingResource, {

    schema,

    create: function() {

      console.log("got create");

     // let schema = "http://api.npolar.no/schema/sighting.json";
      let collection = "sighting";
      let base = "http://api.npolar.no";
      let rights = "NPI's own license";
      let rights_holder = "Norwegian Polar Institute";
      let basis_of_record = "HumanObservation";

      let p = { collection, base, rights, rights_holder, basis_of_record };
      console.debug(p);
      console.log(p);
      console.log("got e create");
      return p;

    },

     hashiObject: function(file) {
      console.log("heiii");
      return {
        url: file.uri,
        filename: file.filename,
        // icon
        file_size: file.length,
        md5sum: (file.hash||'md5:').split('md5:')[1],
        content_type: file.type
      };
    },

    fileObject: function(hashi) {
      return {
        uri: hashi.url,
        filename: hashi.filename,
        length: hashi.file_size,
        hash: 'md5:'+hashi.md5sum,
        type: hashi.content_type
      };
    }

  });

}
module.exports = Sighting;