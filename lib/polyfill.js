if(!Object.hasOwnProperty('values')){
    Object.values = function (obj) {
        let values = [];

        for(let prop in obj){
            values.push(obj[prop]);
        }

        return values;
    };
}