function check(what, value) {
    switch (what) {
        case 'accountNumber':
            value = /^[0-9]+$/.test(value) && String(value).length === 10 ? value : (function () {
                throw new ValidationError('invalid account number');
            })();
            break;
        case 'mail':
            value = /^[a-zA-Z0-9._$%]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) ? value : (function () {
                throw new ValidationError('invalid mail');
            })()
            break;
        case 'name':
            value = value ? value : (function () {
                throw new ValidationError('invalid name');
            })();
            break;
        case 'contactInfo':
            value = /^[a-zA-Z0-9._$%]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) || /^[0-9]+$/.test(value) ? value : (function () {
                throw new ValidationError('invalid contactInfo');
            })();
    }
    return value;
}

class insufficientFundsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InsufficientFundsError';
    }
}

class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class invalidTransactionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidTransactionError';
    }
}

class Bank_Account {
    #balance
    #transactions

    constructor() {
        if (new.target === Bank_Account) {
            throw new TypeError("Cannot create instance of Bank_Account class");
        }
        this.#balance = 0
        this.#transactions = [];
    }

    deposit(amount) {
        throw new Error('abstract')
    }

    withdraw(amount) {
        throw new Error('abstract')
    }

    transferFunds(targetAccount, amount, actor) {
        throw new Error('abstract');
    }

    _inc(amount) {
        this.#balance += amount;
    }

    _dec(amount) {
        this.#balance -= amount;
    }

    getBalance() {
        return this.#balance;
    }

    _getBalance() {
        return this.#balance;
    }

    _addTransaction(tx) {
        this.#transactions.push(tx);
    }

    getAllTransactions() {
        return [...this.#transactions];
    }

    getTransactionSummary(limit = 10) {
        return this.getAllTransactions().slice(-limit);
    }
}

class IndividualAccount extends Bank_Account {

    constructor(accountNumber) {
        super();
        Object.defineProperty(this, 'accountNumber', {
            value: check('accountNumber', accountNumber),
            writable: false,
            enumerable: true
        });

        this.type = 'individual';
    }

    deposit(amount) {
        if (amount < 0) {
            throw new invalidTransactionError('invalid amount');
        }
        this._inc(amount);
        this._addTransaction({type: 'deposit', amount, time: Date.now()});
    }

    withdraw(amount, actor) {
        if (!actor.isAuthorized) throw new AuthorizationError('Not authorized');
        if (amount <= 0 || amount > this._getBalance()) throw new insufficientFundsError('invalid amount');
        this._dec(amount);
        this._addTransaction({type: 'withdraw', amount, time: Date.now()});
    }

    transferFunds(targetAccount, amount, actor) {
        if (!actor.isAuthorized) throw new AuthorizationError('Not authorized');
        if (amount <= 0 || amount > this._getBalance()) throw new insufficientFundsError('invalid amount');

        this._dec(amount);
        targetAccount._inc(amount);

        const tx = new Transaction({
            accountNumber: this.accountNumber,
            amount,
            transactionType: 'transfer',
            fromAccount: this.accountNumber,
            toAccount: targetAccount.accountNumber
        });

        this._addTransaction(tx);
        targetAccount._addTransaction(tx);
    }

}

class JointAccount extends Bank_Account {
    constructor(accountNumber, owners) {
        super();
        Object.defineProperty(this, 'accountNumber', {
            value: check('accountNumber', accountNumber),
            writable: false,
            enumerable: true
        });

        this.owners = owners;
        this.type = 'joint';
    }

    deposit(amount) {
        if (amount < 0) {
            throw new invalidTransactionError('invalid amount');
        }
        this._inc(amount)
    }

    withdraw(amount, actor) {
        if (!this.owners.includes(actor) && !this.owners.some(o => o.id === actor.id))
            throw new Error('AuthorizationError');
        if (amount <= 0 || amount > this._getBalance()) throw new insufficientFundsError('invalid amount');
        this._dec(amount);
        this._addTransaction({type: 'withdraw', amount, time: Date.now()});
    }

    transferFunds(targetAccount, amount, actor) {
        for (let i = 0; i < this.owners.length; i++) {
            if (this.owners[i] === actor) {
                if (this._getBalance() < amount) throw new insufficientFundsError('invalid amount');
                this._dec(amount);
                targetAccount._inc(amount);
                let transaction = {time: Date.now(), amount: amount};
                this._addTransaction(transaction);
                return;
            }
            if (this.owners[i].id === actor.id) {
                if (this._getBalance() < amount) throw new insufficientFundsError('invalid amount');
                this._dec(amount);
                targetAccount._inc(amount);
                let transaction = {time: Date.now(), amount: amount};
                this._addTransaction(transaction);
                return;
            }
        }
    }
}

class Customer {
    constructor(name, contactInfo) {
        Object.defineProperty(this, 'name', {
            value: check('name', name),
            writable: false,
            enumerable: true
        });

        Object.defineProperty(this, 'contactInfo', {
            value: check('contactInfo', contactInfo),
            writable: false,
            enumerable: true
        });

        this.accounts = [];
    }

    addAccount(account) {
        this.accounts.push(account);
    }

    viewAccounts() {
        for (let card of this.accounts) {
            console.log(card);
        }
    }

    viewTransactionHistory(accountNumber) {
        let acc = this.accounts.find(a => a.accountNumber === accountNumber);
        if (!acc) throw new Error('Account not found');
        return acc.getAllTransactions();
    }
}

class Transaction {
    constructor({accountNumber, amount, transactionType, fromAccount = null, toAccount = null}) {
        this.accountNumber = accountNumber;
        this.amount = amount;
        this.transactionType = transactionType;
        this.timestamp = Date.now();
        this.fromAccount = fromAccount;
        this.toAccount = toAccount;
    }
}