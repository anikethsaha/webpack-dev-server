'use strict';

const path = require('path');
const isAbsoluteUrl = require('is-absolute-url');
const defaultTo = require('./defaultTo');

function createConfig(config, argv, { port }) {
  const firstWpOpt = Array.isArray(config) ? config[0] : config;
  const options = firstWpOpt.devServer || {};

  // This updates both config and firstWpOpt
  firstWpOpt.mode = defaultTo(firstWpOpt.mode, 'development');

  Object.keys(argv).map((arg) => {
    switch (arg) {
      case 'host':
        if (argv.host !== 'localhost' || !options.host)
          {options[`${arg}`] = argv.host;}
        break;
      case 'allowedHosts':
        options[`${arg}`] = argv.allowedHosts.split(',');
        break;
      case 'stdin':
        process.stdin.on('end', () => {
          // eslint-disable-next-line no-process-exit
          process.exit(0);
        });
        process.stdin.resume();
        break;
      case 'openPage':
        options.open = true;
        options.openPage = argv.openPage;
        break;
      case 'open':
        options.open = argv.open !== '' ? argv.open : true;
        break;
      case 'color':
        if (!options.stats) {
          options.stats = defaultTo(firstWpOpt.stats, {
            cached: false,
            cachedAssets: false,
          });
        }
        if (
          typeof options.stats === 'object' &&
          typeof options.stats.colors === 'undefined'
        ) {
          options.stats = Object.assign({}, options.stats, {
            colors: argv.color,
          });
        }
        break;
      case 'contentBase':
        options.contentBase = argv.contentBase;

        if (Array.isArray(options.contentBase)) {
          options.contentBase = options.contentBase.map((p) => path.resolve(p));
        } else if (/^[0-9]$/.test(options.contentBase)) {
          options.contentBase = +options.contentBase;
        } else if (!isAbsoluteUrl(String(options.contentBase))) {
          options.contentBase = path.resolve(options.contentBase);
        }
        // It is possible to disable the contentBase by using
        // `--no-content-base`, which results in arg["content-base"] = false
        else if (argv.contentBase === false) {
          options.contentBase = false;
        }

        break;
      default:
        if (typeof options[`${arg}`] !== 'undefined') {
          options[`${arg}`] = argv[arg];
        }
        break;
    }
    return arg;
  });

  if (!options.publicPath) {
    // eslint-disable-next-line
    options.publicPath =
      (firstWpOpt.output && firstWpOpt.output.publicPath) || '';

    if (
      !isAbsoluteUrl(String(options.publicPath)) &&
      options.publicPath[0] !== '/'
    ) {
      options.publicPath = `/${options.publicPath}`;
    }
  }

  if (!options.filename && firstWpOpt.output && firstWpOpt.output.filename) {
    options.filename = firstWpOpt.output && firstWpOpt.output.filename;
  }

  if (!options.watchOptions && firstWpOpt.watchOptions) {
    options.watchOptions = firstWpOpt.watchOptions;
  }

  // TODO https://github.com/webpack/webpack-dev-server/issues/616 (v4)
  // We should prefer CLI arg under config, now we always prefer `hot` from `devServer`
  if (!options.hot) {
    options.hot = argv.hot;
  }

  // TODO https://github.com/webpack/webpack-dev-server/issues/616 (v4)
  // We should prefer CLI arg under config, now we always prefer `hotOnly` from `devServer`
  if (!options.hotOnly) {
    options.hotOnly = argv.hotOnly;
  }

  // TODO https://github.com/webpack/webpack-dev-server/issues/616 (v4)
  // We should prefer CLI arg under config, now we always prefer `clientLogLevel` from `devServer`
  if (!options.clientLogLevel && argv.clientLogLevel) {
    options.clientLogLevel = argv.clientLogLevel;
  }

  if (!options.stats) {
    options.stats = defaultTo(firstWpOpt.stats, {
      cached: false,
      cachedAssets: false,
    });
  }

  // TODO remove in `v4`
  if (!argv.info) {
    options.noInfo = true;
  }

  // TODO remove in `v4`
  if (argv.quiet) {
    options.quiet = true;
  }

  if (options.open && !options.openPage) {
    options.openPage = '';
  }

  // Kind of weird, but ensures prior behavior isn't broken in cases
  // that wouldn't throw errors. E.g. both argv.port and options.port
  // were specified, but since argv.port is 8080, options.port will be
  // tried first instead.
  options.port =
    argv.port === port
      ? defaultTo(options.port, argv.port)
      : defaultTo(argv.port, options.port);
  return options;
}

module.exports = createConfig;
