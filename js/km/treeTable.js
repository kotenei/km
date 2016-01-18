/*
 * 树型表格模块
 * @date:2015-04-29
 * @author:kotenei(kotenei@qq.com)
 */
define('km/treeTable', ['jquery', 'km/ajax'], function ($, ajax) {

    //树型表格
    function TreeTable($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            expanded: true,
            className: 'k-treeTable',
            url: '',
            params: null,
            column: 0,
            columns: [],
            data: [],
            checkType: { "Y": "ps", "N": "ps" },
        }, options);
        this.init();
    }

    //初始化
    TreeTable.prototype.init = function () {
        var self = this;
        if (this.options.data && this.options.data.length > 0) {
            this.data = this.options.data;
            this.dataInit();
            this.build();
            this.watch();
        } else if (this.options.url && this.options.url.length > 0) {
            self.reload();
        }
    };

    

    //事件监控
    TreeTable.prototype.watch = function () {
        var self = this;
        this.$elm.on('click.treetable', '.indenter a', function () {
            var id = $(this).attr('data-nodeId'),
                $row = $('#treeRow_' + id),
                children = self.getChildren(self.objData[id]);

            if ($row.hasClass('expanded')) {
                $row.removeClass('expanded').addClass('collapsed');
                self.collapsed(children);
            } else {
                $row.removeClass('collapsed').addClass('expanded');
                self.expanded(children);
            }

            return false;
        }).on('click.treetable', 'tbody tr', function () {
            var $row = $(this),
                id = $row.attr('data-nodeId'),
                node = self.objData[id];

            if (!node.enableCheck) {
                return;
            }

            if ($row.hasClass('selected')) {
                $row.removeClass('selected');
                $row.find('td:eq(0)').find('input').prop('checked', false);
                node.checked = false;
                self.check(node, false);
            } else {
                $row.addClass('selected');
                $row.find('td:eq(0)').find('input').prop('checked', true);
                node.checked = true;
                self.check(node, true);
            }
        }).on('click.treetable', '[role=checkall]', function () {
            var $el = $(this),
                $rows = self.$elm.find('tbody tr'),
                isChecked = $el.prop('checked');

            for (var i = 0, item; i < self.data.length; i++) {
                item = self.data[i];
                if (item.enableCheck) {
                    item.checked = isChecked;

                    if (isChecked) {
                        $("#treeRow_" + item.nodeId).addClass('selected')
                        $("#treeCheckBox_" + item.nodeId).prop('checked', true);
                    } else {
                        $("#treeRow_" + item.nodeId).removeClass('selected')
                        $("#treeCheckBox_" + item.nodeId).prop('checked', false);
                    }
                }
                self.data[i].checked = isChecked;
            }
        });
    };

    //数据初始化
    TreeTable.prototype.dataInit = function () {
        var data = [];
        var tmpData = this.data;
        this.objData = {};

        function setTreeData(nodes, data) {
            var getChild = function (parentId, items, parentNode, level) {
                for (var i = 0, node; i < nodes.length; i++) {
                    node = nodes[i];
                    if (node.parentId == parentId) {

                        node.hasParent = true;

                        if (node.parentId == 0) {
                            node.isRoot = true;
                            node.level = 1;
                            node.hasParent = false;
                        }

                        if (parentNode) {
                            parentNode.hasChild = true;
                            node.level = parentNode.level + 1 || 1;
                            node.parent = parentNode;

                            if (!$.isArray(parentNode.children)) {
                                parentNode.children = [];
                            }

                            parentNode.children.push(node.nodeId);

                        }

                        items.push(node);

                        getChild(node.nodeId, items, node);
                    }
                }
            };
            getChild(0, data, null, 1);
        }

        

        setTreeData(this.data, data);

        if (data.length == 0) {
            data = this.data;
        }

        for (var i = 0; i < data.length; i++) {
            this.objData[data[i].nodeId] = data[i];
            if (data[i].enableCheck == null || typeof data[i].enableCheck == 'undefined') {
                data[i].enableCheck = true;
            }
        }

        this.data = data;
    };

    //创建
    TreeTable.prototype.build = function () {
        var html = [], columns = this.options.columns;

        html.push('<table class="' + this.options.className + '">');

        //创建头部
        html.push('<thead>');
        for (var i = 0, column; i < columns.length; i++) {
            column = columns[i];
            if (column.checkbox) {
                html.push('<th style="text-align:' + (column.align ? column.align : 'left') + '">');
                html.push('<input type="checkbox" role="checkall" />');
                html.push('</th>');
            } else {
                html.push('<th style="text-align:' + (column.align ? column.align : 'left') + '">' + column.title + '</th>');
            }
        }
        html.push('</thead>');


        //创建行
        html.push('<tbody>');

        for (var i = 0, item, expanded, display; i < this.data.length; i++) {

            item = this.data[i], expanded = '', display = '';

            if (item.hasChild) {
                if (this.options.expanded) {
                    expanded = 'expanded';
                } else {
                    expanded = 'collapsed';
                    if (!item.isRoot) {
                        display = 'hide';
                    }
                }
            }

            if (!this.options.expanded && item.hasParent && item.parentId > 0) {
                display = 'hide';
            }

            var trSelectClass = '';

            if (this.options.columns[0].checkbox) {
                if (item.checked) {
                    trSelectClass = 'selected';
                }
            }

            html.push('<tr class="' + expanded + ' ' + display + ' ' + trSelectClass + '" id="treeRow_' + item.nodeId + '"  data-parentId="' + item.parentId + '" data-nodeId="' + item.nodeId + '" data-level="' + item.level + '">');


            for (var j = 0,column; j < columns.length; j++) {
                column = columns[j];
                //checkbox
                if (column.checkbox) {
                    var strChecked = '';

                    if (item.checked) {
                        strChecked = ' checked="checked" ';
                    }

                    if (!item.enableCheck) {
                        strChecked += ' disabled="disabled" ';
                    }

                    html.push('<td style="text-align:' + (column.align ? column.align : 'left') + '">');
                    html.push('<input type="checkbox" id="treeCheckBox_' + (item.nodeId) + '" value="' + item[column.field] + '"  ' + strChecked + '  />');
                    html.push('</td>');

                } else {

                    var indenter = '', treeHtml = ''

                    //创建树标签样式
                    if (j == this.options.column) {

                        if (item.hasChild) {

                            indenter = '<span class="indenter" style="padding-left: ' + (item.level > 1 ? item.level * 19 : 0) + 'px;"><a href="#" title="Collapse" data-nodeId="' + item.nodeId + '">&nbsp;</a></span>';

                            treeHtml = '<span class="folder">' + (typeof column.formatter == 'function' ? column.formatter(item[column.field],item) : item[column.field]) + '</span>';

                        } else {

                            indenter = '<span class="indenter" style="padding-left: ' + (item.level > 1 ? item.level * 19 : 0) + 'px;"></span>';

                            treeHtml = '<span class="file">' + (typeof column.formatter == 'function' ? column.formatter(item[column.field],item) : item[column.field]) + '</span>';

                        }

                    }

                    if (typeof column.formatter === 'function') {
                        html.push('<td style="text-align:' + (column.align ? column.align : 'left') + '">');
                        html.push(indenter);
                        html.push(treeHtml.length > 0 ? treeHtml : column.formatter(item[column.field],item));
                        html.push('</td>');
                    } else {
                        html.push('<td style="text-align:' + (column.align ? column.align : 'left') + '">');
                        html.push(indenter);
                        html.push(treeHtml.length > 0 ? treeHtml : item[column.field]);
                        html.push('</td>');
                    }

                }
            }

            html.push('</tr>');
        }


        html.push('</tbody>');
        html.push('</table>');

        this.$elm.html(html.join(''));
    };

    //选择
    TreeTable.prototype.check = function (node,checked) {
        var parents = this.getParents(node);
        var children = this.getChildren(node);
        var brothers = this.getBrothers(node);
        var unChecked = true;
        var $curRow = $('#treeRow_' + node.nodeId),
            $curCheckBox = $('#treeCheckBox_' + node.nodeId);

        if (checked) {
            switch (this.options.checkType.Y.toLowerCase()) {
                case "p":
                    this.checkAction(parents, checked);
                    break;
                case "s":
                    this.checkAction(children, checked);
                    break;
                default:
                    this.checkAction(parents, checked);
                    this.checkAction(children, checked);
                    break;
            }
        } else {
            switch (this.options.checkType.N.toLowerCase()) {
                case "p":
                    uncheckParent.call(this, node, brothers);
                    break;
                case "s":
                    this.checkAction(children, checked);
                    break;
                default:
                    uncheckParent.call(this, node, brothers);
                    this.checkAction(children, checked);
                    break;
            }
        }


        function uncheckParent(curNode, brothers) {
            for (var i = 0; i < brothers.length; i++) {
                if (brothers[i].checked) {
                    unChecked = false;
                    break;
                }
            }

            var parentNode = node.parent;

            if (unChecked && parentNode && parentNode.enableCheck) {
                parentNode.checked = false;
                $('#treeRow_' + parentNode.nodeId).removeClass('selected');
                $('#treeCheckBox_' + parentNode.nodeId).prop('checked', false);
            }

            

            while (parentNode) {

                var siblings = this.getBrothers(parentNode);

                for (var i = 0; i < siblings.length; i++) {
                    if (siblings[i].checked) {
                        unChecked = false;
                        break;
                    }
                }

                if (unChecked && parentNode.enableCheck) {
                    parentNode.checked = false;
                    $('#treeRow_' + parentNode.nodeId).removeClass('selected');
                    $('#treeCheckBox_' + parentNode.nodeId).prop('checked', false);
                    parentNode = parentNode.parent;
                } else {
                    break;
                }
            }
        }

    };

    //复选关联节点操作
    TreeTable.prototype.checkAction = function (nodes, checked) {
        for (var i = 0, node, $row, $checkbox; i < nodes.length; i++) {
            node = nodes[i];
            $checkbox = $('#treeCheckBox_' + node.nodeId);
            $row = $('#treeRow_' + node.nodeId);

            if (node.enableCheck) {
                if (checked) {
                    node.checked = true;
                    $row.addClass('selected');
                    $checkbox.prop('checked', true);
                } else {
                    node.checked = false;
                    $row.removeClass('selected');
                    $checkbox.prop('checked', false);
                }
            }
        }
    };

    //展开
    TreeTable.prototype.expanded = function (nodes) {
        for (var i = 0, child, $child, $parent; i < nodes.length; i++) {
            child = nodes[i];
            $child = $('#treeRow_' + child.nodeId);
            $parent = $('#treeRow_' + child.parentId);

            if ($parent.hasClass('collapsed')) {
                $child.addClass('hide');
            } else {
                $child.removeClass('hide');
            }
        }
    };

    //收起
    TreeTable.prototype.collapsed = function (nodes) {
        for (var i = 0, child, $child, $parent; i < nodes.length; i++) {
            child = nodes[i];
            $child = $('#treeRow_' + child.nodeId);
            $child.addClass('hide');
        }
    };

    //取父结点
    TreeTable.prototype.getParents = function (node) {
        var nodes = [];

        var parent = node.parent;

        while (parent) {
            nodes.push(parent);
            parent = parent.parent;
        }

        return nodes;
    };

    //取同级结点
    TreeTable.prototype.getBrothers = function (node) {
        var nodes = [];
        for (var i = 0, brother; i < this.data.length; i++) {
            brother = this.data[i];
            if (node.parentId == brother.parentId && brother.nodeId != node.nodeId) {
                nodes.push(brother);
            }
        }
        return nodes;
    };

    //取孩子结点
    TreeTable.prototype.getChildren = function (node) {
        var childNodes = [];

        var getChild = function (node, childNodes, objData) {

            if (node.children) {

                for (var i = 0, child; i < node.children.length; i++) {
                    child = objData[node.children[i]];

                    childNodes.push(child);
                    if (child.hasChild) {
                        getChild(child, childNodes, objData);
                    }
                }
            }

        }

        getChild(node, childNodes, this.objData);

        return childNodes;
    };

    //重新加载
    TreeTable.prototype.reload = function () {
        var self = this;

        ajax.get(this.options.url, this.options.params).done(function (data) {

            if (!data) {
                data = [];
                return;
            }



            for (var i = 0,item; i < data.length; i++) {
                item = data[i];
                if (item.Checked) {
                    item.checked = item.Checked;
                }
                if (item.EnableCheck) {
                    item.enableCheck = item.EnableCheck;
                }
                if (item.Level) {
                    item.level = item.Level;
                }
            }

            self.data = data;
            self.dataInit();
            self.build();
            self.watch();
        });
    };

    //加载数据
    TreeTable.prototype.loadData = function () {

    };

    //取选择的数据
    TreeTable.prototype.getSelectRows = function () {
        var items = [];

        if (!this.data) {
            return items;
        }

        for (var i = 0, item; i < this.data.length; i++) {
            item = this.data[i];
            if (item.checked) {
                items.push(item);
            }
        }

        return items;
    };

    return TreeTable;

});