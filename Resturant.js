function checker(reason, value) {
    switch (reason) {
        case 'price':
            value = value > 0 ? value : (function () {
                throw new Error('invalid amount');
            })()
            break
        case 'name':
            value = value ? value : (function () {
                throw new Error('Invalid name');
            })();
            break
        case 'contactInfo':
            value = /^[a-zA-Z0-9._$%]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) || /^[0-9]+$/.test(value) ? value : (function () {
                throw new Error('invalid contactInfo');
            })();
    }
}

class Menu {
    #dishes

    constructor() {
        if (new.target === Menu) {
            throw new TypeError('Cannot create a instance');
        }
        this.#dishes = new Map();
    }

    increasePrice(dishName, percent) {
        let dish = this._getReference().get(dishName);
        dish ? dish.price = dish.price + dish.price * (percent / 100) : (function () {
            throw new DishNotFoundError('not found');
        })();
    }

    decreasePrice(dishName, percent) {
        let dish = this._getReference().get(dishName);
        dish ? dish.price = dish.price - dish.price * (percent / 100) : (function () {
            throw new DishNotFoundError('not found');
        })();
    }

    addDish(dish) {
        throw new Error('abstract');
    }

    removeDish(dishName) {
        throw new Error('abstract');
    }

    viewDish() {
        throw new Error('abstract');
    }

    _getReference() {
        return this.#dishes;
    }
}

class AppetizersMenu extends Menu {
    constructor() {
        super();
    }

    addDish(dish) {
        this._getReference().set(dish.name, dish);
    }

    removeDish(dishName) {
        this._getReference().delete(dishName);
    }

    viewDish() {
        console.log([...this._getReference().values()].join(', '));
    }
}

class EntreesMenu extends Menu {
    constructor() {
        super();
    }

    addDish(dish) {
        setTimeout(() => {
            this._getReference().set(dish.name, dish);
        }, dish.preptime);
    }

    removeDish(dishName) {
        this._getReference().delete(dishName);
    }

    viewDish() {
        console.log([...this._getReference().values()].join(', '));
    }
}

class DessertsMenu extends Menu {
    constructor() {
        super()
    }

    addDish(dish) {
        if (dish.price > 15) throw new Error('no much at 15');
        this._getReference().set(dish.name, dish);
    }

    removeDish(dishName) {
        this._getReference().delete(dishName);
    }

    viewDish() {
        console.log([...this._getReference().values()].join(', '));
    }
}

class Customer {
    constructor(name, contactInfo) {
        Object.defineProperties(this, {
            name: {
                value: checker('name', name),
                writable: false,
                enumerable: true
            },
            contactInfo: {
                value: checker('contactInfo', contactInfo),
                writable: false,
                enumerable: true
            }
        })
        this.orderHistory = [];
    }

    placeOrder(order) {
        this.orderHistory.push(order);
    }

    viewOrderHistory() {
        console.log([...this.orderHistory])
    }

}

class Order_Class {
    #totalPrice

    constructor(Customer, dishNames) {
        this.#totalPrice = 0;
        this.dishes = [];
    }

    addDish(dishname, menus) {
        let flag = false
        for (let i of menus) {
            if (i._getReference().has(dishname)) {
                this.dishes.push(i._getReference().get(dishname));
                this.#totalPrice += i._getReference().get(dishname).price;
                flag = true;
                break;
            }
        }
        if (this.dishes.length == 0) throw new InvalidOrderError('invalid order');
        if (!flag) {
            throw new DishNotFoundError('Dish not found');
        }
    }

    getTotal() {
        return this.#totalPrice;
    }

    viewSummary() {
        console.log([...this.dishes], this.#totalPrice);
    }

    applyDemandPricing(dishes) {
        const popularDishes = ['Caesar Salad', 'Cheeseburger', 'Chocolate Cake']
        for (let i of popularDishes) {
            if (dishes._getReference().has(i)) {
                let dish = dishes._getReference().get(i);
                if (dish instanceof Dessert) {
                    dish.price = dish.price + dish.price * (5 / 100);
                }
                if (dish instanceof Entree) {
                    dish.price = dish.price + dish.price * (15 / 100);
                }
                if (dish instanceof Appetizer) {
                    dish.price = dish.price + dish.price * (10 / 100);
                }
            }
        }
    }
}

class Dish {
    constructor(name, price) {
        Object.defineProperties(this, {
            name: {
                value: checker('name', name),
                writable: false,
                enumerable: true
            },
            price: {
                value: checker('price', price),
                enumerable: true
            }
        })
    }
}

class Appetizer extends Dish {
    constructor(name, price, isVegan) {
        super(name, price);
        this.isVegan = isVegan;
    }
}

class Entree extends Dish {
    constructor(name, price, preptime) {
        super(name, price)
        this.preptime = preptime
    }
}

class Dessert extends Dish {
}

class DishNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DishNotFoundError';
    }
}

class InvalidOrderError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidOrderError';
    }
}