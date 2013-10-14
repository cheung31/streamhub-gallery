requirejs.config({
  baseUrl: '/',
  paths: {
    jquery: 'lib/jquery/jquery',
	jasmine: 'lib/jasmine/lib/jasmine-core/jasmine',
    'jasmine-html': 'lib/jasmine/lib/jasmine-core/jasmine-html',
    'jasmine-jquery': 'lib/jasmine-jquery/lib/jasmine-jquery',
    text: 'lib/requirejs-text/text',
    hgn: 'lib/requirejs-hogan-plugin/hgn',
    hogan: 'lib/hogan/web/builds/2.0.0/hogan-2.0.0.amd',
    json: 'lib/requirejs-plugins/src/json',
    base64: 'lib/base64/base64',
    'event-emitter': 'lib/event-emitter/src/event-emitter',
    inherits: 'lib/inherits/inherits',
    hammerjs: 'lib/hammerjs/dist/hammer'
  },
  packages: [{
    name: "streamhub-sdk",
    location: "lib/streamhub-sdk/src/"
  },{
    name: "streamhub-sdk/auth",
    location: "lib/streamhub-sdk/src/auth"
  },{
    name: "streamhub-sdk/collection",
    location: "lib/streamhub-sdk/src/collection"
  },{
    name: "streamhub-sdk/content",
    location: "lib/streamhub-sdk/src/content"
  },{
    name: "streamhub-sdk/modal",
    location: "lib/streamhub-sdk/src/modal"
  },{
    name: "streamhub-sdk-tests",
    location: "lib/streamhub-sdk/tests/"
  },{
    name: "stream",
    location: "lib/stream/src"
  },{
	name: "streamhub-gallery",
  	location: "./src"
  },{
    name: 'streamhub-gallery-tests',
    location: './tests/'
  }
  ],
  shim: {
    jasmine: {
      exports: 'jasmine'
    },
    'jasmine-html': {
      deps: ['jasmine'],
      exports: 'jasmine'
    },
    'jasmine-jquery': {
      deps: ['jquery', 'jasmine']
    },
    jquery: {
        exports: '$'
    },
    hammerjs: {
        exports: 'Hammer'
    }
  },
  urlArgs: "_=" +  (new Date()).getTime()
});
