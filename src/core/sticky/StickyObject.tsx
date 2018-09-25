/**
 * Created by ananya.chandra on 20/09/18.
 */

import * as React from "react";
import {Animated, Dimensions, View} from "react-native";
import {Layout} from "../layoutmanager/LayoutManager";
import RecyclerListView, {RecyclerListViewProps, RecyclerListViewState} from "../RecyclerListView";

export enum StickyType {
    HEADER,
    FOOTER,
}
export interface StickyObjectProps {
    rowRenderer: ((type: string | number, data: any, index: number) => JSX.Element | JSX.Element[] | null) | null;
    stickyIndices: number[];
    recyclerRef: RecyclerListView<RecyclerListViewProps, RecyclerListViewState> | null;
}
export interface StickyObjectState {
    visible: boolean;
    tentativeSliding: boolean;
}
export default class StickyObject<P extends StickyObjectProps, S extends StickyObjectState> extends React.Component<P, S> {
    private _stickyViewOffset: Animated.Value = new Animated.Value(0);
    private _currentIndice: number = 0;
    private _stickyType: StickyType = StickyType.HEADER;
    private _stickyTypeMultiplier: number = 1;

    constructor(props: P, context?: any) {
        super(props, context);
        this._setStickyType(context as StickyType);
        this.state = {
            visible: this._stickyType === StickyType.FOOTER,
            tentativeSliding: false,
        } as S;
    }

    public render(): JSX.Element | null {
        return (
            <Animated.View style={[
                {position: "absolute", transform: [{translateY: this._stickyViewOffset}]},
                this._stickyType === StickyType.HEADER ? {top: 0} : {bottom: 0}]}>
                {this.state.visible ?
                    this.props.rowRenderer ? this.props.rowRenderer(this.props.stickyIndices[this._currentIndice], null, 0) : null
                    : null}
            </Animated.View>
        );
    }

    public onVisibleIndicesChanged(all: number[], now: number[], notNow: number[]): void {
        //TODO Ananya: Use hashmaps
        if (this.props.stickyIndices) {
            const stickyHeaderIndice: number = this.props.stickyIndices[this._currentIndice];
            if (all.indexOf(stickyHeaderIndice) >= 0 && all.indexOf(stickyHeaderIndice - this._stickyTypeMultiplier) === -1) {
                this.stickyViewVisible(true);
            } else if (all.indexOf(stickyHeaderIndice) >= 0 && all.indexOf(stickyHeaderIndice - this._stickyTypeMultiplier) >= 0) {
                this.stickyViewVisible(false);
            }
        }
    }

    public onScroll(offsetY: number): void {
        if (this.props.recyclerRef) {
            const currentStickyIndice = this.props.stickyIndices[this._currentIndice];
            const previousStickyIndice = this.props.stickyIndices[this._currentIndice - this._stickyTypeMultiplier];
            const nextStickyIndice = this.props.stickyIndices[this._currentIndice + this._stickyTypeMultiplier];
            if (this._stickyType === StickyType.HEADER) {
                if (previousStickyIndice || this.state.tentativeSliding) {
                    const previousLayout: Layout | undefined = this.props.recyclerRef.getLayout(previousStickyIndice);
                    const previousHeight: number | null = previousLayout ? previousLayout.height : null;
                    const currentLayout: Layout | undefined = this.props.recyclerRef.getLayout(currentStickyIndice);
                    const currentY: number | null = currentLayout ? currentLayout.y : null;
                    if (currentY && previousHeight && offsetY < currentY) {
                        if (offsetY > currentY - previousHeight) {
                            this._currentIndice -= 1;
                            const y = offsetY + previousHeight - currentY;
                            this._stickyViewOffset.setValue(-1 * y);
                            this.stickyViewVisible(true, true);
                        }
                    }
                }
                if (nextStickyIndice) {
                    const nextLayout: Layout | undefined = this.props.recyclerRef.getLayout(nextStickyIndice);
                    const nextY: number | null = nextLayout ? nextLayout.y : null;
                    const currentLayout: Layout | undefined = this.props.recyclerRef.getLayout(currentStickyIndice);
                    const currentHeight: number | null = currentLayout ? currentLayout.height : null;
                    if (nextY && currentHeight && offsetY + currentHeight > nextY) {
                        if (offsetY <= nextY) {
                            const y = offsetY + currentHeight - nextY;
                            this._stickyViewOffset.setValue(-1 * y);
                        }
                        if (offsetY > nextY) {
                            this._currentIndice += 1;
                            this._stickyViewOffset.setValue(0);
                            this.stickyViewVisible(true);
                        }
                    }
                }
            } else {
                if (previousStickyIndice || this.state.tentativeSliding) {
                    const previousLayout: Layout | undefined = this.props.recyclerRef.getLayout(previousStickyIndice);
                    const previousHeight: number | null = previousLayout ? previousLayout.height : null;
                    const currentLayout: Layout | undefined = this.props.recyclerRef.getLayout(currentStickyIndice);
                    const currentY: number | null = currentLayout ? currentLayout.y : null;
                    const currentHeight: number | null = currentLayout ? currentLayout.height : null;

                    if (currentY && currentHeight) {
                        const currentYd = -1 * (currentY + currentHeight);
                        const screenHeight: number = Dimensions.get("window").height;
                        const scrollY = -1 * (offsetY + screenHeight);
                        if (previousHeight && scrollY < currentYd) {
                            if (scrollY > currentYd - previousHeight) {
                                this._currentIndice += 1;
                                const translate = scrollY - currentYd + previousHeight;
                                this._stickyViewOffset.setValue(translate);
                                this.stickyViewVisible(true, true);
                            }
                        }
                    }
                }
                if (nextStickyIndice) {
                    const nextLayout: Layout | undefined = this.props.recyclerRef.getLayout(nextStickyIndice);
                    const nextY: number | null = nextLayout ? nextLayout.y : null;
                    const nextHeight: number | null = nextLayout ? nextLayout.height : null;
                    const currentLayout: Layout | undefined = this.props.recyclerRef.getLayout(currentStickyIndice);
                    const currentY: number | null = currentLayout ? currentLayout.y : null;
                    const currentHeight: number | null = currentLayout ? currentLayout.height : null;

                    if (nextY && nextHeight) {
                        const nextYd = -1 * (nextY + nextHeight);
                        const screenHeight: number = Dimensions.get("window").height; //TODO Ananya use recycler height here
                        const scrollY = -1 * (offsetY + screenHeight);
                        if (currentHeight && nextYd && scrollY + currentHeight > nextYd) {
                            if (scrollY <= nextYd) {
                                const translate = scrollY - nextYd + currentHeight;
                                this._stickyViewOffset.setValue(translate);
                            } else if (scrollY > nextYd) {
                                this._currentIndice -= 1;
                                this._stickyViewOffset.setValue(0);
                                this.stickyViewVisible(true);
                            }
                        }
                    }
                }
            }
        }
    }

    protected _setStickyType(stickyType: StickyType): void {
        this._stickyType = stickyType;
        switch (stickyType) {
            case StickyType.HEADER:
                this._stickyTypeMultiplier = 1;
                break;
            case StickyType.FOOTER:
                this._stickyTypeMultiplier = -1;
                break;
        }
    }

    private stickyViewVisible(_visible: boolean, _tentativeSliding?: boolean): void {
        this.setState({
            visible: _visible,
            tentativeSliding: _tentativeSliding ? _tentativeSliding : false,
        });
    }
}
