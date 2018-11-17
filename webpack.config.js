"use strict";

const path = require("path");

const ExtractTextPlugin = require("extract-text-webpack-plugin");
const webpack = require("webpack");

module.exports = env => {
  const production = env === "production";

  const plugins = [];

  const devtool = env === "production" ? "hidden-source-map" : "source-map";

  plugins.push(
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(env)
    }),
    new ExtractTextPlugin("[name].css")
  );

  if (production) {
    plugins.push(new webpack.optimize.UglifyJsPlugin({ sourceMap: true }));
    plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
  }

  return {
    devtool: devtool,
    entry: {
      shim: "./src/shim.js",
      launcher: "./src/launcher.js",
      index: "./src/index.js"
    },

    output: {
      path: path.join(__dirname, "dist"),
      publicPath: "/dist",
      filename: "[name].js"
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: ["es2015"]
              }
            }
          ],
          exclude: ["/node-modules/"]
        },
        {
          test: /\.vue$/,
          use: [{ loader: "vue-loader" }],
          exclude: ["/node-modules/"]
        },
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: "style-loader",
            use: {
              loader: "css-loader",
              options: {
                minimize: production,
                sourceMap: production
              }
            }
          })
        },
        {
          test: /\.(jpg|svg|png)$/,
          use: [{ loader: "url-loader" }]
        },
        {
          test: /\.html$/,
          use: [
            { loader: "file-loader?name=[name].[ext]" },
            { loader: "extract-loader" },
            { loader: "html-loader" }
          ]
        },
        {
          test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
          use: [{
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: '/',    // where the fonts will go
              publicPath: '../'       // override the default path
            }
          }]
        }
      ]
    },
    plugins: plugins
  };
};
