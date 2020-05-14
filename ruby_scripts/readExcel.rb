#!/usr/bin/env ruby
# Convert from the incoming mms Excel files to the new sightings database
# Fetch Excel files from excel_download/start, reads thems and moves them to excel_download/done
#
# Author: srldl
#
# If placename exists, coord can be inserted.
# This script replaces the old one since now I use the 'spreadsheet' gem.
# This gem requires only xls files, cannot do xlsx!
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
require 'digest'
require 'spreadsheet'
require 'securerandom'
require 'fileutils'



module Couch

  class ReadExcel

    #Get hold of UUID for database storage
     def self.getUUID()
        return SecureRandom.uuid
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


    def self.getFileInfo(filename)
        #open excel_uuid file and fetch excel uuid
        readtext = File.read("./excel_uuid.txt")
        uuidexcel = ""
        uuids = readtext.split('|')


        #Find excelname in uuids array
        for index in 0 ... uuids.size
            if uuids[index].include? filename.to_s
                uuidarr =  uuids[index].split(':')
                uuidexcel = uuidarr[0].gsub(/\s+/, "")
            end
        end
        return uuidexcel,uuidarr[1]
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
             dt = DateTime.new(b[2].to_i, b[1].to_i, b[0].to_i, 12, 0, 0, 0)
       else
             puts "cannot read dateformat"
       end
             return dt.to_time.utc.iso8601
    end

    #Put request to server
    def self.postToServer(doc,auth,user,password,host,port,id)

      http = Net::HTTP.new(host, 443);
      http.use_ssl = true
      #req = Net::HTTP::Put.new('/radiation-weather/'+id,initheader ={'Authorization' => auth, 'Content-Type' => 'application/json' })
      req = Net::HTTP::Post.new('/sighting/'+id,initheader ={'Authorization' => auth, 'Content-Type' => 'application/json' })
      req.body = doc
      req.basic_auth(user, password)
      res2 = http.request(req)
      unless ((res2.header).inspect) == "#<Net::HTTPOK 200 OK readbody=true>"
          puts (res2.header).inspect
          puts (res2.body).inspect
      end
      return http #res2
    end

    #Make a get request to a server
    def self.httpGet(url,host,port)
      http = Net::HTTP.new(host, port)
      http.use_ssl = true
      request = Net::HTTP::Get.new(url)
      response = http.request(request)
      return response.body
    end


    def self.buildEntry(arr,arr2,filename,species)

      use_id = getUUID()
      user = 'siri.uldal@npolar.no'

      uuidexcel, uuidarr = getFileInfo(filename[6..-1])

      mime_type = 'application/vnd.ms-excel'
      if filename.end_with? ".xlsx"
        mime_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      end

      #poar_bear_condition = 0 has to be handled
     if arr2[9] == '' then arr2[9]= 'not applicable/unknown' end



      #Build json
      @entry = {
        :id => use_id,
        :_id => use_id,
        :schema => 'http://api.npolar.no/schema/sighting.json',
        :collection => 'sighting',
        :base => 'http://api.npolar.no',
        :language => 'en',
        :rights => 'No licence announced on web site',
        :rights_holder => 'Norwegian Polar Institute',
        :basis_of_record => 'HumanObservation',
        :event_date => if arr2[0] then iso8601time(arr2[0]) end,
        :@placename => arr2[3] == "(select or write placename)"? "": arr2[3],
        :latitude => ((arr2[1].to_f)*1000).round / 1000.0,
        :longitude => ((arr2[2].to_f)*1000).round / 1000.0,
        :species => unless (arr2[4] == nil) then \
            (arr2[4] == "(select species)"? "": species[arr2[4].downcase])  end,
        :adult_m => (arr2[5].to_i).to_s,
        :adult_f => (arr2[6].to_i).to_s,
        :adult => (arr2[7].to_i).to_s,
        :sub_adult => (arr2[8].to_i).to_s,
        :polar_bear_condition => (arr2[9] == "(select condition)") || (arr2[9] == 'not applicable/unknown') ? "not applicable/unknown":(arr2[9].to_i).to_s,
        :polar_bear_den => unless (arr2[4] == nil) then \
          ([arr2[4].downcase]) == 'polar bear den'? "1" : "" \
           end,
        :cub_calf_pup => (arr2[10].to_i).to_s,
        :bear_cubs => arr2[11] == "(select years)"? "": (arr2[11].to_i).to_s,
        :unidentified => (arr2[12].to_i).to_s,
        :dead_alive => (arr2[13]) == "NA"? "unknown": (arr2[13]),
        :total => arr2[14].to_i.to_s,
        :habitat => (arr2[15]) == "(select habitat)"? "": (arr2[15]).downcase,
        :occurrence_remarks => arr2[16] == nil ? "": arr2[16],
        :recorded_by => arr[1].downcase,
        :recorded_by_name => arr[0],
        :editor_assessment => 'green',
        :editor_comment => 'not available',
        :kingdom => 'animalia',
        :created => timestamp,
        :updated => timestamp,
        :created_by => user,
        :updated_by => user,
        :draft => 'no',
        :excel_uri => "https://api.npolar.no/sighting-excel/" + uuidexcel + "/_file/",
        :excel_filename => filename[6..-1],
        :excel_type => mime_type,
        :excel_length => (uuidarr.to_s).strip,
        :start_date => if arr[3] != nil then iso8601time(arr[3]) end,
        :end_date => if arr[4] != nil then iso8601time(arr[4]) end,
        :contact_info => arr[2],
        :organisation => arr[0],
        :platform => "",
        :platform_comment => arr[5],
        :info_comment => arr[5].downcase
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

      return @entry

    end #method


    #Set server
    host = Couch::Config::HOST4
    port = Couch::Config::PORT4
    user = Couch::Config::USER4
    password = Couch::Config::PASSWORD4
    auth = Couch::Config::AUTH4



    species = {
              'ursus maritimus' => 'ursus maritimus',
              'polar bear' => 'ursus maritimus',
              'polar bear den' => 'polar bear den',
              'odobenus rosmarus' => 'odobenus rosmarus',
              'walrus' => 'odobenus rosmarus',
              'ringed seal' => 'pusa hispida',
              'phoca hispida' => 'pusa hispida',
              'erignathus barbatus' => 'erignathus barbatus',
              'bearded seal' => 'erignathus barbatus',
              'phoca vitulina' => 'phoca vitulina',
              'harbour seal' => 'phoca vitulina',
              'pagophilus groenlandicus' => 'phoca groenlandica',
              'harp seal' => 'phoca groenlandica',
              'cystophora cristata' => 'cystophora cristata',
              'hooded seal' => 'cystophora cristata',
              'seal'=> 'pinnipedia',
              'balaena mysticetus' => 'balaena mysticetus',
              'bowhead whale' => 'balaena mysticetus',
              'delphinapterus leucas' => 'delphinapterus leucas',
              'white whale' => 'delphinapterus leucas',
              'monodon monoceros' => 'monodon monoceros',
              'narwhal' => 'monodon monoceros',
              'balaenoptera musculus' => 'balaenoptera musculus',
              'blue whale' => 'balaenoptera musculus',
              'balaenoptera physalus' => 'balaenoptera physalus',
              'fin whale' => 'balaenoptera physalus',
              'megaptera novaeangliae' => 'megaptera novaeangliae',
              'humpback whale' => 'megaptera novaeangliae',
              'balaenoptera acutorostrata' => 'balaenoptera acutorostrata',
              'minke whale' => 'balaenoptera acutorostrata',
              'balaenoptera borealis' => 'balaenoptera borealis',
              'sei whale' => 'balaenoptera borealis',
              'physeter catodon' => 'physeter macrocephalus',
              'sperm whale' => 'physeter macrocephalus',
              'hyperoodon ampullatus' =>'hyperoodon ampullatus',
              'northern bottlenose whale' =>'hyperoodon ampullatus',
              'orcinus orca' => 'orcinus orca',
              'killer whale' => 'orcinus orca',
              'globicephala melas' => 'globicephala melas',
              'pilot whale' => 'globicephala melas',
              'lagenorhynchus acutus' => 'lagenorhynchus acutus',
              'atlantic white-sided dolphin' => 'lagenorhynchus acutus',
              'lagenorhynchus albirostris'=> 'lagenorhynchus albirostris',
              'white-beaked dolphin' => 'lagenorhynchus albirostris',
              'phocoena phocoena' => 'phocoena phocoena',
              'harbour porpoise' => 'phocoena phocoena',
              'whale' => 'cetacea',
              'alopex lagopus' => 'vulpes lagopus',
              'other species' =>'other species'}



    # do work on files ending in .xls in the desired directory
    Dir.glob('./excel_download/start/*.xls*') do |excel_file|

     #Get filename -last part of array (path is the first)
     filename =  excel_file[17..-1]

     puts filename

     # Open source spreadsheet - must be xls, NOT xlsx
     workbook = Spreadsheet.open './excel_download/'+filename

     # Specify a single worksheet by index
     s = workbook.worksheet 0
     arr = Array.new(6)

     s.each_with_index do |row,i|
        date1 = "#{row[0]}"
        #arr holds the contact info
        if (i<7)
           arr[i] = "#{row[10]}"
        end
       #Build and send json if first element is a date in in 2005 (example date)
       if (i>12)&&(date1.include? "20")&&(!date1.include?("2005"))   #&&(!date1.start_with?("2005"))
         #Put all variables into arr2

         arr2 = Array.new(17)
         for j in 0..17
           arr2[j] = "#{row[j]}"
           if (j==14)&&(row[14].class==Spreadsheet::Formula)
             arr2[j] = row[14].value
           end
         end

         #get lat, lng if not existing
         placename = arr2[3].downcase.gsub(/\s/,'%20')

         if ((arr2[1]=='')&&(arr2[2]=='')&&(arr2[3]!='')&&(arr2[3]!=nil))
            all_ret = httpGet('/placename/?q=&filter-name.@value='+placename,'api.npolar.no',443)
            ret =  JSON.parse(all_ret)
            #Choose first entry
            ret_entry = ret['feed']['entries']
            if (ret_entry!=nil)

              ret_entry.each_with_index do | p, index|

              ent =  ret_entry[index]
              if (ent['name']['@value'] == arr2[3])

                 arr2[1] = ent['geometry']['coordinates'][1]
                 arr2[2] = ent['geometry']['coordinates'][0]
              end
            end
            else
              puts "No name match - cannot find lat and lng!"
            end


         end

         entry = buildEntry(arr,arr2,filename,species)
         doc = entry.to_json
         id = getUUID()
         postToServer(doc,auth,user,password,host,port,id)
       end


    end


end
end
end
