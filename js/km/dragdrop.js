/**
 * 拖放模块
 * @date :2014-09-10
 * @author kotenei (kotenei@qq.com)
 */
define('km/dragdrop', ['jquery'], function ($) {

    var zIndex = 1000,
        droppables = [],
        dropMethod = {
            start: function () {
                if (droppables.length == 0) {
                    return;
                }

                for (var i = 0; i < droppables.length; i++) {
                    droppables[i].setInfo();
                }
            },
            move: function (e, moveCoord) {


                if (droppables.length == 0) {
                    return;
                }

                var left, top, width, height;

                for (var i = droppables.length - 1, droppable; i >= 0; i--) {

                    droppable = droppables[i];

                    left = droppable.info.offset.left - this.$range.offset().left;
                    top = droppable.info.offset.top - this.$range.offset().top;
                    width = droppable.info.width;
                    height = droppable.info.height;


                    if (left <= moveCoord.x + this.dragParms.width / 2
                        && top <= moveCoord.y + this.dragParms.height / 2
                        && left + width >= moveCoord.x + this.dragParms.width / 2
                        && top + height >= moveCoord.y + this.dragParms.height / 2) {


                        if (this.overDrop != droppable) {

                            if (this.overDrop) {
                                this.overDrop.out(this.$layer, moveCoord);
                            }

                            this.overDrop = droppable;
                            this.overDrop.over(this.$layer, moveCoord);
                        }
                        break;
                    } else {
                        if (this.overDrop && this.overDrop == droppable) {
                            this.overDrop.out(this.$layer, moveCoord);
                            this.overDrop = null;
                        }
                    }
                }
            },
            drop: function (e, moveCoord) {


                if (droppables.length == 0) {
                    return;
                }

                var left, top, width, height;


                for (var i = droppables.length - 1, droppable; i >= 0; i--) {

                    droppable = droppables[i];

                    left = droppable.info.offset.left - this.$range.offset().left;
                    top = droppable.info.offset.top - this.$range.offset().top;
                    width = droppable.info.width;
                    height = droppable.info.height;

                    if (left <= moveCoord.x + this.dragParms.width / 2
                        && top <= moveCoord.y + this.dragParms.height / 2
                        && left + width >= moveCoord.x + this.dragParms.width / 2
                        && top + height >= moveCoord.y + this.dragParms.height / 2) {

                        droppable.drop(this.$layer, moveCoord);

                        break;
                    }
                }
            }
        },
        util = {
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
                        info.pLeft = info.left - $target.offset().left + util.getNum($cur.css('marginLeft'));
                        info.pTop = info.top - $target.offset().top + util.getNum($cur.css('marginTop'));
                        info.$el = $parent;
                        info.isRoot = true;

                        return info;
                    }
                    $parent = $parent.parent();
                }

                return info;
            },
            getNum: function (val) {
                var ret = parseInt(val);

                if (isNaN(ret)) {
                    return 0;
                }

                return ret;
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
            $scrollWrap: null,
            direction: '',          // h:水平  v:垂直
            resizable: false,       //是否可拖放
            scale: false,           //是否按比例缩放
            boundary: false,        //是否可移出边界
            sortable: false,        //是否可排序
            minWidth: 100,
            autoScroll: true,
            autoScrollDealy: 5,
            zIndex: {
                increase: false
            },
            callback: {
                start: $.noop,
                move: $.noop,
                stop: $.noop,
                resize: $.noop
            }
        }, options);

        this._event = {
            start: $.noop,
            move: $.noop,
            stop: $.noop,
            resize: $.noop
        };

        this.$window = $(window);
        this.$document = $(document);
        this.$body = $(document.body);

        this.$layer = this.options.$layer;
        this.$handle = this.options.$handle && this.options.$handle.length > 0 ? this.options.$handle : this.options.$layer;
        this.$range = this.options.$range;

        this.$scrollWrap = this.options.$scrollWrap || this.$window;

        this.autoScrollActive = false;
        this.tm = null;

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

        this.$handle.css('cursor', 'move');

        if (!this.options.sortable) {
            this.$layer.css({ position: 'absolute', zIndex: zIndex });
        } else {
            this.$layer.css({});
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

    };

    /**
     * 事件监控
     * @return {Void} 
     */
    DragDrop.prototype.eventBind = function () {
        var self = this;

        this.$handle.off('mousedown.dragdrop').on('mousedown.dragdrop', function (e) {

            if (self.options.zIndex.increase) {
                zIndex++;
            }

            self.dragParms = {
                left: parseInt(self.$layer.position().left),
                top: parseInt(self.$layer.position().top),
                //width: parseInt(self.$layer.outerWidth()) + util.getNum(self.$layer.css('borderLeftWidth')) + util.getNum(self.$layer.css('borderRightWidth')),
                //height: parseInt(self.$layer.outerHeight()) + util.getNum(self.$layer.css('borderTopWidth')) + util.getNum(self.$layer.css('borderBottomWidth'))
                width: self.$layer.outerWidth(),
                height: self.$layer.outerHeight()
            };



            self.$layer.css({
                zIndex: zIndex,
                width: self.dragParms.width
            });

            e.stopPropagation();
            e.preventDefault();
            self.start(e);
            //禁止文档选择事件
            document.onselectstart = function () { return false };
            return false;
        }).on('mousedown.dragdrop', '.k-resizable', function () {
            self.isResize = true;
            self.resizeParams.type = $(this).attr("data-type");
            self.resizeParams.left = parseInt(self.$layer.position().left);
            self.resizeParams.top = parseInt(self.$layer.position().top);
            self.resizeParams.width = parseInt(self.$layer.outerWidth());
            self.resizeParams.height = parseInt(self.$layer.outerHeight());
            self.resizeParams.ratio = self.resizeParams.width >= self.resizeParams.height ? self.resizeParams.width / self.resizeParams.height : self.resizeParams.height / self.resizeParams.width;

        });
    };

    /**
    * 添加事件
    * @return {Void} 
    */
    DragDrop.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 开始拖动
     * @param  {Object} e - 事件
     * @return {Boolean}  
     */
    DragDrop.prototype.start = function (e) {
        var self = this;

        this.isMoving = true;

        this.winHeight = this.$scrollWrap.height();
        this.docHeight = this.$document.height();

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
            return false;
        }).on('mouseup.dragdrop', function (e) {
            self.stop(e);
            self.$document.off('mousemove.dragdrop');
            self.$document.off('mouseup.dragdrop');
            return false;
        });

        //获取鼠标位置
        var mouseCoord = this.getMouseCoord(e);

        var position = util.getPosition(this.$layer, this.$range ? this.$range : this.$body);

        //记录鼠标在拖动层的坐标位置
        this.offset.x = mouseCoord.x - position.left;
        this.offset.y = mouseCoord.y - position.top;

        this.offset.click = {
            left: mouseCoord.x - position.offsetLeft,
            top: mouseCoord.y - position.offsetTop
        };

        this.offset.parent = util.getOffsetParent(this.$layer, this.$range ? this.$range : this.$body);

        //记录鼠标点击后的坐标
        this.originalCoord.x = mouseCoord.x;
        this.originalCoord.y = mouseCoord.y;

        this.moveCoord = { x: 0, y: 0 };

        //捕捉鼠标的作用范围，防止鼠标移动过快丢失
        if (this.$handle[0].setCapture) {
            this.$handle[0].setCapture();
        }


        dropMethod.start.call(this, e);

        //开始拖动回调函数
        if ($.isFunction(this.options.callback.start)) {
            this.options.callback.start.call(this, e, this.$layer);
        }

        this._event.start.call(this, e);

        return false;

    };

    /**
     * 移动中
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.move = function (e) {

        var self = this;

        var $range = this.$range;

        var boundary = { right: 0, bottom: 0 };

        var mouseCoord = this.getMouseCoord(e);

        var moveCoord = {
            x: mouseCoord.x - this.offset.x,
            y: mouseCoord.y - this.offset.y
        };

        if (this.options.autoScroll) {


            if (e.clientY <= 10 || e.clientY >= this.winHeight - 10) {

                if (e.clientY <= 10 && !this.autoScrollActive) {
                    this.autoScrollActive = true;
                    this.autoScroll(-1, e.clientY);
                }

                if (e.clientY >= (this.winHeight - 10) && mouseCoord.y < (this.docHeight + 100) && !this.autoScrollActive) {

                    this.autoScrollActive = true;
                    this.autoScroll(1, e.clientY);
                }

            } else {
                this.autoScrollActive = false;
            }
        }

        if (this.options.sortable) {
            if (!this.$placeholder) {
                this.$placeholder = $('<div/>');
                this.$placeholder.attr('class', this.$layer.attr('class')).addClass('k-sortable-placeholder').css({
                    opacity: '0.5',
                    height: this.dragParms.height,
                    //width: this.dragParms.width,
                    background: 'white'
                }).insertAfter(this.$layer);
            }
            this.$layer.css({
                position: 'absolute'
            });
        }

        var position = {
            left: mouseCoord.x - this.offset.click.left - this.offset.parent.left,
            top: mouseCoord.y - this.offset.click.top - this.offset.parent.top
        };

        if ($range) {
            //元素范围内移动
            boundary.right = parseInt($range.outerWidth() - util.getNum(this.$range.css('borderLeftWidth')) - util.getNum(this.$range.css('borderRightWidth')) - this.$layer.outerWidth());
            boundary.bottom = parseInt($range.outerHeight() - util.getNum(this.$range.css('borderTopWidth')) - util.getNum(this.$range.css('borderBottomWidth')) - this.$layer.outerHeight());


            if (!this.options.boundary) {
                this.setMoveCoord(moveCoord, boundary, position);
            }

        } else {
            //窗体内移动
            boundary.right = parseInt(this.$window.width() - this.$layer.outerWidth() + this.$document.scrollLeft());
            boundary.bottom = parseInt(this.$window.height() - this.$layer.outerHeight() + this.$document.scrollTop());
            this.setMoveCoord(moveCoord, boundary, position);
        }

        this.moveCoord = moveCoord;

        this.setPosition(moveCoord, position);

        dropMethod.move.call(this, e, moveCoord);

        if ($.isFunction(this.options.callback.move)) {
            this.options.callback.move.call(this, e, moveCoord);
        }

        this._event.move.call(this, e, moveCoord, position);
    };

    /**
     * 设置移动时的坐标定位
     * @param  {object} moveCoord - 坐标 
     * @param  {object} boundary - 边界
     * @return {objet}  position - 定位
     */
    DragDrop.prototype.setMoveCoord = function (moveCoord, boundary, position) {

        if (moveCoord.x < 0) {

            moveCoord.x = 0;

            if (this.offset.parent.isRoot) {
                position.left = -this.offset.parent.pLeft;
            }

        }

        if (moveCoord.y < 0) {

            moveCoord.y = 0;

            if (this.offset.parent.isRoot) {
                position.top = -this.offset.parent.pTop;
            }
        }

        if (moveCoord.x > boundary.right) {

            moveCoord.x = boundary.right;

            if (this.offset.parent.isRoot) {
                position.left = parseInt(moveCoord.x - this.offset.parent.pLeft);
            }
        }

        if (moveCoord.y > boundary.bottom) {

            moveCoord.y = boundary.bottom;

            if (this.offset.parent.isRoot) {
                position.top = parseInt(moveCoord.y - this.offset.parent.pTop);
            }
        }
    };

    /**
     * 自动滚动滚动条
     * @param  {Int} direction -方向 
     * @param  {Int} yPos - 鼠标移动时的y值
     * @return {Void}   
     */
    DragDrop.prototype.autoScroll = function (direction, yPos) {
        var self = this;

        var scrollTop = this.$scrollWrap.scrollTop();

        if (direction < 0) {
            if (scrollTop > 0) {
                scrollTop -= 5;
                this.$scrollWrap.scrollTop(scrollTop);
            } else {
                this.autoScrollActive = false;
            }
        } else {
            if (yPos >= (this.winHeight - 10)) {
                scrollTop += 5;
                this.$scrollWrap.scrollTop(scrollTop);
            } else {
                this.autoScrollActive = false;
            }
        }

        if (this.autoScrollActive) {
            this.tm = setTimeout(function () {
                self.autoScroll(direction, yPos);
            }, this.options.autoScrollDealy);
        } else {
            if (this.tm) {
                clearTimeout(this.tm);
            }
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
        this.autoScrollActive = false;

        if (this.$handle[0].releaseCapture) {
            this.$handle[0].releaseCapture();
        }

        if (this.options.sortable && this.$placeholder) {
            this.$layer.insertAfter(this.$placeholder).css('position', 'static');
            this.$placeholder.remove();
            this.$placeholder = null;
        }

        dropMethod.drop.call(this, e, this.moveCoord);


        if ($.isFunction(this.options.callback.stop)) {
            this.options.callback.stop.call(this, e, this.$layer);
        }

        this._event.stop.call(this, e);
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
            rw = $range.outerWidth();
            rh = $range.outerHeight();
        } else {
            rw = this.$window.width() + this.$document.scrollLeft();
            rh = this.$window.height() + this.$document.scrollTop();
        }


        switch (this.resizeParams.type) {
            case "topLeft":

                css.width = resizeParams.width + (resizeParams.left - (this.offset.parent.isRoot ? mouseCoord.x - this.offset.click.left - this.offset.parent.left : moveCoord.x));
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);

                css.top = resizeParams.top - (css.height - resizeParams.height);
                css.left = resizeParams.left - (css.width - resizeParams.width);

                if (css.left <= -this.offset.parent.pLeft) {
                    css.left = -this.offset.parent.pLeft;
                    css.width = resizeParams.width + this.offset.parent.pLeft + resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                    css.top = resizeParams.top - (css.height - resizeParams.height);
                }

                if (css.top <= -this.offset.parent.pTop) {
                    css.top = -this.offset.parent.pTop;
                    css.height = resizeParams.height + this.offset.parent.pTop + resizeParams.top;
                    css.width = this.getScaleWidth(css.height);
                    css.left = resizeParams.left - (css.width - resizeParams.width);
                }

                break;
            case "topRight":
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);


                if ((css.width + this.offset.parent.pLeft + css.left) >= rw) {
                    css.width = rw - this.offset.parent.pLeft - css.left;
                    css.height = this.getScaleHeight(css.width);
                }

                css.top = resizeParams.top - (css.height - resizeParams.height);

                if (css.top <= -this.offset.parent.pTop) {
                    css.top = -this.offset.parent.pTop;
                    css.height = resizeParams.height + this.offset.parent.pTop + resizeParams.top;
                    css.width = this.getScaleWidth(css.height);
                }

                break;
            case "leftCenter":
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
            case "rightCenter":

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
            case "topCenter":
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
            case "bottomCenter":
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
            case "bottomLeft":
                css.top = resizeParams.top;
                css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);
                css.left = resizeParams.left - (css.width - resizeParams.width);


                if (css.left <= -this.offset.parent.pLeft) {
                    css.left = -this.offset.parent.pLeft;
                    css.width = resizeParams.width + this.offset.parent.pLeft + resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if ((css.height + this.offset.parent.pTop + css.top) >= rh) {
                    css.height = rh - this.offset.parent.pTop - css.top;
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


                if ((css.width + this.offset.parent.pLeft + css.left) >= rw) {
                    css.width = rw - this.offset.parent.pLeft - css.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if ((css.height + this.offset.parent.pTop + css.top) >= rh) {
                    css.height = rh - this.offset.parent.pTop - css.top;
                    css.width = this.getScaleWidth(css.height);
                }

                break;
            default:
                break;
        }

        this.$layer.css(css);

        if ($.isFunction(this.options.callback.resize)) {
            this.options.callback.resize.call(this, e, css);
        }

        this._event.resize.call(this, e, css);
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
    DragDrop.prototype.setPosition = function (moveCoord, position) {

        var left, top;

        if (this.options.direction === 'h') {
            this.$layer.css('left', this.offset.parent.isRoot ? position.left : moveCoord.x);
        } else if (this.options.direction === 'v') {
            this.$layer.css('top', this.offset.parent.isRoot ? position.top : moveCoord.y);
        } else {

            left = this.offset.parent.isRoot ? position.left : moveCoord.x - util.getNum(this.$layer.css('marginLeft'));
            top = this.offset.parent.isRoot ? position.top : moveCoord.y - util.getNum(this.$layer.css('marginTop'));

            this.$layer.css({
                left: left,
                top: top
            });

        }
    };

    /**
    * 销毁
    * @return {Void} 
    */
    DragDrop.prototype.destory = function () {
        this._event = {
            start: $.noop,
            move: $.noop,
            stop: $.noop,
            resize: $.noop
        };
        this.$handle.css('cursor', 'default').off('mousedown.dragdrop');
        this.$layer.css('cursor', 'default').find('.k-resizable').remove();
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



            this.setInfo();
        };

        /**
         * 设置放置区相关信息
         * @return {Void}   
         */
        Droppable.prototype.setInfo = function () {

            var offset = this.$drop.offset(),
                position = this.$drop.position();

            this.info = {
                width: this.$drop.outerWidth() + util.getNum(this.$drop.css('borderLeftWidth')) + util.getNum(this.$drop.css('borderRightWidth')),
                height: this.$drop.outerHeight() + util.getNum(this.$drop.css('borderTopWidth')) + util.getNum(this.$drop.css('borderBottomWidth')),
                offset: { left: offset.left, top: offset.top },
                position: { left: position.left, top: position.left }
            };
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
                data = $.data($el[0], 'droppable');

            if (!data) {
                data = new Droppable($el, options);
                $.data($el[0], 'droppable', data);
                droppables.push(data);
            }
        });
    };

    /**
     * sortable
     * @param {Dom} $container - jquery对象
     * @param {Object} options - 设置
     */
    DragDrop.sortable = function ($container, options) {

        var groups = [],
            sortables = [],
            hasSwap = false,
            $groups,
            method;

        var method = {
            _getInfo: function ($elm) {
                var offset = $elm.offset(),
                    position = $elm.position(),
                    width = $elm.outerWidth(),
                    height = $elm.outerHeight();

                return {
                    offset: {
                        left: offset.left,
                        top: offset.top
                    },
                    position: {
                        left: position.left,
                        top: position.top
                    },
                    width: width,
                    height: height,
                    h_half: offset.left + width / 2,        //水平
                    v_half: offset.top + height / 2         //垂直
                };
            },
            _setGroupInfo: function (groups) {

                if (!groups || groups.length == 0) {
                    return;
                }


                var draggableInfo,
                    droppableInfo;

                for (var i = 0, group; i < groups.length; i++) {

                    draggableInfo = [];
                    droppableInfo = [];

                    group = groups[i];

                    group.offset = {
                        left: group.$group.offset().left,
                        top: group.$group.offset().top,
                        width: group.$group.outerWidth() + util.getNum(group.$group.css('borderLeftWidth')) + util.getNum(group.$group.css('borderRightWidth')),
                        height: group.$group.outerHeight() + util.getNum(group.$group.css('borderTopWidth')) + util.getNum(group.$group.css('borderBottomWidth'))
                    };

                    

                    group.$draggable = group.$group.find(options.draggable).each(function () {
                        var $drag = $(this),
                            info = method._getInfo($drag);

                        info.$drag = $drag;
                        draggableInfo.push(info);
                    });


                    group.$droppable = group.$group.find(options.droppable).each(function () {
                        var $drop = $(this),
                            info = method._getInfo($drop);

                        info.$drop = $drop;
                        droppableInfo.push(info);
                    });

                    group.draggableInfo = draggableInfo;

                    group.droppableInfo = droppableInfo;

                }
            },
            _setSortableInfo: function (resetSortNum) {

                for (var i = 0, sortable; i < sortables.length; i++) {

                    sortable = sortables[i];

                    if (resetSortNum) {
                        sortable.sortNum = i;
                    }

                    sortable.info = method._getInfo(sortable.$layer);
                }



            }
        };

        options = $.extend(true, {
            $scrollWrap: null,
            draggable: '.k-draggable',
            droppable: '.k-droppable',
            group: '.k-sortable-group',
            handle: null,
            boundary: false,
            model: 'default',
            direction: '',
            callback: {
                init: $.noop,
                start: $.noop,
                move: $.noop,
                stop: $.noop
            }
        }, options);

        $groups = $container.find(options.group);

        if ($groups.length == 0) {
            $groups = $container;
        }

        $groups.each(function () {

            var $group = $(this),
                $draggable = $group.find(options.draggable),
                $droppable = $group.find(options.droppable);

            $draggable.each(function () {

                var $el = $(this),
                    $handle = $el.find(options.handle);


                sortable = new DragDrop({
                    $scrollWrap: options.$scrollWrap,
                    $range: $container,
                    $layer: $el,
                    $handle: $handle.length > 0 ? $handle : null,
                    sortable: true,
                    boundary: options.boundary,
                    direction: options.direction
                });

                sortable.on('start', function (e) {
                    options.callback.start.call(this, e, $el);
                }).on('move', function (e, moveCoord, position) {

                    var mouseCoord = this.getMouseCoord(e);

                    for (var i = 0, group; i < groups.length; i++) {

                        group = groups[i];

                        //分组范围内
                        if (mouseCoord.y >= group.offset.top && mouseCoord.y <= group.offset.top + group.offset.height
                            && mouseCoord.x >= group.offset.left && mouseCoord.x <= group.offset.left + group.offset.width) {


                            //放置区域
                            for (var j = 0, dropInfo; j < group.droppableInfo.length; j++) {

                                dropInfo = group.droppableInfo[j];

                                if (mouseCoord.y >= dropInfo.offset.top + dropInfo.height
                                    && mouseCoord.x >= dropInfo.offset.left && mouseCoord.x <= dropInfo.offset.left + dropInfo.width
                                    && dropInfo.$drop.find('.k-sortable-placeholder').length == 0) {

                                    dropInfo.$drop.append(this.$placeholder);

                                    method._setGroupInfo(groups);
                                    method._setSortableInfo();
                                    options.callback.move.call(this, e, $el);
                                    return;
                                }
                            }


                            //排序项
                            for (var k = 0, tmpNum, sortable; k < sortables.length; k++) {

                                sortable = sortables[k];

                                if (sortable == this) {
                                    continue;
                                }



                                if (mouseCoord.x >= sortable.info.offset.left
                                    && mouseCoord.x <= sortable.info.offset.left + sortable.info.width
                                    && mouseCoord.y >= sortable.info.offset.top
                                    && mouseCoord.y <= sortable.info.offset.top + sortable.info.height) {


                                    if (this.dragParms.height < sortable.info.height) {

                                        if (mouseCoord.y >= sortable.info.offset.top
                                            && mouseCoord.y <= sortable.info.v_half) {

                                            hasSwap = this.$placeholder.next()[0] == sortable.$layer[0];

                                            this.$placeholder.insertBefore(sortable.$layer);

                                            if (hasSwap) {
                                                return;
                                            }

                                        } else {

                                            hasSwap = this.$placeholder.prev()[0] == sortable.$layer[0];

                                            this.$placeholder.insertAfter(sortable.$layer);

                                            if (hasSwap) {
                                                return;
                                            }
                                        }


                                    } else if (this.dragParms.width < sortable.info.width && options.mode == 'float') {

                                        if (mouseCoord.x >= sortable.info.offset.left
                                            && mouseCoord.x <= sortable.info.h_half) {

                                            hasSwap = this.$placeholder.next()[0] == sortable.$layer[0];

                                            this.$placeholder.insertBefore(sortable.$layer);

                                            if (hasSwap) {
                                                return;
                                            }

                                        } else {
                                            hasSwap = this.$placeholder.prev()[0] == sortable.$layer[0];

                                            this.$placeholder.insertAfter(sortable.$layer);

                                            if (hasSwap) {
                                                return;
                                            }
                                        }

                                    } else {

                                        if (this.sortNum > sortable.sortNum) {
                                            this.$placeholder.insertBefore(sortable.$layer);
                                        } else {
                                            this.$placeholder.insertAfter(sortable.$layer);
                                        }

                                        tmpNum = this.sortNum;
                                        this.sortNum = sortable.sortNum;
                                        sortable.sortNum = tmpNum;
                                    }

                                    method._setGroupInfo(groups);
                                    method._setSortableInfo();
                                    options.callback.move.call(this, e, $el);
                                    return;
                                }
                            }

                            options.callback.move.call(this, e, $el);

                            return;
                        }

                    }

                }).on('stop', function (e) {
                    this.$layer.css('width', 'auto');
                    hasSwap = false;
                    method._setGroupInfo(groups);
                    method._setSortableInfo(true);
                    options.callback.stop.call(this, e, $el);
                });

                sortables.push(sortable);

                options.callback.init.call(this, sortable);
            });

            groups.push({
                $group: $group,
                $draggable: $draggable,
                $droppable: $droppable
            });
        });

        method._setGroupInfo(groups);
        method._setSortableInfo(true);

        return {
            getGroups: function () { return groups; },
            getSortables: function () { return sortables; },
            setInfo: function () {
                method._setGroupInfo(groups);
                method._setSortableInfo(true);
            },
            removeSortable: function (sortable) {
                var index = -1;
                for (var i = 0; i < sortables.length; i++) {
                    if (sortables[i] == sortable) {
                        index = i;
                        break;
                    }
                }

                if (index == -1) {
                    return;
                }

                sortables[index].$layer.remove();
                sortables.splice(index, 1);
                method._setGroupInfo(groups);
                method._setSortableInfo(true);
            },
            removeSortables: function (arrSortable) {
                if (arrSortable.length == 0) {
                    return;
                }

                var tmpSortables = [],
                    has = false;

                for (var i = 0; i < sortables.length; i++) {

                    has = false;

                    for (var j = 0; j < arrSortable.length; j++) {
                        if (sortables[i] == arrSortable[j]) {
                            has = true;
                            break;
                        }
                    }

                    if (!has) {
                        tmpSortables.push(sortables[i]);
                    }
                }

                sortables = tmpSortables;
                method._setGroupInfo(groups);
                method._setSortableInfo(true);
            },
            removeGroup: function ($el) {

                if (!$el || $el.length == 0) {
                    return;
                }
                var index = -1;

                for (var i = 0; i < groups.length; i++) {

                    if ($el[0] == groups[i].$group[0]) {
                        index = i;
                        break;
                    }
                }
                if (index == -1) {
                    return;
                }
                groups.splice(index, 1);
            },
            destory: function () {
                for (var i = 0; i < sortables.length; i++) {
                    sortables[i].destory();
                    sortables[i] = null;
                }
                sortables = [];
            }
        };

    };

    return DragDrop;
});
