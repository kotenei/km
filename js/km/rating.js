/*
 * 评级模块
 * @date:2015-07-17
 * @author:kotenei(kotenei@qq.com)
 */
define('km/rating', ['jquery', 'km/event'], function ($, Event) {

    /**
     * 私有方法
     * @Object   
     */
    var method = {
        _createStar: function () {
            var html = [],
                icon,
                title;

            for (var i = 1; i <= this.options.number; i++) {
                title = method._getTitle.call(this, i);
                icon = (this.options.score && this.options.score >= i) ? 'starOn' : 'starOff';
                icon = this.options.path + this.options[icon];
                html.push('<img src="' + icon + '" alt="' + i + '" title="' + title + '" style="padding-left:' + this.options.space + 'px;" />');
            }

            this.$stars = $(html.join('')).appendTo(this.$starBox);
        },
        _createScore: function () {
            if (!this.options.scoreName || !this.options.score) {
                return;
            }
            this.$score = $('<input/>', {
                type: 'hidden',
                name: this.options.scoreName,
                value: this.options.score
            }).appendTo(this.$el);
        },
        _getMin: function (value, min, max) {
            return Math.min(Math.max(parseFloat(value), min), max);
        },
        _getTitle: function (score) {
            var value = this.options.values[parseInt(score) - 1];
            return (value === '') ? '' : (value || score);
        },
        _setStar: function (score) {

            var rest = (score - Math.floor(score)).toFixed(2);

            if (rest > this.options.round.down) {

                var icon = 'starOn';

                if (this.options.half && rest < this.options.round.up) {
                    icon = 'starHalf';
                } else if (rest < this.options.round.full) {
                    icon = 'starOff';
                }

                this.$stars.eq(Math.ceil(score) - 1).attr('src', this.options.path + this.options[icon]);
            }

        },
        _fill: function (score) {
            var self = this,
                icon;

            this.$stars.each(function (index) {
                icon = index <= (score - 1) ? 'starOn' : 'starOff';
                $(this).attr('src', self.options.path + self.options[icon]);
            });
        },
        _setScore: function (score) {
            if (!this.$score) {
                return;
            }
            this.$score.val(score);
        },
        _setValue: function (value) {
            if (!this.$target || this.$target[0].tagName.toLowerCase() !== 'input') {
                return;
            }
            this.$target.val(value);
        }
    };

    /**
     * 评级模块
     * @constructor
     * @alias kotenei/rating
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数设置
     */
    var Rating = function ($el, options) {
        this.$el = $el;
        this.options = $.extend(true, {
            path: '../images/star',
            starOff: 'star-off.png',
            starHalf: 'star-half.png',
            starOn: 'star-on.png',
            target: '.k-rating-target',
            number: 3,
            values: [1, 2, 3],
            score: 0,
            scoreName: undefined,
            round: { down: .25, full: .6, up: .76 },
            half: true,
            size: 24,
            space: 4
        }, options);
        this.event = new Event();
        this._tmpScore = 0;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    Rating.prototype.init = function () {
        this.options.score = this.options.score < 0 ? 0 : this.options.score;
        this._tmpScore = this.options.score;
        this.$starBox = this.$el.find('.k-rating-star');
        this.$target = this.$el.find(this.options.target);

        if (this.options.path &&
            this.options.path.slice(this.options.path.length - 1, this.options.path.length) !== '/') {
            this.options.path += '/';
        }

        method._createStar.call(this);
        method._createScore.call(this);
        method._setStar.call(this, this.options.score);

        this.watch();
    };

    /**
     * 事件监控
     * @return {Void}   
     */
    Rating.prototype.watch = function () {
        var self = this;
        this.$el.on('mousemove.rating', 'img', function (e) {
            var $el = $(this),
                score = parseInt($el.attr('alt')),
                left = $el.offset().left,
                x = e.pageX,
                position = (x - left) / (self.options.size),
                plus = (position > .5) ? 1 : .5,
                value;

            if (self.options.half) {

                score = score - 1 + plus;

                method._fill.call(self, score);

                method._setStar.call(self, score);

                method._setScore.call(self, score);

            } else {
                method._fill.call(self, score);
            }

            value = method._getTitle.call(self, $el.attr('alt'));

            self._tmpScore = score;

            method._setValue.call(self, value);

            self.event.trigger('mousemove.rating', [score, value]);

        }).on('mouseleave.rating', '.k-rating-star', function () {
            var icon,
                value;

            self._tmpScore = self.options.score;

            self.$stars.each(function (index) {
                icon = (self.options.score && self.options.score - 1 >= index) ? 'starOn' : 'starOff';
                $(this).attr('src', self.options.path + self.options[icon]);
            });

            method._setStar.call(self, self.options.score);

            method._setScore.call(self, self.options.score);

            if (self.options.score > self.options.round.down) {
                value = method._getTitle.call(self, Math.ceil(self.options.score));
            } else {
                value = "";
            }

            method._setValue.call(self, value);

            self.event.trigger('mouseleave.rating', [self.options.score, value]);

        }).on('click.rating', 'img', function () {
            var value;
            self.options.score = self._tmpScore;
            method._setStar.call(self, self.options.score);
            method._setScore.call(self, self.options.score);
            value = method._getTitle.call(self, Math.round(self.options.score));
            method._setValue.call(self, value);
            self.event.trigger('click.rating', [self.options.score, value]);
        });
    };

    /**
     * 事件添加
     * @return {Void}   
     */
    Rating.prototype.on = function (name, callback) {
        var self = this;
        this.event.on(name + '.rating', function (args) {
            callback.apply(self, args);
        });
        return this;
    };


    return Rating;
});
