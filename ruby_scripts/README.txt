Procedure
1) Remove all files from directory ruby_script/excel_download/start og ruby_script/excel_download/done.
2) Back up the current excel_uuid.txt file found in ruby_script/.
3) Part A. First store all Excel files to server so we can get a reference to the excel file fore each entry. For safety copy the /srv/hashi/..sightingexcel/restriced if something goes wrong. Read all new Excel files into the ruby_script/excel_download/start. Files stay in start also when they are read - i.e. they are not moved after running sightingExcel.
4) Run sightingExcel.
5) Part B. All files should still be ruby_script/excel_download/start. Run tests on testserver first. Run readExcel.
6) Check that files can be updated if needed.
   Check that excel file storage is ok and the excel file link is functional.
7) Cleanup if successful: Remove duplicate from dbmaster /srv/hashi/..sightingexcel/...
8) Back up excel_uuid.txt

Convertmms was used to transfer all files from the old database
