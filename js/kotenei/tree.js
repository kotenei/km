/*
 * 树型模块
 * @date:2014-10-22
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/tree', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

    
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
            ROOTS: 'roots',
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
        },
        getIndex: function (node, nodes) {
            for (var i = 0; i < nodes.length; i++) {
                if (node.nodeId === nodes[i].nodeId) {
                    return i;
                }
            }
            return -1;
        }
    };


    var isCheckRadio = false;

    /**
     * view的操作
     * @type {Object}
     */
    var view = {
        getLineHtml: function (node,options) {

            if (!options.view.showLine) {
                return;
            }

            var lineType = _consts.line.CENTER;

            if (node.isFirst && node.parentId === 0) {
                lineType = _consts.line.ROOTS;
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
        getIconHtml: function (node,options) {

            
            if (!options.view.showIcon) {
                return;
            }
            

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

            var checked = String(node.checked === true);
            var className;

            if (options.check.chkType === 'radio') {
                if (!isCheckRadio) {
                    isCheckRadio = true;
                } else {
                    checked = false;
                }
            }

            className = options.check.chkType + '_' + checked + '_' + (node.chkDisabled ? 'part' : 'full');

            return '<span id="chk_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' chk ' + className + '"></span>';

        },
        //getOperateHtml: function (node, options) {
        //    var str = [];

        //    if (!options.edit.enable) {
        //        return '';
        //    }

        //    if (options.edit.showAddBtn) {
        //        str.push('<span id="add_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' add"></span>');
        //    }
        //    if (options.edit.showEditBtn) {
        //        str.push('<span id="edit_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' edit"></span>');
        //    }
        //    if (options.edit.showRemoveBtn) {
        //        str.push('<span id="remove_' + node.nodeId + '" nId="' + node.nodeId + '"  class="' + _consts.className.ICON + ' remove"></span>');
        //    }

        //    return str.join('');
        //},
        replaceSwitchClass: function ($element, newName) {
            var className = $element.attr('class');

            if (!className) { return; }
            var tmpList = className.split('_');

            switch (newName) {
                case _consts.line.ROOT:
                case _consts.line.ROOTS:
                case _consts.line.CENTER:
                case _consts.line.BOTTOM:
                    tmpList[0] = _consts.className.ICON + ' ' + _consts.className.SWITCH + ' ' + newName;
                    break;
                case _consts.floder.OPEN:
                case _consts.floder.CLOSE:
                case _consts.floder.DOCU:
                    tmpList[1] = newName;
                    break;
            }

            $element.attr('class', tmpList.join('_'));
        },
        replaceChkClass: function ($element, checked) {
            $element.attr('class', $element.attr('class').replace(checked ? 'false' : 'true', checked ? 'true' : 'false'));
        }
    };

    /**
     * 树型类
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Tree = function ($element, options) {
        this.$element = $element;

       
        this.options = $.extend(true, {
            data: [],
            edit: {
                enable: false
                //showAddBtn: false,
                //showEditBtn: false,
                //showRemvoeBtn: false
            },
            check: {
                enable: false,                          // 是否启用
                chkType: 'checkbox',                    // 单选框还是复选框，默认复选
                chkBoxType: { Y: "ps", N: "ps" }        // Y：选中时对父与子级的关联关系，N：取消选中时对父与子级的关联关系，p:父级,s:子级
            },
            callback: {
                beforeCheck: $.noop,
                beforeSelect: $.noop,
                beforeAdd: $.noop,
                beforeRemove: $.noop,

                onCheck: $.noop,
                onSelect: $.noop,
                onAdd: $.noop,
                onRemove: $.noop
            },
            view: {
                showLine: true,
                showIcon: true
            }
        }, options);

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

            if (i === 0 && (i + 1) < data.length) {
                node.isFirst = true;
            } else if ((i + 1) === data.length) {
                node.isLast = true;
            }


            node.hasChildren = this.hasChildren(node);
            node.isParent = node.hasChildren;

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
                $children = self.$tree.find('#ul_' + id),
                $icon = self.$tree.find('#icon_' + id);

            if ($children.length === 0) { return; }
            $children.slideToggle('fast', function () {
                view.replaceSwitchClass($this, $children[0].style.display === "none" ? _consts.floder.CLOSE : _consts.floder.OPEN);
                view.replaceSwitchClass($icon, $children[0].style.display === "none" ? _consts.floder.CLOSE : _consts.floder.OPEN);
            });

        }).on('click', '.chk', function () {
            //复选或单选
            var $this = $(this),
                id = $this.attr('nId'),
                node = self.getNode(id),
                className = this.className,
                checkedNodes = self.getCheckedNodes(),
                checked = className.indexOf('true') === -1;

            if (self.options.callback.beforeCheck() === false) {
                return;
            }

            if (node.chkDisabled) { return; }

            node.checked = checked;
            view.replaceChkClass($this, node.checked);

            if (self.options.check.chkType === "checkbox") {
                self.check(node);
            } else {
                for (var i = 0; i < checkedNodes.length; i++) {
                    if (checkedNodes[i] != node) {
                        checkedNodes[i].checked = false;
                        view.replaceChkClass(self.$tree.find('#chk_' + checkedNodes[i].nodeId), false);
                    }
                }
            }

            self.options.callback.onCheck(node);

        }).on('click', 'a', function () {
            //选择
            var $this = $(this);

            if (self.options.callback.beforeSelect() === false) {
                return;
            }

            if ($this.hasClass(_consts.node.SELECTED)) { return; }
            self.$element.find('a').removeClass(_consts.node.SELECTED);
            $this.addClass(_consts.node.SELECTED);

            self.options.callback.onSelect(self.getSelectedNode());

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
                html.push(view.getLineHtml(node,this.options));
                html.push(view.getChkHtml(node, this.options));
                html.push('<a href="javascript:void(0);" id="a_' + node.nodeId + '" nId="' + node.nodeId + '">');
                html.push(view.getIconHtml(node,this.options));
                html.push('<span>' + node.text + '</span>');
                //html.push(view.getOperateHtml(node, this.options));
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
                view.replaceSwitchClass($switch, _consts.floder.OPEN);
                view.replaceSwitchClass($icon, _consts.floder.OPEN);
            } else {

                var lastNode = parentNode.nodes[parentNode.nodes.length - 1];
                var $last = $parent.find('#li_' + lastNode.nodeId);
                $last.children('ul').addClass('line');

                var $switch = $last.find('#' + _consts.className.SWITCH + "_" + lastNode.nodeId);
                lastNode.isLast = false;
                //需要改变同级节点的line
                view.replaceSwitchClass($switch, _consts.line.CENTER);
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

        var parentNode = this.getNode(node.parentId);
        var childNodes = this.getChildNodes(node);
        var $parent = this.$tree.find('#li_' + node.parentId);
        var $current = this.$tree.find('#li_' + node.nodeId);
        var $prev = $current.prev();
        var $next = $current.next();
        var prevNode = this.getNode($prev.attr('nId'));
        var nextNode = this.getNode($next.attr('nId'));

        //删除当前节点下所有子节点
        for (var i = 0; i < childNodes.length; i++) {
            this.$tree.find('#li_' + childNodes[i].nodeId).remove();
            delete this.nodes[this.prefix + childNodes[i].nodeId];
        }

        //有父节点，表明当前删除节点是子节点
        if (parentNode) {
            var index = utils.getIndex(node, parentNode.nodes);
            if (index >= 0) {
                parentNode.nodes.splice(index, 1);
            }

            if (parentNode.nodes.length === 0) {
                $current.parent().remove();
                parentNode.isParent = false;
                parentNode.open = false;
                view.replaceSwitchClass($parent.find('#' + _consts.className.SWITCH + '_' + parentNode.nodeId), _consts.floder.DOCU);
                view.replaceSwitchClass($parent.find('#' + _consts.className.ICON + '_' + parentNode.nodeId), _consts.floder.DOCU);
            }
        }

        if (prevNode) {
            if (node.isLast) {
                prevNode.isLast = true;

                $prev.children('ul').removeClass('line');

                if (prevNode.isFirst && prevNode.parentId === 0) {
                    view.replaceSwitchClass($prev.find('#' + _consts.className.SWITCH + '_' + prevNode.nodeId), _consts.line.ROOT);
                } else {
                    view.replaceSwitchClass($prev.find('#' + _consts.className.SWITCH + '_' + prevNode.nodeId), _consts.line.BOTTOM);
                }
            }
        }


        if (node.isFirst && node.parentId === 0) {
            if (nextNode) {
                nextNode.isFirst = true;
                view.replaceSwitchClass($next.find('#' + _consts.className.SWITCH + '_' + nextNode.nodeId), _consts.line.ROOT);
            }
        }

        $current.remove();
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
        for (var i = 0, node, $elm; i < nodes.length; i++) {
            node = nodes[i];
            node.checked = checked;
            $elm = this.$tree.find('#chk_' + node.nodeId);
            if (node.chkDisabled) {
                continue;
            }
            view.replaceChkClass($elm, checked);
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
        var $selected = this.$tree.find('a.selected');
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
