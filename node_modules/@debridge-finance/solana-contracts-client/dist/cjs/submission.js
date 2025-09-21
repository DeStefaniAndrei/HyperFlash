"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionState = exports.UpdateActions = void 0;
const constants_1 = require("./constants");
const accounts_1 = require("./accounts");
var UpdateActions;
(function (UpdateActions) {
    UpdateActions["ExternalCallStorage"] = "externalCallStorage";
    UpdateActions["ExternalCallMeta"] = "externalCallMeta";
    UpdateActions["ConfirmationStorage"] = "confirmationStorage";
    UpdateActions["Submission"] = "submission";
    UpdateActions["CorrectCalldata"] = "correctCalldata";
})(UpdateActions = exports.UpdateActions || (exports.UpdateActions = {}));
class SubscriptionManager {
    constructor() {
        this.limitedSubscriptions = [];
        this.subscriptions = [];
        this.idCounter = 0;
    }
    callCallbacks(type, ...args) {
        this.limitedSubscriptions
            .filter((lsub) => lsub.type == type && lsub.calsLeft > 0)
            .map((lsub) => {
            lsub.calsLeft -= 1;
            lsub.callback(...args);
        });
        this.subscriptions.filter((sub) => sub.type === type).map((lsub) => lsub.callback(...args));
    }
    addSubscription(type, callback, repeat) {
        if (repeat === "unlimited") {
            this.subscriptions.push({ callback: callback, type, id: this.idCounter });
        }
        else {
            this.limitedSubscriptions.push({
                callback: callback,
                type,
                id: this.idCounter,
                calsLeft: repeat,
            });
        }
        this.idCounter += 1;
    }
}
class SubmissionState {
    onAction(type, callback, repeat) {
        this.subManager.addSubscription(type, callback, repeat);
    }
    onActionOnce(type, callback) {
        this.onAction(type, callback, 1);
    }
    onCorrectCalldataOnce(expected, callback) {
        if (this.expectedCalldata !== undefined)
            throw new Error("Already set listener for the correct calldata");
        this.expectedCalldata = expected;
        this.subManager.addSubscription(UpdateActions.CorrectCalldata, callback, 1);
    }
    updateListener(type, account) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
        if (account === null || account === undefined)
            return;
        switch (type) {
            case UpdateActions.ConfirmationStorage: {
                (_a = this.logFn) === null || _a === void 0 ? void 0 : _a.call(this, `Updating conf storage`);
                (_b = this.confirmationStorage) === null || _b === void 0 ? void 0 : _b.setData(account);
                (_c = this.logFn) === null || _c === void 0 ? void 0 : _c.call(this, `Conf storage = `, this.confirmationStorage);
                this.subManager.callCallbacks(type, (_d = this.confirmationStorage.data) !== null && _d !== void 0 ? _d : null);
                break;
            }
            case UpdateActions.Submission: {
                (_e = this.logFn) === null || _e === void 0 ? void 0 : _e.call(this, `Updating submission`);
                this.submission.setData(account);
                (_f = this.logFn) === null || _f === void 0 ? void 0 : _f.call(this, `Submission = `, this.submission);
                this.subManager.callCallbacks(type, (_g = this.submission.data) !== null && _g !== void 0 ? _g : null);
                break;
            }
            case UpdateActions.ExternalCallMeta: {
                (_h = this.logFn) === null || _h === void 0 ? void 0 : _h.call(this, `Updating ext call meta`);
                (_j = this.externalCallMeta) === null || _j === void 0 ? void 0 : _j.setData(account);
                (_k = this.logFn) === null || _k === void 0 ? void 0 : _k.call(this, `extCallMeta = `, this.externalCallMeta);
                this.subManager.callCallbacks(type, (_m = (_l = this.externalCallMeta) === null || _l === void 0 ? void 0 : _l.data) !== null && _m !== void 0 ? _m : null);
                break;
            }
            case UpdateActions.ExternalCallStorage: {
                (_o = this.logFn) === null || _o === void 0 ? void 0 : _o.call(this, `Updating extCall storage`);
                (_p = this.externalCallStorage) === null || _p === void 0 ? void 0 : _p.setData(account);
                (_q = this.logFn) === null || _q === void 0 ? void 0 : _q.call(this, `ExtCall storage = `, this.externalCallStorage);
                this.subManager.callCallbacks(type, (_s = (_r = this.externalCallStorage) === null || _r === void 0 ? void 0 : _r.data) !== null && _s !== void 0 ? _s : null);
                // check for correct calldata if needed
                if (this.expectedCalldata &&
                    ((_t = this.externalCallStorage) === null || _t === void 0 ? void 0 : _t.data) &&
                    ((_u = this.externalCallMeta) === null || _u === void 0 ? void 0 : _u.data) &&
                    this.expectedCalldata.equals(this.externalCallStorage.data.slice(constants_1.EXT_CALL_STORAGE_OFFSET, ((_v = this.externalCallMeta.data.data) === null || _v === void 0 ? void 0 : _v.accumulation)
                        ? this.externalCallMeta.data.data.accumulation.externalCallLen.toNumber()
                        : this.expectedCalldata.length + constants_1.EXT_CALL_STORAGE_OFFSET))) {
                    this.subManager.callCallbacks(UpdateActions.CorrectCalldata, null);
                }
                break;
            }
        }
    }
    constructor(decoder, connection, submissionId, accounts, logFn, initialState, subscriptionCommitment = "confirmed") {
        this.decoder = decoder;
        this.connection = connection;
        this.submissionId = submissionId;
        this.accounts = accounts;
        this.logFn = logFn;
        this.nativeSubscriptions = [];
        this.subManager = new SubscriptionManager();
        this.confirmationStorage = new accounts_1.UpdatableAccountInfo(accounts.confirmationStorage, null, decoder.decodeConfirmationStorage);
        this.submission = new accounts_1.UpdatableAccountInfo(accounts.submission, null, decoder.decodeSubmissionAccount);
        this.nativeSubscriptions = [
            connection.onAccountChange(accounts.confirmationStorage, (data) => this.updateListener(UpdateActions.ConfirmationStorage, data), subscriptionCommitment),
            connection.onAccountChange(accounts.submission, (data) => this.updateListener(UpdateActions.Submission, data), subscriptionCommitment),
        ];
        if (accounts.externalCall) {
            this.externalCallMeta = new accounts_1.UpdatableAccountInfo(accounts.externalCall.externalCallMeta, null, decoder.decodeExternalCallMeta);
            this.externalCallStorage = new accounts_1.UpdatableAccountInfo(accounts.externalCall.externalCallStorage, null, (data) => Buffer.from(data));
            this.nativeSubscriptions.push(connection.onAccountChange(accounts.externalCall.externalCallMeta, (data) => this.updateListener(UpdateActions.ExternalCallMeta, data), subscriptionCommitment));
            this.nativeSubscriptions.push(connection.onAccountChange(accounts.externalCall.externalCallStorage, (data) => this.updateListener(UpdateActions.ExternalCallStorage, data), subscriptionCommitment));
        }
        if (initialState) {
            this.updateListener(UpdateActions.ConfirmationStorage, initialState.confirmationStorage);
            this.updateListener(UpdateActions.Submission, initialState.submission);
            if (initialState.externalCall) {
                this.updateListener(UpdateActions.ExternalCallMeta, initialState.externalCall.meta);
                this.updateListener(UpdateActions.ExternalCallStorage, initialState.externalCall.storage);
            }
        }
    }
    async getInitialState() {
        var _a, _b;
        const [rawConfStorage, rawSubmission, ...rest] = await this.connection.getMultipleAccountsInfo([
            this.accounts.confirmationStorage,
            this.accounts.submission,
            ...[(_a = this.accounts.externalCall) === null || _a === void 0 ? void 0 : _a.externalCallStorage, (_b = this.accounts.externalCall) === null || _b === void 0 ? void 0 : _b.externalCallMeta].filter((v) => v !== undefined),
        ]);
        this.updateListener(UpdateActions.ConfirmationStorage, rawConfStorage);
        this.updateListener(UpdateActions.Submission, rawSubmission);
        if (this.accounts.externalCall) {
            const rawExternalCallStorage = rest.at(0);
            const rawExternalCallMeta = rest.at(1);
            this.updateListener(UpdateActions.ExternalCallMeta, rawExternalCallMeta);
            this.updateListener(UpdateActions.ExternalCallStorage, rawExternalCallStorage);
        }
        return this;
    }
    unsubscribe() {
        return Promise.all(this.nativeSubscriptions.map((subId) => this.connection.removeAccountChangeListener(subId)));
    }
}
exports.SubmissionState = SubmissionState;
//# sourceMappingURL=submission.js.map