// Built-in modules
const os = require("os");
const path = require("path");

// Dependency Modules
const webpack = require("webpack");

// Webpack Plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const DIST_DIR = path.resolve(__dirname, "dist");

exports.context = __dirname;

exports.entry = [
  "./src/main.js"
];

exports.output = {
  path: DIST_DIR,
  filename: "main.[hash].js"
};

exports.module = {
  rules: [
    {
      test: /\.html/,
      use: ["html-loader"]
    },
    {
      test: /\.scss$/,
      use: [
        {
          loader: "style-loader"
        },
        {
          loader: "css-loader"
        },
        {
          loader: "sass-loader"
        }
      ]
    }
  ]
};

exports.plugins = [
  new CleanWebpackPlugin([DIST_DIR]),
  new HtmlWebpackPlugin({
    template: "src/index.html"
  }),
];

if(process.env.NODE_ENV == 'development') {
  // Development stuff
  exports.mode = "development";
  exports.devtool = 'inline-source-map';
  exports.plugins.push(new webpack.HotModuleReplacementPlugin());
  exports.devServer = {
    contentBase: DIST_DIR,
    disableHostCheck: true,
    hot: true,
    inline: false,
    historyApiFallback: true,
  };

  exports.entry = exports.entry.concat([
    "webpack-dev-server/client/index.js?https://0.0.0.0:0",
    "webpack-dev-server/client/overlay.js",
    "webpack-dev-server/client/socket.js",
    "webpack/hot/dev-server.js",
    "webpack/hot/emitter.js",
    "webpack/hot/log-apply-result.js",
    "webpack/hot/log.js",
  ]);

} else
if(process.env.NODE_ENV == 'production') {
  exports.mode = 'production';
} else {
  exports.mode = 'none';
}
