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
        edit: {
            enable: false,
            showAddBtn: false,
            showEditBtn: false,
            showRemvoeBtn: false
        },
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
            var lineType = _consts.line.CENTER;

            if (node.isFirst && node.parentId === 0) {
                lineType = _consts.line.ROOT;
            } else if (node.isLast) {
                lineType = _consts.line.BOTTOM;
            }


            if (node.hasChildren) {
                if (node.open) {
                    lineType += "_" + _consts.floder.OPEN;
                } else {
                    lineType += "_" + _consts.floder.CLOSE;
                }
            } else {
                lineType += "_" + _consts.floder.DOCU;
            }

            return '<span id="switch_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' ' + _consts.className.SWITCH + ' ' + lineType + '"></span>';
        },
        getIconHtml: function (node) {
            html = '<span id="' + _consts.className.ICON + '_' + node.nodeId + '" class="' + _consts.className.ICON + ' ico_' + _consts.floder.DOCU + '"></span>';
            if (node.hasChildren) {
                //有子节点
                if (node.open) {
                    html = '<span id="' + _consts.className.ICON + '_' + node.nodeId + '"  class="' + _consts.className.ICON + ' ico_' + _consts.floder.OPEN + '"></span>';
                } else {
                    html = '<span id="' + _consts.className.ICON + '_' + node.nodeId + '"  class="' + _consts.className.ICON + ' ico_' + _consts.floder.CLOSE + '"></span>';
                }
            }
            return html;
        },
        getChkHtml: function (node, options) {
            if (!options.check.enable || node.noCheck) {
                return '';
            }
            return '<span id="chk_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' chk ' + options.check.chkType + '_' + String(node.checked === true) + '_' + (node.chkDisabled ? 'part' : 'full') + '"></span>';

        },
        getOperateHtml: function (node, options) {
            var str = [];

            if (!options.edit.enable) {
                return '';
            }

            if (options.edit.showAddBtn) {
                str.push('<span id="add_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' add"></span>');
            }
            if (options.edit.showEditBtn) {
                str.push('<span id="edit_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' edit"></span>');
            }
            if (options.edit.showRemoveBtn) {
                str.push('<span id="remove_' + node.nodeId + '" nId="' + node.nodeId + '"  class="' + _consts.className.ICON + ' remove"></span>');
            }

            return str.join('');
        },
        replaceClass: function (element) {
            var className = element.className;
            if (className.indexOf(_consts.floder.OPEN) !== -1) {
                className = className.replace(new RegExp(_consts.floder.OPEN, 'ig'), _consts.floder.CLOSE);
            } else {
                className = className.replace(new RegExp(_consts.floder.CLOSE, 'ig'), _consts.floder.OPEN);
            }
            element.className = className;
        }
    };

    var Tree = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, DEFAULTS, options);
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

            node.hasChildren = this.hasChildren(node);
            this.nodes[this.prefix + node.nodeId] = node;
            this.initNodes(node.nodes);
        }
    };

    Tree.prototype.eventBind = function () {
        var self = this;

        this.$element.on('click', "." + _consts.className.SWITCH, function () {
            //展开/收缩
            var $this = $(this),
                id = $this.attr('nId'),
                $children = self.$element.find('#ul_' + id),
                $icon = self.$element.find('#icon_' + id);

            if ($children.length === 0) { return; }
            $children.slideToggle('fast');
            view.replaceClass(this);
            view.replaceClass($icon[0]);
        }).on('click', '.chk', function () {
            var $this = $(this),
                id = $this.attr('nId'),
                node = self.getNode(id);
            if ($this.hasClass('checkbox_false_part')) { return; }

            var nodes = self.getPCNodes(node);

            console.log(nodes)

        }).on('click', 'a', function () {
            //选择
            var $this = $(this);
            if ($this.hasClass(_consts.node.SELECTED)) { return; }
            self.$element.find('a').removeClass(_consts.node.SELECTED);
            $this.addClass(_consts.node.SELECTED);
        }).on('click', '.add', function () {
            //添加
            var $this = $(this);
        }).on('click', '.edit', function () {
            //编辑
            var $this = $(this);
        }).on('click', '.remove', function () {
            //删除
            var $this = $(this);
        });
    };

    Tree.prototype.createTree = function () {
        var html = [], $elm;
        this.createNode(this.options.data, html);
        $elm = $(html.join('')).addClass('k-tree');
        this.$element.append($elm);
    };

    Tree.prototype.createNode = function (data, html, parent) {

        var node, line = 'line';

        if (!utils.isArray(data) || data.length === 0 || !utils.isArray(html)) {
            return;
        }

        if (parent) {

            if (parent.isLast) {
                line = '';
            }

            if (!parent.open) {
                html.push('<ul id="ul_' + parent.nodeId + '" style="display:none;" class="' + line + '" >');
            } else {
                html.push('<ul id="ul_' + parent.nodeId + '" class="' + line + '">');
            }

        } else {
            html.push('<ul>');
        }

        for (var i = 0, node; i < data.length; i++) {
            node = this.getNode(data[i].nodeId);
            if (node) {
                html.push('<li id="li_' + node.nodeId + '">');
                html.push(view.getLineHtml(node));
                html.push(view.getChkHtml(node, this.options));
                html.push('<a href="javascript:void(0);" id="a_' + node.nodeId + '" nId="' + node.nodeId + '">');
                html.push(view.getIconHtml(node));
                html.push('<span>' + node.text + '</span>');
                html.push(view.getOperateHtml(node, this.options));
                html.push('</a>');
                this.createNode(node.nodes, html, node);
                html.push('</li>');
            }
        }

        html.push('</ul>');
    };

    Tree.prototype.addNode = function (node, parent) {
        this.initNodes([node]);
    };

    Tree.prototype.removeNode = function (node) {
        delete this.nodes[this.prefix + node.id];
    };

    //获取父节点
    Tree.prototype.getPCNodes = function (node) {
        var parentNode = this.nodes[this.prefix + node.parentId];
        var nodes = [];

        while (parentNode) {
            nodes.push(parentNode);
            parentNode = this.nodes[this.prefix + parentNode.parentId];
        }

        this.getChildNodes(node, nodes);

        return nodes;
    };

    //获取子节点
    Tree.prototype.getChildNodes = function (node, nodes) {
        if (!utils.isArray(node.nodes)) {
            return;
        }

        for (var i = 0; i < node.nodes.length; i++) {
            nodes.push(node.nodes[i]);
            this.getChildNodes(node.nodes[i], nodes);
        }

    };

    Tree.prototype.getSelected = function () {
        var $selected = this.$element.find('a.selected');
        if ($selected.length === 0) { return null; }
        var id = $selected.attr('nId');
        return this.getNode(id);
    };

    Tree.prototype.getNode = function (id) {
        return this.nodes[this.prefix + id];
    };

    Tree.prototype.hasChildren = function (node) {
        if (node && utils.isArray(node.nodes) && node.nodes.length > 0) {
            return true;
        }
        return false;
    };

    return Tree;
});
