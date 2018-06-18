if (!Object.hasOwnProperty('values')) {
    Object.values = function (obj) {
        const values = [];

        for (const prop in obj) {
            if (!obj.hasOwnProperty(prop)) continue;

            values.push(obj[prop]);
        }

        return values;
    };
}