export const pRequestAnimationFrame = requestAnimationFrame ? requestAnimationFrame : (callback: () => void): number => {
    return setTimeout(callback, 17);
};

export const pCancelAnimationFrame = cancelAnimationFrame ? cancelAnimationFrame : (handle: number): void => {
    clearTimeout(handle);
};
