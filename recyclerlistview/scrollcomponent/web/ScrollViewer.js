import React from "react";
import _throttle from "lodash/throttle";
import PropTypes from "prop-types";
export default class ScrollViewer extends React.Component {
    constructor(args) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        this.scrollEvent = {offsetX: 0, offsetY: 0};
        this._throttleParams = {leading: true, trailing: true};
    }

    componentDidMount() {
        if (this.props.onSizeChanged) {
            let divRef = this.refs.mainDiv;
            this.props.onSizeChanged({height: divRef.clientHeight, width: divRef.clientWidth});
        }
    }

    _onScroll() {
        if (this.props.onScroll) {
            if (this.props.horizontal) {
                this.scrollEvent.offsetY = 0;
                this.scrollEvent.offsetX = this.refs.mainDiv.scrollLeft;
            }
            else {
                this.scrollEvent.offsetX = 0;
                this.scrollEvent.offsetY = this.refs.mainDiv.scrollTop;
            }
            this.props.onScroll(this.scrollEvent);
        }
    }

    scrollTo(x, y, isAnimated) {
        //console.log( this.refs.mainDiv.scollLeft);
        if (this.props.isHorizontal) {
            this.refs.mainDiv.scrollLeft = x;
        } else {
            this.refs.mainDiv.scrollTop = y;
        }
    }

    render() {
        return (
            <div ref="mainDiv"
                 onScroll={_throttle(this._onScroll, this.props.scrollThrottle, this._throttleParams)}
                 style={{
                     "-webkit-overflow-scrolling": "touch",
                     overflowX: this.props.horizontal ? "scroll" : "hidden",
                     overflowY: !this.props.horizontal ? "scroll" : "hidden",
                     height: '100%',
                     width: '100%'
                 }}>
                <div style={{position: 'relative'}}>
                    {this.props.children}
                </div>
            </div>);
    }
}
ScrollViewer.defaultProps = {
    scrollThrottle: 32,
    canChangeSize: false
};
ScrollViewer.propTypes = {
    onScroll: PropTypes.func,
    onSizeChanged: PropTypes.func,
    horizontal: PropTypes.bool,
    scrollThrottle: PropTypes.number,
    canChangeSize: PropTypes.bool
};