/**
 * 上传
 * @date :2015-07-30
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/upload', ['jquery'], function ($) {

    var Upload = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            mode: 'button',
            fontClassName: 'fa fa-upload',
            text: '上传',
            name: 'file',
            
        }, options);
    };

    Upload.prototype.init = function () {
        this.build();
        this.watch();
    };

    Upload.prototype.watch = function () {

    };

    Upload.prototype.build = function () {
        var html = [];
        html.push('<div class="k-upload-box">');
        html.push('<button type="button" class="k-btn k-btn-default">');
        html.push('<span class="' + this.options.fontClassName + '"></span>');
        html.push(this.options.text);
        html.push('</button>');
        html.push('<form action="' + this.options.url + '" enctype="multipart/form-data" method="post">');
        html.push('<input type="file" name="' + this.options.name + '" />');
        html.push('</form>');
        html.push('</div>');
        this.$uploadBox = $(html.join(''));
        this.$file = this.$uploadBox.find('input');
        this.$elm.append(this.$uploadBox);
    };

    return function () { };
});
