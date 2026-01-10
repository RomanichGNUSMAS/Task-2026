function checker(reason, value, ...args) {
    switch (reason) {
        case 'name':
            return value = /^[a-zA-Z0-9]+$/.test(value) ? value : (function () {
                throw new ValidationError('invalid name');
            })()
        case 'contactInfo':
            return value = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) ||
            /^\d+$/.test(value) ? value : (function () {
                throw new ValidationError('invalid contactInfo');
            })();
        case 'message':
            let copy = value.trim()
            return value = copy.length >= args[0] && args[0] >= 1 ? value.trim() :
                (function () {
                    throw new ValidationError('invalid message');
                })();
    }
}

function notify(receiver, message) {
    if (receiver.isOnline) {
        console.log(`🔔 New message from ${message.sender.name}`);
    }
}

class MessagingOperation {
    static id = 1;

    constructor(sender, receiver) {
        if (new.target === MessagingOperation) {
            throw new Error('Cannot create instance of MessagingOperation');
        }
        this.messageID = MessagingOperation.id++;
        this.sender = sender;
        this.receiver = receiver;
        this.timestamp = Date.now();
    }

    send() {
        throw new Error('abstract');
    }

    delete() {
        throw new Error('abstract');
    }
}

class TextMessage extends MessagingOperation {
    constructor(sender, receiver, content) {
        super(sender, receiver);
        this.content = checker('message', content, 1);
        this.isRead = false;
    }

    send() {
        if (this.receiver instanceof Conversation) {
            const conv = this.sender.conversations.find(c => c.chat === this.receiver);
            if (conv) {
                conv.chat.history.push({
                    sender: this.sender,
                    receiver: "Conversation",
                    message: this.content,
                    ID: this.messageID
                });
                for (const user of this.receiver.users) {
                    if (user !== this.sender) {
                        notify(user, this);
                    }
                }
                return;
            }
        } else if (this.receiver instanceof User) {
            notify(this.receiver, this);
            this.receiver.conversations.push({
                sender: this.sender,
                receiver: "You",
                message: this.content,
                ID: this.messageID
            })
            return;
        }
        throw new UserNotFoundError('invalid address');
    }

    delete() {
        if (this.receiver instanceof Conversation) {
            for (let i of this.receiver.history) {
                if (this.content === i.message && this.messageID === i.ID) {
                    i.message = `${this.sender.name} deleted a message`;
                    return;
                }
            }
        } else if (this.receiver instanceof User) {
            for (let i of this.receiver.conversations) {
                if (this.content === i.message && this.messageID === i.ID) {
                    i.message = `${this.sender.name} deleted a message`;
                    return;
                }
            }
        }
        throw new InvalidMessageError('invalid address');
    }

    markRead() {
        this.isRead = true;
    }

    markUnread() {
        this.isRead = false;
    }
}

class MultimediaMessage extends MessagingOperation {
    constructor(sender, receiver, filepath, filetype) {
        super(sender, receiver);
        this.filepath = filepath;
        this.filetype = filetype;
        this.isRead = false;
    }

    send() {
        if (this.receiver instanceof Conversation) {
            const conv = this.sender.conversations.find(c => c.chat === this.receiver);
            if (!conv) {
                throw new UserNotFoundError('Conversation not found');
            }

            this.receiver.history.push({
                sender: this.sender,
                message: this.filepath,
                type: this.filetype,
                ID: this.messageID,
                timestamp: this.timestamp,
                isRead: false
            });

            for (const user of this.receiver.users) {
                if (user !== this.sender) {
                    notify(user, this);
                }
            }
            return;
        } else if (this.receiver instanceof User) {
            notify(this.receiver, this);
            this.receiver.conversations.push({
                sender: this.sender,
                receiver: "You",
                message: this.filepath,
                type: this.filetype,
                ID: this.messageID,
                timestamp: this.timestamp
            })
            return;
        }
        throw new UserNotFoundError('invalid address');
    }

    delete() {
        let m = 0;
        let k = 0;
        if (this.receiver instanceof Conversation) {
            for (let i of this.receiver.history) {
                if (this.filepath === i.message && i.ID === this.messageID) {
                    i.message = `${this.sender.name} deleted a message`;
                    i.type = 'unknown'
                    return
                }
            }
        } else if (this.receiver instanceof User) {
            for (let i of this.receiver.conversations) {
                if (this.filepath === i.message && this.messageID === i.ID) {
                    i.message = `${this.sender.name} deleted a message`;
                    i.type = 'unknown'
                    return
                }
            }
        }
        throw new InvalidMessageError('invalid address');
    }

    markRead() {
        this.isRead = true;
    }

    markUnread() {
        this.isRead = false;
    }
}

class User {
    constructor(name, contactInfo) {
        this.name = checker('name', name);
        this.contactInfo = checker('contactInfo', contactInfo);
        this.conversations = [];
        this.isOnline = false;
    }

    createConversation(...users) {
        let conversation = new Conversation([]);
        this.conversations.push({chat: conversation, notifications: 'on'});
        conversation.addUser(...users);
    }

    muteNotifications(conversationID) {
        for (let i of this.conversations) {
            if (i.chat === conversationID) {
                i.chat.notifications = 'off';
                break;
            }
        }
    }
}

class Conversation {
    constructor(users) {
        this.users = users
        this.history = [];
    }

    addUser(...users) {
        this.users.push(...users);
        for (let i of users) {
            i.conversations.push({chat: this, notifications: 'on'});
        }
    }

    getHistory(limit) {
        if (!limit || limit > this.history.length) throw new Error('out of range');
        for (let i = 0; i < limit; i++) {
            console.log(this.history[i]);
        }
    }


}

class InvalidMessageError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidMessageError';
    }
}

class UserNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UserNotFoundError';
    }
}

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

