function checker(reason, value) {
    switch (reason) {
        case 'name':
            return value = /^[a-zA-Z]/.test(value) ? value : (function () {
                throw new AuthorizationError('Invalid name');
            })();
        case 'contactInfo':
            return value = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) || /^\d+$/.test(value) ?
                value :
                (function () {
                    throw new AuthorizationError('Invalid name');
                })();
    }
}

class JobPostingOperation {
    static id = 1;

    constructor() {
        if (new.target === JobPostingOperation) {
            throw new TypeError('Cannot create a instance of JobPostingOperation');
        }
    }

    createPosting(title, salary) {
        throw new Error('abstract');
    }

    deletePosting(JobPosting, id) {
        throw new Error('abstract');
    }

    listPosting(JobPosting) {
        throw new Error('abstract');
    }
}

class FullTimeJob extends JobPostingOperation {
    constructor() {
        super();
    }

    createPosting(title, salary) {
        const employee = {
            title: title,
            salary: salary,
            id: JobPostingOperation.id++,
            type: 'FullTime',
        };
        return employee;
    }

    deletePosting(JobPosting, id) {
        return JobPosting = JobPosting.filter(j => j.id !== id);
    }

    listPosting(JobPosting) {
        for (let i of JobPosting) {
            console.log(i)
        }
    }
}

class PartTimeJob extends JobPostingOperation {
    constructor(workHours) {
        super();
        this.workHours = workHours
    }

    createPosting(title, salary) {
        const employee = {
            title: title,
            salary: salary,
            type: "partTime",
            id: JobPostingOperation.id++,
            workHours: this.workHours,
        }
        return employee;
    }

    deletePosting(JobPosting, id) {
        return JobPosting = JobPosting.filter(j => j.id !== id);
    }

    listPosting(JobPosting) {
        for (let i of JobPosting) {
            console.log(i)
        }
    }
}

class Company {
    constructor(name, contactInfo) {
        this.name = checker('name', name);
        this.contactInfo = checker('contactInfo', contactInfo);
        this.jobPostings = [];
    }

    addPosting(JobOper) {
        this.jobPostings.push(JobOper);
    }

    editPosting(JobID, salary, title) {
        for (let i of this.jobPostings) {
            if (JobID === i.id) {
                this.jobPostings[this.jobPostings.indexOf(i)].salary = salary;
                this.jobPostings[this.jobPostings.indexOf(i)].title = title;
                return;
            }
        }
        throw new InvalidJobPostingError('Invalid Job ID');
    }

    removePosting(JobOper, ID) {
        JobOper.deletePosting(this.jobPostings, ID);
    }

    viewApplications(jobID) {
        const found = this.jobPostings.filter(jobPost => jobPost.id === jobID);
        if (found[0]) {
            return found;
        }
        throw new ApplicationError('Not found');
    }
}


class JobSeeker {
    constructor(name, contactInfo, resume) {
        this.name = checker('name', name);
        this.contactInfo = checker('contactInfo', contactInfo);
        this.applications = [];
    }

    search(criteria, JobPostings) {
        const theBest = JobPostings.filter(j =>
            criteria.title.toLowerCase() === j.title.toLowerCase() &&
            criteria.type.toLowerCase() === j.type.toLowerCase() &&
            criteria.salary <= j.salary
        )
        return theBest.length === 0 ? (function () {
                throw new ApplicationError('Not found');
            })() :
            theBest;
    }

    apply(jobPosting) {
        const app = new JobApplication(jobPosting, this, 'new Seeker');
        this.applications.push(app);
        return app;
    }
}

class JobApplication {
    constructor(jobPosting, applicant, status) {
        this.jobPosting = jobPosting;
        this.applicant = applicant;
        this.status = status;
    }

    updateStatus(newStatus) {
        this.status = newStatus;
    }
}

class InvalidJobPostingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidJobPostingError';
    }
}

class ApplicationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ApplicationError';
    }
}

class AuthorizationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthorizationError';
    }
}
