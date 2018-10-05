import IResizeDebugHandler from "./resize/IResizeDebugHandler";

// It is basically container of all debugHandlers.
export interface DebugHandlers {
    resizeDebugHandler?: IResizeDebugHandler;
}
