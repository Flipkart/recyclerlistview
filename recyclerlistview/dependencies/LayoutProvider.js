/**
 * Created by talha.naqvi on 05/04/17.
 */
class LayoutProvider {
    constructor(getLayoutTypeForIndex, setLayoutForType) {
        this._getLayoutTypeForIndex = getLayoutTypeForIndex;
        this._setLayoutForType = setLayoutForType;
    }

    getLayoutTypeForIndex(index) {
        return this._getLayoutTypeForIndex(index);
    }

    setLayoutForType(type, dimension) {
        return this._setLayoutForType(type, dimension);
    }
}
export default LayoutProvider;
