/*
 * 放大镜模块
 * @date:2015-07-15
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/magnifier', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

    var Magnifier = function ($el, options) {
        this.options = $.extend({}, {
            offset: 10,
            width: 400,
            height:400,
            selector: {
                width: 150,
                height: 150
            }
        }, options);
        this.$el = $el;
        this._isCreate = false;
        this.init();
    };

    Magnifier.prototype.init = function () {
        this.create();
        this.watch();
    };

    Magnifier.prototype.watch = function () {
        var self = this;

        this.$el.on('mousemove', function (e) {
            self.$view.show();
            self.$selector.show();
            self.setPosition(e);
        }).on('mouseleave', function (e) {
            self.$view.hide();
            self.$selector.hide();
        });
    };

    Magnifier.prototype.create = function () {

        this.$imgBox = this.$el.find('.k-magnifier-imgbox').css({
            width: this.options.width,
            height: this.options.height
        });

        this.$view = $('<div class="k-magnifier-view"><img src="../images/big.jpg" /></div>')
            .appendTo(this.$el)
            .css({
                width: this.options.width,
                height: this.options.height,
                left: this.$imgBox.position().left + this.options.width + this.options.offset,
                top:this.$imgBox.position().top
            });
            

        this.$viewImg = this.$view.find('img');

        this.$selector = $('<div class="k-magnifier-selector"></div>')
            .appendTo(this.$imgBox)
            .css({
                width: this.options.selector.width - 2,
                height: this.options.selector.height - 2
            });
    };

    Magnifier.prototype.setPosition = function (e) {
        var x = e.pageX,
            y = e.pageY,
            left = x - this.$el.offset().left,
            top = y - this.$el.offset().top,
            maxLeft = this.$el.width() - this.options.selector.width,
            maxTop = this.$el.height() - this.options.selector.height,
            percentX, percentY;

        left = left - this.options.selector.width / 2;
        top = top - this.options.selector.height / 2;


        if (left < 0) {
            left = 0;
        } else if (left > maxLeft) {
            left = maxLeft;
        }

        if (top < 0) {
            top = 0;
        } else if (top > maxTop) {
            top = maxTop;
        }

        percentX = left / (this.$el.width() - this.options.selector.width);
        percentY = top / (this.$el.height() - this.options.selector.height);


        this.$selector.css({
            left: left,
            top: top
        });


        this.$viewImg.css({
            width: this.options.width/this.options.selector.width*this.options.width,
            height: this.options.height / this.options.selector.height * this.options.height,
            left: -percentX * (this.$viewImg.width() - this.$view.width()),
            top: -percentY * (this.$viewImg.height() - this.$view.height())
        })
    };


    return Magnifier;
});
