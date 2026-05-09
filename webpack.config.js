const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const dotenv = require('dotenv');

const env = dotenv.config().parsed || {};

// Ensure sensitive keys are not exposed to frontend
const excludedEnvKeys = ['GEMINI_API_KEY', 'DATABASE_URL', 'DATABASE_PASSWORD'];

const envKeys = Object.keys(env).reduce((prev, next) => {
  // Never expose sensitive keys to renderer
  if (!excludedEnvKeys.includes(next)) {
    prev[`process.env.${next}`] = JSON.stringify(env[next]);
  }
  return prev;
}, {});

// Only for dev logging
if (process.env.NODE_ENV === 'development') {
  envKeys['process.env.DEBUG_WEBPACK'] = JSON.stringify('true');
}

module.exports = {
  mode: 'development',
  entry: './src/renderer/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      '@components': path.resolve(__dirname, 'src/renderer/components/'),
      '@pages': path.resolve(__dirname, 'src/renderer/pages/'),
      '@hooks': path.resolve(__dirname, 'src/renderer/hooks/'),
      '@store': path.resolve(__dirname, 'src/renderer/store/'),
      '@core': path.resolve(__dirname, 'src/core/'),
      '@modules': path.resolve(__dirname, 'src/modules/'),
    },
    fallback: {
      'path': false,
      'fs': false,
      'crypto': false,
      'stream': false,
      'util': false,
      'url': false,
      'querystring': false,
      'zlib': false,
      'http': false,
      'https': false,
      'assert': false,
      'os': false,
      'constants': false,
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
    }),
    new webpack.DefinePlugin(envKeys),
  ],
  devServer: {
    port: 3000,
    host: '127.0.0.1',
    hot: true,
    historyApiFallback: true,
    allowedHosts: 'all',
    webSocketServer: 'ws',
    client: {
      overlay: true,
      // Electron-specific WebSocket configuration
      webSocketURL: process.env.NODE_ENV === 'development' ? {
        hostname: '127.0.0.1',
        pathname: '/ws',
        port: 3000,
        protocol: 'ws',
      } : undefined,
      reconnect: 5, // Max retry attempts
      logging: 'error', // Reduce spam
    },
    onBeforeSetupMiddleware: (devServer) => {
      // Add custom middleware for dev server
      devServer.app.use((req, res, next) => {
        // Add CORS headers for Electron
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
      });
    },
  },
  target: 'web',
  externals: {
    'electron': 'commonjs electron',
    'electron-store': 'commonjs electron-store',
  },
};

