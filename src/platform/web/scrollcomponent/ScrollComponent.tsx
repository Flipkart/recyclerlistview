import * as React from "react";
import { Dimension } from "../../../core/dependencies/LayoutProvider";
import BaseScrollComponent, { ScrollComponentProps } from "../../../core/scrollcomponent/BaseScrollComponent";
import { ScrollEvent } from "../../../core/scrollcomponent/BaseScrollView";
import ScrollViewer from "./ScrollViewer";
/***
 * The responsibility of a scroll component is to report its size, scroll events and provide a way to scroll to a given offset.
 * RecyclerListView works on top of this interface and doesn't care about the implementation. To support web we only had to provide
 * another component written on top of web elements
 */

export default class ScrollComponent extends BaseScrollComponent {
    public static defaultProps = {
        contentHeight: 0,
        contentWidth: 0,
        isHorizontal: false,
        scrollThrottle: 0,
    };
    private _height: number;
    private _width: number;
    private _scrollViewRef: ScrollViewer | null;

    constructor(args: ScrollComponentProps) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        this._onSizeChanged = this._onSizeChanged.bind(this);

        this._height = 0;
        this._width = 0;
    }

    public _onScroll(e: ScrollEvent) {
        this.props.onScroll(e.nativeEvent.contentOffset.x, e.nativeEvent.contentOffset.y, e);
    }

    public _onSizeChanged(event: Dimension) {
        if (this.props.onSizeChanged) {
            this.props.onSizeChanged(event);
        }
    }

    public scrollTo(x: number, y: number, animated: boolean) {
        if (this._scrollViewRef) {
            this._scrollViewRef.scrollTo({x, y, animated});
        }
    }

    public render() {
        return (
            <ScrollViewer ref={(scrollView) => this._scrollViewRef as (ScrollViewer | null)}
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
                {this.props.renderFooter ? <div style={this.props.isHorizontal ? {
                    left: this.props.contentWidth,
                    position: "absolute",
                    top: 0,
                } : undefined}>
                    {this.props.renderFooter()}
                </div> : null}
            </ScrollViewer>
        );
    }
}
