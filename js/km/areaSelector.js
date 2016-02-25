/*
 * 区域选择器
 * @date:2016-02-25
 * @author:kotenei(kotenei@qq.com)
 */
define('km/areaSelector', ['jquery'], function ($) {
    return function (options) {
        options = $.extend(true, {
            $container: $(document.body),
            zIndex: 9999,
            autoScroll: true,
            autoScrollDealy: 5,
            isDraw: true,
            callback: {
                onStart: $.noop,
                onMove: $.noop,
                onStop: $.noop
            }
        }, options);
        var $container = options.$container;
        var doc = document;
        var $doc = $(doc);
        var $scrollWrap = $container[0].tagName.toLowerCase() == 'body' ? $(window) : $container;
        var coord = { bx: 0, by: 0, mx: 0, my: 0, ex: 0, ey: 0 };
        var containerInfo = {
            left: $container.offset().left,
            top: $container.offset().top,
            width: $container.outerWidth(),
            height: $container.outerHeight()
        };
        var autoScrollActive = false;
        var $range, w_h, d_h;

        $container.off('mousedown.rangeSelector').on('mousedown.rangeSelector', function (e) {
            if (!$range) {
                $range = $('<div class="k-areaSelector"></div>').css('zIndex', options.zIndex).appendTo(doc.body);
            }
            method.start(e);
            //禁止文档选择事件
            doc.onselectstart = function () { return false };
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        var method = {
            start: function (e) {
                var self = this;
                //获取鼠标位置
                var mouseCoord = this.getMouseCoord(e);
                coord.bx = parseInt(mouseCoord.x);
                coord.by = parseInt(mouseCoord.y);

                w_h = $scrollWrap.height();
                d_h = $doc.height();

                $doc.on('mousemove.rangeSelector', function (e) {
                    self.move(e);
                }).on('mouseup.rangeSelector', function (e) {
                    self.stop(e);
                    $doc.off('mousemove.rangeSelector');
                    $doc.off('mouseup.rangeSelector');
                });
                options.callback.onStart(e, coord);
            },
            move: function (e) {
                var mouseCoord = this.getMouseCoord(e);
                coord.mx = parseInt(mouseCoord.x);
                coord.my = parseInt(mouseCoord.y);

                if (options.isDraw) {
                    this.draw(coord);
                }

                if (options.autoScroll) {
                    if (e.clientY <= 10 || e.clientY >= w_h - 10) {
                        if (e.clientY <= 10 && !autoScrollActive) {
                            autoScrollActive = true;
                            this.scroll(-1, e.clientY);
                        }
                        if (e.clientY >= (w_h - 10) && mouseCoord.y < (d_h + 100) && !autoScrollActive) {
                            autoScrollActive = true;
                            this.scroll(1, e.clientY);
                        }
                    } else {
                        autoScrollActive = false;
                    }
                }

                options.callback.onMove(e, coord);
            },
            stop: function (e) {
                var mouseCoord = this.getMouseCoord(e);
                coord.ex = parseInt(mouseCoord.x);
                coord.ey = parseInt(mouseCoord.y);
                autoScrollActive = false;
                $range.hide();
                options.callback.onStop(e, coord);
            },
            getMouseCoord: function (e) {
                return {
                    x: e.pageX || e.clientX + document.body.scrollLeft - document.body.clientLeft,
                    y: e.pageY || e.clientY + document.body.scrollTop - document.body.clientTop
                };
            },
            scroll: function (direction, yPos) {
                var self = this;
                var scrollTop = $scrollWrap.scrollTop();
                if (direction < 0) {
                    if (scrollTop > 0) {
                        scrollTop -= 5;
                        $scrollWrap.scrollTop(scrollTop);
                    } else {
                        autoScrollActive = false;
                    }
                } else {
                    if (yPos >= (w_h - 10)) {
                        scrollTop += 5;
                        $scrollWrap.scrollTop(scrollTop);
                    } else {
                        autoScrollActive = false;
                    }
                }

                if (autoScrollActive) {
                    this.tm = setTimeout(function () {
                        self.scroll(direction, yPos);
                    }, options.autoScrollDealy);
                } else {
                    if (this.tm) {
                        clearTimeout(this.tm);
                    }
                }
            },
            draw: function (cord) {
                var css = {
                    display: 'block',
                    top: coord.by < coord.my ? coord.by : coord.my,
                    left: coord.bx < coord.mx ? coord.bx : coord.mx,
                    width: Math.abs(coord.mx - coord.bx),
                    height: Math.abs(coord.my - coord.by)
                };

                var a_h = css.top + css.height,
                    a_w = css.left + css.width,
                    c_h = containerInfo.top + containerInfo.height,
                    c_w = containerInfo.left + containerInfo.width;

                if (a_h >= c_h) {
                    css.height = c_h - css.top;
                }

                if (a_w >= c_w) {
                    css.width = c_w - css.left;
                }

                if (css.left <= containerInfo.left) {
                    css.width = css.width - (containerInfo.left - css.left);
                    css.left = containerInfo.left;
                }

                if (css.top <= containerInfo.top) {
                    css.height = css.height - (containerInfo.top - css.top);
                    css.top = containerInfo.top;
                }

                $range.css(css);
            }
        };
    };
});
