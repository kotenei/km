/*
 * 滑块模块
 * @date:2014-09-15
 * @author:kotenei(kotenei@qq.com)
 */
define('km/slider', ['jquery', 'km/dragdrop'], function ($, DragDrop) {

    /**
     * 滑块模块
     * @param {JQuery} $element - dom
     * @param {Object} options  - 参数设置
     */
    var Slider = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, {
            min: 1,
            max: 10,
            step: 1,
            value: 1,
            $bindElement: $([]),
            callback: {
                slide: $.noop
            }
        }, options);
        this.template = '<div class="k-slider"><div class="k-slider-selection"></div><div class="k-slider-handle"></div></div>';
        this.min = this.options.min;
        this.max = this.options.max;
        this.step = this.options.step;
        this.diff = this.max - this.min;
        this.init();
    };

    /**
     * 初始化
     * @return {Void} 
     */
    Slider.prototype.init = function () {
        var self = this;
        this.$slider = $(this.template).appendTo(this.$element);
        this.$sliderSelection = this.$slider.find("div.k-slider-selection");
        this.$sliderHandle = this.$slider.find("div.k-slider-handle");
        this.handleWidth = this.$sliderHandle.width();
        this.sliderWidth = this.$slider.outerWidth();
        this.$bindElement = this.options.$bindElement;
        this.dragdrop = new DragDrop({
            $range: this.$slider,
            $layer: this.$slider.find(".k-slider-handle"),
            direction: 'h',
            callback: {
                move: function (e,moveCoord) {
                    var val = self.getMoveValue(moveCoord);
                    self.setValue(val);
                    self.options.callback.slide(val);
                }
            }
        });

        this.eventBind();
        this.setValue(this.options.value);
    };

    /**
     * 事件绑定
     * @return {Void}
     */
    Slider.prototype.eventBind = function () {
        if (!this.allowElement()) { return; }

        var type = this.$bindElement[0].type;
        var self = this;

        if (type.indexOf('select') !== -1) {
            this.$bindElement.on('change.slider', function () {
                var $this = $(this),
                    val = $.trim(self.getFilterValue($this.val()));
                self.setValue(val);
            });
        } else {
            this.$bindElement.on('keyup.slider', function (e) {
                var $this = $(this),
                    val = $.trim(self.getFilterValue($this.val()));
                if (e.keyCode === 13) {
                    self.setValue(val);
                }
            }).on('blur.slider', function () {
                var $this = $(this),
                    val = $.trim(self.getFilterValue($this.val()));
                self.setValue(val);
            });
        }
    };

    /**
     * 是否是允许绑定的元素
     * @return {Boolean} 
     */
    Slider.prototype.allowElement = function () {
        if (this.$bindElement.length === 0) { return false; }
        var type = this.$bindElement[0].type;
        if (type !== 'text'
            && type !== "textarea"
            && type.indexOf("select") === -1) {
            return false;
        }
        return true;
    };

    /**
     * 获取过滤后的值
     * @param  {Number} value -输入的值
     * @return {Number}    
     */
    Slider.prototype.getFilterValue = function (value) {
        if (!value) { value = this.min; }
        if (isNaN(value)) { value = this.min; }
        if (value < this.min) { value = this.min; }
        if (value > this.max) { value = this.max; }
        return value;
    };

    /**
     * 设置值
     * @param {Number} value- 设置的值
     */
    Slider.prototype.setValue = function (value) {
        if (value > this.max) { value = this.max; }
        if (value < this.min) { value = this.min; }
        var percent = (value - this.min) / this.diff * 100;
        this.setPercent(percent);
        this.setElementValue(value)
    };

    /**
     * 设置绑定元素值
     * @param {Number} value - 要设置的值
     */
    Slider.prototype.setElementValue = function (value) {
        if (!this.allowElement()) { return; }
        var type = this.$bindElement[0].type;
        if (type.indexOf('select') != -1) {
            this.$bindElement.find("option[value='" + value + "']").prop("selected", true);
        } else {
            this.$bindElement.val(value);
        }
    };

    /**
     * 获取滑动时的值
     * @param  {Object} moveCoord - 滑动时坐标
     * @return {Number}    
     */
    Slider.prototype.getMoveValue = function (moveCoord) {
        var percent = (moveCoord.x / (this.sliderWidth - this.handleWidth) * 100);
        var val = Math.round((percent / 100 * this.diff) / this.step) * this.step + this.min;
        val = val > this.max ? this.max : val;
        return val;
    };

    /**
     * 设置百分比
     * @param {Number} percent 
     */
    Slider.prototype.setPercent = function (percent) {
        this.$sliderSelection.width(percent + "%");
        this.$sliderHandle.css("left", percent + "%");
    };

    return function ($elm, options) {
        var slider = new Slider($elm, options);
        return slider;
    };

});
