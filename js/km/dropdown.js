/**
 * 下拉框
 * @author vfasky (vfasky@gmail.com)
 */
define('km/dropdown', ['jquery'], function($){
    var $body = $('body');
    var $win  = $(document);

    var _id=0;

    /**
     * 下拉框
     * @constructor
     * @alias km/dropdown
     * @param {jQuery} $el - dom
     * @param {Object} setting - 参数设置
     * @param {Number} setting.width - 宽度
     * @param {Number} setting.height - 高度
     */
    var Dropdown = function($el, setting){
        this.$soure  = $el;
        this.setting = $.extend({
            width: $el.width(),
            height: $el.height()
        }, setting || {});

        $el.data('widget', this);

        _id++;

        this.id = _id;
        this.nameSpace = 'dropdown_' + String(this.id);

        this.initDom();
    };

    /**
     * 初始化 this.$el
     * @return {Void}
     */
    Dropdown.prototype.initDom = function() {
        var $parent = this.$soure.parent();
        var self   = this;

        this.$soure.css({
            visibility: 'hidden'
        });

        if($parent.css('position') === 'static'){
            $parent.css({
                visibility: 'relative'
            });
        }

        var zIndex = 1;
        if(this.$soure.css('zIndex') === 'auto'){
            this.$soure.css('zIndex', 1);
        }
        else{
            zIndex = Number(this.$soure.css('zIndex'));
        }
       
        this.$el = $('<div class="widget-dropbox"/>').css({
            width: this.setting.width,
            height: this.setting.height,
            zIndex: zIndex + 1
        });

        //在侧内容
        this.$label = $('<div class="label"/>').css({
            width: this.setting.width - this.setting.height,
            height: this.setting.height,
            lineHeight: String(this.setting.height - 4) + 'px'
        }).appendTo(this.$el);

        //右侧icon
        this.$icon = $('<div class="ic">&#9660;</div>').css({
            width: this.setting.height,
            height: this.setting.height,
            lineHeight: String(this.setting.height) + 'px'
            
        }).appendTo(this.$el);

        this.buildDrop();

        this.$el.insertBefore(this.$soure);

        this.watch();
    };

    /**
     * 同步下拉框位置
     * @return {Void}
     */
    Dropdown.prototype.syncPosition = function(){
        this.$el.css(this.$soure.position());
    };

    /**
     * 设置下拉框显示的值
     * @return {Void}
     */
    Dropdown.prototype.setLabel = function(label){
        this.$label.text(label).attr('title', label);
    };

    /**
     * 取下拉框的值
     * @return {Void}
     */
    Dropdown.prototype.getVal = function () {
        return this.$soure.val();
    };

    /**
     * 设置下拉框的值
     * @return {Void}
     */
    Dropdown.prototype.setVal = function(val){
        this.$soure.val(val).change();
    };

    /**
     * 生成下拉框内容
     * @return {jQuery} - dom
     */
    Dropdown.prototype.buildDrop = function(){
        if(this.$drop){
            this.$drop.remove();
        }
        this.$drop = $('<div class="widget-dropbox-drop"/>').css({
            width: this.setting.width,
        }).hide();

        var html = [];
        this.$soure.find('option').each(function(){
            var $el = $(this);
            html.push('<li data-val="'+ $el.val() +'">' + $el.text() + '</li>');
        });
        var $el = $('<ul>' + html.join('') + '</ul>');

        $el.appendTo(this.$drop);
        this.$drop.appendTo($body);
        this.syncPosition();
        this.sync();
    };

    /**
     * 与原下拉框同步数据
     * @return {Void}
     */
    Dropdown.prototype.sync = function(){
        var label = this.$soure.find('option:selected').text();
        if(!label){
            var $option = this.$soure.find('option').eq(0);
            label = $option.text();
            this.setVal($option.val());
        }
        this.setLabel(label);
    };

    /**
     * 显示下拉框
     * @return {Void}
     */
    Dropdown.prototype.showDrop = function(){
        var self   = this;
        var offset = self.$el.offset();
        self.$el.addClass('widget-dropbox-hover');
        self.$drop.css({
            top: offset.top + self.setting.height + 2,
            left: offset.left
        }).show();

        $win.on('click.' + self.nameSpace, function(e){
            if(e.target !== self.$label[0] &&
               e.target !== self.$icon[0] &&
               e.target !== self.$drop[0] &&
               false === $.contains(self.$drop[0], e.target)){
                self.hideDrop();
            }
        });
    };

    /**
     * 隐藏下拉框
     * @return {Void}
     */
    Dropdown.prototype.hideDrop = function(){
        var self = this;
        self.$drop.hide(); 
        self.$el.removeClass('widget-dropbox-hover');
        $win.off('click.' + self.nameSpace);
    };

    /**
     * 监听事件
     * @return {Void}
     */
    Dropdown.prototype.watch = function(){
        var self = this;
        this.$el.on('click', function(){
            self.showDrop();
        });

        this.$drop.on('click', 'li', function(){
            var $el = $(this);
            self.setVal($el.data('val'));
            self.sync();
            self.hideDrop();
            return false;
        });
    };

    /**
     * 重新加载数据
     * @return {Void}
     */
    Dropdown.prototype.reload = function(){
        this.buildDrop();
    };

    return Dropdown;
});