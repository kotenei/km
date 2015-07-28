var gulp   = require('gulp');
var less   = require('gulp-less');
var path   = require('path');
var fs     = require('fs');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var minifyCSS = require('gulp-minify-css');

var through2 = require('through2');

var configPath = path.join(__dirname, 'build.config');
var config     = JSON.parse(fs.readFileSync(configPath, 'utf8'));

//将所有 kotenei 合成一份定义
var build = function (defineName) {

    defineName = defineName || 'kotenei';

    return through2.obj(function (file, enc, callback) {
        var soure   = file.contents.toString('utf8');
        var jsPath  = path.join(__dirname, 'js', 'kotenei');
        var modules = [];
       
        //列出所有文件
        fs.readdirSync(jsPath).forEach(function(fileName){
            if(fileName.indexOf('.js') !== -1 && 
               fileName.indexOf('.') !== 0){
                var files = fileName.split('.');
                files.pop();
                modules.push(files.join('.'));
            }
        });
        var reqs = modules.map(function(v){
            return '"kotenei/' + v + '"';
        });

        var safeModules = modules.map(function(v){
            return '_' + v ;
        });

        var def = [];
        def.push('define("'+defineName+'", [' + reqs.join(', ') + '], function(' + safeModules.join(', ') + '){');
        def.push('    return {');
        var attr = [];
        modules.forEach(function(v){
            if(config['function'].indexOf('kotenei/' + v) === -1){
                //首字母大写
                var names = v.split('');
                names[0] = names[0].toUpperCase(); 
                attr.push('        "' + names.join('') + '" : _' + v);
            }
            else{
                attr.push('        "' + v + '" : _' + v);
            }
        });
        def.push(attr.join(',\n')); 
        def.push('    };');
        def.push('});');

        file.contents = new Buffer(soure + '\n;\n' + def.join('\n'));
        callback(null, file);
    });
};

gulp.task('less', function () {
    gulp.src([
        './style/*.less',
        '!./style/_*.less'
    ])
    .pipe(less({
      paths: [path.join(__dirname, 'style')]
    }))
    .pipe(gulp.dest('./dist/css'))
    .pipe(minifyCSS())
    .pipe(rename('kotenei.min.css'))
    .pipe(gulp.dest('./dist/css'))
});

gulp.task('scripts', function () {

    gulp.src([
        './script/kotenei/*.js'
    ])
    .pipe(concat('kotenei.all.js'))
    .pipe(build())
    .pipe(gulp.dest('./dist'))
    .pipe(uglify())
    .pipe(rename('kotenei.all.min.js'))
    .pipe(gulp.dest('./dist'));

    //gulp.src([
    //    './js/kotenei/*.js'
    //])
    //.pipe(concat('km.min.js'))
    //.pipe(build('KM'))
    //.pipe(uglify())
    //.pipe(gulp.dest('./dist'));
});

gulp.task('watch', function(){
    gulp.watch([
        './style/*.less',
    ], ['less']);

    gulp.watch([
        './js/kotenei/*.js',
    ], ['scripts']);
});

gulp.task('default', ['less', 'scripts', 'watch']);