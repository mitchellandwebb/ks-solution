var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import fetch from "node-fetch";
var Main = /** @class */ (function () {
    function Main() {
    }
    Main.prototype.main = function () {
        return __awaiter(this, void 0, void 0, function () {
            var page, finished, data, req, _i, _a, item, scores, highRisk, fever, badData, results;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        page = 1;
                        finished = false;
                        data = [];
                        _b.label = 1;
                    case 1:
                        if (!!finished) return [3 /*break*/, 3];
                        req = new Req(page, data.length);
                        return [4 /*yield*/, req.execute()];
                    case 2:
                        _b.sent();
                        for (_i = 0, _a = req.data(); _i < _a.length; _i++) {
                            item = _a[_i];
                            data.push(item);
                        }
                        finished = !req.hasNext();
                        if (req.hasError()) {
                            throw new Error("Was unable to complete the requests");
                        }
                        page = page + 1;
                        return [3 /*break*/, 1];
                    case 3:
                        scores = new ScoreMaker(data);
                        scores.calculate();
                        highRisk = scores.highRisk();
                        fever = scores.fever();
                        badData = scores.badData();
                        results = {
                            highRisk: highRisk,
                            fever: fever,
                            badData: badData
                        };
                        console.log(results);
                        return [2 /*return*/];
                }
            });
        });
    };
    return Main;
}());
// TODO -- should we speed it up with simultaneous requests? We 
// could, but this server might not like that.
var Req = /** @class */ (function () {
    function Req(pageNum, currentCount) {
        this.url = "";
        this.response = null;
        this.error = false;
        this.retryCount = 0;
        this.retryMax = 10;
        this.url = "https://assessment.ksensetech.com/api" +
            "/patients?page=".concat(pageNum, "&limit=20");
        this.currentCount = currentCount;
    }
    Req.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, json;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, fetch(this.url, { headers: {
                                "x-api-key": (_a = process.env.API_KEY) !== null && _a !== void 0 ? _a : ""
                            }
                        })];
                    case 1:
                        response = _b.sent();
                        if (!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        json = _b.sent();
                        console.log(json);
                        this.response = json;
                        return [2 /*return*/];
                    case 3: 
                    // Any other response suggests an error. We'll do a simple wait
                    // of half a second up to N times, until it succeeds, or abort
                    // if it fails in the end.
                    return [4 /*yield*/, this.retry()];
                    case 4:
                        // Any other response suggests an error. We'll do a simple wait
                        // of half a second up to N times, until it succeeds, or abort
                        // if it fails in the end.
                        _b.sent();
                        _b.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Req.prototype.retry = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.retryCount >= this.retryMax)) return [3 /*break*/, 1];
                        this.error = true;
                        return [2 /*return*/];
                    case 1:
                        this.retryCount += 1;
                        return [4 /*yield*/, this.delay(500)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.execute()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Req.prototype.delay = function (ms) {
        return __awaiter(this, void 0, void 0, function () {
            var p;
            return __generator(this, function (_a) {
                p = new Promise(function (resolve, reject) {
                    setTimeout(function () {
                        resolve(undefined);
                    }, ms);
                });
                return [2 /*return*/, p];
            });
        });
    };
    Req.prototype.hasError = function () {
        var r = this.response;
        if (r == null) {
            return true;
        }
        else {
            return this.error;
        }
    };
    Req.prototype.hasNext = function () {
        var r = this.response;
        if (r == null) {
            return false;
        }
        else {
            if (r["metadata"] == null) {
                var r2 = r;
                var newTotal = r2.total_records;
                var newCount = r2.count;
                return this.currentCount + newCount < newTotal;
            }
            else {
                return r.pagination.hasNext;
            }
        }
    };
    Req.prototype.data = function () {
        var r = this.response;
        if (r == null) {
            return [];
        }
        else {
            if (r["metadata"] == null) {
                return r.patients;
            }
            else {
                return r.data;
            }
        }
    };
    return Req;
}());
var ScoreMaker = /** @class */ (function () {
    function ScoreMaker(data) {
        this._highRisk = [];
        this._fever = [];
        this._badData = [];
        this._data = data;
    }
    ScoreMaker.prototype.calculate = function () {
        for (var _i = 0, _a = this._data; _i < _a.length; _i++) {
            var p = _a[_i];
            var patient = p;
            var score = this.totalScore(patient);
            if (score >= 4) {
                this._highRisk.push(patient.patient_id);
            }
            if (this.hasFever(patient)) {
                this._fever.push(patient.patient_id);
            }
            if (this.hasBadData(patient)) {
                this._badData.push(patient.patient_id);
            }
        }
    };
    ScoreMaker.prototype.totalScore = function (patient) {
        return (this.bpScore(patient) + this.tempScore(patient) + this.ageScore(patient));
    };
    ScoreMaker.prototype.bpScore = function (patient) {
        var bp = patient.blood_pressure;
        var valid = this.isValidBp(bp);
        if (valid) {
            var _a = bp.split("/"), _sys = _a[0], _dia = _a[1];
            var sys = Number.parseInt(_sys);
            var dia = Number.parseInt(_dia);
            var scores = [];
            if (sys < 120 && dia < 80) {
                scores.push(0);
            }
            if (this.between(sys, 120, 129) && dia < 80) {
                scores.push(1);
            }
            if (this.between(sys, 130, 139) || this.between(dia, 80, 89)) {
                scores.push(2);
            }
            if (sys >= 140 || dia >= 90) {
                scores.push(3);
            }
            if (scores.length == 0) {
                return 0;
            }
            else {
                return Math.max.apply(null, scores);
            }
        }
        else {
            return 0;
        }
    };
    ScoreMaker.prototype.isValidBp = function (a) {
        return a != null && typeof a == "string" && this.matchesRegex(a);
    };
    // NOTE: This doesn't handle decimal-point blood-pressures correctly.
    ScoreMaker.prototype.matchesRegex = function (bp) {
        return /^\d+\/\d+$/.test(bp.trim());
    };
    ScoreMaker.prototype.between = function (score, a, b) {
        return score >= a && score <= b;
    };
    ScoreMaker.prototype.tempScore = function (patient) {
        var temp = patient.temperature;
        var valid = this.isValidTemp(temp);
        if (valid) {
            if (temp <= 99.5) {
                return 0;
            }
            else if (temp >= 101.0) {
                return 2;
            }
            else {
                return 1;
            }
        }
        else {
            return 0;
        }
    };
    ScoreMaker.prototype.isValidTemp = function (a) {
        var valid = a != null && typeof a == "number" &&
            a >= 0 && !Number.isNaN(a);
        return valid;
    };
    ScoreMaker.prototype.ageScore = function (patient) {
        var age = patient.age;
        var valid = age != null && typeof age == "number"
            && age >= 0 && !Number.isNaN(age);
        if (valid) {
            if (age < 40) {
                return 0;
            }
            else if (age > 65) {
                return 2;
            }
            else {
                return 1;
            }
        }
        else {
            return 0;
        }
    };
    ScoreMaker.prototype.isValidAge = function (a) {
        var valid = a != null && typeof a == "number"
            && a >= 0 && !Number.isNaN(a);
        return valid;
    };
    ScoreMaker.prototype.hasFever = function (patient) {
        if (this.isValidTemp(patient.temperature)) {
            return patient.temperature > 99.5;
        }
        else {
            return false;
        }
    };
    ScoreMaker.prototype.hasBadData = function (patient) {
        return !this.isValidTemp(patient.temperature) ||
            !this.isValidBp(patient.blood_pressure) ||
            !this.isValidAge(patient.age);
    };
    ScoreMaker.prototype.highRisk = function () {
        return this._highRisk;
    };
    ScoreMaker.prototype.fever = function () {
        return this._fever;
    };
    ScoreMaker.prototype.badData = function () {
        return this._badData;
    };
    return ScoreMaker;
}());
var Submit = /** @class */ (function () {
    function Submit(props) {
        this.highRisk = props.highRisk;
        this.fever = props.fever;
        this.badData = props.badData;
    }
    Submit.prototype.execute = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, json;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = "https://assessment.ksensetech.com/api/submit-assessment";
                        return [4 /*yield*/, fetch(url, { headers: {
                                    "x-api-key": (_a = process.env.API_KEY) !== null && _a !== void 0 ? _a : "",
                                    "Content-Type": "application/json",
                                },
                                method: "POST",
                                body: JSON.stringify({
                                    high_risk_patients: this.highRisk,
                                    fever_patients: this.fever,
                                    data_quality_issues: this.badData
                                }) })];
                    case 1:
                        response = _b.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        json = _b.sent();
                        console.log("results: ", json);
                        return [2 /*return*/];
                }
            });
        });
    };
    return Submit;
}());
new Main().main();
