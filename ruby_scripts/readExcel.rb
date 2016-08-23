#!/usr/bin/env ruby
# Convert from the incoming mms Excel files to the new sightings database
# Fetch Excel files from excel_download2/done, reads thems and moves them to excel_download2/done2
#
# Author: srldl
#
# Requirements: At least one of the three fields lat, lon or event_date must be filled in
# for the script to work.
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

  class ReadExcel

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

    #Get a timestamp - current time
    def self.timestamp()
       a = (Time.now).to_s
       b = a.split(" ")
       c = b[0].split("-")
       dt = DateTime.new(c[0].to_i, c[1].to_i, c[2].to_i, 12, 0, 0, 0)
       return dt.to_time.utc.iso8601
    end


    #Get date, convert to iso8601
    #Does not handle chars as month such as 6.june 2015 etc
    #Does not handle day in the middle, such as 04/23/2014 etc
    def self.iso8601time(inputdate)
       a = (inputdate).to_s
       puts "a " + a

       #Delimiter space, -, .,/
       b = a.split(/\.|\s|\/|-/)
       #Find out where the four digit is, aka year
       if b[0].size == 4 #Assume YYYY.MM.DD
             dt = DateTime.new(b[0].to_i, b[1].to_i, b[2].to_i, 12, 0, 0, 0)
       elsif b[2].size == 4  #Assume DD.MM.YYYY
            # puts b
            # puts "here's b"
             dt = DateTime.new(b[2].to_i, b[1].to_i, b[0].to_i, 12, 0, 0, 0)
       else
             puts "cannot read dateformat"
       end
             return dt.to_time.utc.iso8601
    end

     #Set server
    host = Couch::Config::HOST1
    port = Couch::Config::PORT1
    user = Couch::Config::USER1
    password = Couch::Config::PASSWORD1


    species = {'polar bear' => 'ursus maritimus',
              'polar bear den' => 'polar bear den',
              'walrus' => 'odobenus rosmarus',
              'ringed seal' => 'pusa hispida',
              'bearded seal' => 'erignathus barbatus',
              'harbour seal' => 'phoca vitulina',
              'harp seal' => 'phoca groenlandica',
              'hooded seal' => 'cystophora cristata',
              'seal'=> 'pinnipedia',
              'bowhead whale' => 'balaena mysticetus',
              'white whale' => 'delphinapterus leucas',
              'narwhal' => 'monodon monoceros',
              'blue whale' => 'balaenoptera musculus',
              'fin whale' => 'balaenoptera physalus',
              'humpback whale' => 'megaptera novaeangliae',
              'minke whale' => 'balaenoptera acutorostrata',
              'sei whale' => 'balaenoptera borealis',
              'sperm whale' => 'physeter macrocephalus',
              'northern bottlenose whale' =>'hyperoodon ampullatus',
              'killer whale' => 'orcinus orca',
              'pilot whale' => 'globicephala melas',
              'atlantic white-sided dolphin' => 'lagenorhynchus acutus',
              'white-beaked dolphin' => 'lagenorhynchus albirostris',
              'harbour porpoise' => 'phocoena phocoena',
              'whale' => 'cetacea',
              'other species' =>'other species'}

    # do work on files ending in .xls in the desired directory
    Dir.glob('./excel_download/start/*.xls*') do |excel_file|

     puts excel_file

     #Get filename -last part of array (path is the first)
     filename =  excel_file[18..-1]


     #Open the file
     s = SimpleSpreadsheet::Workbook.read(excel_file)

     #Always fetch the first sheet
     s.selected_sheet = s.sheets.first

     #Start down the form -after
     line = 19
     while (line > 18 and line < (s.last_row).to_i)

          #if row hasn't got event_date, lat or lon, skip it
          unless ((s.cell(line,1)== nil) or (s.cell(line,1) == "Add your observations here:") or (s.cell(line,1)==' ')) \
          and ((s.cell(line,2)==nil) or (s.cell(line,2).to_i)==0 or (s.cell(line,2).to_s) =='') \
          and ((s.cell(line,3)==nil) or (s.cell(line,3).to_i)==0 or (s.cell(line,3).to_s) =='')


              #Total is an object --but some people use integer or Fixnum instead..
              if (s.cell(line,15) != "") and (s.cell(line,15).class == Object)
                    total = (((s.cell(line,15)).value).to_i).to_s
              else  #But some users fix it to be Fixnum or integer..
                    total = (s.cell(line,15)).to_i.to_s
              end

              #Read the row here
              #Get ready to put into database
              #Set server database here
              server = Couch::Server.new(host, port)

              #Get uuid
              uuid = getUUID(server)


              #Create the json structure object
              @entry = {
                :id => uuid,
                :_id => uuid,
                :schema => 'http://api.npolar.no/schema/' + Couch::Config::COUCH_DB_NAME + '.json',
                :collection => Couch::Config::COUCH_DB_NAME,
                :base => 'http://api.npolar.no',
                :language => 'en',
                :draft => 'no',
                :rights => 'No licence announced on web site',
                :rights_holder => 'Norwegian Polar Institute',
                :basis_of_record => 'HumanObservation',
                :event_date => (if (s.cell(line,1)) then iso8601time(s.cell(line,1)) end),
                :@placename => (s.cell(line,4)) == "(select or write placename)"? "": (s.cell(line,4)),
                :latitude => (s.cell(line,2)).to_f(),    #Not big decimal
                :longitude => (s.cell(line,3)).to_f(),   #Not big decimal
                :species => unless (s.cell(line,5)) == nil then \
                    (s.cell(line,5)) == "(select species)"? "": (species[(s.cell(line,5)).downcase]) \
                  end,
                :adult_m => ((s.cell(line,6)).to_i).to_s,
                :adult_f => ((s.cell(line,7)).to_i).to_s,
                :adult => (s.cell(line,8).to_i).to_s,
                :sub_adult => ((s.cell(line,9)).to_i).to_s,
                :polar_bear_condition => ((s.cell(line,10)) == "(select condition)")? "":((s.cell(line,10)).to_i).to_s,
                :polar_bear_den => unless (s.cell(line,5)) == nil then \
                  (species[(s.cell(line,5)).downcase]) == 'polar bear den'? "1" : "" \
                   end,
                :cub_calf_pup => ((s.cell(line,11)).to_i).to_s,
                :bear_cubs => (s.cell(line,12)) == "(select years)"? "": ((s.cell(line,12)).to_i).to_s,
                :unidentified => (s.cell(line,13).to_i).to_s,
                :dead_alive => (s.cell(line,14)) == "NA"? "unknown": (s.cell(line,14)),
                :total => total,
                :habitat => (s.cell(line,16)) == "(select habitat)"? "": (s.cell(line,16)),
                :occurrence_remarks => s.cell(line,17) == nil ? "": s.cell(line,17),
                :recorded_by => s.cell(3,11),
                :recorded_by_name => s.cell(2,11),
                :editor_assessment => 'green',
                :excelfile => Object.new,
                :expedition => Object.new,
                :created => timestamp,
                :updated => timestamp,
                :created_by => user,
                :updated_by => user,
                :draft => 'no'
            }


             #Extract expedition info
            @expedition = Object.new
            @expedition = {
                :name => s.cell(2,11),
                :contact_info => s.cell(3,11),
                :organisation => s.cell(4,11),
                :platform_comment => s.cell(7,11),
                #:platform => '',
                :start_date => (if s.cell(5,11) then iso8601time(s.cell(5,11)) end),
                :end_date => (if s.cell(6,11) then iso8601time(s.cell(6,11)) end)
                }  #end exped object

            #Extract excelfile info
            @excelfile = Object.new
            filename2 = filename.split("/");

            #open excel_uuid file and fetch excel uuid
            readtext = File.read("./excel_uuid.txt")
            uuidexcel = ""
            uuids = readtext.split('|')
            puts uuids
            puts "uuids"

            #Find excelname in uuids array
            for index in 0 ... uuids.size
                if uuids[index].include? filename2[1].to_s
                    uuidarr =  uuids[index].split(':')
                    uuidexcel = uuidarr[0].gsub(/\s+/, "")
                    puts uuidexcel
                end
            end

            #Extract the MD5 checksum from reply
            filenameExcel = filename2[1].to_s
            md5excel = Digest::MD5.hexdigest(filenameExcel)


            @excelfile = {
                 :items => {
                  :uri => "https://api.npolar.no/sighting-excel/" + uuidexcel + "/_file/",
                  :filename => filename2[1],
                  :type => "application/vnd.ms-excel", #last digits
                  :length => (File.size(excel_file)).to_s
                  },
                  :hash => md5excel
            } #Excelfile


            #Add expedition and excelfile objects to entry object
            defined?(@expedition[:name]).nil? ? @entry[:expedition] = nil : @entry[:expedition] = @expedition
            defined?(@excelfile[:filename]).nil? ?  @entry[:excelfile] = nil : @entry[:excelfile] = @excelfile



            #Traverse @entry and remove all empty entries
            @entry.each do | key, val |
              if  val == "" || val == ""
                puts key
                @entry.delete(key)
              end
            end


            #puts @entry


            #save entry in database
            doc = @entry.to_json
            res = server.post("/"+ Couch::Config::COUCH_DB_NAME + "/", doc, user, password)



          end #unless nil

          #Count up next line
          line += 1
     end #while line

     puts 'filename' + filename
     #File contains a subdir as well, need to remove this first
    #puts excel_file[0..17]


     #Move Excel file to 'done'
     File.rename excel_file, (excel_file[0..16]+'done/' + filename2[1])
  end #file

  end
end