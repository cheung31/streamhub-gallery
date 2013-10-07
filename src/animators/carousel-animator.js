define([
    'streamhub-gallery/animators/animator',
    'inherits'
], function (Animator, inherits) {
    'use strict';

    var CarouselAnimator = function (view, opts) {
        opts = opts || {};
        Animator.apply(this, arguments);
    };
    inherits(CarouselAnimator, Animator);

    CarouselAnimator.prototype._transforms = {};
    CarouselAnimator.prototype._transforms.contentBefore = { transforms: {} };
    CarouselAnimator.prototype._transforms.contentAfter = { transforms: {} };
    CarouselAnimator.prototype._transforms.contentBefore1 = {
        transformOrigin: 'right',
        transforms: { rotateY: '-30deg' },
        opacity: 0.7 };
    CarouselAnimator.prototype._transforms.contentBefore2 = {
        transformOrigin: 'right',
        transforms: { rotateY: '-52deg', scale: 0.7 },
        opacity: 0.3 };
    CarouselAnimator.prototype._transforms.contentBefore3 = {
        transformOrigin: 'right',
        transforms: { rotateY: '122deg', scale: 0.3 },
        opacity: 0.1 };
    CarouselAnimator.prototype._transforms.contentAfter1 = {
        transformOrigin: 'left',
        transforms: { rotateY: '30deg' },
        opacity: 0.7 };
    CarouselAnimator.prototype._transforms.contentAfter2 = {
        transformOrigin: 'left',
        transforms: { rotateY: '52deg', scale: 0.7 },
        opacity: 0.3 };
    CarouselAnimator.prototype._transforms.contentAfter3 = {
        transformOrigin: 'left',
        transforms: { rotateY: '-122deg', scale: 0.3 },
        opacity: 0.1 };

    CarouselAnimator.prototype._getBeforeTranslateX = function (beforeTranslateX, previousWidth, contentBeforeWidth) {
        return beforeTranslateX - previousWidth;
    };

    CarouselAnimator.prototype._getAfterTranslateX = function (afterTranslateX, previousWidth, contentAfterWidth) {
        return  afterTranslateX + previousWidth;
    };

    return CarouselAnimator;
});
