define([
    'streamhub-sdk/jquery',
    'hgn!streamhub-gallery/css/theme.css',
], function ($, themeCssTemplate) {
    'use strict';

    var TRANSFORMATIONS = {
        'translation': ['translateX','translateY','translateZ','translate','translate3d'],
        'rotation': ['rotateX','rotateY','rotateZ','rotate','rotate3d'],
        'skew': ['skewX','skewY','skewZ','skew','skew3d'],
        'scale': ['scaleX','scaleY','scaleZ','scale','scale3d']
    };

    /**
     * Manages updates to the DOM to facilitate animating of 
     * visible content when jumping to content items
     * @param view {GalleryView} An instance of GalleryView to perform animations upon
     * @param opts {Object} A set of options to configure the Animatior with
     * @param opts.numVisible {Number} The number of adjacent content items visible. If specified overrides the number of visible content items specified by the GalleryView instance
     * @exports streamhub-gallery/animators/animator
     * @constructor
     */
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
    Animator.prototype._transforms.contentBefore = { transforms: { scale: 0.85 } };
    Animator.prototype._transforms.contentAfter = { transforms: { scale: 0.85 } };

    /**
     * Set the GalleryView instance for the animator to operate upon
     */
    Animator.prototype.setView = function (view) {
        this._galleryView = view;
        this._numVisible = this._numVisible || view._numVisible;
        this._updateDefaultTransforms();
    };


    /**
     * Starts the animation flow
     * @param opts {Object}
     * @param opts.transform {Object} The set of transforms to apply on visible items
     * @param opts.translate {Boolean} Whether to exclude translate functions from the transforms to be applied
     * @param opts.seek {Object} Perform the transition with 0s duration.
     */
    Animator.prototype.animate = function (opts) {
        opts = opts || {};
        var newTransforms = this._updateTransforms(opts);
        return newTransforms;
    };


    /**
     * @private
     * A helper method to set z-index and opacity on
     * adjacent visible content.
     */ 
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


    /**
     * @private
     * A helper method that returns a copy of the 
     * ._transforms template object.
     */ 
    Animator.prototype._getDefaultTransforms = function () {
        return $.extend(true, {}, this._transforms);
    };


    /**
     * @private
     * Updates the transform function values for all visible adjacent content
     * in preparation for animating to the target state. Then applies
     * the computed transform values as CSS in a <style> element to be 
     * animated via CSS transition.
     * @param opts {Object}
     * @param opts.transform {Object} The set of transforms to apply on visible items
     * @param opts.translate {Boolean} Whether to exclude translate functions from the transforms to be applied
     * @param opts.seek {Object} Perform the transition with 0s duration.
     */ 
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


    /**
     * @private
     * A helper method to determine the translation relative to its adjacent 
     * content for content items preceding the active content
     */ 
    Animator.prototype._computeBeforeTranslateX = function (beforeTranslateX, previousWidth, contentBeforeWidth) {
        return beforeTranslateX - previousWidth - (contentBeforeWidth - previousWidth)/2;
    };


    /**
     * @private
     * A helper method to determine the translation relative to its adjacent
     * content for content items following the active content
     */ 
    Animator.prototype._computeAfterTranslateX = function (afterTranslateX, previousWidth, contentAfterWidth) {
        return afterTranslateX = afterTranslateX + previousWidth + (contentAfterWidth - previousWidth)/2;
    };


    /**
     * @private
     * Determines the translations for non-visible content.
     * The translation should be computed in a way so that transitioning from non-visible to
     * visible state feels continuous.
     */ 
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


    /**
     * @private
     * Takes the structured transforms object and sets a string of the 
     * CSS transform value for each visible class name's specified transform
     * as seen in the ._targetTransforms property
     */ 
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
     * @param opts {Object}
     * @param opts.ignoreTransformOrigin {Boolean}
     * @param opts.translate {Boolean}
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


    /**
     * @private
     * Check whether a transform function is a translation
     * @return {Boolean} Whether the transform function is a translation
     */
    Animator.prototype._isTranslation = function (transformName) {
        return transformName.indexOf('translate') === -1 ? false : true;
    };


    /**
     * @private
     * Remove anything appended to the DOM by the animator for animation purposes
     */
    Animator.prototype.destroy = function () {
        this._styleEl.remove();
    };

    return Animator;
});
