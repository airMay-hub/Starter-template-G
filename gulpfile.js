let project_folder = require("path").basename(__dirname); // папка проекта
let source_folder = "src"; // папка с исходными файлами

let fs = require("fs");

// пути к папкам и файлам

let path = {
  build: {
    html: project_folder + "/",
    css: project_folder + "/css/",
    js: project_folder + "/js/",
    img: project_folder + "/assets/img/",
    video: project_folder + "/assets/video/",
    audio: project_folder + "/assets/audio/",
    fonts: project_folder + "/assets/fonts/",
  },
  src: {
    html: [source_folder + "/*.html", "!"+ source_folder + "/_*.html"],
    css: source_folder + "/style/style.scss",
    js: source_folder + "/js/script.js",
    img: source_folder + "/assets/img/**/*.{jpg,png,svg,gif,ico,webp}",
    video: source_folder + "/assets/video/**/*.mp4",
    audio: source_folder + "/assets/audio/**/*.mp3",
    fonts: source_folder + "/assets/fonts/*.ttf",
  },
  watch: {
    html: source_folder + "/**/*.html",
    css: source_folder + "/style/**/*.scss",
    js: source_folder + "/js/**/*.js",
    img: source_folder + "/assets/img/**/*.{jpg,png,svg,gif,ico,webp}",
    video: source_folder + "/assets/video/**/*.mp4",
    audio: source_folder + "/assets/audio/**/*.mp3",
  },
  clean: "./" + project_folder + "/" // путь к папке проекта для функции удаления
}

let { src, dest } = require("gulp"),
  gulp = require("gulp"),
  browsersync = require("browser-sync").create(), // Live Server
  // позволяет  с помощью @@include('путь к файлу') добавлять файлы в один основной (index.html, script.js)
  fileinclude = require("gulp-file-include"),
  del = require("del"), // удаление
  scss = require("gulp-sass"),
  autoprefixer = require("gulp-autoprefixer"), // автопрефиксер
  group_media = require("gulp-group-css-media-queries"), // группирует медиа-запросы
  clean_css = require("gulp-clean-css"), // минимизация стилей
  rename = require("gulp-rename"), // переименование файлов
  uglify = require("gulp-uglify"), // минимизация скрипта
  imagemin = require("gulp-imagemin"), // минимизация изображений
  webp = require("gulp-webp"), // перевод изображений в формат webp
  webphtml = require("gulp-webp-html"), // подключение webp и jpg через тег picture
  webpcss = require("gulp-webp-css"), // подключение webp в css
  svgSprite = require("gulp-svg-sprite"), // спрайты
  ttf2woff = require("gulp-ttf2woff"), //
  ttf2woff2 = require("gulp-ttf2woff2"), //
  fonter = require("gulp-fonter"); //

// Функция, открывающая сервер
function browserSync() {
  browsersync.init ({
    server: {
      baseDir: "./" + project_folder + "/"
    },
    port: 3000,
    notify: false
  })
}

// собирает html файлы
function html () {
  return src(path.src.html)
  .pipe(fileinclude())
  .pipe(webphtml())
  .pipe(dest(path.build.html))
  .pipe(browsersync.stream())
}

// собирает css файлы
function css () {
  return src(path.src.css)
  .pipe(
    scss({
      outputStyle: "expanded"
    })
  )
  .pipe(
    group_media()
  )
  .pipe(
    autoprefixer({
      overrideBrowserslist: ["last 5 versions"],
      cascade: true
    })
  )
  .pipe(webpcss())
  .pipe(dest(path.build.css))
  .pipe(clean_css())
  .pipe(
    rename({
      extname: ".min.css"
    })
  )
  .pipe(dest(path.build.css))
  .pipe(browsersync.stream())
}

// собирает js файлы
function js () {
  return src(path.src.js)
  .pipe(fileinclude())
  .pipe(dest(path.build.js))
  .pipe(
    uglify()
  )
  .pipe(
    rename({
      extname: ".min.js"
    })
  )
  .pipe(dest(path.build.js))
  .pipe(browsersync.stream())
}

function images () {
  return src(path.src.img)
  .pipe (
    webp ({
      quality: 70
    })
  )
  .pipe(dest(path.build.img))
  .pipe (src(path.src.img))
  .pipe (
    imagemin ({
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }],
      interlaced: true,
      optimizationLevel: 3 // 0 to 7
    })
  )
  .pipe(dest(path.build.img))
  .pipe(browsersync.stream())
}

function video () {
  return src(path.src.video)
  .pipe(dest(path.build.video))
  .pipe(browsersync.stream())
}

function audio () {
  return src(path.src.audio)
  .pipe(dest(path.build.audio))
  .pipe(browsersync.stream())
}

// обрабатывает шрифты
function fonts() {
  src(path.src.fonts)
  .pipe(ttf2woff())
  .pipe(dest(path.build.fonts));
  return src(path.src.fonts)
  .pipe(ttf2woff2())
  .pipe(dest(path.build.fonts))
}

gulp.task("otf2ttf", function () {
  return src([source_folder + "/fonts/*.otf"])
    .pipe(fonter({
      formats: ["ttf"]
    }))
    .pipe(dest(source_folder + "/fonts/"));
})

// для спрайтов сначала запустить gulp, потом в отдельном терминале gulp svgSprite
gulp.task("svgSprite", function () {
  return gulp.src([source_folder + "/iconsprite/*.svg"])
  .pipe(svgSprite({
    mode: {
      stack: {
        sprite: "../icons/icons.svg",
        example: true
      }
    },
  }))
  .pipe(dest(path.build.img))
})

function fontsStyle() {

  let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
  if (file_content == '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
      let c_fontname;
        for (var i = 0; i < items.length; i++) {
        let fontname = items[i].split('.');
        fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
          }
        c_fontname = fontname;
        }
      }
    })
  }
  }

function cb() {
  
}

// следит за изменениями в файлах
function watchFiles() {
  gulp.watch([path.watch.html], html);
  gulp.watch([path.watch.css], css);
  gulp.watch([path.watch.js], js);
  gulp.watch([path.watch.img], images);
  gulp.watch([path.watch.video], video);
  gulp.watch([path.watch.audio], audio);
}

// удаляет папку проекта, каждый раз при запуске gulp
function clean() {
  return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images, video, audio, fonts), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);


exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.video = video;
exports.audio = audio;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;