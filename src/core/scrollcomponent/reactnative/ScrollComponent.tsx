import * as React from 'react';
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    View
} from "react-native";
import BaseScrollComponent, { ScrollComponentProps } from "../BaseScrollComponent";
/***
 * The responsibility of a scroll component is to report its size, scroll events and provide a way to scroll to a given offset.
 * RecyclerListView works on top of this interface and doesn't care about the implementation. To support web we only had to provide
 * another component written on top of web elements
 */


export default class ScrollComponent extends BaseScrollComponent{
    static defaultProps = {
        isHorizontal: false,
        contentHeight: 0,
        contentWidth: 0,
        scrollThrottle: 0
    }

    private _height: number;
    private _width: number;
    private _isSizeChangedCalledOnce: boolean;
    private _dummyOnLayout: (event: LayoutChangeEvent) => void;
    private _scrollViewRef: ScrollView | null;

    constructor(args: ScrollComponentProps) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        this._onLayout = this._onLayout.bind(this);

        this._height = 0;
        this._width = 0;

        this._isSizeChangedCalledOnce = false;
    }

    _onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
        this.props.onScroll(event.nativeEvent.contentOffset.x, event.nativeEvent.contentOffset.y, event);
    }

    _onLayout(event: LayoutChangeEvent) {
        if (this._height !== event.nativeEvent.layout.height || this._width !== event.nativeEvent.layout.width) {
            this._height = event.nativeEvent.layout.height;
            this._width = event.nativeEvent.layout.width;
            if (this.props.onSizeChanged) {
                this._isSizeChangedCalledOnce = true;
                this.props.onSizeChanged(event.nativeEvent.layout);
            }
        }
    }

    scrollTo(x: number, y: number, isAnimated: boolean) {
        if(this._scrollViewRef) {
            this._scrollViewRef.scrollTo({x: x, y: y, animated: isAnimated});
        }
    }

    render(): JSX.Element {
        return (
            <ScrollView ref={(scrollView) => this._scrollViewRef = scrollView as (ScrollView | null)} removeClippedSubviews={false}
                        scrollEventThrottle={this.props.scrollThrottle}
                        {...this.props}
                        horizontal={this.props.isHorizontal}
                        onScroll={this._onScroll}
                        onLayout={(!this._isSizeChangedCalledOnce || this.props.canChangeSize) ? this._onLayout : this._dummyOnLayout}>
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