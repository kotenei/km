define('km/portlets', ['jquery', 'km/window', 'km/dragdrop'], function ($, Window, Dragdrop) {

    var groupSortable,
        webPartSortable;

    var groupMoving = false,
        isSetGroup = false;

    var method = {
        group: {
            init: function ($container, options) {
                //组排序
                groupSortable = Dragdrop.sortable($container, {
                    $scrollWrap:options.$scrollWrap,
                    draggable: 'div.group',
                    handle: 'div.group-head-handle',
                    boundary: true,
                    direction: 'v',
                    callback: {
                        init: function () {

                        },
                        start: options.callback.start,
                        move: options.callback.move,
                        stop: options.callback.stop
                    }
                });
            },
            toggle: function ($el, options) {
                var $group = $el.parents('div.group:eq(0)'),
                    $body = $group.find('div.group-body');

                if ($el.hasClass('fa-minus-square-o')) {
                    $el.removeClass('fa-minus-square-o').addClass('fa-plus-square-o');
                    options.callback.hide($el);
                } else {
                    $el.removeClass('fa-plus-square-o').addClass('fa-minus-square-o');
                    options.callback.show($el);
                }

                $group.toggleClass('group-hide');

                webPartSortable.setInfo();
                groupSortable.setInfo();
            },
            refresh: function () {

            },
            close: function ($el) {
                var $group = $el.parents('div.group:eq(0)'),
                    sortable = $group.data('sortable');
                Window.confirm('删除', '您确认要删除该模块吗？', function () {

                    var $webParts = sortable.$layer.find('div.webPart'),
                        sortables = [];

                    $webParts.each(function () {
                        var sortable = $(this).data('sortable');
                        if (sortable) {
                            sortables.push(sortable);
                        }
                    });

                    //删除组排序项
                    groupSortable.removeSortable(sortable);

                    //删除部件中的组
                    webPartSortable.removeGroup($group);

                    //删除部件排序项
                    webPartSortable.removeSortables(sortables);

                });
            }
        },
        webpart: {
            init: function ($container, options) {

                //项排序
                webPartSortable = Dragdrop.sortable($container, {
                    $scrollWrap: options.$scrollWrap,
                    draggable: 'div.webPart',
                    droppable: 'div.column',
                    group: 'div.group',
                    handle: 'div.webPart-head-handle',
                    boundary: true,
                    callback: {
                        init: function (sortable) {
                            sortable.portletsOptions = eval('(0,' + sortable.$layer.attr('data-options') + ')');
                        },
                        start: options.callback.start,
                        move: options.callback.move,
                        stop: options.callback.stop
                    }
                });
            },
            toggle: function ($el, options) {
                var $panel = $el.parents('div.webPart:eq(0)'),
                    $body = $panel.find('div.webPart-body');

                if ($el.hasClass('fa-minus-square-o')) {
                    $el.removeClass('fa-minus-square-o').addClass('fa-plus-square-o');
                    options.callback.hide($el);
                } else {
                    $el.removeClass('fa-plus-square-o').addClass('fa-minus-square-o');
                    options.callback.show($el);
                }

                $panel.toggleClass('webPart-hide');

                webPartSortable.setInfo();
                groupSortable.setInfo();
            },
            refresh: function () {

            },
            setting: function () {

            },
            close: function ($el) {
                var $layer = $el.parents('div.webPart:eq(0)'),
                    sortable = $layer.data('sortable');

                Window.confirm('删除', '您确认要删除该模块吗？', function () {
                    webPartSortable.removeSortable(sortable);
                });
            }
        }
    };




    return function ($container, options) {

        var tm;

        options = $.extend(true, {
            group: {
                callback: {
                    init: $.noop,
                    hide: $.noop,
                    show: $.noop,
                    start: $.noop,
                    move: $.noop,
                    stop: $.noop
                }
            },
            webpart: {
                callback: {
                    init: $.noop,
                    hide: $.noop,
                    show: $.noop,
                    start: $.noop,
                    move: $.noop,
                    stop: $.noop
                }
            }
        }, options);
        method.group.init($container, options.group);
        method.webpart.init($container, options.webpart);
        //事件监控
        $container.off('click.portlets').on('click.portlets', '[data-role=gtoggle]', function () {
            //组显示隐藏
            method.group.toggle($(this), options.group);
            return false;
        }).on('click.portlets', '[data-role=grefresh]', function () {
            //组刷新
            method.group.refresh();
            return false;
        }).on('click.portlets', '[data-role=gclose]', function () {
            //组关闭
            method.group.close($(this));
            return false;
        }).on('click.portlets', '[data-role=wtoggle]', function () {
            //部件显示隐藏
            method.webpart.toggle($(this), options.webpart);
            return false;
        }).on('click.portlets', '[data-role=wrefresh]', function () {
            //部件刷新
            method.webpart.refresh();
            return false;
        }).on('click.portlets', '[data-role=wsetting]', function () {
            //部件设置
            method.webpart.setting();
            return false;
        }).on('click.portlets', '[data-role=wclose]', function () {
            //部件关闭
            method.webpart.close($(this));
            return false;
        })

        $(window).off('resize.portlets')
                .on('resize.portlets', function () {
                    if (tm) {
                        clearTimeout(tm);
                    }
                    tm = setTimeout(function () {
                        groupSortable.setInfo();
                        webPartSortable.setInfo();
                    }, 300);
                });

        return {
            groupSortable: groupSortable,
            webPartSortable: webPartSortable,
            destory: function () {
                groupSortable.destory();
                webPartSortable.destory();
            }
        };
    };
});