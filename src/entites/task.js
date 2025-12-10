export default class{

    #title;
    #description;
    #status;

    constructor(title, description, status){
        this.#title = title;
        this.#description = description;
        this.#status = status;
    }

    get title(){
        return this.#title;
    }

    get description(){
        return this.#description;
    }

    get status(){
        return this.#status;
    }

    set title(newTitle){
        this.#title = newTitle;
    }

    set description(newDescription){
        this.#description = newDescription;
    }

    set status(newStatus){
        this.#status = newStatus;
    }
}