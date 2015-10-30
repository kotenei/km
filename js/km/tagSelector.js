/*
 * 标签选择模块
 * @date:2015-08-16
 * @author:kotenei(kotenei@qq.com)
 */
define('km/tagSelector', ['jquery'], function ($) {

    var identity = 1,
        $selector,
        $layer,
        $left, $top, $right, $bottom;

    var method = {
        setSidePosition: function ($target) {

            var info = {
                width: $target.outerWidth(),
                height: $target.outerHeight(),
                top: $target.offset().top,
                left: $target.offset().left
            };

            var offset = 0;

            $left.css({ left: info.left - offset, top: info.top, height: info.height }).show();
            $top.css({ left: info.left, top: info.top - offset, width: info.width + offset * 2 }).show();
            $right.css({ left: info.left + info.width + offset, top: info.top, height: info.height }).show();
            $bottom.css({ left: info.left, top: info.top + info.height + offset, width: info.width + offset * 2 }).show();

        },
        sideHide: function () {
            $left.hide();
            $top.hide();
            $right.hide();
            $bottom.hide();
        },
        showLayer: function ($target) {
            var info = {
                width: $target.outerWidth(),
                height: $target.outerHeight(),
                top: $target.offset().top,
                left: $target.offset().left
            };

            $layer.show().css(info);
        },
        hideLayer: function () {
            $layer.hide();
        }
    };

    return function ($elms, options) {

        if ($elms && ! ($elms instanceof $)) {
            options = $elms;
            $elms = $('[data-module=tagselector]');
        }

        options = $.extend(true, {
            callback: {
                onClick: $.noop
            }
        }, options || {});

        $elms = $elms || $('[data-module=tagselector]');

        $elms = $elms.map(function () {
            if (!this.getAttribute('data-isInit')) {
                this.setAttribute('data-isInit', true);
                return this;
            }
        });


        if (!$elms || $elms.length == 0) {
            return;
        }

        if (!$selector) {
            var html = '<div class="k-tagSelector-layer"></div>' +
                        '<div class="k-tagSelector-leftside"></div>' +
                        '<div class="k-tagSelector-topside"></div>' +
                        '<div class="k-tagSelector-rightside"></div>' +
                        '<div class="k-tagSelector-bottomside"></div>';

            $selector = $(html).appendTo(document.body);
            $layer = $selector.filter('div.k-tagSelector-layer');
            $left = $selector.filter('div.k-tagSelector-leftside');
            $top = $selector.filter('div.k-tagSelector-topside');
            $right = $selector.filter('div.k-tagSelector-rightside');
            $bottom = $selector.filter('div.k-tagSelector-bottomside');
        }

        var $curElm;

        $elms.on('mouseover.tagSelector', function () {
            method.setSidePosition($(this).addClass('k-tagSelector-curr'));
            return false;
        }).on('mouseout.tagSelector', function () {
            $(this).removeClass('k-tagSelector-curr');
            method.sideHide();
        }).on('click.tagSelector', function () {
            var $el = $(this),
                onclick = $el.attr('data-onclick');

            $curElm = $el;

            method.showLayer($el, $layer);

            if (onclick && onclick.length > 0) {
                onclick = eval('(0,' + onclick + ')');
                onclick($el);
            } else {
                options.callback.onClick($el, $layer);
            }

            return false;
        });

        $layer.on('click.tagSelector', function () {
            $layer.hide();
            return false;
        });

        $(window).on('resize.tagSelector', function () {
            if (!$curElm) {
                return;
            }
            method.showLayer($curElm, $layer);
        });

        $(document).on('click.tagSelector', function () {
            $layer.hide();
            $curElm = null;
        });

    };

});