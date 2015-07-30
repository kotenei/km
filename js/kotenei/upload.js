/**
 * 上传
 * @date :2015-07-30
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/upload', ['jquery', 'spin', 'kotenei/ajax', 'kotenei/popTips'], function ($, Spinner, ajax, popTips) {

    var Upload = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            uploadUrl: '',
            removeUrl: '',
            mode: '',
            fontClassName: 'fa fa-upload',
            text: '上传',
            name: 'file',
        }, options);
        this.isLoading = false;
        this.init();
    };

    Upload.prototype.init = function () {
        this.spinner = new Spinner({

        });
        this.build();
        this.watch();
    };

    Upload.prototype.watch = function () {
        var self = this;

        this.$uploadBox.on('change', 'input', function () {
            self.upload();
        }).on('click', '.fa-close', function () {
            self.removeFile();
        });
    };

    Upload.prototype.upload = function () {
        var self = this;
        if (this.isLoading) {
            return;
        }
        this.isLoading = true;
        $.ajax({
            url: this.$form.attr('action'),
            data: this.$form.serialize(),
            type: 'post'
        }).done(function (ret) {

        }).fail(function () {
            popTips.error('上传失败', 600);
        }).always(function () {
            self.isLoading = false;
            self.showResult('asdfasdfasf.html')
        });
    };

    Upload.prototype.build = function () {
        var html = [],
            groupHtml = [];


        html.push('<div class="k-upload-box">');

        if (this.options.mode == 'button') {
            html.push('<div class="k-upload-result">');
            html.push('<span></span>');
            html.push('<i class="fa fa-close"></i>');
            html.push('</div>');
        }

        html.push('<div class="button-box">');
        html.push('<button type="button" class="k-btn k-btn-default">');
        html.push('<span class="' + this.options.fontClassName + '"></span>');
        html.push(this.options.text);
        html.push('</button>');
        html.push('<form action="' + this.options.uploadUrl + '" enctype="multipart/form-data" method="post">');
        html.push('<input type="file" name="' + this.options.name + '" />');
        html.push('</form>');
        html.push('</div>');
        html.push('</div>');


        if (this.options.mode != 'button') {
            groupHtml.push('<div class="k-input-group k-input-group-upload">');
            groupHtml.push('<input type="text"  readonly="readonly"  class="k-form-control">');
            groupHtml.push('<i class="fa fa-close"></i>');
            groupHtml.push('<span class="k-input-group-btn">');
            groupHtml.push(html.join(''));
            groupHtml.push('</span>');
            groupHtml.push('</div>');
        }

        this.$uploadBox = $(groupHtml.length == 0 ? html.join('') : groupHtml.join(''));
        this.$buttonBox = this.$uploadBox.find('.button-box');
        this.$file = this.$uploadBox.find('input[type=file]');
        this.$form = this.$uploadBox.find('form');
        this.$resultBox = this.$uploadBox.find('.k-upload-result');
        this.$txtResult = this.$uploadBox.find('input[type=text]');
        this.$close = this.$uploadBox.find('.fa-close');
        this.$elm.append(this.$uploadBox).css('overflow', 'hidden');
    };

    Upload.prototype.removeFile = function () {

        $.post(this.options.removeUrl);

        if (this.options.mode == "button") {
            this.$resultBox.hide();
            this.$buttonBox.fadeIn();
        } else {
            this.$txtResult.val('');
            this.$close.fadeOut();
        }
    };

    Upload.prototype.showResult = function (msg) {
        if (this.options.mode == 'button') {
            this.$resultBox.children('span').text(msg).end().fadeIn();
            this.$buttonBox.hide();
        } else {
            this.$txtResult.val(msg);
            this.$close.fadeIn();
        }
    }


    return Upload;
});
