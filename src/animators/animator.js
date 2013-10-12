define([
    'streamhub-sdk/jquery',
    'hgn!streamhub-gallery/css/theme.css',
], function ($, themeCssTemplate) {
    'use strict';

    var Animator = function (view, opts) {
        opts = opts || {};
        this._numVisible = opts.numVisible;
        this._id = 'animator-' + (new Date()).getTime();
        if (view) {
            this.setView(view);
        }
        this._styleEl = $('<style></style');
    };

    Animator.prototype._transforms = {};
    Animator.prototype._transforms.contentBefore = { transforms: { scale: 0.75 } };
    Animator.prototype._transforms.contentAfter = { transforms: { scale: 0.75 } };

    Animator.prototype.animate = function (opts) {
        opts = opts || {};
        var newTransforms = this._updateTransforms(opts);
        return newTransforms;
    };

    Animator.prototype._computeBeforeTranslateX = function (beforeTranslateX, previousWidth, contentBeforeWidth) {
        return beforeTranslateX - previousWidth - (contentBeforeWidth - previousWidth)/2;
    };

    Animator.prototype._computeAfterTranslateX = function (afterTranslateX, previousWidth, contentAfterWidth) {
        return afterTranslateX = afterTranslateX + previousWidth + (contentAfterWidth - previousWidth)/2;
    };

    Animator.prototype._computeNonVisibleTranslations = function (opts) {
        opts = opts || {};
        if (! this._targetTransforms.contentBefore.transforms) {
            this._targetTransforms.contentBefore.transforms = {};
        }
        if (! this._targetTransforms.contentAfter.transforms) {
            this._targetTransforms.contentAfter.transforms = {};
        }
        this._targetTransforms.contentBefore.transforms = $.extend({}, this._targetTransforms['contentBefore'+this._numVisible].transforms);
        this._targetTransforms.contentAfter.transforms = $.extend({}, this._targetTransforms['contentAfter'+this._numVisible].transforms);

        if (opts.beforeTranslateX) {
            this._targetTransforms.contentBefore.transforms.translateX = parseInt(this._targetTransforms.contentBefore.transforms.translateX) + opts.beforeTranslateX + 'px';
        }
        if (opts.afterTranslateX) {
            this._targetTransforms.contentAfter.transforms.translateX = parseInt(this._targetTransforms.contentAfter.transforms.translateX) + opts.afterTranslateX + 'px';
        }
    };

    Animator.prototype._updateDefaultTransforms = function () {
        // Set opacity on adjacent
        var opacityStep = 1 / this._numVisible;
        var opacity = 1;
        var zIndex = this._numVisible;
        for (var i=0; i < this._numVisible; i++) {
            var adjacentIndex = i+1;
            opacity -= opacityStep;
            zIndex -= 1;

            if ( ! this._transforms['contentBefore'+adjacentIndex]) {
                this._transforms['contentBefore'+adjacentIndex] = {};
            }
            this._transforms['contentBefore'+adjacentIndex].opacity = opacity;
            this._transforms['contentBefore'+adjacentIndex].zIndex = zIndex;

            if ( ! this._transforms['contentAfter'+adjacentIndex]) {
                this._transforms['contentAfter'+adjacentIndex] = {};
            }
            this._transforms['contentAfter'+adjacentIndex].opacity = opacity;
            this._transforms['contentAfter'+adjacentIndex].zIndex = zIndex;
        }
    };

    Animator.prototype._getDefaultTransforms = function () {
        return $.extend(true, {}, this._transforms);
    };

    Animator.prototype._updateTransforms = function (opts) {
        opts = opts || {};

        if (opts.transforms) {
            this._targetTransforms = opts.transforms;
            this._updateStyleEl(opts);
            return $.extend(true, {}, this._targetTransforms);
        }
        
        var adjacentContentEls = this._galleryView.$el.find('.content-container');
        if (!adjacentContentEls.length) {
            return;
        }

        // Do not animate while computing translation spacing
        this._galleryView.$el.removeClass('animate');
        this._targetTransforms = this._getDefaultTransforms();
        // Do not apply transform-origin while computing translation spacing
        opts.ignoreTransformOrigin = true;
        this._updateStyleEl(opts);

        var beforeTranslateX = 0;
        var afterTranslateX = 0;
        var numAdjacentVisible = this._numVisible;
        for (var i=0; i < numAdjacentVisible; i++) {
            var adjacentIndex = i+1;

            // Before
            var contentBefore = adjacentContentEls.filter('.content-before-'+adjacentIndex);
            var contentBeforeWidth;
            var previousEl;
            var previousWidth;
            if (contentBefore.length) {
                if (! this._targetTransforms.contentBefore.transforms) {
                    this._targetTransforms.contentBefore.transforms = {};
                } else {
                    this._targetTransforms['contentBefore'+adjacentIndex].transforms = $.extend(
                        this._targetTransforms['contentBefore'+adjacentIndex].transforms || {},
                        this._targetTransforms.contentBefore.transforms);
                }
                contentBeforeWidth = contentBefore[0].getBoundingClientRect().width;
                previousEl = contentBefore.next();
                previousWidth = previousEl[0].getBoundingClientRect().width;
                beforeTranslateX = this._computeBeforeTranslateX(beforeTranslateX, previousWidth, contentBeforeWidth, previousWidth);
                this._targetTransforms['contentBefore'+adjacentIndex].transforms.translateX = beforeTranslateX+'px';
            }

            // After
            var contentAfter = adjacentContentEls.filter('.content-after-'+adjacentIndex);
            var contentAfterWidth;
            if (contentAfter.length) {
                if (! this._targetTransforms.contentAfter.transforms) {
                    this._targetTransforms.contentAfter.transforms = {};
                } else {
                    this._targetTransforms['contentAfter'+adjacentIndex].transforms = $.extend(
                        this._targetTransforms['contentAfter'+adjacentIndex].transforms || {},
                        this._targetTransforms.contentAfter.transforms);
                }
                contentAfterWidth = contentAfter[0].getBoundingClientRect().width;
                previousEl = contentAfter.prev();
                previousWidth = previousEl[0].getBoundingClientRect().width;
                afterTranslateX = this._computeAfterTranslateX(afterTranslateX, previousWidth, contentAfterWidth);
                this._targetTransforms['contentAfter'+adjacentIndex].transforms.translateX = afterTranslateX+'px';
            }
            
            if (adjacentIndex === this._numVisible) {
                beforeTranslateX = beforeTranslateX + contentBeforeWidth;
                afterTranslateX = afterTranslateX + contentAfterWidth;
                this._computeNonVisibleTranslations({
                    beforeTranslateX: beforeTranslateX,
                    afterTranslateX: afterTranslateX
                });
            }

            this._galleryView.$el.removeClass('animate');
            this._updateStyleEl(opts);
        }

        if (opts.translate === false) {
            return $.extend(true, {}, this._targetTransforms);
        }
       
        // Check whether animating is required when applying computed transformations
        if (opts.seek !== false) {
            this._galleryView.$el.addClass('animate');
        }
        // If transformOrigin is specified in #_transform, respect it
        opts.ignoreTransformOrigin = false;
        // Apply computed transformations
        this._updateStyleEl(opts);
        return $.extend(true, {}, this._targetTransforms);
    };

    var TRANSFORMATIONS = {
        'translation': ['translateX','translateY','translateZ','translate','translate3d'],
        'rotation': ['rotateX','rotateY','rotateZ','rotate','rotate3d'],
        'skew': ['skewX','skewY','skewZ','skew','skew3d'],
        'scale': ['scaleX','scaleY','scaleZ','scale','scale3d']
    }

    Animator.prototype._buildCssTransform = function () {
        for (var style in this._targetTransforms) {
            var transform = '';
            if (this._targetTransforms.hasOwnProperty(style)) {
                if (! this._targetTransforms[style].transforms) {
                    continue;
                }

                for (var transformType in TRANSFORMATIONS) {
                    for (var i=0; i < TRANSFORMATIONS[transformType].length; i++) {
                        var transformFunc = TRANSFORMATIONS[transformType][i];
                        if (this._targetTransforms[style].transforms[transformFunc]) {
                            transform = transform + transformFunc + '(' + this._targetTransforms[style].transforms[transformFunc] + ') ';
                        }
                    }
                }

                this._targetTransforms[style].transform = transform;
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

        this._targetTransforms.ignoreTransformOrigin = opts.ignoreTransformOrigin;
        if (this._galleryView._forward) {
            if (this._targetTransforms.contentAfter1.transformOrigin) {
                this._targetTransforms.contentActive = {};
                this._targetTransforms.contentActive.transformOrigin = this._targetTransforms.contentAfter1.transformOrigin;
            }
        } else {
            if (this._targetTransforms.contentBefore1.transformOrigin) {
                this._targetTransforms.contentActive = {};
                this._targetTransforms.contentActive.transformOrigin = this._targetTransforms.contentBefore1.transformOrigin;
            }
        }

        var styleInnerHtml = '';
        for (var t in this._targetTransforms) {
            if (this._targetTransforms.hasOwnProperty(t)) {
                styleInnerHtml += '.'+this._galleryView.galleryListViewClassName + ' .' + t.replace(/([A-Z0-9])/g, function($1){return "-"+$1.toLowerCase();});
                styleInnerHtml += '{' + themeCssTemplate(this._targetTransforms[t]);
                styleInnerHtml += '} ';
            }
        }

        var matches = styleInnerHtml.match(new RegExp("(\A|\})\s*(?![^ ~>|]*\.*\{)", 'g'));
        for (var i=0; i < matches.length; i++) {
            var idx = styleInnerHtml.indexOf(matches[i]);
            styleInnerHtml = styleInnerHtml.slice(0, idx) + 
                this._id + styleInnerHtml.slice(idx);
        }

        this._styleEl.remove();
        this._styleEl = $('<style></style>').text(styleInnerHtml).appendTo('head');
    };

    Animator.prototype._isTranslation = function (transformName) {
        return transformName.indexOf('translate') === -1 ? false : true;
    };

    Animator.prototype.setView = function (view) {
        this._galleryView = view;
        this._numVisible = this._numVisible || view._numVisible;
        this._updateDefaultTransforms();
    };

    Animator.prototype.destroy = function () {
        this._styleEl.remove();
    };

    return Animator;
});
