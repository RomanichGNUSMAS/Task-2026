function check(reason, value, ...args) {
    switch (reason) {
        case 'name':
            return value = /^[a-zA-Z]+$/.test(value) ? value : (function () {
                throw new ValidationError('invalid name');
            })();
        case 'modelName':
            return value = /^[a-zA-Z0-9]+$/.test(value) ? value : (function () {
                throw new ValidationError('invalid modelName');
            })()
        case 'contactInfo':
            return value = (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
                || /^\d+$/.test(value)) ? value : (function () {
                throw new ValidationError('invalid contactInfo');
            })
        case 'price':
            return value = typeof value === 'number' ? value : (function () {
                throw new ValidationError('invalid price');
            })()
        case 'humanName':
            return value = /^[a-zA-Z]+$/.test(value) ? value : (function () {
                throw new ValidationError('invalid human name');
            })()
        case 'instance':
            return value = value instanceof args[0] ? value : (function () {
                throw new ValidationError('invalid instance');
            })();
        case 'rentalDuriation':
            return value = typeof value === 'number' ? value : (function () {
                throw new InvalidRentalDurationError('invalid rentalDuration');
            })
    }
}

class Rental {
    static id = 1;

    constructor(customer, car, rentalDuriation) {
        if (new.target === Rental) {
            throw new TypeError('Cannot create instance of Rental');
        }
        this.rentalId = Rental.id++;
        this.customerId = check('instance', customer, Customer);
        this.car = check('instance', car, Car);
        this.rentalDuriation = check('rentalDuriation', rentalDuriation);
    }

    rentCar(car) {
        throw new Error('abstract');
    }

    returnCar(car) {
        throw new Error('abstract');
    }

    calculateRentalPrice() {
        throw new Error('abstract');
    }
}

class StandartRental extends Rental {
    constructor(customer, car, rentalDuration) {
        super(customer, car, rentalDuration);
    }

    rentCar() {
        if (!this.car.availability) throw new CarNotAvailableError('Car is already rented');
        this.car.makeRented();
        this.customerId.rentalHistory.push(this);
    }

    returnCar(car) {
        if (this.car.availability) throw new CarNotAvailableError('Car is available');
        for (let i = 0; i < this.customerId.rentalHistory.length; i++) {
            if (this.customerId.rentalHistory[i].id === car.id) {
                delete this.customerId.rentalHistory[i]
            }
        }
        car.makeAvailable();
    }

    calculateRentalPrice() {
        let sum = this.car.pricePerDay * this.rentalDuriation;
        if (this.car instanceof LuxuryCar) {
            sum += this.car.insurance + this.car.premiumService;
        }
        return sum;
    }

}

class Car {
    constructor(make, model, pricePerDay) {
        this.make = check('name', make);
        this.model = check('modelName', model);
        this.pricePerDay = check('price', pricePerDay);
        this.availability = true;
    }


    makeRented() {
        if (!this.availability) {
            throw new Error;
        }
        this.availability = false;
    }

    makeAvailable() {
        if (this.availability) {
            throw new Error;
        }
        this.availability = true;
    }
}

class EconomyCar extends Car {
}

class LuxuryCar extends Car {
    constructor(make, model, pricePerDay, insurance, premiumService) {
        super(make, model, pricePerDay);
        this.insurance = insurance;
        this.premiumService = premiumService;
    }
}

class Customer {
    constructor(name, contactInfo) {
        this.name = check('humanName', name);
        this.contactInfo = check('contactInfo', contactInfo);
        this.rentalHistory = [];
    }

    searchCar(make, model, price) {
        //I don't understand a lot. where should he search the car?
        // will it take array argument to find, or I should find in rentalHistory?
        let res = this.rentalHistory.filter(car => {
            if ((!make || car.make == make) && (!model || car.model == model) && (!price || car.pricePerDay <= price)) {
                return car;
            }
        })
        return res.length === 0 ? (function () {
            throw new CarNotAvailableError('car not available');
        })() : res;
    }

    viewRentalHistory() {
        for (let i of this.rentalHistory) {
            console.log(`${i.car.make} ${i.car.model} ${i.car.pricePerDay}`);
        }
    }
}


class CarNotAvailableError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CarNotAvailableError';
    }
}

class InvalidRentalDurationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidRentalDurationError'
    }
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

