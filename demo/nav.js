var nav = (function () {

    var data = [
        { text: '模态窗口', activeCode: 'window', link: 'window.html' },
        { text: '树型菜单', activeCode: 'tree', link: 'tree.html' },
        { text: '树型表格', activeCode: 'treetable', link: 'treetable.html' },
        { text: '下拉树', activeCode: 'dropdowntree', link: 'dropDownTree.html' },
        { text: '占位符', activeCode: 'placeholder', link: 'placeholder.html' },
        { text: '自动完成', activeCode: 'autocomplete', link: 'autocomplete.html' },
        { text: '日期选择', activeCode: 'datepicker', link: 'datepicker.html' },
        { text: '图片预览', activeCode: 'imgpreview', link: 'imgpreview.html' },
        { text: '图片剪裁', activeCode: 'clipzoom', link: 'clipzoom.html' },
        { text: '放大镜', activeCode: 'magnifier', link: 'magnifier.html' },
	    { text: '拖放', activeCode: 'dragdrop', link: 'dragdrop.html' },
        { text: '上传', activeCode: 'upload', link: 'upload.html' },
        { text: '焦点图', activeCode: 'focusmap', link: 'focusmap.html' },
        { text: '文字高亮', activeCode: 'highlight', link: 'highlight.html' },
        { text: '评级打分', activeCode: 'rating', link: 'rating.html' },
        { text: '弹出提示', activeCode: 'popTips', link: 'poptips.html' },
        { text: '工具提示', activeCode: 'tooltips', link: 'tooltips.html' },
        { text: '弹出框', activeCode: 'popover', link: 'popover.html' },
        { text: '标签选择', activeCode: 'tagselector', link: 'tagselector.html' },
        { text: '开关', activeCode: 'switch', link: 'switch.html' },
        { text: '分页', activeCode: 'pager', link: 'pager.html' },
        { text: '加载提示', activeCode: 'loading', link: 'loading.html' },
        { text: '表单验证', activeCode: 'validate', link: 'validate.html' },
        { text: '字数限制', activeCode: 'wordlimit', link: 'wordlimit.html' },
        { text: '右键菜单', activeCode: 'contextmenu', link: 'contextmenu.html' },
        { text: '滑块', activeCode: 'slider', link: 'slider.html' },
        { text: '延迟加载', activeCode: 'lazyload', link: 'lazyload.html' },
        { text: '无限滚动', activeCode: 'infinitescroll', link: 'infinitescroll.html' },
        { text: '瀑布流', activeCode: 'waterfall', link: 'waterfall.html' },
        { text: '本地存储', activeCode: 'localStorage', link: 'localStorage.html' },
        { text: 'Ajax', activeCode: 'ajax', link: 'ajax.html' },
        { text: '路由', activeCode: 'route', link: 'route.html' }
    ];




    return function (elm, activeCode) {
        var html = [];
        for (var i = 0, item; i < data.length; i++) {
            item = data[i];
            html.push('<li><a href="' + item.link + '" class="' + (activeCode.toLowerCase() == item.activeCode.toLowerCase() ? "active" : "") + '">' + item.text + '</a></li>');
        }

        elm.innerHTML = html.join('');
    };

})();