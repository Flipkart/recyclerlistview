import * as React from "react";
import { Dimension } from "../../../core/dependencies/LayoutProvider";
import BaseScrollComponent, { ScrollComponentProps } from "../../../core/scrollcomponent/BaseScrollComponent";
import BaseScrollView, { ScrollEvent } from "../../../core/scrollcomponent/BaseScrollView";
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
        externalScrollView: ScrollViewer,
        isHorizontal: false,
        scrollThrottle: 16,
        canChangeSize: false,
    };
    private _height: number;
    private _width: number;
    private _scrollViewRef: BaseScrollView | null = null;

    constructor(args: ScrollComponentProps) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        this._onSizeChanged = this._onSizeChanged.bind(this);

        this._height = 0;
        this._width = 0;
    }

    public scrollTo(x: number, y: number, animated: boolean): void {
        if (this._scrollViewRef) {
            this._scrollViewRef.scrollTo({ x, y, animated });
        }
    }

    public render(): JSX.Element {
        const Scroller = this.props.externalScrollView as any; //TSI
        return (
            <Scroller ref={(scrollView: BaseScrollView) => this._scrollViewRef = scrollView as (BaseScrollView | null)}
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
            </Scroller>
        );
    }

    private _onScroll(e: ScrollEvent): void {
        this.props.onScroll(e.nativeEvent.contentOffset.x, e.nativeEvent.contentOffset.y, e);
    }

    private _onSizeChanged(event: Dimension): void {
        if (this.props.onSizeChanged) {
            this.props.onSizeChanged(event);
        }
    }
}
