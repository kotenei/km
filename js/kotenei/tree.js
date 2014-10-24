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
            ICON: 'icon',
            SWITCH: 'switch'
        },
        floder: {
            OPEN: 'open',
            CLOSE: 'close',
            DOCU: 'docu'
        },
        line: {
            ROOT: 'root',
            CENTER: 'center',
            BOTTOM: 'bottom'
        },
        node: {
            SELECTED: 'selected'
        }
    };

    var utils = {
        isArray: function (data) {
            return data instanceof Array;
        }
    };

    var view = {
        getLineHtml: function (node) {
            return '';
        },
        getIconHtml: function (node) {
            return '';
        }
    };

    var Tree = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, DEFAULTS, options);
        this.nodes = {};
        this.prefix = 'node';
        this.init();
    };

    Tree.prototype.init = function () {
        this.initNodes(this.options.data);
        this.createTree();
        this.eventBind();
    };

    Tree.prototype.initNodes = function (data) {
        if (!utils.isArray(data) || data.length === 0) {
            return;
        }

        for (var i = 0, node; i < data.length; i++) {
            node = data[i];

            if (node.parentId === 0 && i === 0) {
                node.isFirst = true;
            }

            if ((i + 1) === data.length) {
                node.isLast = true;
            }

            this.nodes[this.prefix + node.nodeId] = node;
            this.initNodes(node.nodes);
        }
    };

    Tree.prototype.eventBind = function () {

        this.$element.on('click', _consts.className.SWITCH, function () {

        });

    };

    Tree.prototype.createTree = function () {
        var html = [], $elm;
        this.createNode(this.options.data, html);
        $elm = $(html.join('')).addClass('k-tree');
        this.$element.append($elm);
    };

    Tree.prototype.createNode = function (data, html) {

        if (!utils.isArray(data) || data.length === 0 || !utils.isArray(html)) {
            return;
        }

        html.push('<ul>');

        for (var i = 0, node; i < data.length; i++) {
            node = this.getNode(data[i].nodeId);
            if (node) {
                html.push('<li>');
                html.push(view.getLineHtml(node));
                html.push('<a href="javascript:void(0);">');
                html.push(view.getIconHtml(node));
                html.push('<span>' + node.text + '</span>');
                html.push('</a>');
                this.createNode(node.nodes, html);
                html.push('</li>');
            }
        }

        html.push('</ul>');
    };

    Tree.prototype.addNode = function (node) {
        this.initNodes([node]);
    };

    Tree.prototype.removeNode = function (node) {
        delete this.nodes[this.prefix + node.id];
    };

    Tree.prototype.getNode = function (id) {
        return this.nodes[this.prefix + id];
    };

    Tree.prototype.hasNode = function (id) {
        var node = this.getNode(id);
        return node !== null && node !== undefined;
    };

    return Tree;
});
