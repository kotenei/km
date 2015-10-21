/*
 * 缩放模块
 * @date:2015-08-21
 * @author:kotenei(kotenei@qq.com)
 */
define('km/resizable', ['jquery'], function ($) {

    var $cover = $('<div class="k-resizable-cover"></div>').appendTo(document.body);

    var util = {
        getPosition: function ($cur, $target) {

            var curOffset = $cur.offset(),
                targetOffset = $target.offset();

            return {
                left: curOffset.left - targetOffset.left,
                top: curOffset.top - targetOffset.top,
                offsetLeft: curOffset.left,
                offsetTop: curOffset.top
            };
        },
        getOffsetParent: function ($cur, $target) {
            var isRoot = true;
            var $parent = $cur.parent();

            var info = {
                isRoot: false,
                left: 0,
                top: 0,
                pLeft: 0,
                pTop: 0,
                $el: null
            };

            var offset, position;

            while ($parent[0] != $target[0]) {
                position = $parent.css('position');
                if (position == 'relative' || position == 'absolute') {
                    info.left = $parent.offset().left;
                    info.top = $parent.offset().top;
                    info.pLeft = info.left - $target.offset().left;
                    info.pTop = info.top - $target.offset().top;
                    info.$el = $parent;
                    info.isRoot = true;
                    return info;
                }
                $parent = $parent.parent();
            }

            return info;
        }
    };

    /**
     * 缩放类
     * @param {JQuery} $elm - dom
     * @param {Object} options - 参数
     */
    var Resizable = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            $range: this.$elm.parent(),
            minBar: false,
            scale: false,
            cover: true,
            minWidth: 100,
            minHeight: 100,
            border: {
                left: true,
                top: true,
                right: true,
                bottom: true
            }
        }, options);

        //原来坐标
        this.originalCoord = { x: 0, y: 0 };
        //鼠标相对拖动层偏移值
        this.offset = { x: 0, y: 0 };
        //缩放参数
        this.resizeParams = { left: 0, top: 0, width: 0, height: 0, ratio: 1, type: 'bottom' };

        this.moving = false;
        this.minWidth = this.options.minWidth;
        this.minHeight = this.options.minHeight;

        this._event = {
            resize: $.noop,
            stop: $.noop
        };

        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Resizable.prototype.init = function () {

        var html = [];
        html.push('<div class="k-resizable-handle k-resizable-handle-left" role="resizable" data-type="left"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-top" role="resizable" data-type="top"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-right" role="resizable" data-type="right"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-bottom" role="resizable" data-type="bottom"></div>');
        html.push('<div class="k-resizable-handle-minbar" role="resizable" data-type="bottomRight"></div>');
        this.$elm.addClass('k-resizable-container').append(html.join(''));
        this.$leftHandle = this.$elm.find('.k-resizable-handle-left');
        this.$topHandle = this.$elm.find('.k-resizable-handle-top');
        this.$rightHandle = this.$elm.find('.k-resizable-handle-right');
        this.$bottomHandle = this.$elm.find('.k-resizable-handle-bottom');
        this.$minbar = this.$elm.find('.k-resizable-handle-minbar');

        this.$range = this.options.$range.css("position", "relative");
        this.$doc = $(document);
        this.$win = $(window);
        this.$body = $(document.body);

        if (this.options.border.left) {
            this.$leftHandle.show();
        }

        if (this.options.border.top) {
            this.$topHandle.show();
        }

        if (this.options.border.right) {
            this.$rightHandle.show();
        }

        if (this.options.border.bottom) {
            this.$bottomHandle.show();
        }

        if (this.options.minBar) {
            this.$minbar.show();
        }

        this.watch();
    };

    /**
     * 事件监控
     * @return {Void}
     */
    Resizable.prototype.watch = function () {
        var self = this;

        this.$elm.on('mousedown.resizable', '[role=resizable]', function (e) {
            var $el = $(this);
            self.resizeParams.top = parseInt(self.$elm.position().top);
            self.resizeParams.left = self.$elm.position().left;
            self.resizeParams.width = parseInt(self.$elm.outerWidth(true));
            self.resizeParams.height = parseInt(self.$elm.outerHeight(true));
            self.resizeParams.ratio = self.resizeParams.width >= self.resizeParams.height ? self.resizeParams.width / self.resizeParams.height : self.resizeParams.height / self.resizeParams.width;
            self.resizeParams.type = $el.attr('data-type');
            self.showCover();
            e.stopPropagation();
            e.preventDefault();
            self.start(e, $el);
            document.onselectstart = function () { return false };
        });
    };

    /**
     * 添加自定义事件
     * @param {String} type - 事件类别
     * @param {Function} options - 事件回调
     * @return {Void}
     */
    Resizable.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 开始缩放
     * @return {Void}
     */
    Resizable.prototype.start = function (e, $handle) {
        var self = this;

        this.$doc.on('mousemove.resizable', function (e) {
            self.resize(e)
        }).on('mouseup.resizable', function (e) {
            self.stop(e, $handle);
            self.$doc.off('mousemove.resizable');
            self.$doc.off('mouseup.resizable');
        });

        this.moving = true;

        this.winHeight = this.$win.height();
        this.docHeight = this.$doc.height();

        //获取鼠标位置
        var mouseCoord = this.getMouseCoord(e);

        var position = util.getPosition(this.$elm, this.$range ? this.$range : this.$body);

        //记录鼠标在拖动层的坐标位置
        this.offset.x = mouseCoord.x - position.left;
        this.offset.y = mouseCoord.y - position.top;

        this.offset.click = {
            left: mouseCoord.x - position.offsetLeft,
            top: mouseCoord.y - position.offsetTop
        };

        this.offset.parent = util.getOffsetParent(this.$elm, this.$range ? this.$range : this.$body);


        //记录鼠标点击后的坐标
        this.originalCoord.x = mouseCoord.x;
        this.originalCoord.y = mouseCoord.y;


        //捕捉鼠标的作用范围，防止鼠标移动过快丢失
        if ($handle[0].setCapture) {
            $handle[0].setCapture();
        }

        this.css = {
            left: this.resizeParams.left,
            top: this.resizeParams.top,
            width: this.resizeParams.width,
            height:this.resizeParams.height
        };

    };

    /**
     * 缩放
     * @return {Void}
     */
    Resizable.prototype.resize = function (e) {

        var mouseCoord = this.getMouseCoord(e),
            moveCoord = {
                x: parseInt(mouseCoord.x - this.offset.x),
                y: parseInt(mouseCoord.y - this.offset.y)
            },
            css = {},
            resizeParams = this.resizeParams,
            $range = this.options.$range,
            rw, rh;

        if ($range) {
            rw = $range.outerWidth();
            rh = $range.outerHeight();
        } else {
            rw = this.$win.width() + this.$doc.scrollLeft();
            rh = this.$win.height() + this.$doc.scrollTop();
        }

        switch (this.resizeParams.type) {
            case 'left':
                css.top = resizeParams.top;
                css.height = resizeParams.height;

                if (moveCoord.x <= 0) {
                    css.left = -this.offset.parent.pLeft;
                    css.width = resizeParams.width + this.offset.parent.pLeft + resizeParams.left;
                } else {
                    css.left = this.offset.parent.isRoot ? mouseCoord.x - this.offset.click.left - this.offset.parent.left : moveCoord.x;
                    css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                }

                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                    css.left = resizeParams.left + (resizeParams.width - css.width);
                }
                break;
            case 'top':
                css.top = this.offset.parent.isRoot ? mouseCoord.y - this.offset.click.top - this.offset.parent.top : moveCoord.y;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height + (this.originalCoord.y - mouseCoord.y);

                if (css.top < -this.offset.parent.pTop) {
                    css.top = -this.offset.parent.pTop;
                    css.height = resizeParams.height + this.offset.parent.pTop + resizeParams.top;
                }

                if (css.height <= this.minHeight) {
                    css.height = this.minHeight;
                    css.top = resizeParams.top + (resizeParams.height - css.height);
                }
                break;
            case 'right':
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.height = resizeParams.height;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);

                if ((css.width + this.offset.parent.pLeft + css.left) >= rw) {
                    css.width = rw - this.offset.parent.pLeft - css.left;
                }
                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                }
                break;
            case 'bottom':
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height - (this.originalCoord.y - mouseCoord.y);

                if ((css.height + this.offset.parent.pTop + css.top) >= rh) {
                    css.height = rh - this.offset.parent.pTop - css.top;
                }

                if (css.height <= this.minHeight) {
                    css.height = this.minHeight;
                }
                break;
            case 'bottomRight':
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);


                if ((css.width + this.offset.parent.pLeft + css.left) >= rw) {
                    css.width = rw - this.offset.parent.pLeft - css.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if ((css.height + this.offset.parent.pTop + css.top) >= rh) {
                    css.height = rh - this.offset.parent.pTop - css.top;
                    css.width = this.getScaleWidth(css.height);
                }
                break;
        }

        this.css = css;


        if (this.options.cover) {
            $cover.css(css);
        } else {
            this.$elm.css(css);
        }

        this._event.resize.call(this, css);
    };

    /**
     * 停止缩放
     * @return {Void}
     */
    Resizable.prototype.stop = function (e, $handle) {

        this.moving = false;
        this.hideCover();

        if (this.options.cover) {
            this.$elm.css(this.css);
        }

        if ($handle[0].releaseCapture) {
            $handle[0].releaseCapture();
        }

        this._event.stop.call(this, this.css);
    };

    /**
     * 显示覆盖层
     * @return {Void}
     */
    Resizable.prototype.showCover = function () {

        if (!this.options.cover) {
            return;
        }

        var $el = this.$elm;

        $cover.insertAfter(this.$elm).show().css({
            width: $el.outerWidth(),
            height: $el.outerHeight(),
            left: $el.position().left,
            top: $el.position().top
        });
    };

    /**
     * 隐藏覆盖层
     * @return {Void}
     */
    Resizable.prototype.hideCover = function () {
        $cover.hide();
    };

    /**
     * 取鼠标坐标
     * @return {Object}
     */
    Resizable.prototype.getMouseCoord = function (e) {
        return {
            x: parseInt(e.pageX || e.clientX + document.body.scrollLeft - document.body.clientLeft),
            y: parseInt(e.pageY || e.clientY + document.body.scrollTop - document.body.clientTop)
        };
    };

    /**
     * 取缩放宽度
     * @return {Int}
     */
    Resizable.prototype.getScaleWidth = function (height, ratio) {
        ratio = ratio || this.resizeParams.ratio;
        if (this.resizeParams.width >= this.resizeParams.height) {
            return height * ratio;
        } else {
            return height / ratio;
        }
    };

    /**
    * 取缩放高度
    * @return {Int}
    */
    Resizable.prototype.getScaleHeight = function (width, ratio) {
        ratio = ratio || this.resizeParams.ratio;
        if (this.resizeParams.width >= this.resizeParams.height) {
            return width / ratio;
        } else {
            return width * ratio;
        }
    };

    /**
     * 全局初始化调用
     * @return {Void}
     */
    Resizable.Global = function ($elms) {
        $elms = $elms || $('[data-module=resizable]');
        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                onResize = $el.attr('data-onresize'),
                onStop = $el.attr('data-onstop'),
                data =$.data($el[0],'resizable');

            if (options && options.length > 0) {
                options = eval('(0,' + options + ')');
            }

            onResize = onResize && onResize.length > 0 ? eval('(0,' + onResize + ')') : $.noop;
            onStop = onStop && onStop.length > 0 ? eval('(0,' + onStop + ')') : $.noop;

            if (!data) {

                data = new Resizable($el, options);

                data.on('resize', function (css) {
                    onResize.call(this, css);
                }).on('stop', function (css) {
                    onStop.call(this, css);
                });

                $.data($el[0], 'resizable', data);
            }

        });
    }

    return Resizable;

});