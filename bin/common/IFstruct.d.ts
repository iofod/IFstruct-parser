declare const RegModelVar: RegExp;
declare class IFstruct {
    CTT: any;
    json: any;
    Models: any;
    Config: any;
    constructor(json: any);
    get T(): any;
    get pages(): any;
    get HSS(): any;
    get table(): any;
    get Fx(): any;
    get MF(): any;
    get util(): any;
    get mainPage(): any;
    getActiveMetaState(hid: any): any;
    parseModelStr(target: any, hid: any): any;
    parseModelExp(exp: any, hid: any, runtime?: boolean): any;
}
export { IFstruct, RegModelVar };
