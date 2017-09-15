#!/usr/bin/env ruby
# Convert from the incoming mms Excel files to the new sightings database
# Fetch Excel files from excel_download/start, reads thems and moves them to excel_download/done
#
# Author: srldl
#
# Requirements: At least one of the three fields lat, lon or event_date must be filled in
# for the script to work.
#
########################################

require '../config'
require '../server'
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

    #If number exist, return it, if not return 0
    def self.check(numb)
       return (numb == nil ? 0 : numb.abs)
    end


    #Get date, convert to iso8601
    #Does not handle chars as month such as 6.june 2015 etc
    #Does not handle day in the middle, such as 04/23/2014 etc
    def self.iso8601time(inputdate)
       a = (inputdate).to_s

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
    host = Couch::Config::HOST2
    port = Couch::Config::PORT2
    user = Couch::Config::USER2
    password = Couch::Config::PASSWORD2


    species = {'polar bear' => 'ursus maritimus',
              'polar bear den' => 'polar bear den',
              'walrus' => 'odobenus rosmarus',
              'ringed seal' => 'pusa hispida',
              'phoca hispida' => 'pusa hispida',
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

     #puts start excel_file

     #Get filename -last part of array (path is the first)
     filename =  excel_file[18..-1]

     puts filename


     #Open the file
     s = SimpleSpreadsheet::Workbook.read(excel_file)

     #Always fetch the first sheet
     s.selected_sheet = s.sheets.first

     #Start down the form -after
     line = 19
   #  while (line > 18 and line < (s.last_row).to_i+1)
     while (line > 18 and line < (s.last_row).to_i + 1)

          #lat and lng
          #if lat and lng decimal degrees are empty, use degrees min sec instead if existing
         # puts (s.cell(line,21)).is_a? Numeric
         s.cell(line,2)


          #Use the decimal degree fields if existing
          unless ((s.cell(line,18)).is_a? Numeric) && ((s.cell(line,21)).is_a? Numeric)
            lat =  (s.cell(line,2)).to_f()   #Not big decimal
            lng =  (s.cell(line,3)).to_f()   #Not big decimal
          else
            lat = check(s.cell(line,18)) + check(s.cell(line,19))/60 + check(s.cell(line,20))/3600
            lng = check(s.cell(line,21)) + check(s.cell(line,22))/60 + check(s.cell(line,23))/3600
            if s.cell(line,21).to_i < 0  then lng = -1 * lng end
          end

         #puts lat, lng

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

               #Extract excelfile info
           # @excelfile = Object.new
            filename2 = filename.split("/");

            #open excel_uuid file and fetch excel uuid
            readtext = File.read("./excel_uuid.txt")
            uuidexcel = ""
            uuids = readtext.split('|')


            #Find excelname in uuids array
            for index in 0 ... uuids.size
                if uuids[index].include? filename2[1].to_s
                    uuidarr =  uuids[index].split(':')
                    uuidexcel = uuidarr[0].gsub(/\s+/, "")
                end
            end

            #Extract the MD5 checksum from reply
            filenameExcel = filename2[1].to_s
            md5excel = Digest::MD5.hexdigest(filenameExcel)

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
                :latitude => lat,
                :longitude => lng,
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
                :editor_comment => 'not available',
              #  :excelfile => Object.new,
              #  :expedition => Object.new,
                :kingdom => 'animalia',
                :created => timestamp,
                :updated => timestamp,
                :created_by => user,
                :updated_by => user,
                :draft => 'no',
                :excel_uri => "https://api.npolar.no/sighting-excel/" + uuidexcel + "/_file/",
                :excel_filename => filename2[1],
                :excel_type => "application/vnd.ms-excel",
                :excel_length => (File.size(excel_file)).to_s,
             #   :title => s.cell(2,11),
                :start_date => (if s.cell(5,11) then iso8601time(s.cell(5,11)) end),
                :end_date => (if s.cell(6,11) then iso8601time(s.cell(6,11)) end),
                :contact_info => s.cell(3,11),
                :organisation => s.cell(4,11),
                :platform => "",
                :platform_comment => s.cell(7,11),
                :info_comment => unless (s.cell(line,5)) == nil then \
                    (s.cell(line,5)) == "(select species)"? "": (species[(s.cell(line,5)).downcase]) \
                  end
              }

              if (@entry["end_date"] == "" || @entry["end_date"] == nil)
                  @entry.tap { |k| k.delete("end_date") }
              end



            #Traverse @entry and remove all empty entries
            @entry.each do | key, val |
              if  val == "" || val == nil
                @entry.delete(key)
              end
            end



            #save entry in database

            puts @entry[:id]

            doc = @entry.to_json
            puts doc
         #   res = server.post("/"+ Couch::Config::COUCH_DB_NAME + "/", doc, user, password)

            text = (@entry[:excel_filename]).to_s + "   "  + @entry[:id]
              inputfile = 'output.txt'
              File.open(inputfile, 'a') { |f| f.write(text) }

          end #unless nil

          #Count up next line
          line += 1
     end #while line

     puts 'filename' + filename
     #File contains a subdir as well, need to remove this first
    #puts excel_file[0..17]


     #Move Excel file to 'done'
#     File.rename excel_file, (excel_file[0..16]+'done/' + filename2[1])
  end #file

  end
end