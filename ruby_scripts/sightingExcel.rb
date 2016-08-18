#!/usr/bin/env ruby
# Fetch MMS Excel files from disk, create metadata to store in the sighting-excel database,
# and thereafter move file to server disk. Create an UUID for each file.
#
# Author: srldl
#
#
#
########################################

require './config'
require './server'
require 'net/http'
require 'net/ssh'
require 'net/scp'
require 'time'
require 'date'
require 'json'
require 'oci8'
require 'net-ldap'
require 'rmagick'
require 'simple-spreadsheet'



module Couch

  class sightingExcel

    #Get hold of UUID for database storage
    def self.getUUID(server)

       #Fetch a UUID from couchdb
       res = server.get("/_uuids")


       #Extract the UUID from reply
       uuid = (res.body).split('"')[3]

       #Convert UUID to RFC UUID
       uuid.insert 8, "-"
       uuid.insert 13, "-"
       uuid.insert 18, "-"
       uuid.insert 23, "-"
       return uuid
    end

      #Set server
       host = Couch::Config::HOST1
       port = Couch::Config::PORT1
       user = Couch::Config::USER1
       password = Couch::Config::PASSWORD1

         # do work on files ending in .xls in the desired directory
    Dir.glob('./excel_download/sheets/*.xls*') do |excel_file|

     puts excel_file

     #Get filename -last part of array (path is the first)
     filename =  excel_file[18..-1]

     #get UUID
      #Get ready to put into database
       server = Couch::Server.new(host, port)

       #Fetch a UUID from courchdb
       res = server.get("/_uuids")


       #Extract the UUID from reply
       uuid = (res.body).split('"')[3]

       #Convert UUID to RFC UUID
       uuid.insert 8, "-"
       uuid.insert 13, "-"
       uuid.insert 18, "-"
       uuid.insert 23, "-"

       #Timestamp
       a = (Time.now).to_s
       b = a.split(" ")
       c = b[0].split("-")
       dt = DateTime.new(c[0].to_i, c[1].to_i, c[2].to_i, 12, 0, 0, 0)
       timestamp = dt.to_time.utc.iso8601

      #Create shema
       @entry = {
            :id => uuid,
            :_id => uuid,
            :schema => 'http://api.npolar.no/schema/sighting-excel.json',
            :collection => 'sighting-excel.json',
            :base => 'http://api.npolar.no',
            :language => 'en',  #converted to eng for the database
            :draft => 'no',
            :rights => 'No licence announced on web site',
            :uri =>  XXXXX,
            :filename => filename,
            :length => XXX,
            :type => XXX,
            :hash => XXX,
            :comments => XXXX,
            :created => timestamp,
            :updated => timestamp,
            :created_by => user,
            :updated_by => user
         }

    #Traverse @entry and remove all empty entries
    @entry.each do | key, val |
        if  val == "" || val == "" || val == nil
              #  puts key
                @entry.delete(key)
        end
    end

    #Post coursetype
    doc = @entry.to_json

   # puts doc
   # puts "doc------------"

    res = server.post("/"+ Couch::Config::COUCH_DB_NAME + "/", doc, user, password)


     #Send schema to sighting-excel database

    Net::SCP.start(Couch::Config::HOST1, Couch::Config::USER2, :password => Couch::Config::PASSWORD1 ) do |scp|
    #Create a remote directory

    # puts "SCP started"
    scp.upload!("/home/siri/projects/ruby_scripts/images/" + uuid + "/" + pic[2], "/srv/hashi/storage/sighting/restricted/" + uuid + "/", :recursive => true)
    # puts "scp started2"
    scp.upload!("/home/siri/projects/ruby_scripts/thumbnails/" + uuid + "/" + pic[2], "/srv/hashi/storage/sighting/restricted/" + uuid +"/thumb_" + pic[2], :recursive => true)
    end

  end


end #class
end #module




