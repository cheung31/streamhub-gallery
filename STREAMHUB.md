# streamhub-gallery

streamhub-gallery is a [StreamHub App](http://apps.livefyre.com) that displays social content in a horizontal CoverFlow-like gallery.

Classic Gallery
![Gallery View](http://i.imgur.com/9VoyWji.png)

## Getting Started

The quickest way to use streamhub-gallery is to use the built version hosted on Livefyre's CDN.

### Dependencies

streamhub-gallery depends on [streamhub-sdk](https://github.com/livefyre/streamhub-sdk). Ensure it's been included in your page.

	<script src="http://cdn.livefyre.com/libs/sdk/v2.0.0/streamhub-sdk.min.gz.js"></script>

Include streamhub-gallery too.

	<script src="http://livefyre-cdn-dev.s3.amazonaws.com/libs/apps/cheung31/streamhub-gallery/v1.0.0/streamhub-gallery.min.js"></script>
	
Optionally, include some reasonable default CSS rules for StreamHub Content. This stylesheet is provided by the StreamHub SDK.

    <link rel="stylesheet" href="http://cdn.livefyre.com/libs/sdk/v2.0.0/streamhub-sdk.gz.css" />

### Usage

1. Require streamhub-sdk and streamhub-gallery

        var GalleryView = Livefyre.require('streamhub-gallery');
    
1. Now let's provide a Livefyre Collection to the ```GalleryView```. This is the source of the social content we want to display

		var Collection = Livefyre.require('streamhub-sdk/collection');
        var collection = new Collection({
            network: "labs.fyre.co",
            siteId: 315833,
            articleId: 'example'
        });
        
1. Create a GalleryView, passing the DOMElement to render it in (```el``` option).

        var view = new GalleryView({
        	el: document.getElementById("myGallery")
    	});
    
1. Pipe the collection's content into the ```GalleryView```

        collection.pipe(view);

### Changing Themes

The ```GalleryView``` constructor accepts the ```animator``` option. By passing in an instance of a ```Animator```, the Gallery view can be customized to visualize a stream to your liking. There are two animators included, ```streamhub-gallery/animators/coverflow-animator``` and ```streamhub-gallery/animators/carousel-animator```.

        var CoverflowAnimator = Livefyre.require('streamhub-gallery/animators/coverflow-animator');
        var view = new GalleryView({
        	el: document.getElementById("myGallery"),
        	animator: new CoverflowAnimator()
    	});


Coverflow
![Coverflow Gallery View](http://i.imgur.com/AC8dxxW.png)

### Number of Visible Content Slides

By default, 3 content items will appear to before/after the focused content item. If you wish to adjust the number of visible adjacent items, specifiy the ```numVisible``` option for the ```GalleryView``` constructor.

    var view = new GalleryView({
        el: document.getElementById("myGallery"),
        numVisible: 8 // Eight visible items before/after the active content view
    });

