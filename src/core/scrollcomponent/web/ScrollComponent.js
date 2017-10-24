import React from "react";
import ScrollViewer from "./ScrollViewer";
import PropTypes from "prop-types";
/***
 * The responsibility of a scroll component is to report its size, scroll events and provide a way to scroll to a given offset.
 * RecyclerListView works on top of this interface and doesn't care about the implementation. To support web we only had to provide
 * another component written on top of web elements
 */
class ScrollComponent extends React.Component {
    constructor(args) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        this._onSizeChanged = this._onSizeChanged.bind(this);

        this._height = 0;
        this._width = 0;
    }

    _onScroll(e) {
        this.props.onScroll(e.offsetX, e.offsetY, e);
    }

    _onSizeChanged(event) {
        if (this.props.onSizeChanged) {
            this.props.onSizeChanged(event);
        }
    }

    scrollTo(x, y, isAnimated) {
        this.refs["scrollView"].scrollTo(x, y, isAnimated);
    }

    render() {
        const invertedStyles = this.props.inverted
        ? { transform: this.props.isHorizontal ? "scaleX(-1)" : "scaleY(-1)" }
        : null;
    const horizontalStyle = this.props.isHorizontal
        ? {
                position: "absolute",
                top: 0,
                left: this.props.contentWidth
            }
        : null;
        return (
            <ScrollViewer ref="scrollView"
                          {...this.props}
                          horizontal={this.props.isHorizontal}
                          onScroll={this._onScroll}
                          onSizeChanged={this._onSizeChanged}>

                <div style={{
                    height: this.props.contentHeight,
                    width: this.props.contentWidth,
                }}>
                    {this.props.children}
                </div>
                {this.props.renderFooter ? <div style={{ ...horizontalStyle, ...invertedStyles }}>
                    {this.props.renderFooter()}
                </div> : null}
            </ScrollViewer>
        );
    }
}

export default ScrollComponent;
ScrollComponent.defaultProps = {
    isHorizontal: false,
    contentHeight: 0,
    contentWidth: 0,
    scrollThrottle: 0,
    inverted: false
};
//#if [DEV]
ScrollComponent.propTypes = {
    contentHeight: PropTypes.number,
    contentWidth: PropTypes.number,
    onSizeChanged: PropTypes.func,
    isHorizontal: PropTypes.bool,
    renderFooter: PropTypes.func,
    scrollThrottle: PropTypes.number,
    canChangeSize: PropTypes.bool,
    distanceFromWindow: PropTypes.number,
    useWindowScroll: PropTypes.bool,
    inverted: PropTypes.bool
};
//#endif
