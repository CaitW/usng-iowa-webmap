module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['dist/*', 'example/*'],
        concat: {
            options: {
                separator: ';\n',
                stripBanners: true,
            },
            dist: {
                src: ['src/js/lib/jquery-1.11.3.min.js', 'src/js/lib/leaflet.js', 'src/js/lib/esri-leaflet.js', 'src/js/lib/leaflet-pip.min.js', 'src/js/lib/L.Control.Window.js', 'src/js/lib/leaflet.draw.js', 'src/js/lib/turf.min.js', 'src/js/app.js'],
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
            example_fonts: {
                expand: true,
                cwd: 'src/fonts',
                src: '**',
                dest: 'example/fonts',
            },
            example_data: {
                expand: true,
                cwd: 'src/data',
                src: '**',
                dest: 'example/data',
            },
            example_cssjs: {
                expand: true,
                files: {
                    'example/usng-web-map.css': ['dist/usng-web-map.css'],
                    'example/usng-web-map.js': ['dist/usng-web-map.js'],
                    'example/index.html': ['src/example/index.html']
                }
            },
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-concat-css');
    grunt.loadNpmTasks('grunt-autoprefixer');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    // Default task(s).
    grunt.registerTask('default', ['clean', 'concat', 'sass', 'autoprefixer', 'concat_css', 'copy']);
};
