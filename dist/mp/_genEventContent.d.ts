declare const CE_list: any;
declare function genEventContent(hid: any, events: any, cloneMark: any, jumpCE?: boolean): {
    eventMarks: string[];
    eventMethods: string[];
};
export { genEventContent, CE_list };
