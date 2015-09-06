/**
 * 拖放模块
 * @date :2014-09-10
 * @author kotenei (kotenei@qq.com)
 */
define('km/dragdrop', ['jquery'], function ($) {

    var zIndex = 1000,
        droppables = [],
        method = {
            move: function (moveCoord) {

                var left,
                    top,
                    width,
                    height;

                if (droppables.length == 0) {
                    return;
                }

                for (var i = droppables.length - 1, item; i >= 0; i--) {
                    item = droppables[i];

                    left = item.$drop.offset().left - this.$range.offset().left;
                    top = item.$drop.offset().top - this.$range.offset().top;
                    width = item.$drop.outerWidth();
                    height = item.$drop.outerHeight();

                    if (left <= moveCoord.x + this.dragParms.width / 2
                        && top <= moveCoord.y + this.dragParms.height / 2
                        && left + width >= moveCoord.x + this.dragParms.width / 2
                        && top + height >= moveCoord.y + this.dragParms.height / 2) {


                        if (this.overItem != item) {

                            if (this.overItem) {
                                this.overItem.out(this.$layer, moveCoord);
                            }

                            this.overItem = item;
                            this.overItem.over(this.$layer, moveCoord);
                        }
                        break;
                    } else {
                        if (this.overItem && this.overItem == item) {
                            this.overItem.out(this.$layer, moveCoord);
                            this.overItem = null;
                        }
                    }
                }
            },
            drop: function (moveCoord) {
                var left,
                    top,
                    width,
                    height;

                if (droppables.length == 0) {
                    return;
                }


                for (var i = droppables.length - 1, item; i >= 0; i--) {
                    item = droppables[i];

                    left = item.$drop.offset().left - this.$range.offset().left;
                    top = item.$drop.offset().top - this.$range.offset().top;
                    width = item.$drop.outerWidth();
                    height = item.$drop.outerHeight();

                    if (left <= moveCoord.x + this.dragParms.width / 2
                        && top <= moveCoord.y + this.dragParms.height / 2
                        && left + width >= moveCoord.x + this.dragParms.width / 2
                        && top + height >= moveCoord.y + this.dragParms.height / 2) {

                        item.drop(this.$layer, moveCoord);

                        break;
                    }
                }
            }
        };

    /**
     * 拖放模块
     * @constructor
     * @alias km/dragdrop
     * @param {Object} options - 参数设置
     */
    var DragDrop = function (options) {

        this.options = $.extend(true, {
            $layer: null,
            $handle: null,
            $range: null,
            direction: '',          // h:水平  v:垂直
            resizable: false,       //是否可拖放
            scale: false,           //是否按比例缩放
            boundary: false,        //是否可移出边界
            sortable: false,        //是否可排序
            placeholder: false,      //占位符
            minWidth: 100,
            callback: {
                start: $.noop,
                move: $.noop,
                stop: $.noop,
                resize: $.noop
            }
        }, options);

        this.$layer = options.$layer;
        this.$handle = options.$handle;
        this.$range = options.$range;
        this.$window = $(window);
        this.$document = $(document);

        //是否设置大小
        this.isResize = false;
        //是否移动中
        this.moving = false;
        //鼠标相对拖动层偏移值
        this.offset = { x: 0, y: 0 };
        //原来坐标
        this.originalCoord = { x: 0, y: 0 };
        //调整尺寸参数
        this.resizeParams = { left: 0, top: 0, width: 0, height: 0, type: 'bottomRight' };

        this.init();
    }

    /**
     * 初始化
     * @return {Void} 
     */
    DragDrop.prototype.init = function () {
        if (!this.$layer) { return; }
        if (this.$range) { this.$range.css("position", "relative"); }
        this.$handle = this.$handle || this.$layer;

        if (!this.options.sortable) {
            this.$layer.css({ cursor: "move", position: 'absolute', zIndex: zIndex });
        } else {
            this.$layer.css({ cursor: 'move' });
        }


        if (this.options.resizable) {
            this.$layer.append('<span class="k-resizable k-resizable-topLeft" data-type="topLeft"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-topRight" data-type="topRight"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-bottomLeft" data-type="bottomLeft"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-bottomRight" data-type="bottomRight"></span>');

            if (!this.options.scale) {
                this.$layer.append('<span class="k-resizable k-resizable-topCenter" data-type="topCenter"></span>');
                this.$layer.append('<span class="k-resizable k-resizable-leftCenter" data-type="leftCenter"></span>');
                this.$layer.append('<span class="k-resizable k-resizable-rightCenter" data-type="rightCenter"></span>');
                this.$layer.append('<span class="k-resizable k-resizable-bottomCenter" data-type="bottomCenter"></span>');
            }

        }

        this.setMinSize();

        this.eventBind();
    };

    /**
    * 设置最小尺寸
    * @return {Void} 
    */
    DragDrop.prototype.setMinSize = function () {

        var w = this.$layer.outerWidth(),
            h = this.$layer.outerHeight(),
            ratio;

        this.minWidth = this.options.minWidth || w;

        if (w >= h) {
            ratio = w / h;
            this.minHeight = this.minWidth / ratio;
        } else {
            ratio = h / w;
            this.minHeight = this.minWidth * ratio;
        }

    }

    /**
     * 绑定事件
     * @return {Void} 
     */
    DragDrop.prototype.eventBind = function () {
        var self = this;

        this.$handle.on('mousedown.dragdrop', function (e) {
            zIndex++;
            self.$layer.css('zIndex', zIndex);
            self.dragParms = {
                left: parseInt(self.$layer.position().left),
                top: parseInt(self.$layer.position().top),
                width: parseInt(self.$layer.outerWidth()),
                height: parseInt(self.$layer.outerHeight())
            };
            e.stopPropagation();
            e.preventDefault();
            self.start(e);
            //禁止文档选择事件
            document.onselectstart = function () { return false };
        }).on('mousedown.dragdrop', '.k-resizable', function () {
            self.isResize = true;
            self.resizeParams.type = $(this).attr("data-type");
            self.resizeParams.left = parseInt(self.$layer.position().left);
            self.resizeParams.top = parseInt(self.$layer.position().top);
            self.resizeParams.width = parseInt(self.$layer.outerWidth());
            self.resizeParams.height = parseInt(self.$layer.outerHeight());
            self.resizeParams.ratio = self.resizeParams.width >= self.resizeParams.height ? self.resizeParams.width / self.resizeParams.height : self.resizeParams.height / self.resizeParams.width
        })
    };

    /**
     * 开始拖动
     * @param  {Object} e - 事件
     * @return {Boolean}  
     */
    DragDrop.prototype.start = function (e) {
        var self = this;

        this.isMoving = true;

        //给文档绑定事件
        this.$document.on('mousemove.dragdrop', function (e) {
            if (self.isMoving) {
                if (self.isResize) {
                    self.resize(e);
                }
                else {
                    self.move(e);
                }
            }
        }).on('mouseup.dragdrop', function (e) {
            self.stop(e);
            self.$document.off('mousemove.dragdrop');
            self.$document.off('mouseup.dragdrop');
        });


        //获取鼠标位置
        var mouseCoord = this.getMouseCoord(e);

        //记录鼠标在拖动层的坐标位置
        this.offset.x = mouseCoord.x - this.$layer.position().left;
        this.offset.y = mouseCoord.y - this.$layer.position().top;
        //记录鼠标点击后的坐标
        this.originalCoord.x = mouseCoord.x;
        this.originalCoord.y = mouseCoord.y;

        this.moveCoord = { x: 0, y: 0 };



        //捕捉鼠标的作用范围，防止鼠标移动过快丢失
        if (this.$handle[0].setCapture) {
            this.$handle[0].setCapture();
        }

        //开始拖动回调函数
        if ($.isFunction(this.options.callback.start)) {
            this.options.callback.start(e, this.$layer);
        }

        return false;

    };

    /**
     * 移动中
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.move = function (e) {
        var self = this;

        var mouseCoord = this.getMouseCoord(e);

        var moveCoord = {
            x: mouseCoord.x - this.offset.x,
            y: mouseCoord.y - this.offset.y
        };

        var $range = this.$range,
            rightBoundary,
            bottomBoundary;


        if (this.options.sortable) {
            if (!this.$placeholder) {
                this.$placeholder = this.$layer.clone(true).css({
                    position: 'static',
                    opacity: '0.5',
                }).insertAfter(this.$layer);
            }
            this.$layer.css({
                position: 'absolute'
            });
        }


        if ($range) {
            //元素范围内移动
            rightBoundary = $range.outerWidth() - this.$layer.outerWidth(true);
            bottomBoundary = $range.outerHeight() - this.$layer.outerHeight(true);

            if (!this.options.boundary) {
                if (moveCoord.x < 0) { moveCoord.x = 0; }
                if (moveCoord.y < 0) { moveCoord.y = 0; }
                if (moveCoord.x > rightBoundary) { moveCoord.x = rightBoundary; }
                if (moveCoord.y > bottomBoundary) { moveCoord.y = bottomBoundary; }
            }

        } else {
            //窗体内移动
            rightBoundary = this.$window.width() - this.$layer.outerWidth() + this.$document.scrollLeft();
            bottomBoundary = this.$window.height() - this.$layer.outerHeight() + this.$document.scrollTop();
            if (moveCoord.x < 0) { moveCoord.x = 0; }
            if (moveCoord.y < 0) { moveCoord.y = 0; }
            if (moveCoord.x > rightBoundary) { moveCoord.x = rightBoundary; }
            if (moveCoord.y > bottomBoundary) { moveCoord.y = bottomBoundary; }
        }

        this.moveCoord = moveCoord;

        this.setPosition(moveCoord);

        method.move.call(this, moveCoord);

        if ($.isFunction(this.options.callback.move)) {
            this.options.callback.move.call(this, moveCoord);
        }
    };

    /**
     * 停止拖动
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.stop = function (e) {
        this.isMoving = false;
        this.isResize = false;

        if (this.$handle[0].releaseCapture) {
            this.$handle[0].releaseCapture();
        }

        if (this.options.sortable && this.$placeholder) {
            this.$layer.insertAfter(this.$placeholder).css('position', 'static');
            this.$placeholder.remove();
            this.$placeholder = null;
        }

        method.drop.call(this, this.moveCoord);


        if ($.isFunction(this.options.callback.stop)) {
            this.options.callback.stop(e, this.$layer);
        }
    };

    /**
     * 调整大小
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.resize = function (e) {
        var org
        var mouseCoord = this.getMouseCoord(e);
        var moveCoord = {
            x: mouseCoord.x - this.offset.x,
            y: mouseCoord.y - this.offset.y
        };
        var $layer = this.$layer;
        var resizeParams = this.resizeParams;
        var css = { left: 0, top: 0, width: 0, height: 0 };
        var rightBoundary, bottomBoundary;
        var rw, rh;
        var $range = this.$range;

        if ($range) {
            rw = $range.width();
            rh = $range.height();
        } else {
            rw = this.$window.width() + this.$document.scrollLeft();
            rh = this.$window.height() + this.$document.scrollTop();
        }


        switch (this.resizeParams.type) {
            case "topLeft":
                css.width = resizeParams.width + (resizeParams.left - moveCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);
                css.top = resizeParams.top - (css.height - resizeParams.height);
                css.left = resizeParams.left - (css.width - resizeParams.width);

                if (css.left < 0) {
                    css.left = 0;
                    css.width = resizeParams.width + resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                    css.top = resizeParams.top - (css.height - resizeParams.height);
                }

                if (css.top < 0) {
                    css.top = 0;
                    css.height = resizeParams.height + resizeParams.top;
                    css.width = this.getScaleWidth(css.height);
                    css.left = resizeParams.left - (css.width - resizeParams.width);
                }

                break;
            case "topRight":
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);

                if ((css.width + css.left) >= rw) {
                    css.width = rw - resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                }

                css.top = resizeParams.top - (css.height - resizeParams.height);

                if (css.top < 0) {
                    css.top = 0;
                    css.height = resizeParams.height + resizeParams.top;
                    css.width = this.getScaleWidth(css.height);
                }

                break;
            case "leftCenter":
                css.top = resizeParams.top;
                css.height = resizeParams.height;
                if (moveCoord.x <= 0) {
                    css.left = 0;
                    css.width = resizeParams.width + resizeParams.left;
                } else {
                    css.left = moveCoord.x;
                    css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                }
                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                    css.left = resizeParams.left + (resizeParams.width - css.width);
                }
                break;
            case "rightCenter":
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.height = resizeParams.height;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                if ((css.width + css.left) >= rw) {
                    css.width = rw - resizeParams.left;
                }
                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                }
                break;
            case "topCenter":
                css.top = moveCoord.y;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height + (this.originalCoord.y - mouseCoord.y);
                if (moveCoord.y < 0) {
                    css.top = 0;
                    css.height = resizeParams.height + resizeParams.top;
                }
                if (css.height <= this.minHeight) {
                    css.height = this.minHeight;
                    css.top = resizeParams.top + (resizeParams.height - css.height);
                }
                break;
            case "bottomCenter":
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height - (this.originalCoord.y - mouseCoord.y);
                if (css.height + css.top >= rh) {
                    css.height = rh - resizeParams.top;
                }
                if (css.height <= this.minHeight) {
                    css.height = this.minHeight;
                }
                break;
            case "bottomLeft":
                css.top = resizeParams.top;
                css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);
                css.left = resizeParams.left - (css.width - resizeParams.width);

                if (css.left <= 0) {
                    css.left = 0;
                    css.width = resizeParams.width + resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if (css.height + css.top >= rh) {
                    css.height = rh - css.top;
                    css.width = this.getScaleWidth(css.height);
                    css.left = resizeParams.left - (css.width - resizeParams.width);
                }

                break;
            case "bottomRight":
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);

                if ((css.width + css.left) >= rw) {
                    css.width = rw - resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if (css.top + css.height >= rh) {
                    css.height = rh - css.top;
                    css.width = this.getScaleWidth(css.height);
                }

                break;
            default:
                break;
        }

        this.$layer.css(css);

        if ($.isFunction(this.options.callback.resize)) {
            this.options.callback.resize(css);
        }
    };

    /**
     * 根据高度按比例获取宽度
     * @param  {Number} height - 高度
     * @param  {Number} ratio - 比例
     * @return {Number}   
     */
    DragDrop.prototype.getScaleWidth = function (height, ratio) {
        ratio = ratio || this.resizeParams.ratio;
        if (this.resizeParams.width >= this.resizeParams.height) {
            return height * ratio;
        } else {
            return height / ratio;
        }
    };

    /**
     * 根据宽度按比例获取高度
     * @param  {Number} width - 宽度
     * @param  {Number} ratio - 比例
     * @return {Number}   
     */
    DragDrop.prototype.getScaleHeight = function (width, ratio) {
        ratio = ratio || this.resizeParams.ratio;
        if (this.resizeParams.width >= this.resizeParams.height) {
            return width / ratio;
        } else {
            return width * ratio;
        }
    };


    /**
     * 获取鼠标坐标
     * @param  {Object} e -事件
     * @return {Object}  
     */
    DragDrop.prototype.getMouseCoord = function (e) {
        return {
            x: e.pageX || e.clientX + document.body.scrollLeft - document.body.clientLeft,
            y: e.pageY || e.clientY + document.body.scrollTop - document.body.clientTop
        };
    };

    /**
     * 设置拖动层位置
     * @param {Object} moveCoord - 鼠标坐标
     */
    DragDrop.prototype.setPosition = function (moveCoord) {
        if (this.options.direction === 'h') {
            this.$layer.css('left', moveCoord.x);
        } else if (this.options.direction === 'v') {
            this.$layer.css('top', moveCoord.y);
        } else {
            this.$layer.css({
                left: moveCoord.x,
                top: moveCoord.y
            });
        }
    };

    /**
     * droppable
     * @param {Dom} $elms - jquery对象
     * @param {Object} options - 设置
     */
    DragDrop.droppable = function ($elms, options) {

        var Droppable = function ($el, options) {
            this.$drop = $el;
            this.options = $.extend(true, {
                overClass: 'droppable-over',
                callback: {
                    over: $.noop,
                    out: $.noop,
                    drop: $.noop
                }
            }, options);
            droppables.push(this);
        };

        /**
         * 滑动时的函数
         * @param  {Dom} $drag -被拖动的对象
         * @param  {Object} moveCoord - 鼠标的坐标
         * @return {Void}   
         */
        Droppable.prototype.over = function ($drag, moveCoord) {
            this.$drop.addClass(this.options.overClass);
            this.options.callback.over.call(this, $drag, moveCoord);
        };

        /**
         * 移出时的函数
         * @param  {Dom} $drag -被拖动的对象
         * @param  {Object} moveCoord - 鼠标的坐标
         * @return {Void}   
         */
        Droppable.prototype.out = function ($drag, moveCoord) {
            this.$drop.removeClass(this.options.overClass);
            this.options.callback.out.call(this, $drag, moveCoord);
        };


        /**
         * 放置时的函数
         * @param  {Dom} $drag -被拖动的对象
         * @param  {Object} moveCoord - 鼠标的坐标
         * @return {Void}   
         */
        Droppable.prototype.drop = function ($drag, moveCoord) {
            this.options.callback.drop.call(this, $drag, moveCoord);
        };

        $elms = $elms || $('[data-module=droppable]');

        $elms.each(function () {
            var $el = $(this),
                data = $el.data('droppable');

            if (!data) {
                data = new Droppable($el, options);
                $el.data('droppable', data);
            }

        });
    };


    DragDrop.sortable = function ($container, options) {
        var sortables = [];

        options = $.extend(true, {
            draggable: '.draggable',
            handle: null
        }, options);

        $draggable = $container.find(options.draggable);

        if ($draggable.length == 0) {
            return;
        }

        $draggable.each(function () {
            var sortable = new DragDrop({
                $range: $container,
                $layer: $(this),
                sortable: true,
                callback: {
                    start: function () {

                    },
                    move: function (moveCoord) {
                        if (sortables.length == 0) {
                            return;
                        }
                        var left,
                            top,
                            width,
                            height;

                        for (var i = 0, sortable; i < sortables.length; i++) {
                            sortable = sortables[i];

                            left = sortable.$layer.offset().left - sortable.$range.offset().left;
                            top = sortable.$layer.offset().top - sortable.$range.offset().top;
                            width = sortable.$layer.outerWidth();
                            height = sortable.$layer.outerHeight();

                            //if (left <= moveCoord.x + this.dragParms.width / 2
                            //    && top <= moveCoord.y + this.dragParms.height / 2
                            //    && left + width >= moveCoord.x + this.dragParms.width / 2
                            //    && top + height >= moveCoord.y + this.dragParms.height / 2) {


                            //}

                            if (sortable == this) {
                                continue;
                            }


                            if (this.$layer.position().left + this.dragParms.width >= left + width / 2
                                && this.$layer.position().left <= left + width / 2) {
                                

                                if (this.$layer.position().left + this.dragParms.width >= left + width / 2) {
                                    this.$placeholder.insertAfter(sortable.$layer);
                                } else {
                                    this.$placeholder.insertBefore(sortable.$layer);
                                }

                            }

                           

                        }
                    },
                    stop: function () {

                    }
                }
            });
            sortables.push(sortable);
        });
    };

    return DragDrop;

});
