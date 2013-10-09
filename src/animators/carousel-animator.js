define([
    'streamhub-gallery/animators/animator',
    'inherits'
], function (Animator, inherits) {
    'use strict';

    var CarouselAnimator = function (view, opts) {
        opts = opts || {};
        opts.numVisible = 2;
        Animator.call(this, view, opts);
    };
    inherits(CarouselAnimator, Animator);

    CarouselAnimator.prototype._transforms = {};
    CarouselAnimator.prototype._transforms.contentBefore = {
        transformOrigin: 'right',
        transforms: {} };
    CarouselAnimator.prototype._transforms.contentAfter = {
        transformOrigin: 'left',
        transforms: {} };
    CarouselAnimator.prototype._transforms.contentBefore1 = {
        transformOrigin: 'right',
        transforms: { rotateY: '-30deg' },
        opacity: 0.7 };
    CarouselAnimator.prototype._transforms.contentBefore2 = {
        transformOrigin: 'right',
        transforms: { rotateY: '-52deg', scale: 0.6 },
        opacity: 0.3 };
    CarouselAnimator.prototype._transforms.contentAfter1 = {
        transformOrigin: 'left',
        transforms: { rotateY: '30deg' },
        opacity: 0.7 };
    CarouselAnimator.prototype._transforms.contentAfter2 = {
        transformOrigin: 'left',
        transforms: { rotateY: '52deg', scale: 0.6 },
        opacity: 0.3 };

    CarouselAnimator.prototype._computeBeforeTranslateX = function (beforeTranslateX, previousWidth, contentBeforeWidth) {
        return Animator.prototype._computeBeforeTranslateX.apply(this, arguments) - 25;
    };

    CarouselAnimator.prototype._computeAfterTranslateX = function (afterTranslateX, previousWidth, contentAfterWidth) {
        return Animator.prototype._computeAfterTranslateX.apply(this, arguments) + 25;
    };

    CarouselAnimator.prototype._computeNonVisibleTranslations = function () {
        Animator.prototype._computeNonVisibleTranslations.call(this);

        this._targetTransforms.contentBefore.transforms.translateX = parseInt(this._targetTransforms.contentBefore.transforms.translateX) + 50 + 'px';
        this._targetTransforms.contentAfter.transforms.translateX = parseInt(this._targetTransforms.contentAfter.transforms.translateX) - 50 + 'px';
    }

    return CarouselAnimator;
});
