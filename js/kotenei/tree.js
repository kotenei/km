/*
 * 树型模块
 * @date:2014-10-22
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/tree', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

    /**
     * 默认参数
     * @type {Object}
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
            beforeSelect: null,
            beforeAdd: null,
            beforeRename: null,
            beforeExpand: null,
            beforeRemove: null,

            onCheck: null,
            onSelect: null,
            onAdd: null,
            onRename: null,
            onExpand: null,
            onRemove: null
        }
    };

    /**
     * 常量
     * @type {Object}
     */
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

    /**
     * 工具
     * @type {Object}
     */
    var utils = {
        isArray: function (data) {
            return data instanceof Array;
        }
    };

    /**
     * view的操作
     * @type {Object}
     */
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
        replaceSwitchClass: function (element) {
            var className = element.className;
            if (className.indexOf(_consts.floder.OPEN) !== -1) {
                className = className.replace(new RegExp(_consts.floder.OPEN, 'ig'), _consts.floder.CLOSE);
            } else {
                className = className.replace(new RegExp(_consts.floder.CLOSE, 'ig'), _consts.floder.OPEN);
            }
            element.className = className;
        },
        replaceChkClass: function (element, checked) {
            element.className = element.className.replace(new RegExp(checked ? 'false' : 'true'), checked ? 'true' : 'false');
        },

    };

    /**
     * 树型类
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Tree = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, DEFAULTS, options);
        this.nodes = {};
        this.prefix = 'node';
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Tree.prototype.init = function () {
        this.initNodes(this.options.data);
        this.createTree();
        this.eventBind();
    };

    /**
     * 初始化节点
     * @param  {Array} data - 数组节点
     * @return {Void}
     */
    Tree.prototype.initNodes = function (data) {
        if (!utils.isArray(data) || data.length === 0) {
            return;
        }

        for (var i = 0, node; i < data.length; i++) {
            node = data[i];

            if (node.parentId === 0 && i === 0 && (i + 1) < data.length) {
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

    /**
     * 事件绑定
     * @return {Void}       
     */
    Tree.prototype.eventBind = function () {
        var self = this;

        this.$element.on('click', "." + _consts.className.SWITCH, function () {
            //展开或收缩
            var $this = $(this),
                id = $this.attr('nId'),
                $children = self.$element.find('#ul_' + id),
                $icon = self.$element.find('#icon_' + id);

            if ($children.length === 0) { return; }
            $children.slideToggle('fast');
            view.replaceSwitchClass(this);
            view.replaceSwitchClass($icon[0]);
        }).on('click', '.chk', function () {
            //复选或单选
            var $this = $(this),
                id = $this.attr('nId'),
                node = self.getNode(id),
                className = this.className,
                checkedNodes = self.getCheckedNodes(),
                checked;

            if (node.chkDisabled) { return; }

            node.checked = className.indexOf('true') === -1;
            view.replaceChkClass(this, node.checked);

            if (self.options.check.chkType === "checkbox") {
                self.check(node);
            } else {
                for (var i = 0; i < checkedNodes.length; i++) {
                    if (checkedNodes[i] != node) {
                        checkedNodes[i].checked = false;
                        view.replaceChkClass(document.getElementById('chk_' + checkedNodes[i].nodeId), false);
                    }
                }
            }
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

    /**
     * 创建树
     * @return {Void}
     */
    Tree.prototype.createTree = function () {
        var html = [];
        html.push('<ul class="k-tree">');
        this.createNode(this.options.data, html);
        html.push('</ul>');
        this.$tree = $(html.join(''))
        this.$element.append(this.$tree);
    };

    /**
     * 创建节点
     * @param  {Array} data - 数组节点
     * @param  {Array} html - 字符串数组
     * @param  {Object} parentNode - 父节点
     * @return {Void}
     */
    Tree.prototype.createNode = function (data, html, parentNode) {

        var node, line = 'line';

        if (!utils.isArray(data) || data.length === 0 || !utils.isArray(html)) {
            return;
        }

        if (parentNode) {

            if (parentNode.isLast) {
                line = '';
            }

            if (!parentNode.open) {
                html.push('<ul id="ul_' + parentNode.nodeId + '" style="display:none;" class="' + line + '" >');
            } else {
                html.push('<ul id="ul_' + parentNode.nodeId + '" class="' + line + '">');
            }

        }

        for (var i = 0, node; i < data.length; i++) {
            node = this.getNode(data[i].nodeId);
            if (node) {
                html.push('<li id="li_' + node.nodeId + '" nId="' + node.nodeId + '">');
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

        if (parentNode) {
            html.push('</ul>');
        }

    };

    /**
     * 添加节点
     * @param  {Object} parentNode - 父节点
     * @param  {Object|Array} newNodes - 新节点
     * @return {Void}
     */
    Tree.prototype.addNodes = function (parentNode, newNodes) {

        var nodeHtml = [], parentNode;

        if (!utils.isArray(newNodes)) {
            newNodes = [newNodes];
        }

        parentNode = parentNode || this.getNode(newNodes[0].parentId);

        this.initNodes(newNodes);
        this.createNode(newNodes, nodeHtml);

        if (parentNode) {
            var $parent = this.$tree.find('#li_' + parentNode.nodeId);
            var $children = $parent.find('#ul_' + parentNode.nodeId);

            if ($children.length === 0) {
                parentNode.nodes = newNodes;
                var $switch = $parent.find('#' + _consts.className.SWITCH + "_" + parentNode.nodeId);
                var $icon = $parent.find('#' + _consts.className.ICON + "_" + parentNode.nodeId);
                //父节点是一个子节点，需改变父节点的line和icon
                $children = $('<ul class="' + (parentNode.isLast ? "" : "line") + '" />').attr('id', 'ul_' + parentNode.nodeId);
                $switch[0].className = $switch[0].className.replace(_consts.floder.DOCU, _consts.floder.OPEN);
                $icon[0].className = $icon[0].className.replace(_consts.floder.DOCU, _consts.floder.OPEN);

            } else {
                var lastNode = parentNode.nodes[parentNode.nodes.length - 1];
                var $last = $parent.find('#li_' + lastNode.nodeId);
                var $switch = $last.find('#' + _consts.className.SWITCH + "_" + lastNode.nodeId);
                //需要改变同级节点的line
                $switch[0].className = $switch[0].className.replace(_consts.line.BOTTOM, _consts.line.CENTER);
                Array.prototype.push.apply(parentNode.nodes, newNodes);
            }
            $children.append(nodeHtml.join('')).appendTo($parent);
        } else {
            var $last = this.$tree.children('li').last(),
                $lastChildren = $last.find('#ul_' + $last.attr('nid'));
            $lastChildren.addClass('line');
            this.$tree.append(nodeHtml.join(''));
        }
    };

    /**
     * 移除节点
     * @param  {Object} node - 节点
     * @return {Void}
     */
    Tree.prototype.removeNode = function (node) {

        if (!node) { return; }

        if (!utils.isArray(node.nodes)) {
            return;
        } 

        for (var i = 0; i < node.nodes.length; i++) {
            this.removeNode(node.nodes[i]);
            delete this.nodes[this.prefix + node.nodes[i].nodeId];
        }

        delete this.nodes[this.prefix + node.nodeId];
    };

    /**
     * 复选操作
     * @param  {Object} node - 节点
     * @return {Void}
     */
    Tree.prototype.check = function (node) {
        var parentNodes = this.getParentNodes(node),
            childNodes = this.getChildNodes(node),
            parentNode = this.getNode(node.parentId),
            options = this.options;

        if (node.checked) {
            switch (options.check.chkBoxType.Y.toLowerCase()) {
                case "p":
                    this.checkAction(parentNodes, node.checked);
                    break;
                case "s":
                    this.checkAction(childNodes, node.checked);
                    break;
                default:
                    this.checkAction(parentNodes, node.checked);
                    this.checkAction(childNodes, node.checked);
                    break;
            }
        } else {
            switch (options.check.chkBoxType.N.toLowerCase()) {
                case "p":
                    uncheckParent.call(this, parentNode, node.checked);
                    break;
                case "s":
                    this.checkAction(childNodes, node.checked);
                    break;
                default:
                    uncheckParent.call(this, parentNode, node.checked);
                    this.checkAction(childNodes, node.checked);
                    break;
            }
        }

        //取消选择父节点
        function uncheckParent(parentNode, checked) {
            var unchecked = true;
            while (parentNode && utils.isArray(parentNode.nodes)) {
                for (var i = 0, siblingNode; i < parentNode.nodes.length; i++) {
                    siblingNode = parentNode.nodes[i];
                    if (siblingNode.checked) {
                        unchecked = false;
                        break;
                    }
                }
                if (unchecked) {
                    this.checkAction([parentNode], checked);
                    unchecked = true;
                    parentNode = this.getNode(parentNode.parentId);
                } else {
                    return;
                }
            }
        }
    }

    /**
     * 复选关联节点操作
     * @param  {Array} nodes - 数组节点
     * @param  {Boolean} checked - 是否选中
     * @return {Void}
     */
    Tree.prototype.checkAction = function (nodes, checked) {
        for (var i = 0, node, elm; i < nodes.length; i++) {
            node = nodes[i];
            node.checked = checked;
            elm = document.getElementById('chk_' + node.nodeId);
            if (node.chkDisabled) {
                continue;
            }
            view.replaceChkClass(elm, checked);
        }
    };

    /**
     * 获取父子节点
     * @param  {Object} node - 当前节点
     * @return {Array}
     */
    Tree.prototype.getParentChildNodes = function (node) {
        var nodes = this.getParentNodes(node);
        this.getChildNodes(node, nodes);
        return nodes;
    };

    /**
     * 获取父节点
     * @param  {Object} node - 当前节点
     * @return {Array}
     */
    Tree.prototype.getParentNodes = function (node) {
        var parentNode = this.nodes[this.prefix + node.parentId];
        var nodes = [];

        while (parentNode) {
            nodes.push(parentNode);
            parentNode = this.nodes[this.prefix + parentNode.parentId];
        }

        return nodes;
    };

    /**
     * 获取子节点
     * @param  {Object} node - 当前节点
     * @param  {Array} nodes - 存数子节点的数组
     * @return {Array}
     */
    Tree.prototype.getChildNodes = function (node, nodes) {

        if (!nodes) {
            nodes = [];
        }

        if (!utils.isArray(node.nodes)) {
            return nodes;
        }

        for (var i = 0; i < node.nodes.length; i++) {
            nodes.push(node.nodes[i]);
            this.getChildNodes(node.nodes[i], nodes);
        }

        return nodes;
    };

    /**
     * 获取选择的节点
     * @return {Object}
     */
    Tree.prototype.getSelectedNode = function () {
        var $selected = this.$element.find('a.selected');
        if ($selected.length === 0) { return null; }
        var id = $selected.attr('nId');
        return this.getNode(id);
    };

    /**
    * 获取勾选节点
    * @return {Array}
    */
    Tree.prototype.getCheckedNodes = function () {
        var nodes = [];

        for (var key in this.nodes) {
            if (this.nodes[key].checked) {
                nodes.push(this.nodes[key]);
            }
        }
        return nodes;
    }

    /**
     * 根据ID获取节点
     * @return {Object}
     */
    Tree.prototype.getNode = function (id) {
        return this.nodes[this.prefix + id];
    };

    /**
     * 判断当前节点是否有子节点
     * @param  {Object} node - 当前节点
     * @return {Boolean}
     */
    Tree.prototype.hasChildren = function (node) {
        if (node && utils.isArray(node.nodes) && node.nodes.length > 0) {
            return true;
        }
        return false;
    };

    return Tree;
});
