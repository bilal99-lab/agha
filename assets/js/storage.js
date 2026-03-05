window.Storage = {
    get: (key) => JSON.parse(localStorage.getItem(key)) || [],
    save: (key, data) => localStorage.setItem(key, JSON.stringify(data)),
    add: (key, item) => {
        let data = window.Storage.get(key);
        data.push(item);
        window.Storage.save(key, data);
        return data;
    },
    update: (key, predicate, updateFn) => {
        let data = window.Storage.get(key);
        let index = data.findIndex(predicate);
        if (index !== -1) {
            data[index] = updateFn(data[index]);
            window.Storage.save(key, data);
        }
        return data;
    },
    remove: (key, predicate) => {
        let data = window.Storage.get(key);
        let newData = data.filter(item => !predicate(item));
        window.Storage.save(key, newData);
        return newData;
    }
};
