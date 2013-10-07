define([
    'streamhub-sdk/jquery',
    'hgn!streamhub-gallery/css/theme.css',
], function ($, themeCssTemplate) {
    'use strict';

    var Animator = function (view, opts) {
        opts = opts || {};
        this._id = 'animator-' + (new Date()).getTime();
        if (view) {
            this.setView(view);
        }
        this._styleEl = $('<style></style');
    };

    Animator.prototype._transforms = {};
    Animator.prototype._transforms.contentBefore = { transforms: { scale: 0.6 } };
    Animator.prototype._transforms.contentAfter = { transforms: { scale: 0.6 } };
    Animator.prototype._transforms.contentBefore1 = { opacity: 0.7 };
    Animator.prototype._transforms.contentBefore2 = { opacity: 0.3 };
    Animator.prototype._transforms.contentBefore3 = { opacity: 0.1 };
    Animator.prototype._transforms.contentAfter1 = { opacity: 0.7 };
    Animator.prototype._transforms.contentAfter2 = { opacity: 0.3 };
    Animator.prototype._transforms.contentAfter3 = { opacity: 0.1 };

    Animator.prototype.animate = function (opts) {
        this._galleryView.animating = true;
        var newTransforms = this._updateTransforms(opts);
        return newTransforms;
    };

    Animator.prototype._getBeforeTranslateX = function (beforeTranslateX, previousWidth, contentBeforeWidth) {
        return beforeTranslateX - previousWidth - (contentBeforeWidth - previousWidth)/2;
    };

    Animator.prototype._getAfterTranslateX = function (afterTranslateX, previousWidth, contentAfterWidth) {
        return afterTranslateX = afterTranslateX + previousWidth + (contentAfterWidth - previousWidth)/2;
    };

    Animator.prototype._updateTransforms = function (opts) {
        opts = opts || {};

        if (opts.transforms) {
            this._transforms = opts.transforms;
            this._updateStyleEl(opts);
            return $.extend(true, {}, this._transforms);
        }
        
        var adjacentContentEls = this._galleryView.$el.find('.content-container');
        if (!adjacentContentEls.length) {
            return;
        }

        var beforeTranslateX = 0;
        var afterTranslateX = 0;
        var numAdjacentVisible = 3;
        for (var i=0; i < numAdjacentVisible; i++) {
            var adjacentIndex = i+1;

            // Before
            var contentBefore = adjacentContentEls.filter('.content-before-'+adjacentIndex);
            var contentBeforeWidth;
            var previousEl;
            var previousWidth;
            if (contentBefore.length) {
                if (! this._transforms.contentBefore.transforms) {
                    this._transforms.contentBefore.transforms = {};
                } else {
                    this._transforms['contentBefore'+adjacentIndex].transforms = $.extend(
                        this._transforms['contentBefore'+adjacentIndex].transforms || {},
                        this._transforms.contentBefore.transforms);
                }
                contentBeforeWidth = contentBefore[0].getBoundingClientRect().width;
                previousEl = contentBefore.next();
                previousWidth = previousEl[0].getBoundingClientRect().width;
                beforeTranslateX = this._getBeforeTranslateX(beforeTranslateX, previousWidth, contentBeforeWidth, previousWidth);
                this._transforms['contentBefore'+adjacentIndex].transforms.translateX = beforeTranslateX+'px';
            }

            // After
            var contentAfter = adjacentContentEls.filter('.content-after-'+adjacentIndex);
            var contentAfterWidth;
            if (contentAfter.length) {
                if (! this._transforms.contentAfter.transforms) {
                    this._transforms.contentAfter.transforms = {};
                } else {
                    this._transforms['contentAfter'+adjacentIndex].transforms = $.extend(
                        this._transforms['contentAfter'+adjacentIndex].transforms || {},
                        this._transforms.contentAfter.transforms);
                }
                contentAfterWidth = contentAfter[0].getBoundingClientRect().width;
                previousEl = contentAfter.prev();
                previousWidth = previousEl[0].getBoundingClientRect().width;
                afterTranslateX = this._getAfterTranslateX(afterTranslateX, previousWidth, contentAfterWidth);
                this._transforms['contentAfter'+adjacentIndex].transforms.translateX = afterTranslateX+'px';
            }

            if (adjacentIndex == numAdjacentVisible) {
                if (! this._transforms.contentBefore.transforms) {
                    this._transforms.contentBefore.transforms = {};
                }
                if (! this._transforms.contentAfter.transforms) {
                    this._transforms.contentAfter.transforms = {};
                }
                this._transforms.contentBefore.transforms.translateX = beforeTranslateX+'px';
                this._transforms.contentAfter.transforms.translateX = afterTranslateX+'px';
            }

            this._updateStyleEl(opts);
        }

        if (opts.translate === false) {
            return $.extend(true, {}, this._transforms);
        }
        
        this._updateStyleEl(opts);
        return $.extend(true, {}, this._transforms);
    };

    var TRANSFORMATIONS = {
        'translation': ['translateX','translateY','translateZ','translate','translate3d'],
        'rotation': ['rotateX','rotateY','rotateZ','rotate','rotate3d'],
        'skew': ['skewX','skewY','skewZ','skew','skew3d'],
        'scale': ['scaleX','scaleY','scaleZ','scale','scale3d']
    }

    Animator.prototype._buildCssTransform = function () {
        for (var style in this._transforms) {
            var transform = '';
            if (this._transforms.hasOwnProperty(style)) {
                if (! this._transforms[style].transforms) {
                    continue;
                }

                for (var transformType in TRANSFORMATIONS) {
                    for (var i=0; i < TRANSFORMATIONS[transformType].length; i++) {
                        var transformFunc = TRANSFORMATIONS[transformType][i];
                        if (this._transforms[style].transforms[transformFunc]) {
                            transform = transform + transformFunc + '(' + this._transforms[style].transforms[transformFunc] + ') ';
                        }
                    }
                }

                this._transforms[style].transform = transform;

            }
        }
    };

    /**
     * @private
     * Replaces a style element that determines the spacing, and animations when 
     * the gallery changes focus
     */
    Animator.prototype._updateStyleEl = function (opts) {
        opts = opts || {};

        var translate = opts.translate == undefined ? true : opts.translate;

        this._buildCssTransform();

        var styleInnerHtml = themeCssTemplate(this._transforms);
        var matches = styleInnerHtml.match(new RegExp("(\A|\})\s*(?![^ ~>|]*\.*\{)", 'g'));
        for (var i=0; i < matches.length; i++) {
            var idx = styleInnerHtml.indexOf(matches[i]);
            styleInnerHtml = styleInnerHtml.slice(0, idx) + 
                this._id + styleInnerHtml.slice(idx);
        }

        this._styleEl.remove();
        this._styleEl = $('<style></style>').text(styleInnerHtml).appendTo('head');

        this._galleryView.animating = false;
    };

    Animator.prototype._isTranslation = function (transformName) {
        return transformName.indexOf('translate') === -1 ? false : true;
    };

    Animator.prototype.setView = function (view) {
        this._galleryView = view;
    };

    Animator.prototype.destroy = function () {
        this._styleEl.remove();
    };

    return Animator;
});
