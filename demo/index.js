var typeset = require("typeset");
var fs = require("fs-extra");
var cheerio = require("cheerio");
var hljs = require("highlight.js");
var minify = require("html-minifier").minify;
var minifyOpts = { removeComments: true, removeAttributeQuotes: true };
var join = require("path").join;
var extname = require("path").extname;
var CleanCSS = require("clean-css");
var esbuild = require("esbuild");

var SOURCE = __dirname + "/source";
var PUBLIC = __dirname + "/public";

function build() {
  fs.emptyDirSync(PUBLIC);

  // Copy library across
  compress_js(
    __dirname + "/../randomColor.js",
    join(PUBLIC, "randomColor.min.js")
  );

  var source_files = fs.readdirSync(SOURCE);

  source_files.forEach(function (name) {
    if (name[0] === ".") return;

    var from = join(SOURCE, name);
    var to = join(PUBLIC, name);

    if (extname(name) === ".css") return compress_css(from, to);

    if (extname(name) === ".js") return compress_js(from, to);

    if (name === "index.html") return build_index(from, to);

    fs.copy(from, to);
  });
}

async function compress_js(from, to) {
  let result = await esbuild.build({
    entryPoints: [from],
    format: "cjs",
    minify: true,
    outfile: to,
  });
}

function compress_css(from, to) {
  var file = fs.readFileSync(from, "utf-8");

  file = new CleanCSS({}).minify(file).styles;

  fs.writeFileSync(to, file);
}

function build_index(from, to) {
  var html = fs.readFileSync(from, "utf-8");
  var $ = cheerio.load(html, { decodeEntities: false });

  $("code").each(function () {
    var newHTML = hljs.highlight("js", $(this).html()).value;

    $(this).attr("class", "hljs");
    $(this).html(newHTML);
  });

  html = typeset($.html());
  html = minify(html, minifyOpts);

  fs.writeFileSync(to, html);
}

build();
fs.watch(__dirname, build);

// forking practice
