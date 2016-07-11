module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';\n',
                stripBanners: true,
            },
            dist: {
                src: ['src/js/lib/jquery-1.11.3.min.js', 'src/js/lib/leaflet.js', 'src/js/lib/esri-leaflet.js', 'src/js/lib/leaflet-pip.js', 'src/js/lib/L.Control.Window.js', 'src/js/lib/leaflet.draw.js', 'src/js/lib/turf.min.js', 'src/js/usng-web-map.js', ],
                dest: 'dist/usng-web-map.js',
            },
        },
        sass: {
            dist: {
                files: {
                    'src/css/usng-web-map-custom.css': 'src/scss/usng-web-map.scss'
                }
            }
        },
        autoprefixer: {
            options: {},
            dist: {
                files: {
                    'src/css/usng-web-map-custom.css': 'src/css/usng-web-map-custom.css'
                }
            }
        },
        concat_css: {
            options: {
                sourceMapStyle: 'inline'
            },
            all: {
                src: ["src/css/lib/*.css", "src/css/*.css"],
                dest: "dist/usng-web-map.css"
            }
        },
        copy: {
            fonts: {
                expand: true,
                cwd: 'src/fonts',
                src: '**',
                dest: 'dist/fonts',
            },
            data: {
                expand: true,
                cwd: 'src/data',
                src: '**',
                dest: 'dist/data',
            },
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-concat-css');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-copy');
    // Default task(s).
    grunt.registerTask('default', ['concat', 'sass', 'autoprefixer', 'concat_css', 'copy']);
};
