define(function(require) {
    var Collection = require('streamhub-sdk/collection');
    var DefaultAnimator = require('streamhub-gallery/animators/animator');
    var CoverflowAnimator = require('streamhub-gallery/animators/coverflow-animator');
    var CarouselAnimator = require('streamhub-gallery/animators/coverflow-animator');
    var View = require('streamhub-gallery');

    return function(el) {
        var collection = new Collection({
            network: "labs-t402.fyre.co",
            environment: "t402.livefyre.com",
            siteId: "303827",
            articleId: 'sh_col_51_1366914813'
        });
        var view = new View({
            el: el,
            aspectRatio: 4/3
        });
        view.switchAnimator(new CoverflowAnimator());
        
        collection.pipe(view);
  
        return view;
    };
});
