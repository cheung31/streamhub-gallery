define([
    'streamhub-gallery/animators/animator',
    'inherits'
], function (Animator, inherits) {
    'use strict';

    var CoverflowAnimator = function (view, opts) {
        opts = opts || {};
        Animator.apply(this, arguments);
    };
    inherits(CoverflowAnimator, Animator);

    CoverflowAnimator.prototype._transforms = {};
    CoverflowAnimator.prototype._transforms.contentBefore = { transforms: { scale: 0.6, rotateY: '85deg' } };
    CoverflowAnimator.prototype._transforms.contentAfter = { transforms: { scale: 0.6, rotateY: '-85deg' } };
    CoverflowAnimator.prototype._transforms.contentBefore1 = { opacity: 0.7 };
    CoverflowAnimator.prototype._transforms.contentBefore2 = { opacity: 0.3 };
    CoverflowAnimator.prototype._transforms.contentBefore3 = { opacity: 0.1 };
    CoverflowAnimator.prototype._transforms.contentAfter1 =  { opacity: 0.7 };
    CoverflowAnimator.prototype._transforms.contentAfter2 =  { opacity: 0.3 };
    CoverflowAnimator.prototype._transforms.contentAfter3 =  { opacity: 0.1 };

    CoverflowAnimator.prototype._computeNonVisibleTranslations = function () {
        if (! this._targetTransforms.contentBefore.transforms) {
            this._targetTransforms.contentBefore.transforms = {};
        }
        if (! this._targetTransforms.contentAfter.transforms) {
            this._targetTransforms.contentAfter.transforms = {};
        }
        this._targetTransforms.contentBefore.transforms = $.extend({}, this._targetTransforms['contentBefore'+this._numVisible].transforms);
        this._targetTransforms.contentAfter.transforms = $.extend({}, this._targetTransforms['contentAfter'+this._numVisible].transforms);
    };

    return CoverflowAnimator;
});
