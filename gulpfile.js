const gulp = require('gulp'),
    sass = require('gulp-sass'),
    plumber = require('gulp-plumber'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    fs = require('fs'),
    glob = require('glob'),
    path = require('path'),
    data = require('gulp-data'),
    twig = require('gulp-twig'),
    foreach = require('gulp-foreach'),
    autoprefixer = require('gulp-autoprefixer'),
    babel = require('gulp-babel'),
    svgmin = require('gulp-svgmin'),
    svgstore = require('gulp-svgstore'),
    inject = require('gulp-inject'),
    browserSync = require('browser-sync').create(),
    inputCss = "src/scss/**/*.scss",
    inputJs = "src/js/*.js",
    inputViews = "src/views/**/*.twig",
    inputImages = "src/img/**/*",
    inputIcons = "src/icons/*.svg",
    outputCss = "dist/css",
    outputJs = "dist/js",
    outputImages = "dist/img",
    outputViews = "dist"

const sassOptions = {
    errLogToConsole: true,
    outputStyle: 'nested',
};

const autoprefixerOptions = {
    browsers: ['> 1%', 'iOS > 8', 'Firefox ESR', 'Opera 12.1', 'Explorer > 8']
};

gulp.task('serve', ['sass', 'es6', 'twig'], () => {
    browserSync.init({
        server: {
            baseDir: "./dist/"
        }
    });

    gulp.watch(inputIcons, ['svgmin']);
    gulp.watch(inputCss, ['sass']);
    gulp.watch(inputViews, ['twig']);
    gulp.watch('dist/*.html').on('change', browserSync.reload);
    gulp.watch(inputJs, ['es6']).on('change', browserSync.reload);
    gulp.watch(inputImages, ['imagemin']).on('change', browserSync.reload);
});

/* Twig Templates */
function getJsonData (file, cb) {
    glob("src/data/*.json", {}, function(err, files) {
        var data = {};
        if (files.length) {
            files.forEach(function(fPath){
                var baseName = path.basename(fPath, '.json');
                data[baseName] = JSON.parse(fs.readFileSync(fPath));
            });
        }
        cb(undefined, data);
    });
}

gulp.task('twig',function(){
    return gulp.src('src/views/*.twig')
        .pipe(plumber({
          errorHandler: function (error) {
            console.log(error.message);
            this.emit('end');
        }}))
        .pipe(data(getJsonData))
        .pipe(foreach(function(stream,file){
            return stream
                .pipe(twig())
        }))
        .pipe(gulp.dest('dist/'));
});

gulp.task('sass', () => {
    return gulp.src(inputCss)
        .pipe(plumber())
        .pipe(sass(sassOptions))
        .pipe(autoprefixer(autoprefixerOptions))
        .pipe(gulp.dest(outputCss)).pipe(browserSync.stream());
});

gulp.task('es6', () => {
    return gulp.src(inputJs)
        .pipe(babel())
        .pipe(gulp.dest(outputJs));
});

gulp.task('imagemin', () => {
    return gulp.src(inputImages)
    .pipe(imagemin())
    .pipe(gulp.dest(outputImages));
});

gulp.task('svgmin', function () {
    var svgs = gulp.src(inputIcons)
        .pipe(plumber())
        .pipe(svgmin(function(file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: true
                    }
                }]
            }
        }))
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename(function(path) {
            path.basename = 'sprite';
        }))
        .pipe(gulp.dest(outputImages));

    function fileContents (filePath, file) {
        return file.contents.toString();
    }

    return gulp
        .src('src/views/includes/svgsprite.twig')
        .pipe(inject(svgs, { transform: fileContents }))
        .pipe(gulp.dest('src/views/includes'));
});

gulp.task('default', ['serve', 'imagemin', 'svgmin']);