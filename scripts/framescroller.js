var Framescroller = (function () {

    var

    /**
     * Cached scroller variables.
     */
    _scroller = {
        el: null,      // 'el' is replaced with HTMLElement set by user 
        absolute: 0,   // scroller's top position, is absolute
        top: 0,        // scroller's top position, is relative to viewport
        prev: 0,       // previous relative top value (used for catching when scroller comes into view)
        docked: false, // is scroller docked?
        below: true,   // is scroller below the viewport?
        touchY: 0      // previous touch value (for detetcting touch direction)
    },

     /**
      * Image frames variables.
      */
    _frames = {
        list: [],
        index: 0
    },

    _timer = null,
    _logging = true,

    /**
     * Default parameters.
     */
    params = {
        folder: 'images',      // common folder for images (either absolute or relative path)
        tiny: 'sm',            // thumbnails folder name
        big: 'lg',             // big images folder name
        format: '.jpg',        // images format
        count: false,          // images count
        keys: [32, 33, 34,     // keyboard button keys to handle when framescroll is active
               35, 36, 37,
               38, 39, 40],
        delay: 300,            // timeout delay for big image loading
        touchSpeed: 2,         // touch scroll speed modifier
        transits: {},
        transitIndexes: []
    },

    // events that handle page scrolling by a user
    _events = ['wheel', 'mousewheel', 'DOMMouseScroll', 'touchmove'],

    /**
     * Adds multiple events.
     */
    addEventListeners = function (element, events, listener, useCapture) {
        for (var i = events.length - 1; i >= 0; i--) {
            var event = events[i];
            element.addEventListener(event, listener, !!useCapture)
        };
    },

    /**
     * Removes multiple events
     */
    removeEventListeners = function (element, events, listener, useCapture) {
        for (var i = events.length - 1; i >= 0; i--) {
            var event = events[i];
            element.removeEventListener(event, listener, !!useCapture)
        };
    },

    /**
     * Initializes plugin.
     */
    init = function (element, settings) {
        // check if scroller is an HTML element
        if (!(element instanceof HTMLElement)) {
            throw new Error('First parameter must be an HTML image element.');
        }

        // set scroller element
        _scroller.el = element;
        // locate scroller
        _scroller.top = _scroller.prev = _scroller.el.getBoundingClientRect().top;
        // check if scroller is below the viewport
        _scroller.below = _scroller.top > document.body.scrollTop;

        // override default parameters
        for (prop in settings) {
            if (params.hasOwnProperty(prop)) {
                params[prop] = settings[prop];
            }
        }

        // register transit indexes for faster looping-through
        params.transits.forEach(function (transit) {
            params.transitIndexes.push(transit.index);
        });
            
        preloadImages();
        registerEvents();
    },

    /**
     * Registers common events.
     */
    registerEvents = function () {
        document.addEventListener('scroll', handleScroll, false);
        // document.addEventListener('touchmove', handleScroll, false);
        // document.addEventListener('touchstart', updateTouchPosition, false);

        _scroller.absolute = document.body.scrollTop + _scroller.top;

        // _scroller.touchScrollEvent = new UIEvent('touchmove');

        document.addEventListener('touchmove', preventDockedScrolling, false);
    },

    /**
     * Caches small images.
     */
    preloadImages = function () {
        var timeout,
            check = true,
            finished = false,
            i = 1,
            image;

        timeout = setTimeout(getImage, 1);

        function getImage() {
            image = new Image;
            
            if (!finished) {
                image.onload = pushImage;
                image.onerror = stopLoad;
                image.src = params.folder + '/' + params.tiny + '/' + i + params.format;
            }
        }

        function pushImage() {
            _frames.list.push(image.src);
            if (i === params.count) {
                // set appropriate frame if scroller is above viewport
                if (!_scroller.below) {
                    _frames.index = params.count - 1;
                    loadImage(_frames.index);
                }
            } else {
                i++;
                timeout = setTimeout(getImage, 1);
            }
        }

        function stopLoad() {
            finished = true;
        }
    },

    /**
     * Updates touchY variable for proper touch scrolling.
     */
    updateTouchPosition = function (event) {
        _scroller.touchY = event.touches[0].clientY;
    },

    preventDockedScrolling = function (event) {
        if (_scroller.docked) {
            event.preventDefault();
        }
    },

    /**
     * Docks scroller and disables DOM scrolling.
     */
    dockScroller = function () {
        !_logging || console.log('%cdocked', 'color: green; font-weight: 700');

        // _scroller.absolute = document.body.scrollTop + _scroller.top;

        window.scroll(0, _scroller.absolute);

        _scroller.top = _scroller.prev = 0;
        _scroller.docked = true;

        // document.removeEventListener('scroll', handleScroll, false);
        // document.removeEventListener('touchmove', handleScroll, false);
        document.removeEventListener('touchstart', updateTouchPosition, false);
        document.removeEventListener('touchmove', preventDockedScrolling, false);

        addEventListeners(window, _events, handleDockedScroll);
        document.addEventListener('keydown', handleDockedKeys, false);
    },

    /**
     * Undocks scroller and enable DOM scrolling.
     */
    undockScroller = function () {
        !_logging || console.log('%cundocked', 'color: green; font-weight: 700');
        _scroller.docked = false;
        _scroller.top = 0;

        // little hack goes here —— prevent further docking
        if (_scroller.below) {
            _scroller.prev = 1;
            document.body.scrollTop--;
        } else {
            _scroller.prev = -1;
            document.body.scrollTop++;
        }

        // document.addEventListener('scroll', handleScroll, false);
        // document.addEventListener('touchmove', handleScroll, false);
        document.addEventListener('touchmove', preventDockedScrolling, false);
        document.addEventListener('touchstart', updateTouchPosition, false);

        removeEventListeners(window, _events, handleDockedScroll);
        document.removeEventListener('keydown', handleDockedKeys, false);
    },

    /**
     * Handles document scrolling.
     */
    handleScroll = function (event) {
        !_logging || console.log('%cscrolling', 'color: blue; font-weight: 700');
        // prevent touch scroll momentum
        if (_scroller.docked) {
            window.scroll(0, _scroller.absolute);
            return;
        }

        /*if (event.type === 'touchmove') {
            _scroller.touchY = event.touches[0].clientY;
        }*/

        _scroller.top = _scroller.el.getBoundingClientRect().top;

        // console.log(window.scrollY);

        // dock scroller if it came into view and not yet docked
        // !(_scroller.top > 0) === !(_scroller.prev > 0) || dockScroller();
        if (!(_scroller.top > 0) !== !(_scroller.prev > 0)) {
            // _scroller.docked = true;
            dockScroller();
        }

        _scroller.prev = _scroller.top;
    },

    /**
     * Puts appropriate frame when scroller is docked.
     */
    handleDockedScroll = function (event) {
        event.preventDefault();

        // console.log('%cprevious touch: ' + _scroller.touchY, 'color: orange');
        // console.log('%ccurrent touch: ' + event.touches[0].clientY, 'color: green');

        // determine if scrolling from bottom to top
        var prev;

        if (event.type === 'touchmove') {
            // console.log(event);
            prev = _scroller.touchY < event.touches[0].clientY;
            updateTouchPosition(event);
        } else {
            prev = event.wheelDelta > 0;
        }

        // console.log(prev);

        // var prev = event.type === 'touchmove'
        //     ? _scroller.touchY < event.touches[0].clientY
        //     : event.wheelDelta > 0;

        // console.log(_scroller.touchY, event.touches[0].clientY);
        replaceFrame(prev);
    },

    /**
     * Handles keys pressing when the scroller is docked.
     */
    handleDockedKeys = function (event) {
        var key = event.keyCode;

        if (params.keys.indexOf(key) < 0) {
            return;
        }

        event.preventDefault();

        replaceFrame(key === 33 || key === 36 || key === 38);
    },

    /**
     * Handles image frame replacement.
     */
    replaceFrame = function (prev) {
        !_logging || console.log('%creplacing', 'color: orange; font-weight: 700');

        /*if (document.body.scrollTop !== _scroller.absolute) {
            document.body.scrollTop = _scroller.absolute;
        }*/

        // execute transit functions
        var transitIndex = params.transitIndexes.indexOf(_frames.index);
        if (~transitIndex) {
            var transit = params.transits[transitIndex];

            transit.callback.call(_scroller.el, prev);
            // remove transit item if corresponding option is provided
            if (transit.once) {
                params.transits.splice(transitIndex, 1);
                params.transitIndexes.splice(transitIndex, 1);
            }
        }

        // increase/descreace index depending on scroll direction
        prev ? _frames.index-- : _frames.index++;

        // edge values are first (e.g. zero) and last indexes of the images array (e.g. params.count - 1)
        var edge = params.count - 1;

        // prevent index going beyond edge values 
        _frames.index = _frames.index > edge
            ? edge
            : _frames.index < 0
                ? 0 : _frames.index;
        
        // undock scroller on edge values 
        if (!_frames.index || _frames.index === edge) {
            _scroller.below = !_frames.index;
            undockScroller();
            return;
        }

        loadImage(_frames.index);
    },

    /**
     * Appends appropriate frame to scroller.
     */
    loadImage = function (imageIndex) {
        var loadedLink = _frames.list[imageIndex],
            bigLink = loadedLink.replace('/' + params.tiny + '/', '/' + params.big + '/'),
            bigImage = new Image;

        _scroller.el.src = loadedLink;

        !_timer || clearTimeout(_timer);

        _timer = setTimeout(function () {
            handleLoad();
        }, 500);

        // replace thumbnail with big image
        function handleLoad() {
            bigImage.src = bigLink;
            bigImage.onload = function () {
                _scroller.el.src = bigLink;
            }
        }
    };

    return { init: init };

})();