#!/usr/bin/env ruby
# Convert from the old mms database to the new sightings database
#
# Author: srldl
#
########################################

require './server'
require './config'
require 'net/http'
require 'net/ssh'
require 'net/scp'
require 'mdb'
require 'time'
require 'date'
require 'json'
require 'oci8'
require 'net-ldap'
require 'rmagick'
require 'digest'


module Couch

  class Convertmms

    #Set server
    host = Couch::Config::HOST2
    port = Couch::Config::PORT2
    password = Couch::Config::PASSWORD2
    user = Couch::Config::USER2


    #Convert to iso8601
    def self.iso8601time(inputdate)
       a = (inputdate).to_s
       b = a.split(" ")
       c = b[0].split("-")
       dt = DateTime.new(c[0].to_i, c[1].to_i, c[2].to_i, 12, 0, 0, 0)
       return dt.to_time.utc.iso8601
    end



    species = {'ursus maritimus' => 'ursus maritimus',
              'polar bear den' => 'polar bear den',
              'odobenus rosmarus' => 'odobenus rosmarus',
              'pusa hispida' => 'pusa hispida',
              'erignathus barbatus' => 'erignathus barbatus',
              'phoca vitulina' => 'phoca vitulina',
              'phoca groenlandica' => 'phoca groenlandica',
              'cystophora cristata' => 'cystophora cristata',
              'cetacea'=> 'cetacea',
              'dolphin Undetermined' => 'cetacea',
              'balaena mysticetus' => 'balaena mysticetus',
              'delphinapterus leucas' => 'delphinapterus leucas',
              'monodon monoceros' => 'monodon monoceros',
              'balaenoptera musculus' => 'balaenoptera musculus',
              'balaenoptera physalus' => 'balaenoptera physalus',
              'megaptera novaeangliae' => 'megaptera novaeangliae',
              'balaenoptera acutorostrata' => 'balaenoptera acutorostrata',
              'balaenoptera borealis' => 'balaenoptera borealis',
              'physeter macrocephalus' => 'physeter macrocephalus',
              'hyperoodon ampullatus' =>'hyperoodon ampullatus',
              'orcinus orca' => 'orcinus orca',
              'globicephala melas' => 'globicephala melas',
              'lagenorhynchus albirostris' => 'lagenorhynchus albirostris',
              'lagenorhynchus acutus' => 'lagenorhynchus acutus',
              'lagenorhynchus spp.' => 'other species', #
              'phocoena phocoena' => 'phocoena phocoena',
              'pinnipedia' => 'pinnipedia',
              'other species' =>'other species'}

    #Get Oracle server connection
    #Get caroline.npolar.no
    oci = OCI8.new(Couch::Config::USER_MMS,Couch::Config::PASSWORD_MMS,Couch::Config::ORACLE_SID)

    #define the id
    id = nil


    #Fetch observation info
   # oci.exec('select * from mms.observations where id>4953 and id<4955') do |obs|
   #  oci.exec('select * from mms.observations where id>4954') do |obs|

  #  oci.exec("select * from mms.observations where (duplicate is NULL) and (id>16264 and id<16272)") do |obs|
  #   oci.exec("select * from mms.observations where (duplicate is NULL) and (id>1589 and id<1592)") do |obs|
       oci.exec("select * from mms.observations where (duplicate is NULL)") do |obs|

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

       #Print id for comparison
       puts "Observation: " + obs[0].to_s

       #Define the id
       id = obs[0]

       #Holds LDAP ids to be substituted
       temp_entry = ''
       temp_expedition_created = ''
       temp_expedition_updated = ''
       temp_excelfile = ''

      # puts obs[15].class

       #Create the json structure object
       info_comment1 = 'Old id:' + obs[0].to_s + ', field activity id:' + obs[1].to_s+ ' Platform: ' + obs[2].to_s + ', platform comment: ' + obs[3].to_s + ', species comment: ' + obs[6].to_s
       info_comment2 = ', total count accuracy: ' + obs[8].to_s + ', coordinate precision: ' + obs[17].to_s
       info_comment3 = ', created_at ' + obs[20].to_s + ', updated_at ' + obs[21].to_s + ', time_known ' + obs[22].to_s + ', created_by_dn: ' + obs[19].to_s  + 'observer name:' + obs[24].to_s

       @entry = {
            :id => uuid,
            :_id => uuid,
            :schema => 'http://api.npolar.no/schema/' + Couch::Config::COUCH_DB_NAME + '.json',
            :collection => Couch::Config::COUCH_DB_NAME,
            :base => 'http://api.npolar.no',
            :language => 'en',  #converted to eng for the database
            :draft => 'no',
            :rights => 'No licence announced on web site',
            :rights_holder => 'Norwegian Polar Institute',
            :basis_of_record => 'HumanObservation',
            :event_date => unless (obs[10] == nil) then  iso8601time(obs[10]) end,
            :@placename => obs[13],     #placename will not contain official names only!
            :placename_comment => obs[14],
            :longitude => (obs[15]).to_f(),    #Big decimal
            :latitude => (obs[16]).to_f(),   #Big decimal
            :species => species[(obs[4].downcase)],
            :adult_m => '',
            :adult_f => '',
            :adult => '',
            :sub_adult => '',
            :polar_bear_condition => '',
            :cub_calf_pup => '',
            :bear_cubs => '',
            :unidentified => '',
            :polar_bear_den => unless (obs[4] == nil) then \
                  (species[obs[4].downcase]) == 'polar bear den'? "1" : ""  end,
            :dead_alive => '',   #Does not exist in old database
            :total => obs[7].to_s,
            :habitat => obs[9],
            :occurrence_remarks => obs[18] == nil ? "": obs[18],
            :info_comment => info_comment1 +  info_comment2 + info_comment3,
            :recorded_by_name => obs[11],
            :identified_by => '',
            :date_identified => '',
            :editor_assessment => 'green',
            :editor_comment => 'not available',
            :excelfile => Object.new,
            :expedition => Object.new,
            :pictures => Array.new,
            :created => timestamp,
            :updated => timestamp,
            :created_by => user,
            :updated_by => user,
            :draft => 'no'
         }

         #Add to occurrence remark - seals - whales -uncommon species
           alt = ['Lagenorhynchus spp.', 'Dolphin Undetermined']
            #first check if species exist at all
            if (obs[4] != nil) && (obs[4] != '')
                elem = obs[4]
             #   puts @entry[:occurrence_remarks]
              if alt.include?(elem)
               @entry[:occurrence_remarks] += " " + elem
              end
            end


       #Finds the LDAP id - should be added to info_comment through variable temp_entry
       temp_entry = obs[19].to_s

       #Open occurences table
       oci.exec('select * from mms.occurrences where observation_id=' + obs[0].to_s) do |occu|

           #Resolve lifestage
           case occu[4]
           when 1 #adult

            if occu[8] == 'Male'
              @entry[:adult_m] = occu[2].to_s
            elsif occu[8] == 'Female'
              @entry[:adult_f] = occu[2].to_s
            else #none
              @entry[:adult] = occu[2].to_s
            end

           when 2 #juvenile
            @entry[:sub_adult] = occu[2].to_json
           when 3 #child
            @entry[:cub_calf_pup] = occu[2].to_s
           end

           @entry[:info_comment] << ", Count accuracy: " + occu[3].to_s


       end #occurrence

       #Go through images
       y=0
       oci.exec('select * from mms.pictures where observation_id=' + obs[0].to_s) do |pic|

          #puts "Picture: " + pic[0].to_s + ' ' + obs[0].to_s


          #Don't create image dir over again of more than one image
          if (y < 1)
            #Create a new dir under images and thumbnails
            Dir.mkdir 'images/' +uuid
            Dir.mkdir 'thumbnails/' + uuid
            #puts uuid

            #Create thumbnail and image on apptest
           # Net::SSH.start(host, user, :password => password) do |ssh|
         #   Net::SSH.start(Couch::Config::HOST1, Couch::Config::USER2, :password => Couch::Config::PASSWORD1) do |ssh|
            Net::SSH.start(Couch::Config::HOST2, Couch::Config::USER2, :password => Couch::Config::PASSWORD2) do |ssh|
              ssh.exec "mkdir -p /srv/hashi/storage/sighting/restricted/" + uuid
            end

            y=y+1
          end

          #Avoid cluttering up next info with old image infos from "last round".
          @pictures = Object.new

          #Extract the MD5 checksum from reply
          filenameImg = pic[2]
          md5img = Digest::MD5.hexdigest(filenameImg)

          #Get MD5 checksum from reply
          filenameThumb = 'thumb_' + pic[2]
          md5thumb = Digest::MD5.hexdigest(filenameThumb)

          @pictures = {
            :items => {
            :uri => "https://api.npolar.no/sighting/" + uuid +"/_file/" + md5img,
            :thumb_uri => "https://api.npolar.no/sighting/" + uuid + "/_file/" + md5thumb,
            :filename => pic[2],
            :type => pic[8],
            :length => pic[9]},
            :hash => md5img,
            :thumb_hash => md5thumb,
            :photographer => pic[7],
            :comments => pic[4].to_s,
            :other_info => 'Created at: ' + pic[5].to_s + ', updated at: ' + pic[6].to_s
          }

          @entry[:pictures] << @pictures

          #Save the image aka blob to disk
          #Need the new id here
          File.open("images/" + uuid + '/' + pic[2], 'w') do |f|
             #Need to stringify OCI8::BLOB object
             f.write(pic[3].read)
          end

          #Convert to RMagick image object
          original = Magick::Image.read("images/"+ uuid +'/'+ pic[2]).first

          #Create thumbnail
          thumbnail = original.change_geometry('200x200') { |cols, rows, img|
             img.resize!(cols, rows)
          }

          #Save thumbnail to disk
          File.open("thumbnails/" + uuid + '/' + pic[2], 'wb') do |f|
             #Need to stringify Magick::Image object, then save to disk
             f.write(thumbnail.to_blob)
          end

          #Upload from ruby_scripts to remote server
        #  Net::SCP.upload!("dbmaster.data.npolar.no", "siri","/local/path", "/remote/path", :ssh => { :password => "password" })

          Net::SCP.start(Couch::Config::HOST2, Couch::Config::USER2, :password => Couch::Config::PASSWORD2 ) do |scp|
        #  Net::SCP.start(Couch::Config::HOST1, Couch::Config::USER2, :password => Couch::Config::PASSWORD1 ) do |scp|
          #Create a remote directory

          # puts "SCP started"
         scp.upload!("/home/siri/projects/ruby_scripts/images/" + uuid + "/" + pic[2], "/srv/hashi/storage/sighting/restricted/" + uuid + "/", :recursive => true)
          # puts "scp started2"
         scp.upload!("/home/siri/projects/ruby_scripts/thumbnails/" + uuid + "/" + pic[2], "/srv/hashi/storage/sighting/restricted/" + uuid +"/thumb_" + pic[2], :recursive => true)
         end

        end  #end oci pictures


       #Removed empty array
       if  @entry[:pictures] == [] then  @entry[:pictures] = nil end


       @expedition = Object.new

       sel = 'select * from mms.field_activities where mms.field_activities.id =
       (select mms.observations.field_activity_id from mms.observations
       where mms.observations.id =' + obs[0].to_s + ')'
       oci.exec(sel) do |field|

              #  puts "Field: " + field[0].to_s

                @expedition = {
                :name => field[1],
                :contact_info => field[3],
                :organisation => field[2],
                :platform => field[6],
                :platform_comment => field[7], # obs[3],
                :start_date => unless (field[8] == nil) then  iso8601time(field[8]) end,  #iso8601time(field[8]),
                :end_date => unless (field[9] == nil) then  iso8601time(field[9]) end, #iso8601time(field[9]),
                :other_info => 'Contact person: ' + field[4] + ', email: ' + field[5]   \
                         + ', created_at: ' + field[12].to_s + ', updated_at: ' + field[13].to_s \
                         + ', created_by_dn: ' + field[10].to_s  + ', updated_by_dn: ' + field[11].to_s
                }  #end exped object

                #Traverse @expedition and remove all empty entries
                @expedition.each do | key, val |
                    if  val == "" || val == "" || val == nil
                         # puts key
                          @expedition.delete(key)
                    end
                end

                 #Add LDAP temp variables
                 temp_expedition_created = field[10].to_s
                 temp_expedition_updated = field[11].to_s

            end

            #Avoid cluttering up next info with old excel infos
            @excelfile = Object.new

                 #Extract excelfile info
                 sel2 = 'select * from mms.obs_files where mms.obs_files.field_activity_id=
                 (select mms.observations.field_activity_id from mms.observations where
                  mms.observations.id =' + obs[0].to_s + ')'
                 oci.exec(sel2) do |ofile|

                      #open file and get uuid
                      readtext = File.read("./excel_uuid.txt")
                      uuidexcel = ""
                      uuids = readtext.split(':')
                      #Find excelname in uuids array
                      for index in 0 ... uuids.size
                          if uuids[index].include? ofile[1].to_s
                             uuidarr =  uuids[index].split('|')
                             uuidexcel = uuidarr[0].gsub(/\s+/, "")
                          end
                      end

                     # puts uuidexcel + "uuidexcel"

                      #Fetch an thumbnail UUID from courchdb
                      # res4 = server.get("/_uuids")


                      #Extract the UUID from reply
                     # uuidexcel = (res4.body).split('"')[3]

                      #Convert UUID to RFC UUID
                     # uuidexcel.insert 8, "-"
                     # uuidexcel.insert 13, "-"
                     # uuidexcel.insert 18, "-"
                     # uuidexcel.insert 23, "-"

                      other_info1 = 'Status ' + ofile[2].to_s + ', processed_at: ' + ofile[4].to_s
                      other_info2 = ', Created at: ' + ofile[5].to_s + ', Updated at: ' + ofile[6].to_s
                      other_info3 = ', created by DN: ' + ofile[3].to_s

                      #Extract the MD5 checksum from reply
                      filenameExcel = ofile[1].to_s
                      md5excel = Digest::MD5.hexdigest(filenameExcel)

                      @excelfile = {
                        :items => {
                         :uri => "https://api.npolar.no/sighting-excel/" + uuidexcel + "/_file/" + ofile[1].to_s,
                         :filename => ofile[1].to_s,
                         :type => ofile[9].to_s,
                         :length => ofile[10].to_s
                         },
                         :hash => md5excel,
                         :other_info => other_info1 + other_info2 + other_info3
                       }

                       #Don't add excelfile if it does not exist
                       #puts @excelfile
                       puts "file"

                      #if  uuidexcel  === ""
                      #     puts "uuidexcel = null"
                        #   @excelfile = NULL
                      # end

                        # :timestamp =>  ""      #timestamp
                       #Excelfile

                      #Add LDAP temp variables
                      temp_excelfile = ofile[3].to_s

            end  #obs_files


#Here comes the storage into the Couch database

#Chop off so only the user uid remains -or nothing. Use LDAP to find the user by name.
    temp_entry == '' ? temp_entry = "uid=0" : temp_entry = temp_entry.split(",cn=users,dc=polarresearch,dc=org").first
    temp_expedition_created == '' ? temp_expedition_created = "uid=0" : temp_expedition_created =       temp_expedition_created.split(",cn=users,dc=polarresearch,dc=org").first
    temp_expedition_updated == '' ? temp_expedition_updated = "uid=0" : temp_expedition_updated = temp_expedition_updated.split(",cn=users,dc=polarresearch,dc=org").first
    temp_excelfile == '' ? temp_excelfile = "uid=0" : temp_excelfile = temp_excelfile.split(",cn=users,dc=polarresearch,dc=org").first


    #Connect to LDAP
    credentials = {
                    :method => :simple,
                    :username => Couch::Config::USER_LDAP,
                    :password => Couch::Config::PASSWORD_LDAP
                   }

    Net::LDAP.open(:host => Couch::Config::HOST_LDAP, :port => 389, :base => "dc=polarresearch, dc=org", :auth => credentials ) do |ldap|

          #Add results from LDAP search into @entry
          ldap.search(filter: temp_entry, base: "dc=polarresearch,dc=org", ignore_server_caps: true) do |ldap_entry|
              # puts ldap_entry.cn #common name
              # puts ldap_entry.sn
              # puts ldap_entry.dn
              # puts ldap_entry.givenName
              # puts ldap_entry.mail
                e0 = (ldap_entry.cn.first.to_s).force_encoding('iso-8859-1').encode('utf-8')
               @entry[:info_comment ] << ', created_by_dn: ' + e0 + ', ' + (ldap_entry.mail).first.to_s
          end

          #Expedition - add from LDAP search
          ldap.search(filter: temp_expedition_created, base: "dc=polarresearch,dc=org", ignore_server_caps: true) do |ldap_entry1|
            #   puts ldap_entry1.cn
             #  puts ldap_entry1.mail
                e1 = (ldap_entry1.cn.first.to_s).force_encoding('iso-8859-1').encode('utf-8')
               @expedition[:other_info] << ', created_by_dn: ' + e1 + ', ' + (ldap_entry1.mail).first.to_s
          end

          #Expedition variable created and updated
          ldap.search(filter: temp_expedition_updated, base: "dc=polarresearch,dc=org", ignore_server_caps: true) do |ldap_entry2|
             #  puts ldap_entry2.cn
             #  puts ldap_entry2.mail
                e2 = (ldap_entry2.cn.first.to_s).force_encoding('iso-8859-1').encode('utf-8')
                @expedition[:other_info] << ', updated_by_dn: ' + e2 + ', ' + (ldap_entry2.mail).first.to_s
          end

          #Excelfile - add from LDAP search
          ldap.search(filter: temp_excelfile, base: "dc=polarresearch,dc=org", ignore_server_caps: true) do |ldap_entry3|
             #  puts ldap_entry3.cn #common name
             #  puts ldap_entry3.mail
               e3 = (ldap_entry3.cn.first.to_s).force_encoding('iso-8859-1').encode('utf-8')
               @excelfile[:other_info] << (', created by DN: ' + e3 + ', ' + (ldap_entry3.mail).first.to_s).force_encoding('iso-8859-1').encode('utf-8')
          end
    end


    #Add expedition and excelfile objects to entry object
    defined?(@expedition[:other_info]).nil? ? @entry[:expedition] = nil : @entry[:expedition] = @expedition
    defined?(@excelfile[:file_name]).nil? ?  @entry[:excelfile] = nil : @entry[:excelfile] = @excelfile

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


     #Load only the x first entries
   #  x += 1
   #  if x==2 then break end;



 end #observation -need to keep the object until stored

end #class
end #module
