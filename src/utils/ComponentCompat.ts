import * as React from "react";

//Interim solve given we want to be active on old react as well for now.
export abstract class ComponentCompat<T1 = {}, T2 = {}, SS = any> extends React.Component<T1, T2, SS> {
    private _hasRenderedOnce: boolean = false;
    private _didPropsChange: boolean = false;

    constructor(props: T1, context?: any) {
        super(props, context);
    }

    public shouldComponentUpdate(newProps: T1, newState: T2): boolean {
        if (this.props !== newProps) {
            this.componentWillReceivePropsCompat(newProps);
        }
        return true;
    }

    /**
     * allow the extended component to access _hasRenderedOnce flag
     * to ensure that the component has rendered at least once
     * @returns _hasRenderedOnce
     */
    public getHasRenderedOnce(): boolean {
        return this._hasRenderedOnce;
    }
    //setState inside will not update the existing cycle, not a true replacement for componentWillReceiveProps
    public componentWillReceivePropsCompat(newProps: T1): void {
        //no op
    }

    public componentWillMountCompat(): void {
        //no op
    }

    public componentWillUpdateCompat(): void {
        //no op
    }

    public render(): React.ReactNode {
        if (!this._hasRenderedOnce) {
            this._hasRenderedOnce = true;
            this.componentWillMountCompat();
        } else {
            this.componentWillUpdateCompat();
        }
        return this.renderCompat();
    }

    public abstract renderCompat(): React.ReactNode;
}
