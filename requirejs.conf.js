requirejs.config({
  paths: {
    jquery: 'lib/jquery/jquery',
	jasmine: 'lib/jasmine/lib/jasmine-core/jasmine',
    'jasmine-html': 'lib/jasmine/lib/jasmine-core/jasmine-html',
    'jasmine-jquery': 'lib/jasmine-jquery/lib/jasmine-jquery',
    text: 'lib/requirejs-text/text',
    hgn: 'lib/requirejs-hogan-plugin/hgn',
    hogan: 'lib/hogan/web/builds/2.0.0/hogan-2.0.0.amd',
    base64: 'lib/base64/base64',
    bespoke: 'lib/bespoke/src/bespoke'
  },
  packages: [{
    name: 'streamhub-sdk',
    location: 'lib/streamhub-sdk/src'
  },
  {
	name: "streamhub-gallery",
  	location: "./src"
  },{
    name: 'streamhub-gallery-tests',
    location: './tests/'
  }
  ],
  shim: {
    bespoke: {
      exports: 'bespoke'
    },
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
    }
  },
  urlArgs: "_=" +  (new Date()).getTime()
});
