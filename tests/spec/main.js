define([
    'streamhub-gallery',
    'streamhub-sdk/content',
    'jasmine',
    'jasmine-jquery'
], function (GalleryView, Content) {

    describe('A GalleryView', function () {

        // construction behavior
        describe('can be constructed', function() {
            it ("with no options", function () {
                var view = new GalleryView();
                expect(view).toBeDefined();
            });

            it("accepts the opts.modal option", function () {
                var view = new GalleryView({ modal: true });
                expect(view).toBeDefined();
            });

            it("renders itself", function () {
                spyOn(GalleryView.prototype, 'render');
                var view = new GalleryView({ modal: true });
                expect(GalleryView.prototype.render).toHaveBeenCalled();
            });
        });

        // setElement
        describe('can set the HTML element in which to be rendered with the #setElement method', function () {

            var view,
                myEl;

            beforeEach(function () {
                view = new GalleryView();
                myEl = document.createElement('div');
                myEl.setAttribute('id', 'mycooldiv');
                view.setElement(myEl);
            });

            it('.el is the element that we are setting', function () {
                expect(view.el).toBe(myEl);
            });

            it('has an event listener on the #focusContent.hub event', function () {
                expect($(view.el)).toHandle('focusContent.hub');
            });

            it('has an event listener on the #click event', function () {
                expect($(view.el)).toHandle('click');
            });
        });

        // render
        describe('renders the view', function () {
            var view;
            view = new GalleryView();

            it('appends a child element with class "streamhub-gallery-view"', function () {
                expect($(view.el).find('.streamhub-gallery-view')).toHaveClass('streamhub-gallery-view');
            });

            it('appends a child element with class "streamhub-gallery-view-notification"', function () {
                expect($(view.el).find('.streamhub-gallery-view-notification')).toHaveClass('streamhub-gallery-view-notification');
            });
        });

        // add
        describe('can have content items added to it', function () {

            var view,
                myEl,
                content = new Content({ body: "this is some dude's comment" });

            beforeEach(function () {
                view = new GalleryView();
            });

            it('sets the _activeContentView when the first content item is added to the Gallery View', function () {
                view.write(content);
                expect(view._activeContentView).toBeDefined();
            });

            it('calls the #_insert method to attach the content view into the DOM', function () {
                spyOn(view, '_insert');
                view.write(content);
                expect(view._insert).toHaveBeenCalled();
            });

            describe('#_insert', function () {

                var view,
                    myEl,
                    content = new Content({ body: "this is some dude's comment" });

                beforeEach(function () {
                    view = new GalleryView();
                });

                it('calls #_focus', function () {
                    spyOn(view, '_focus');
                    view.write(content);
                    expect(view._focus).toHaveBeenCalled();
                });

                it('calls ._animator#animate', function () {
                    spyOn(view._animator, 'animate');
                    view.write(content);
                    expect(view._animator.animate).toHaveBeenCalled();
                });
            });
        });

        // focus a content item (e.g. to shift the active content item)
        describe('can focus a content item', function () {

            var view,
                myEl,
                content = new Content({ body: "this is some dude's comment" });

            beforeEach(function () {
                view = new GalleryView();
                view.write(content);
            });

            it('adds the "content-active" class name to the focused content view\'s parent element', function () {
                view._focus();
                expect($(view._activeContentView.el).parent()).toHaveClass('content-active');
            });

            it('adds "content-before" classes to previous siblings', function () {
                var content1 = new Content();
                view.write(content1);
                var content2 = new Content();
                view.write(content2);
                var content3 = new Content();
                view.write(content3);

                view._focus(view.views[view.views.length-1]);
                expect($(view.views[0].el).parent()).toHaveClass('content-before');
                expect($(view.views[1].el).parent()).toHaveClass('content-before');
                expect($(view.views[2].el).parent()).toHaveClass('content-before');
            });

            it('adds "content-after" classes to next siblings', function () {
                var content1 = new Content();
                view.write(content1);
                var content2 = new Content();
                view.write(content2);
                var content3 = new Content();
                view.write(content3);

                view._focus(view.views[0]);
                expect($(view.views[1].el).parent()).toHaveClass('content-after');
                expect($(view.views[2].el).parent()).toHaveClass('content-after');
                expect($(view.views[3].el).parent()).toHaveClass('content-after');
            });
        });

        // jumpTo
        describe('can jump to a particular content item with an animation', function () {

            var view,
                myEl,
                content1 = new Content({ body: "this is some dude's comment" }),
                content2 = new Content({ body: "this is some other dude's comment" });

            beforeEach(function () {
                view = new GalleryView();
                view.write(content1);
                view.write(content2);
            });
        });

        // Notifications of newly streamed content
        describe('can notify user of newly streamed content', function () {
            var view,
                myEl,
                content1 = new Content({ body: "this is some dude's comment" }),
                content2 = new Content({ body: "this is some other dude's comment" });

            beforeEach(function () {
                view = new GalleryView();
                view.write(content1);
            });

            it('calls #_showNewNotification', function () {
                spyOn(view, '_showNewNotification');
                view.write(content2);
                expect(view._showNewNotification).toHaveBeenCalled();
                expect(view._newContentCount).toBe(1);
            });
        });

        // Resize
        describe('can adjust to window resize', function () {

            var view;

            beforeEach(function () {
                view = new GalleryView();
            });

            it('calls #_handleResize', function () {
                spyOn(view, '_handleResize');
                $(window).trigger('resize');
                expect(view._handleResize).toHaveBeenCalled();
            });

            describe('#_handleResize', function () {

                var view,
                    content = new Content({ body: "this is some dude's comment" });

                beforeEach(function () {
                    view = new GalleryView();
                });

                it('calls #_adjustContentSize', function () {
                    spyOn(view, '_adjustContentSize');
                    $(window).trigger('resize');
                    expect(view._adjustContentSize).toHaveBeenCalled();
                });

                it('calls ._animator#animate', function ()  {
                    spyOn(view._animator, 'animate');
                    $(window).trigger('resize');
                    expect(view._animator.animate).toHaveBeenCalled();
                });
            });
        });
    });
 
});
