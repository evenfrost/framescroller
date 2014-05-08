/**
 * Some custom stuff to be transitted.
 */
var tips = {
    section: document.querySelector('.scroller-wrapper'),
    delay: 200,
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusantium, autem alias atque nesciunt odio harum. Exercitationem, repellendus, ratione, ullam est id mollitia accusamus porro nesciunt perspiciatis hic dolores deleniti tenetur!',

    add: function (className) {
        var fragment = document.createDocumentFragment(),
            wrapper = document.createElement('div');

        if (!this.section.querySelector('.tip')) {
            for (var i = 0; i < 3; i++) {
                var tip = document.createElement('div'),
                    header = document.createElement('H1'),
                    p = document.createElement('P');

                tip.classList.add('tip', className);
                fragment.appendChild(tip);

                header.textContent = i
                    ? i === 1
                        ? 'dolor sit'
                        : 'amet, consectetur.'
                    : 'Lorem ipsum';

                tip.appendChild(header);
                p.textContent = this.text;
                tip.appendChild(p);
            };

            this.section.appendChild(wrapper);
            wrapper.classList.add('tip-wrapper');
            wrapper.appendChild(fragment);
        }
    },

    toggle: function (toTop) {
        var delay = this.delay,
            text = this.text,
            className,
            oppositeClassName;

        if (toTop) {
            className = 'top';
            oppositeClassName = 'bottom';
        } else {
            className = 'bottom';
            oppositeClassName = 'top';
        }

        if (!this.section.querySelector('.tip')) {
            this.add(className);
        }

        Array.prototype.forEach.call(this.section.querySelectorAll('.tip'), function (tip) {
            setTimeout(function () {
                if (tip.classList.contains(className) || tip.classList.contains(oppositeClassName)) {
                    tip.classList.remove(className);
                } else {
                    tip.classList.add(oppositeClassName);
                }

            }, delay);
            delay += delay;
        });
    }
}

/**
 * Initialize Framescroller.
 */
Framescroller.init(
    document.querySelector('.scroller'),
    {
        count: 50,
        transits: [
            {
                index: 15,
                callback: function(toTop) {
                    tips.toggle.call(tips, toTop);
                }
            },
            {
                index: 35,
                callback: function(toTop) {
                    tips.toggle.call(tips, toTop);
                }
            }
        ]
    }
);
