declare const FontCDN = "https://static.iofod.com/";
declare type ExternalObj = {
    [key: string]: any;
};
declare const FontList: {};
declare const entryList: ExternalObj[];
declare const innerEntryList: string[];
declare const externalList: ExternalObj[];
declare function localizImage(obj: any, usePath?: boolean): void;
declare function localizModel(obj: any, usePath?: boolean): void;
declare function parserExternal(str: any): {
    url: any;
    dir: any;
    filename: string;
};
declare function localizExternals(externals: any): {};
declare function localizModules(obj: any): void;
declare function downloadAssets(getAssetsPath: any): Promise<unknown[]>;
declare function downloadFonts(getAssetsPath: any, type?: string): Promise<unknown[]>;
declare function downloadEntrys(getEntrysPath: any): Promise<unknown[]>;
declare function downloadExternals(getExternalsPath: any): Promise<unknown[]>;
declare function setIFTarget(type: any): void;
export { localizImage, localizModel, downloadAssets, downloadFonts, FontList, FontCDN, entryList, innerEntryList, externalList, setIFTarget, localizModules, parserExternal, localizExternals, downloadEntrys, downloadExternals, };
