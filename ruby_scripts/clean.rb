#!/usr/bin/env ruby
# The program cleans the an Excel file i.e.
# - use the placename to add lat and lng if not present.
#
#
# Fetch Excel files from excel_download/start, reads thems and moves them to base catalogue
#
# Author: srldl
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
require 'spreadsheet'
require 'oci8'



module Couch

  class Clean

     #Set server
    fetchHost = Couch::Config::HOST2
    fetchPort = Couch::Config::PORT2
    fetchPassword = Couch::Config::PASSWORD2
    fetchUser = Couch::Config::USER2

      #Get Oracle server connection
    #Get caroline.npolar.no
    oci = OCI8.new(Couch::Config::USER_PLACENAME,Couch::Config::PASSWORD_PLACENAME,Couch::Config::ORACLE_SID)


    #Get ready to put into database
    server = Couch::Server.new(fetchHost, fetchPort)


    # do work on files ending in .xls in the desired directory
    Dir.glob('./excel_download/start/*.xls*') do |excel_file|

     # Open source spreadsheet
     workbook = Spreadsheet.open excel_file

      #Get filename -last part of array (path is the first)

     filename =  excel_file[23..-1]
     puts filename


     # Specify a single worksheet by index
     sheet1 = workbook.worksheet 0
     sheet1.each do |row|
          puts "#{row[3]} - #{row[1]} - #{row[2]}"

          #if lat /lng empty
          unless ((row[1].to_s != "") && (row[2].to_s != "") && (row[3]))

              #puts "select * from placenames.sval_placenames where placename='" + placename + "'"

               #Fetch observation info
              oci.exec("select * from placenames.sval_placenames where placename='" + row[3].to_s + "'") do |obs|
                puts obs[8]
                puts obs[9]
                row[1] = obs[8].to_f
                row[2] = obs[9].to_f
              end

          end
            puts "#{row[3]} - #{row[1]} - #{row[2]}"



    end

    workbook.write filename
    #Move Excel file to 'done'
  #  File.rename excel_file, (excel_file[0..16]+'start/' + filename)


     end #while file

  end
end