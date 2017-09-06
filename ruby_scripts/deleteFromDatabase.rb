#!/usr/bin/env ruby
#
# This programme deletes all entries from a named couch database
# Handy when you want to clear everything.
#
# Author: srldl
#################################################################

require './server'
require 'net/http'
require 'json'


module Couchdb

  class DeleteEntries

    host = "db-test.data.npolar.no"
    port  = "5984"
    database = "sighting"

    #Get ready to put into database
    server = Couch::Server.new(host, port)

    #Fetch a UUIDs from couchdb
    res = server.get("/"+ database +"/_all_docs")

    json = JSON.parse(res.body)
    rows = json["rows"]

    (rows).each_with_index { |r, i|
         puts r['id']
         puts r['value']['rev']
         #database/sighting/275d07fc-7cd9-cd10-7731-b01ed6736116?_rev
         server.delete("/" + database + "/" + (r['id']).to_s + "?rev=" + r['value']['rev'])
    }

  end
end

