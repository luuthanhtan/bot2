import { config } from "../config.js";
const repoPath: string = config.repoPath || 'postgresql';
import Base from "./base.js";
const {UserSequenceRepo} = await import(`../repo/${repoPath}/usequence.js`);

export class UserSequence extends Base {
    constructor() {
        super(new UserSequenceRepo());
    }
}