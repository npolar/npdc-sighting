var gulp = require('gulp');
var npdcGulp = require('npdc-gulp');
var config = npdcGulp.baseConfig;
config.COMMON_VERSION = '4.11.3';
npdcGulp.loadAppTasks(gulp, {
  'deps': {
    'assets': [
                'node_modules/leaflet-draw/dist/**/*',
                'node_modules/xlsx/dist/*',
                'node_modules/leaflet/dist/*',
                'node_modules/leaflet/dist/images/*',
                'node_modules/angular-leaflet-directive/dist/*',
                'node_modules/leaflet-draw/dist/*',
                'node_modules/angular-smart-table/dist/smart-table.min.js',
                'node_modules/leaflet-fullscreen/dist/*']
}});

