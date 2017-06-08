if(!Object.hasOwnProperty('values')){
    Object.values = function (obj) {
        let values = [];

        for(let prop in obj){
            if (!obj.hasOwnProperty(prop)) continue;

            values.push(obj[prop]);
        }

        return values;
    };
}