var HtmlWebpackPlugin = require("html-webpack-plugin"),
    path = require("path"),
    webpack = require("webpack"),
    WebpackDevServer = require('webpack-dev-server');

var config = {
  entry: [
    "react-hot-loader/patch",
    "webpack-dev-server/client?http://localhost:4000",
    "webpack/hot/only-dev-server",
    "./src/main.js"
  ],

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/"
  },

  devServer: {
    host: "localhost",
    historyApiFallback: true,
    hot: true,
    port: 4000
  },

  devtool: "inline-source-map",

  resolve: {
    extensions: ["*", ".js", ".jsx"],
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [
          "babel-loader",
        ],
        exclude: /node_modules/,
      },
    ],
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      template: "./index.html",
      inject: true
    })
  ]
};

module.exports = config;
