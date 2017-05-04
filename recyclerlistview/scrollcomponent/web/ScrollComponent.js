import React from "react";
import ScrollViewer from "./ScrollViewer";
import PropTypes from "prop-types";
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
        return (
            <ScrollViewer ref="scrollView"
                          {...this.props}
                          horizontal={this.props.isHorizontal}
                          onScroll={this._onScroll}
                          distanceFromWindow={this.props.distanceFromWindow}
                          canChangeSize={this.props.canChangeSize}
                          scrollThrottle={this.props.scrollThrottle}
                          useWindowScroll={this.props.useWindowScroll}
                          onSizeChanged={this._onSizeChanged}>

                <div style={{
                    height: this.props.contentHeight,
                    width: this.props.contentWidth,
                }}>
                    {this.props.children}
                </div>
                <div style={this.props.isHorizontal ? {
                    position: 'absolute',
                    top: 0,
                    left: this.props.contentWidth
                } : null}>
                    {this.props.renderFooter ? this.props.renderFooter() : null}
                </div>
            </ScrollViewer>
        );
    }
}

export default ScrollComponent;
ScrollComponent.defaultProps = {
    isHorizontal: false,
    contentHeight: 0,
    contentWidth: 0,
    scrollThrottle: 32
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
    useWindowScroll: PropTypes.bool
};
//#endif
