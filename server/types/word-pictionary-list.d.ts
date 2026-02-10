
declare module 'word-pictionary-list' {
    const wordList: string[];
    const words: {
        (options?: any): any;
        wordList: string[];
    };
    export default words;
    export { wordList };
}
