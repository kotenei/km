/**
 * 上传
 * @date :2015-07-30
 * @author kotenei (kotenei@qq.com)
 */
define('km/upload', ['jquery', 'spin', 'km/window', 'km/ajax', 'km/event'], function ($, Spinner, Window, ajax, event) {

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
            uploadUrl: '',
            removeUrl: '',
            fontClassName: 'fa fa-upload',
            text: '上传',
            name: 'file',
            //loadingEnable: true,
            popTips: {
                enable: true,
                delay: 600
            }
        }, options);
        this.isLoading = false;
        this.isButton = this.$elm[0].type.toLowerCase() == 'text' ? false : true;
        this.event = event;
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


        this.build();
        this.watch();




    };

    /**
     * 事件监控
     * @return {Void}
     */
    Upload.prototype.watch = function () {
        var self = this;

        this.$uploadBox.on('change', 'input', function () {
            self.upload();
        }).on('click', '.fa-close', function () {
            if (self.isLoading) {
                return;
            }
            Window.confirm('您确认要删除该文件吗？', function () {
                self.removeFile();
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

        if (this.isButton) {
            html.push('<div class="k-upload-result">');
            html.push('<span></span>');
            html.push('<i class="fa fa-close"></i>');
            html.push('</div>');
        }

        html.push('<div class="button-box">');
        html.push('<button type="button" class="k-btn k-btn-default">');
        html.push('<div class="loading-box"></div>');
        html.push('<span class="k-upload-icon ' + this.options.fontClassName + '"></span>&nbsp;');
        html.push(this.options.text);
        html.push('</button>');
        html.push('<form action="' + this.options.uploadUrl + '" enctype="multipart/form-data" method="post">');
        html.push('<input type="file" name="' + this.options.name + '" />');
        html.push('</form>');
        html.push('</div>');
        html.push('</div>');

        if (!this.isButton) {
            groupHtml.push('<div class="k-input-group k-input-group-upload">');
            groupHtml.push('<i class="fa fa-close"></i>');
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
        this.$resultBox = this.$uploadBox.find('.k-upload-result');
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
                'readonly': 'readonly'
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
        ajax.ajaxForm(this.$form, {
            loadingEnable: false,
            redirectEnable: false,
            popTips: {
                enable: this.options.popTips.enable,
                delay: this.options.delay,
                inCallback: false
            }
        }).done(function (ret) {
            self.showResult(ret.Url || '');
        }).always(function () {
            self.isLoading = false;
            method.hideLoading.call(self);
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

        ajax.post(this.options.removeUrl, data || { filePath: this.url }, {
            redirectEnable: false,
            loadingEnable: true,
            popTips: {
                enable: this.options.popTips.enable,
                delay: this.options.delay,
                inCallback: false
            }
        }).done(function (ret) {
            if (ret.Status || ret.status) {
                self.hideResult();
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
            this.$resultBox.children('span').text(url).end().fadeIn();
            this.$buttonBox.hide();
        } else {
            this.$txtResult.val(url);
            this.$close.fadeIn();
        }
    };

    /**
     * 隐藏结果
     * @return {Void}
     */
    Upload.prototype.hideResult = function () {
        if (this.isButton) {
            this.$resultBox.children('span').text('').end().hide();
            this.$buttonBox.fadeIn();
        } else {
            this.$txtResult.val('');
            this.$close.hide();
        }
    }


    /**
     * 事件添加
     * @return {Void}
     */
    Upload.prototype.on = function (name, callback) {
        var self = this;
        this.event.on(name + '.upload', function (args) {
            callback.apply(self, args);
        });
    };

    /**
     * 全局调用
     * @return {Void}
     */
    Upload.Global = function ($elms) {
        $elms = $elms || $('button[data-module=upload],input[data-module=upload]');
        $elms.each(function () {
            var $el = $(this),
                uploadUrl = $el.attr('data-uploadurl'),
                removeUrl = $el.attr('data-removeurl'),
                name = $el.attr('data-name'),
                text = $el.attr('data-text'),
                loadingEnable = $el.attr('data-loadingEnable'),
                popTips = $el.attr('data-popTips'),
                data = $el.data('upload');

            if (!data) {
                data = new Upload($el, {
                    uploadUrl: uploadUrl && uploadUrl.length > 0 ? uploadUrl : '',
                    removeUrl: removeUrl && removeUrl.length > 0 ? removeUrl : '',
                    name: name && name.length > 0 ? name : 'file',
                    text: text && text.length > 0 ? text : '上传',
                    loadingEnable: loadingEnable && loadingEnable == 'false' ? false : true,
                    popTips: popTips && popTips.length > 0 ? eval('(0,' + popTips + ')') : {}
                });
                $el.data('upload', data);
            }
        });
    };

    return Upload;
});
