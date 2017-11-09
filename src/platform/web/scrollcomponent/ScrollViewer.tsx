import * as React from "react";
import { default as BaseScrollView, ScrollEvent, ScrollViewDefaultProps } from "../../../core/scrollcomponent/BaseScrollView";
/***
 * A scrollviewer that mimics react native scrollview. Additionally on web it can start listening to window scroll events optionally.
 * Supports both window scroll and scrollable divs inside other divs.
 */
export interface ScrollViewerProps extends ScrollViewDefaultProps {
    distanceFromWindow: number;
    useWindowScroll: boolean;
}
export default class ScrollViewer extends BaseScrollView<ScrollViewerProps> {
    public static defaultProps: Partial<ScrollViewerProps> = {
        canChangeSize: false,
        distanceFromWindow: 0,
        style: null,
        useWindowScroll: false,
    };

    private scrollEvent: ScrollEvent;
    private _throttleFunction: () => void;
    private _mainDivRef: HTMLDivElement | null;

    constructor(args: ScrollViewerProps) {
        super(args);
        this._onScroll = this._onScroll.bind(this);
        this._windowOnScroll = this._windowOnScroll.bind(this);
        this._getRelevantOffset = this._getRelevantOffset.bind(this);
        this._setRelevantOffset = this._setRelevantOffset.bind(this);
        this._onWindowResize = this._onWindowResize.bind(this);

        this.scrollEvent = {nativeEvent: {contentOffset: {x: 0, y: 0}}};
    }

    public componentDidMount() {
        if (this.props.onSizeChanged) {
            if (!this.props.useWindowScroll && this._mainDivRef) {
                this._startListeningToDivEvents();
                this.props.onSizeChanged({height: this._mainDivRef.clientHeight, width: this._mainDivRef.clientWidth});
            }
        }
    }

    public componentWillMount() {
        if (this.props.onSizeChanged) {
            if (this.props.useWindowScroll) {
                this._startListeningToWindowEvents();
                this.props.onSizeChanged({height: window.innerHeight, width: window.innerWidth});
            }
        }
    }

    public componentWillUnmount() {
        if (this._throttleFunction) {
            window.removeEventListener("scroll", this._throttleFunction);
            if (this._mainDivRef) {
                this._mainDivRef.removeEventListener("scroll", this._onScroll);
            }
        }
        window.removeEventListener("resize", this._onWindowResize);
    }

    public scrollTo(scrollInput: {x: number, y: number, animated: boolean}) {
        if (scrollInput.animated) {
            this._doAnimatedScroll(this.props.horizontal ? scrollInput.x : scrollInput.y);
        } else {
            this._setRelevantOffset(this.props.horizontal ? scrollInput.x : scrollInput.y);
        }
    }

    public _getRelevantOffset(): number {
        if (!this.props.useWindowScroll) {
            if (this._mainDivRef) {
                if (this.props.horizontal) {
                    return this._mainDivRef.scrollLeft;
                } else {
                    return this._mainDivRef.scrollTop;
                }
            }
            return 0;
        } else {
            if (this.props.horizontal) {
                return window.scrollX;
            } else {
                return window.scrollY;
            }
        }
    }

    public _setRelevantOffset(offset: number): void {
        if (!this.props.useWindowScroll) {
            if (this._mainDivRef) {
                if (this.props.horizontal) {
                    this._mainDivRef.scrollLeft = offset;
                } else {
                    this._mainDivRef.scrollTop = offset;
                }
            }
        } else {
            if (this.props.horizontal) {
                window.scrollTo(offset + this.props.distanceFromWindow, 0);
            } else {
                window.scrollTo(0, offset + this.props.distanceFromWindow);
            }
        }
    }

    public _doAnimatedScroll(offset: number) {
        let start = this._getRelevantOffset();
        if (offset > start) {
            start = Math.max(offset - 800, start);
        } else {
            start = Math.min(offset + 800, start);
        }
        const change = offset - start;
        const increment = 20;
        const duration = 200;
        const animateScroll = (elapsedTime: number) => {
            elapsedTime += increment;
            const position = this._easeInOut(elapsedTime, start, change, duration);
            this._setRelevantOffset(position);
            if (elapsedTime < duration) {
                window.setTimeout(() => animateScroll(elapsedTime), increment);
            }
        };
        animateScroll(0);
    }

    public _startListeningToDivEvents() {
        this._throttleFunction = this._onScroll;
        if (this._mainDivRef) {
            this._mainDivRef.addEventListener("scroll", this._throttleFunction);
        }
    }

    public _startListeningToWindowEvents() {
        this._throttleFunction = this._windowOnScroll;
        window.addEventListener("scroll", this._throttleFunction);
        if (this.props.canChangeSize) {
            window.addEventListener("resize", this._onWindowResize);
        }
    }

    public _onWindowResize() {
        if (this.props.onSizeChanged && this.props.useWindowScroll) {
            this.props.onSizeChanged({height: window.innerHeight, width: window.innerWidth});
        }
    }

    public _windowOnScroll() {
        if (this.props.onScroll) {
            if (this.props.horizontal) {
                this.scrollEvent.nativeEvent.contentOffset.y = 0;
                this.scrollEvent.nativeEvent.contentOffset.x = window.scrollX - this.props.distanceFromWindow;
            } else {
                this.scrollEvent.nativeEvent.contentOffset.x = 0;
                this.scrollEvent.nativeEvent.contentOffset.y = window.scrollY - this.props.distanceFromWindow;
            }
            this.props.onScroll(this.scrollEvent);
        }
    }

    public _onScroll() {
        if (this.props.onScroll) {
            if (this.props.horizontal) {
                this.scrollEvent.nativeEvent.contentOffset.y = 0;
                this.scrollEvent.nativeEvent.contentOffset.x = this._mainDivRef ? this._mainDivRef.scrollLeft : 0;
            } else {
                this.scrollEvent.nativeEvent.contentOffset.x = 0;
                this.scrollEvent.nativeEvent.contentOffset.y = this._mainDivRef ? this._mainDivRef.scrollTop : 0;
            }
            this.props.onScroll(this.scrollEvent);
        }
    }

    public _easeInOut(currentTime: number, start: number, change: number, duration: number): number {
        currentTime /= duration / 2;
        if (currentTime < 1) {
            return change / 2 * currentTime * currentTime + start;
        }
        currentTime -= 1;
        return (-change) / 2 * (currentTime * (currentTime - 2) - 1) + start;
    }

    public render() {
        return !this.props.useWindowScroll
            ? <div
                ref={(div) => this._mainDivRef = div as HTMLDivElement | null}
                style={{
                    WebkitOverflowScrolling: "touch",
                    height: "100%",
                    overflowX: this.props.horizontal ? "scroll" : "hidden",
                    overflowY: !this.props.horizontal ? "scroll" : "hidden",
                    width: "100%",
                    ...this.props.style,
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
