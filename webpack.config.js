// webpack.config.js
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { watch } = require("fs");


module.exports = {
  mode: "production",                  // mode can be development or production
  entry: "./src/index.js",              // define entry point
  output: {
    filename: "main.js",                     // all .js material is gonna go into this file
    path: path.resolve(__dirname, "dist"),  // all other files will be named main.xxx and be placed in ./dist
    clean: true,     // It will empty the output directory first before bundling the files into it
  },
                                             // 13 to 15: HOW TO SET UP WEBPACK DEV SERVER
                                             // • Install webpack-de server (npm install --save-dev webpack-dev-server)
  devtool: "eval-source-map",                // • Create source map
  devServer: {                               // • Tells the webserver
    watchFiles: ["./src/template.html"],     //   which file to watch (http://localhost:8080/'s homepage)
  },
  plugins: [  //ADD HTML HANDLER (MUST HAVE BEEN INSTALLED `npm install html-webpack-plugin`)
    new HtmlWebpackPlugin({
      template: "./src/template.html", //Tell what the template is going to be
    }),
  ],
  module: {
    rules: [//TELLS HOW TO RECOGNISE WHAT FILES
      {//FOR LOADING CSS FILES
        test: /\.css$/i, // the extansion(s) the loader will look for
        use: ["style-loader", "css-loader"],
      },
      {//FOR LOADING HTML FILES
        test: /\.html$/i,
        loader: "html-loader",
      },
      { //FOR LOADING IMAGES
        test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
        type: "asset/resource",
      },
      { //FOR LOADING FONTS
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
    ],
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  watch: true
};