/**
 * 上传
 * @date :2015-07-30
 * @author kotenei (kotenei@qq.com)
 */
define('km/upload', ['jquery', 'spin', 'km/window', 'km/ajax', 'km/event','km/popTips','jqueryForm'], function ($, Spinner, Window, ajax, event,popTips) {

    var method = {
        showLoading: function () {
            this.spinner.spin(this.$loadingBox.get(0));
            this.$loadingBox.css('display', 'inline-block');
            this.$uploadIcon.hide();
        },
        hideLoading: function () {
            this.$loadingBox.hide();
            this.spinner.stop();
            this.$uploadIcon.show();
        }
    };

    /**
     * upload 上传模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Upload = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            uploadUrl: null,
            removeUrl: null,
            $target: null,
            fontClassName: 'fa fa-upload',
            text: '上传',
            name: 'file',
            uploadedUrls: [],
            //loadingEnable: true,
            showResult:true,
            popTips: {
                enable: true,
                delay: 600
            }
        }, options);
        if (this.options.removeUrl && this.options.removeUrl.length==0) {
            this.options.removeUrl = null;
        }

        this.isLoading = false;
        this.isButton = this.$elm[0].type.toLowerCase() == 'text' ? false : true;
        this._event = {
            success: $.noop,
            error: $.noop
        };
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Upload.prototype.init = function () {
        this.spinner = new Spinner({
            lines: 9, // 花瓣数目
            length: 3, // 花瓣长度
            width: 2, // 花瓣宽度
            radius: 2, // 花瓣距中心半径
            scale: 0.2,
            corners: 0.6, // 花瓣圆滑度 (0-1)
            rotate: 4, // 花瓣旋转角度
            direction: 1, // 花瓣旋转方向 1: 顺时针, -1: 逆时针    
            color: '#222222', // 花瓣颜色
            speed: 1, // 花瓣旋转速度
            trail: 60, // 花瓣旋转时的拖影(百分比)
            shadow: false, // 花瓣是否显示阴影
            hwaccel: false, // 是否启用硬件加速及高速旋转            
            className: 'spinner', // css 样式名称
            zIndex: 2e9, // spinner的z轴 (默认是2000000000)
            top: '5px', // spinner 相对父容器Top定位 单位 px
            left: '10px'// spinner 相对父容器Left定位 单位 px
        });

        this.uploadedUrls = this.options.uploadedUrls;
        this.build();
        this.watch();

    };

    /**
     * 事件监控
     * @return {Void}
     */
    Upload.prototype.watch = function () {
        var self = this;

        this.$uploadBox.on('change.upload', '[data-role=upfile]', function () {
            self.upload();
        }).on('click.upload', '.fa-close', function () {
            var $el = $(this),
                $parent = $el.parents('.k-upload-result:eq(0)'),
                removeUrl = $parent.attr('data-url');

            if (self.isLoading) {
                return;
            }

            Window.confirm('您确认要删除该文件吗？', function () {
                self.removeFile(self.isButton ? { filePath: removeUrl } : null);
            });
        });
    };

    /**
     * 构造上传HTML
     * @return {Void}
     */
    Upload.prototype.build = function () {
        var html = [],
            groupHtml = [];

        html.push('<div class="k-upload-box">');

        if (this.isButton&&this.options.showResult) {

            html.push('<div class="k-upload-result-box">');

            if (this.options.uploadedUrls.length > 0) {

                for (var i = 0; i < this.options.uploadedUrls.length; i++) {
                    html.push('<div class="k-upload-result" data-url="' + this.options.uploadedUrls[i] + '">');
                    html.push('<span title="' + this.options.uploadedUrls[i] + '">' + this.options.uploadedUrls[i] + '</span>');
                    html.push('<i class="fa fa-close" style="display:' + (this.options.removeUrl ? "block" : "none") + ';"></i>');
                    html.push('</div>');
                }

            }

            html.push('</div>');
        }

        html.push('<div class="button-box">');
        html.push('<button type="button" class="k-btn k-btn-default">');
        html.push('<div class="loading-box"></div>');
        html.push('<span class="k-upload-icon ' + this.options.fontClassName + '"></span>&nbsp;');
        html.push(this.options.text);
        html.push('</button>');
        html.push('<form action="' + this.options.uploadUrl + '" enctype="multipart/form-data" method="post">');
        html.push('<input type="file" data-role="upfile" name="' + this.options.name + '" />');
        html.push('</form>');
        html.push('</div>');
        html.push('</div>');

        if (!this.isButton) {
            var val = $.trim(this.$elm.val());

            groupHtml.push('<div class="k-input-group k-input-group-upload">');
            groupHtml.push('<i class="fa fa-close" style="display:' + (this.options.removeUrl && val.length > 0 ? "block" : "none") + ';"></i>');
            groupHtml.push('<span class="k-input-group-btn">');
            groupHtml.push(html.join(''));
            groupHtml.push('</span>');
            groupHtml.push('</div>');
        }

        this.$uploadBox = $(groupHtml.length == 0 ? html.join('') : groupHtml.join(''));
        this.$buttonBox = this.$uploadBox.find('.button-box');
        this.$button = this.$uploadBox.find('button');
        this.$file = this.$uploadBox.find('input[type=file]');
        this.$form = this.$uploadBox.find('form');
        this.$resultBox = this.$uploadBox.find('.k-upload-result-box');
        this.$txtResult = this.isButton ? null : this.$elm;
        this.$close = this.$uploadBox.find('.fa-close');
        this.$uploadBox.appendTo(this.$elm.parent());
        this.$uploadIcon = this.$uploadBox.find('.k-upload-icon');
        this.$loadingBox = this.$buttonBox.find('.loading-box');


        if (this.isButton) {
            this.$elm.hide();
        } else {
            this.$elm.attr({
                'class': 'k-form-control',
                //'readonly': 'readonly'
            }).prependTo(this.$uploadBox);
            this.$close.css('right', this.$button.outerWidth() + 10);
        }

    };

    /**
     * 上传
     * @return {Void}
     */
    Upload.prototype.upload = function () {
        var self = this;
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        method.showLoading.call(this);

        this.$form.ajaxSubmit({
            url: this.$form.attr('action'),
            cache: false,
            success: function (ret) {

                if (typeof ret==='string') {
                    ret = eval('(0,' + ret + ')');
                }

                if (self.isButton && ret.Url && ret.Url.length > 0) {
                    self.uploadedUrls.push(ret.Url);
                }
                self.showResult(ret.Url || '');

                self._event.success(ret);
            },
            error: function () {
                self._event.error();
            },
            complete: function () {
                self.isLoading = false;
                method.hideLoading.call(self);
            }
        });
    };

    /**
     * 删除
     * @return {Void}
     */
    Upload.prototype.removeFile = function (data) {
        var self = this;

        if (this.isLoading) {
            return;
        }

        this.isLoading = true;

        data = data || { filePath: this.url }

        ajax.post(this.options.removeUrl, data, {
            redirectEnable: false,
            loadingEnable: true,
            popTips: {
                enable: this.options.popTips.enable,
                delay: this.options.delay,
                inCallback: false
            }
        }).done(function (ret) {
            if (ret.Status || ret.status) {
                self.hideResult(data.filePath);
            }
        }).always(function () {
            self.isLoading = false;
        });
    };

    /**
     * 显示结果
     * @return {Void}
     */
    Upload.prototype.showResult = function (url) {
        this.url = url;
        if (this.isButton) {
            if (this.options.showResult) {
                this.$resultBox.append('<div class="k-upload-result" data-url="' + url + '"><span title="' + url + '">' + url + '</span><i class="fa fa-close" style="display:' + (this.options.removeUrl ? "block" : "none") + ';"></i></div>');
            }
            if (this.options.$target) {
                this.options.$target.val(this.uploadedUrls.join(','));
            }


        } else {
            this.$txtResult.val(url);
            if (this.options.removeUrl) {
                this.$close.fadeIn();
            }
            if (this.options.$target) {
                this.options.$target.val(url);
            }
        }
    };

    /**
     * 隐藏结果
     * @return {Void}
     */
    Upload.prototype.hideResult = function (url) {
        var index = -1;
        if (this.isButton) {
            this.$resultBox.children('div[data-url="' + url + '"]').remove();

            for (var i = 0; i < this.uploadedUrls.length; i++) {
                if (this.uploadedUrls[i] == url) {
                    index = i;
                    break;
                }
            }
            if (i >= 0) {
                this.uploadedUrls.splice(index, 1);
            }

            if (this.options.$target) {
                this.options.$target.val(this.uploadedUrls.join(','));
            }

        } else {
            this.$txtResult.val('');
            this.$close.hide();
            if (this.options.$target) {
                this.options.$target.val('');
            }
        }
    }


    /**
     * 事件添加
     * @return {Void}
     */
    Upload.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 全局调用
     * @return {Void}
     */
    Upload.Global = function ($elms) {
        $elms = $elms || $('button[data-module=upload],input[data-module=upload]');
        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                uploadUrl = $el.attr('data-uploadurl'),
                removeUrl = $el.attr('data-removeurl'),
                name = $el.attr('data-name'),
                text = $el.attr('data-text'),
                loadingEnable = $el.attr('data-loadingEnable'),
                popTips = $el.attr('data-popTips'),
                success = $el.attr('data-success'),
                error = $el.attr('data-error'),
                data = $.data($el[0], 'upload');


            if (!data) {

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        uploadUrl: uploadUrl && uploadUrl.length > 0 ? uploadUrl : null,
                        removeUrl: removeUrl && removeUrl.length > 0 ? removeUrl : null,
                        name: name && name.length > 0 ? name : 'file',
                        text: text && text.length > 0 ? text : '上传',
                        loadingEnable: loadingEnable && loadingEnable == 'false' ? false : true,
                        popTips: popTips && popTips.length > 0 ? eval('(0,' + popTips + ')') : {}
                    };
                }

                

                data = new Upload($el, options);

                data.on('success', success && success.length > 0 ? eval('(0,' + success + ')') : $.noop)
                    .on('error', error && error.length > 0 ? eval('(0,' + error + ')') : $.noop);

                $.data($el[0], 'upload', data);
            }
        });
    };

    return Upload;
});
