import React from 'react';
import {ScrollView, View} from "react-native";
class ScrollComponent extends React.Component {
    constructor(args) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        this._onLayout = this._onLayout.bind(this);

        this._height = 0;
        this._width = 0;
    }

    _onScroll(event) {
        this.props.onScroll(event.nativeEvent.contentOffset.x, event.nativeEvent.contentOffset.y, event);
    }

    _onLayout(event) {
        if (this._height !== event.nativeEvent.layout.height || this._width !== event.nativeEvent.layout.width) {
            this._height = event.nativeEvent.layout.height;
            this._width = event.nativeEvent.layout.width;
            if (this.props.onSizeChanged) {
                this.props.onSizeChanged(event.nativeEvent.layout);
            }
        }

    }

    scrollTo(x, y, isAnimated) {
        this.refs["scrollView"].scrollTo({x: x, y: y, animated: isAnimated});
    }

    render() {
        return (
            <ScrollView ref="scrollView" removeClippedSubviews={false} scrollEventThrottle={16}
                        {...this.props.parentProps}
                        horizontal={this.props.isHorizontal}
                        onScroll={this._onScroll}
                        onLayout={this._onLayout}>
                <View style={{flexDirection: this.props.isHorizontal ? 'row' : 'column'}}>
                    <View style={{
                        height: this.props.contentHeight,
                        width: this.props.contentWidth,
                    }}>
                        {this.props.children}
                    </View>
                    {this.props.renderFooter ? this.props.renderFooter() : null}
                </View>
            </ScrollView>
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