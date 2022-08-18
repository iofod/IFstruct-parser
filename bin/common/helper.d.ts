declare const getPath: (road: string) => string;
declare function format(content: any, _?: string): any;
declare function writeIn(road: any, content: any): void;
declare function cleanWriteMap(): void;
declare function mergeDiff(value: any, diff: any): any;
declare function getLayout(tag?: string): {
    width: string;
    'margin-left': string;
    'min-width'?: undefined;
} | {
    width: string;
    'min-width': string;
    'margin-left'?: undefined;
} | {
    width: string;
    'margin-left'?: undefined;
    'min-width'?: undefined;
};
declare const mkdir: (road: any, prefix?: boolean) => Promise<unknown>;
declare const DIMap: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
};
declare function getCloneMark(DI: any): any[];
declare const diffState: (os: any, ns: any) => any;
declare const parseExclude: string[];
declare function genExp(exp: any, str?: string): any;
declare const writeResponseList: string[];
declare const Gesture: string[];
declare function clearDefaultProperty(style: any): any;
declare function fixHSS(obj: any): any;
declare function processReplacement(str: any, hid: any): any;
export { format, writeIn, cleanWriteMap, mergeDiff, getLayout, getPath, mkdir, getCloneMark, diffState, parseExclude, genExp, writeResponseList, Gesture, DIMap, fixHSS, clearDefaultProperty, processReplacement, };
