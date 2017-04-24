import React from 'react';
class ScrollComponent extends React.Component {
    constructor(args) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        //this._onLayout = this._onLayout.bind(this);

        this._height = 0;
        this._width = 0;
    }

    _onScroll() {
        let sv = this.refs["scrollView"];
        if (this.props.isHorizontal) {
            this.props.onScroll(sv.scrollLeft, 0, null);
        }
        else {
            this.props.onScroll(sv.scrollTop, 0, null);
        }
    }

    componentDidMount() {
        if (this.props.onSizeChanged) {
            let sv = this.refs["scrollView"];
            this.props.onSizeChanged({height: sv.height, width: sv.width});
        }
    }

    // _onLayout(event) {
    //     if (this._height !== event.nativeEvent.layout.height || this._width !== event.nativeEvent.layout.width) {
    //         this._height = event.nativeEvent.layout.height;
    //         this._width = event.nativeEvent.layout.width;
    //         if (this.props.onSizeChanged) {
    //             this.props.onSizeChanged(event.nativeEvent.layout);
    //         }
    //     }
    //
    // }

    scrollTo(x, y, isAnimated) {
        let sv = this.refs["scrollView"];
        if (this.props.isHorizontal) {
            sv.scollLeft = x;
        }
        else {
            sv.scollTop = y;
        }
    }

    render() {
        return (
            <div ref="scrollView"
                 {...this.props.parentProps}
                 style={{
                     overflowX: this.props.isHorizontal ? 'auto' : 'hidden',
                     overflowY: !this.props.isHorizontal ? 'auto' : 'hidden',
                 }}
                 onScroll={this._onScroll}>
                <div style={{flexDirection: this.props.isHorizontal ? 'row' : 'column'}}>
                    <div style={{
                        height: this.props.contentHeight,
                        width: this.props.contentWidth,
                    }}>
                        {this.props.children}
                    </div>
                    {this.props.renderFooter ? this.props.renderFooter() : null}
                </div>
            </div>
        );
    }
}

export default ScrollComponent;
ScrollComponent.defaultProps = {
    isHorizontal: false,
    contentHeight: 0,
    contentWidth: 0
}
//#if [DEV]
ScrollComponent.propTypes = {
    contentHeight: React.PropTypes.number,
    contentWidth: React.PropTypes.number,
    onSizeChanged: React.PropTypes.func,
    parentProps: React.PropTypes.object,
    isHorizontal: React.PropTypes.bool,
    renderFooter: React.PropTypes.func
}
//#endif