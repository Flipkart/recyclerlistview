import ResizeDebugHandler from "./resize/ResizeDebugHandler";

// It is basically container of all debugHandlers.
export interface DebugHandlers {
    resizeDebugHandler?: ResizeDebugHandler;
}
