export default class CustomError extends Error {
    constructor(exception: Exception) {
        super(exception.message);
        this.name = exception.type;
    }
}
export interface Exception {
    type: string;
    message: string;
}
