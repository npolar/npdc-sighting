#!/usr/bin/env ruby
# Fetch all entries from a datbase, change entries as wanted and save them back again.
# Use if you want to change the schema of an existing database.
#
# Author: srldl
#
######################################################

require './server'
require './config'
require 'net/http'
require 'net/ssh'
require 'net/scp'
require 'time'
require 'date'
require 'json'


module Couch2

  class MoveDatabase

    #Set server
    fetchHost = Couch::Config::HOST1
    fetchPort = Couch::Config::PORT1
    fetchPassword = Couch::Config::PASSWORD1
    fetchUser = Couch::Config::USER1

    #Post to server
    postHost = Couch::Config::HOST1
    postPort = Couch::Config::PORT1
    postPassword = Couch::Config::PASSWORD1
    postUser = Couch::Config::USER1

    #Get ready to put into database
    server = Couch::Server.new(fetchHost, fetchPort)
    server2 = Couch::Server.new(postHost, postPort)

    #Fetch from database
    db_res = server.get("/"+ Couch::Config::COUCH_DB_NAME + "/_all_docs")

    #Get ids
    res = JSON.parse(db_res.body)

    #Iterate over the Ids from Couch
    for i in 0..((res["rows"].size)-1)


      id =  res["rows"][i]["id"]
      #id = "275d07fc-7cd9-cd10-7731-b01ed6679d94"


      #Fetch the entry with the id from database incl attachments
      #db_entry = server.get("/"+ Couch::Config::COUCH_EXPEDITION + "/"+id+"?attachments=true")
      db_entry = server.get("/"+ Couch::Config::COUCH_DB_NAME + "/"+id)

      @entry = JSON.parse(db_entry.body)

    # puts @entry
    if (@entry["total"] === "-1")

        puts @entry['id']
        puts "total-----"
        #Remove total
        @entry.tap { |k| k.delete("total") }
       # p =  @entry["other_info"].split('Contact person:', 2).last
      #  puts p
       # q = p.split(',')
      #  puts q[0]
      #  @entry[:recorded_by_name] = q[0].strip
    end


    if ((@entry["files"] === "") || (@entry["files"] === nil)) then
        #Remove total
        puts @entry['id']
        @entry.tap { |k| k.delete("files") }
    end

    # @entry[:kingdom] = 'animalia'

     #Remove end_date if empty
    # if (@entry["end_date"] == "")
    #     @entry.tap { |k| k.delete("end_date") }
    # end

     #Copy to recorded_by_name

      #Need to remove revision - otherwise it will not save
      #@entry.tap { |k| k.delete("_rev") }


      #Post coursetype
      doc = @entry.to_json
     # puts doc


     #Get new id
      db_res2 = server2.post("/"+ Couch::Config::COUCH_DB_NAME + "/", doc, postUser, postPassword, "application/json; charset=utf-8")
      id2 = JSON.parse(db_res2.body)
      rev = id2["rev"]
      length = id2["length"]
      puts rev


=begin    unless att.nil?
         puts "att not nil!"
         server2.post("/"+ Couch::Config::COUCH_EXPEDITION_BKP + "/"+id2["id"]+"/attachment?rev="+rev.to_s, att, postUser, postPassword, content_type,length)
      end

=end


 end #iterate over ids

end #class
end #module
