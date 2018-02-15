import ItemAnimator from "../../core/ItemAnimator";
import { ViewStatic, LayoutAnimation, Platform, UIManager } from "react-native";

export default class DefaultNativeItemAnimator implements ItemAnimator {
    public shouldAnimateOnce: boolean = true;
    private hasAnimatedOnce: boolean = false;
    constructor() {
        if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }
    public animateMount(atX: number, atY: number, itemRef?: object): void {
        //no need
    }
    public animateUpdate(fromX: number, fromY: number, toX: number, toY: number, itemRef: object): void {
        //no need
    }

    public animateShift(fromX: number, fromY: number, toX: number, toY: number, itemRef: object): void {
        if (!this.shouldAnimateOnce || this.shouldAnimateOnce && !this.hasAnimatedOnce) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            this.hasAnimatedOnce = true;
        }
    }

    public animateUnmount(atX: number, atY: number, itemRef: object): void {
        //no need
    }
}
