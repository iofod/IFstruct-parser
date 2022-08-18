declare const log: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
declare const error: (...v: any[]) => void;
declare const msg: (...v: any[]) => void;
export { error, msg, log };
