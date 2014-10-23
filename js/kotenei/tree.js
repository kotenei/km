/*
 * 树型模块
 * @date:2014-10-22
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/tree', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

    var nodes = {};

    /**
     * 默认参数
     */
    var DEFAULTS = {
        data: [],
        check: {
            enable: false,                          // 是否启用
            chkType: 'checkbox',                    // 单选框还是复选框，默认复选
            chkBoxType: { Y: "ps", N: "ps" }        // Y：选中时对父与子级的关联关系，N：取消选中时对父与子级的关联关系，p:父级,s:子级
        },
        callback: {
            beforeCheck: null,
            beforeClick: null,
            beforeRename: null,
            beforeExpand: null,
            beforeRemove: null,

            onCheck: null,
            onClick: null,
            onRename: null,
            onExpand: null,
            onRemove: null
        }
    };

    var _consts = {
        className: {
            icon: 'icon',
            switch: 'switch'
        },
        floder: {
            open: 'open',
            close: 'close',
            docu: 'docu'
        },
        node: {
            curSelected: 'selected'
        }
    };

    var utils = {

    };

    var Tree = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, DEFAULTS, options);
        this.nodes = {};
        this.init();
    };

    Tree.prototype.init = function () {
        this.initNodes(this.options.data);
        this.eventBind();

    };

    Tree.prototype.initNodes = function (data) {
        if (!(data instanceof Array) || data.length === 0) {
            return;
        }
        for (var i = 0; i < data.length; i++) {
            this.nodes["node" + data[i].nodeId] = data[i];
            this.initNodes(data[i].nodes);
        }
    }



    Tree.prototype.eventBind = function () {

        this.$element.on('click', _consts.className.switch, function () {
            //expand
            var $this = $(this),
                $children = $this.parent().children('ul'),
                $icon = $this.next().children('span').first();
            className = this.className;
            $children.slideToggle('fast');

            if (className.indexOf('close') !== -1) {
                className = className.replace('close', 'open');
            } else {
                className = className.replace('open', 'close');
            }
            this.className = className;
        });

    };

    Tree.prototype.method = {
        add: function () { },
        edit: function () { },
        remove: function () { }
    };

    return Tree;
});
