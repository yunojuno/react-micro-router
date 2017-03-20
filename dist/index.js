'use strict';

exports.__esModule = true;
exports.location = exports.Route = exports.routes = undefined;
exports.isMatch = isMatch;
exports.redirect = redirect;
exports.Link = Link;
exports.getCurrentPath = getCurrentPath;
exports.getParams = getParams;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var routes = exports.routes = [];

function isMatch(path, exact) {
    if (!path) {
        return false;
    }

    if (exact && location.path() !== path) {
        return false;
    }

    return new RegExp('^' + path).test(location.path());
}

var Route = exports.Route = function (_Component) {
    _inherits(Route, _Component);

    function Route() {
        _classCallCheck(this, Route);

        var _this = _possibleConstructorReturn(this, _Component.call(this));

        _this.onPopState = _this.onPopState.bind(_this);
        return _this;
    }

    Route.prototype.componentWillMount = function componentWillMount() {
        window.addEventListener('popstate', this.onPopState);
        routes.push(this);
    };

    Route.prototype.componentWillUnmount = function componentWillUnmount() {
        window.removeEventListener('popstate', this.onPopState);
        routes.splice(routes.indexOf(this), 1);
    };

    Route.prototype.onPopState = function onPopState() {
        this.forceUpdate();
    };

    Route.prototype.render = function render() {
        var _props = this.props,
            path = _props.path,
            exact = _props.exact,
            children = _props.children;


        if (!isMatch(path, exact)) {
            return null;
        }

        var childNodes = _react2.default.Children.toArray(children);

        if (childNodes.length) {
            var params = getParams(path);

            childNodes = childNodes.map(function (child, i) {
                if (typeof child.type === 'string' || child.type === Route) {
                    return child;
                }
                return (0, _react.cloneElement)(child, { key: 'child' + i, route: { params: params, path: path } });
            });
        }
        return _react2.default.createElement(
            'div',
            null,
            childNodes
        );
    };

    return Route;
}(_react.Component);

function redirect(path) {
    var replace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    window.history[replace ? 'replaceState' : 'pushState']({}, null, path);
    routes.forEach(function (route) {
        return route.forceUpdate();
    });
}

function Link(_ref) {
    var children = _ref.children,
        className = _ref.className,
        to = _ref.to,
        href = _ref.href,
        _ref$replace = _ref.replace,
        replace = _ref$replace === undefined ? false : _ref$replace,
        _ref$activeClassName = _ref.activeClassName,
        activeClassName = _ref$activeClassName === undefined ? 'active' : _ref$activeClassName;

    var path = to || href;

    function onClick(event) {
        event.preventDefault();
        redirect(path, replace);
    }

    if (isMatch(path, path === '/')) {
        className = (className + ' ' + activeClassName).trim();
    }

    return _react2.default.createElement(
        'a',
        { className: className, href: path, onClick: onClick },
        children
    );
}

function getCurrentPath() {
    var lastRoute = routes.filter(function (route) {
        return isMatch(route.props.path, !!route.props.exact);
    }).pop();

    return lastRoute ? lastRoute.props.path : '';
}

function getParams(path) {
    if (!path) {
        path = getCurrentPath();
    }

    return location.path().match(new RegExp('^' + path)).slice(1);
}

// allow tests to override
var location = exports.location = {
    path: function path() {
        return window.location.pathname;
    }
};