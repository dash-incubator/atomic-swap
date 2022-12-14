const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const glob = require('glob');
const webpack = require('webpack');


const config = ({ directory, entry, filename, library, output, production }) => {
    let optimization = {
            usedExports: false
        };

    filename = filename || 'app';
    production = production == 'true' ? true : false;

    if (directory) {
        entry = glob.sync(`${directory}/{,!(node_modules)/**/}!(webpack)*!(.d).{ts,js}`);
    }

    if (!production) {
        optimization = {
            mangleWasmImports: false,
            minimize: false,
            usedExports: false
        };
    }

    return {
        entry: {
            [(filename || 'app') + (production ? '.min' : '')]: entry
        },
        mode: (production ? 'production' : 'development'),
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                }
            ]
        },
        optimization,
        output: {
            // fixes ReferenceError: window is not defined
            globalObject: "(typeof self !== 'undefined' ? self : this)",
            library: library || filename,
            path: output,
        },
        plugins: [
            new NodePolyfillPlugin(),
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
                // process: 'process/browser'
            })
        ],
        resolve: {
            extensions: ['.js', '.ts', '.tsx'],
            fallback: {
                fs: false
            },
            plugins: [
                new TsconfigPathsPlugin()
            ]
        }
    };
};


module.exports = config;
