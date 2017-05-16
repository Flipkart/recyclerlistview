import React from "react";
import _throttle from "lodash/throttle";
import PropTypes from "prop-types";
export default class ScrollViewer extends React.Component {
    constructor(args) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        this._windowOnScroll = this._windowOnScroll.bind(this);
        this._getRelevantOffset = this._getRelevantOffset.bind(this);
        this._setRelevantOffset = this._setRelevantOffset.bind(this);
        this._onWindowResize = this._onWindowResize.bind(this);

        this.scrollEvent = {offsetX: 0, offsetY: 0};
        this._throttleParams = {leading: true, trailing: true};
    }

    componentDidMount() {
        if (this.props.onSizeChanged) {
            if (!this.props.useWindowScroll) {
                let divRef = this.refs.mainDiv;
                this._startListeningToDivEvents();
                this.props.onSizeChanged({height: divRef.clientHeight, width: divRef.clientWidth});
            }
        }
    }

    componentWillMount() {
        if (this.props.onSizeChanged) {
            if (this.props.useWindowScroll) {
                this._startListeningToWindowEvents();
                this.props.onSizeChanged({height: window.innerHeight, width: window.innerWidth});
            }
        }
    }

    componentWillUnmount() {
        if (this._throttleFunction) {
            window.removeEventListener("scroll", this._throttleFunction);
            if (this.refs.mainDiv) {
                this.refs.mainDiv.removeEventListener("scroll", this._onScroll);
            }
        }
        window.removeEventListener("resize", this._onWindowResize);
    }

    scrollTo(x, y, isAnimated) {
        if (isAnimated) {
            this._doAnimatedScroll(this.props.isHorizontal ? x : y);
        } else {
            this._setRelevantOffset(this.props.isHorizontal ? x : y);
        }
    }

    _getRelevantOffset() {
        if (!this.props.useWindowScroll) {
            if (this.props.isHorizontal) {
                return this.refs.mainDiv.scrollLeft;
            } else {
                return this.refs.mainDiv.scrollTop;
            }
        } else {
            if (this.props.isHorizontal) {
                return window.scrollX;
            } else {
                return window.scrollY;
            }
        }
    }

    _setRelevantOffset(offset) {
        if (!this.props.useWindowScroll) {
            if (this.props.isHorizontal) {
                this.refs.mainDiv.scrollLeft = offset;
            } else {
                this.refs.mainDiv.scrollTop = offset;
            }
        } else {
            if (this.props.isHorizontal) {
                window.scrollTo(offset + this.props.distanceFromWindow, 0);
            } else {
                window.scrollTo(0, offset + this.props.distanceFromWindow);
            }
        }
    }

    _doAnimatedScroll(offset) {
        let start = this._getRelevantOffset();
        if (offset > start) {
            start = Math.max(offset - 800, start);
        } else {
            start = Math.min(offset + 800, start);
        }
        const change = offset - start;
        const increment = 20;
        const duration = 200;
        const animateScroll = elapsedTime => {
            elapsedTime += increment;
            var position = this._easeInOut(elapsedTime, start, change, duration);
            this._setRelevantOffset(position);
            if (elapsedTime < duration) {
                window.setTimeout(
                    function () {
                        animateScroll(elapsedTime);
                    },
                    increment
                );
            }
        };
        animateScroll(0);
    }

    _startListeningToDivEvents() {
        if (this.props.scrollThrottle > 0) {
            this._throttleFunction = _throttle(this._onScroll, this.props.scrollThrottle, this._throttleParams);
        } else {
            this._throttleFunction = this._onScroll;
        }
        this.refs.mainDiv.addEventListener("scroll", this._throttleFunction);
    }

    _startListeningToWindowEvents() {
        if (this.props.scrollThrottle > 0) {
            this._throttleFunction = _throttle(this._windowOnScroll, this.props.scrollThrottle, this._throttleParams);
        } else {
            this._throttleFunction = this._windowOnScroll;
        }
        window.addEventListener("scroll", this._throttleFunction);
        if (this.props.canChangeSize) {
            window.addEventListener("resize", this._onWindowResize);
        }
    }

    _onWindowResize() {
        if (this.props.onSizeChanged && this.props.useWindowScroll) {
            this.props.onSizeChanged({height: window.innerHeight, width: window.innerWidth});
        }
    }

    _windowOnScroll() {
        if (this.props.onScroll) {
            if (this.props.horizontal) {
                this.scrollEvent.offsetY = 0;
                this.scrollEvent.offsetX = window.scrollX - this.props.distanceFromWindow;
            } else {
                this.scrollEvent.offsetX = 0;
                this.scrollEvent.offsetY = window.scrollY - this.props.distanceFromWindow;
            }
            this.props.onScroll(this.scrollEvent);
        }
    }

    _onScroll() {
        if (this.props.onScroll) {
            if (this.props.horizontal) {
                this.scrollEvent.offsetY = 0;
                this.scrollEvent.offsetX = this.refs.mainDiv.scrollLeft;
            } else {
                this.scrollEvent.offsetX = 0;
                this.scrollEvent.offsetY = this.refs.mainDiv.scrollTop;
            }
            this.props.onScroll(this.scrollEvent);
        }
    }

    _easeInOut(currentTime, start, change, duration) {
        currentTime /= duration / 2;
        if (currentTime < 1) {
            return change / 2 * currentTime * currentTime + start;
        }
        currentTime -= 1;
        return (-change) / 2 * (currentTime * (currentTime - 2) - 1) + start;
    }

    render() {
        return !this.props.useWindowScroll
            ? <div
                ref="mainDiv"
                style={{
                    "-webkit-overflow-scrolling": "touch",
                    overflowX: this.props.horizontal ? "scroll" : "hidden",
                    overflowY: !this.props.horizontal ? "scroll" : "hidden",
                    height: "100%",
                    width: "100%"
                }}
            >
                <div style={{position: "relative"}}>
                    {this.props.children}
                </div>
            </div>
            : <div style={{position: "relative"}}>
                {this.props.children}
            </div>;
    }
}
ScrollViewer.defaultProps = {
    scrollThrottle: 32,
    canChangeSize: false,
    useWindowScroll: false,
    distanceFromWindow: 0
};
ScrollViewer.propTypes = {
    onScroll: PropTypes.func,
    onSizeChanged: PropTypes.func,
    horizontal: PropTypes.bool,
    scrollThrottle: PropTypes.number,
    canChangeSize: PropTypes.bool,
    useWindowScroll: PropTypes.bool,
    distanceFromWindow: PropTypes.number
};
