export default class{

    #userName;

    constructor(userName){
        this.#userName = userName;
    }

    get userName(){
        return this.#userName
    }

    set usertName(newName){
        this.#userName = newName;
    }
}