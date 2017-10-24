import webpack from 'webpack'
import merge from 'webpack-merge'
import jssGlobal from 'jss-global'
import jssNested from 'jss-nested'
import jssCamelCase from 'jss-camel-case'
import autoprefixer from 'autoprefixer'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import CssResolvePlugin from 'elementum-tools/lib/webpack/css-resolve-plugin'
import { findConfigs } from 'babel-core/lib/config/loading/files/configuration'

const defaultConfig = {
  output: {
    path: '/',
  },
  module: {
    rules: [
      {
        test: /\.jss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                plugins: () => ([
                  autoprefixer({ browsers: ['>2%', 'last 2 versions'] }),
                ]),
              },
            },
            'jss-loader',
          ],
        }),
      },
      {
        test: /\.(png|jpg|svg|ttf|eot|woff|woff2)$/,
        loader: 'file-loader?name=[name].[ext]',
      },
    ],
  },
  resolve: {
    plugins: [
      new CssResolvePlugin(),
    ],
  },
  plugins: [
    new ExtractTextPlugin('index.css'),
    new webpack.LoaderOptionsPlugin({
      options: {
        jssLoader: {
          plugins: [
            jssGlobal(),
            jssNested(),
            jssCamelCase(),
          ],
        },
      },
    }),
  ],
}

const INJECT_PLUGIN_NAME = 'elementum-tools/lib/babel/plugin'

const injectExtractOption = options => ({
  ...options,
  plugins: options.plugins.map((plugin) => {
    if (plugin === INJECT_PLUGIN_NAME) {
      return [INJECT_PLUGIN_NAME, { extract: true }]
    }

    if (plugin[0] === INJECT_PLUGIN_NAME) {
      return [INJECT_PLUGIN_NAME, { ...plugin[1], extract: true }]
    }

    return plugin
  }),
})

const findBabelConfigs = (cwd) => {
  const [config] = findConfigs(cwd)

  if (!config) {
    throw new Error('Babel config not found')
  }

  return config.options
}

export const buildConfig = (cwd, entry) => {
  const babelOptions = injectExtractOption(findBabelConfigs(cwd))

  return merge(
    defaultConfig,
    {
      entry,
      context: cwd,
      module: {
        rules: [
          {
            test: /\.js?$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            options: babelOptions,
          },
        ],
      },
    },
  )
}
