import fetch from "node-fetch";



class Main {
  async main() {
    let page = 1
    let finished = false

    // We'll read all the data and process it at the end
    // This potentially bad if the data is large, but for the
    // current purposes, it should be fine.
    let data = [];
    while(!finished) {
      const req: Req = new Req(page, data.length);
      await req.execute();
      for(const item of req.data()) {
        data.push(item) 
      }
      finished = !req.hasNext();
      if(req.hasError()) {
        throw new Error("Was unable to complete the requests");
      }
      page = page + 1;
    }
    
    // Once we finish, we can compute scores.
    let scores = new ScoreMaker(data);
    scores.calculate();
    const highRisk = scores.highRisk()
    const fever = scores.fever();
    const badData = scores.badData();
    
    const results = {
      highRisk,
      fever,
      badData
    }
    console.log(results)

    //const submit = new Submit(results);
    //await submit.execute();
  }
}

type NormalResponse = 
  { data: any[]
  , pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number,
      hasNext: boolean,
      hasPrevious: boolean,
    }
  }
  
type WeirdResponse = {
  patients: any[],
  count: number,
  total_records: number,
  current_page: number
  per_page: number
}

// TODO -- should we speed it up with simultaneous requests? We 
// could, but this server might not like that.
class Req {
  url: string = ""
  response: WeirdResponse | NormalResponse | null = null
  error: boolean = false
  currentCount: number
  retryCount = 0;
  retryMax = 10;

  constructor(pageNum: number, currentCount: number) {
    this.url = `https://assessment.ksensetech.com/api` + 
                  `/patients?page=${pageNum}&limit=20`;
    this.currentCount = currentCount
  }
  
  async execute() {
    const response = await fetch(
      this.url,
      { headers: {
          "x-api-key": process.env.API_KEY ?? ""
        }
      }
    );
    
    if(response.ok) {
      // No problem with response; we can end.
      const json = await response.json();
      console.log(json)
      this.response = json as any
      return
    } else {
      // Any other response suggests an error. We'll do a simple wait
      // of half a second up to N times, until it succeeds, or abort
      // if it fails in the end.
      await this.retry();
    }
  }
  
  async retry() {
    if(this.retryCount >= this.retryMax) {
      this.error = true;
      return;
    } else {
      this.retryCount += 1
      await this.delay(500)
      await this.execute();
    }
  }
  
  async delay(ms: number): Promise<unknown> {
    const p = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(undefined)
      }, ms)
    });
    return p
  }
  
  hasError(): boolean {
    const r = this.response;
    if(r == null) {
      return true;
    } else {
      return this.error
    }
  }
  
  hasNext(): boolean {
    const r = this.response;
    if(r == null) {
      return false;
    } else {
      if((r as any)["metadata"] == null) {
        let r2 = r as WeirdResponse;
        let newTotal = r2.total_records
        let newCount = r2.count
        return this.currentCount + newCount < newTotal
      } else {
        return (r as NormalResponse).pagination.hasNext
      }
    }
  }
  
  data(): any[] {
    const r = this.response
    if(r == null) {
      return []
    } else {
      if((r as any)["metadata"] == null) {
        return (r as WeirdResponse).patients
      } else {
        return (r as NormalResponse).data
      }
    }
  }
}

type Patient = {
  patient_id: string
  name: string
  age: number
  gender: string
  blood_pressure: string
  temperature: number
  visit_date: string
  diagnosis: string
  medications: string
}

class ScoreMaker {
  _data: any[]
  _highRisk: string[] = []
  _fever: string[] = []
  _badData: string[] = []

  constructor(data: any[]) {
    this._data = data 
  }
  
  calculate() {
    for(const p of this._data) {
      const patient: Patient = p;
      const score = this.totalScore(patient);
      if(score >= 4) {
        this._highRisk.push(patient.patient_id)
      }

      if(this.hasFever(patient)) {
        this._fever.push(patient.patient_id)
      }
      
      if(this.hasBadData(patient)) {
        this._badData.push(patient.patient_id)
      }
    }
  }
  
  totalScore(patient: Patient) {
    return (
      this.bpScore(patient) + this.tempScore(patient) + this.ageScore(patient)
    )
  }
  
  bpScore(patient: Patient) {
    const bp = patient.blood_pressure; 
    const valid = this.isValidBp(bp);
    if(valid) {
      const [_sys, _dia] = bp.split("/");
      let sys = Number.parseInt(_sys);
      let dia = Number.parseInt(_dia);
      const scores = []
      if(sys < 120 && dia < 80 ) {
        scores.push(0)
      }
      
      if(this.between(sys, 120, 129) && dia < 80) {
        scores.push(1)
      }
      
      if(this.between(sys, 130, 139) || this.between(dia, 80, 89)) {
        scores.push(2)
      }
      
      if(sys >= 140 || dia >= 90) {
        scores.push(3)
      }
      
      if(scores.length == 0) {
        return 0
      } else {
        return Math.max.apply(null, scores)
      }

    } else {
      return 0
    }
  }
  
  isValidBp(a: any) {
    return a != null && typeof a == "string" && this.matchesRegex(a)
  }
  
  // NOTE: This doesn't handle decimal-point blood-pressures correctly.
  matchesRegex(bp: string) {
    return /^\d+\/\d+$/.test(bp.trim())
  }
  
  between(score: number, a: number, b: number) {
    return score >= a && score <= b
  }
  
  tempScore(patient: Patient) {
    const temp = patient.temperature
    const valid = this.isValidTemp(temp)
    if(valid) {
      if(temp <= 99.5) {
        return 0
      } else if(temp >= 101.0) {
        return 2
      } else {
        return 1
      }
    } else {
      return 0
    }
  }
  
  isValidTemp(a: any) {
    const valid = 
        a != null && typeof a == "number" && 
        a >= 0 && !Number.isNaN(a)
    return valid
  }
  
  ageScore(patient: Patient) {
    const age = patient.age
    const valid = age != null && typeof age == "number" 
        && age >= 0 && !Number.isNaN(age);
    if(valid) {
      if(age < 40) {
        return 0
      } else if (age > 65) {
        return 2
      } else {
        return 1
      }
    } else {
      return 0
    }
  }
  
  isValidAge(a: any) {
    const valid = a != null && typeof a == "number" 
        && a >= 0 && !Number.isNaN(a);
    return valid
  }
  
  hasFever(patient: Patient) {
    if(this.isValidTemp(patient.temperature)) {
      return patient.temperature > 99.5
    } else {
      return false
    }
  }
  
  hasBadData(patient: Patient) {
    return !this.isValidTemp(patient.temperature) ||
      !this.isValidBp(patient.blood_pressure) || 
      !this.isValidAge(patient.age);
  }
  
  highRisk() {
    return this._highRisk
  }
  
  fever() {
    return this._fever 
  }
  
  badData() {
    return this._badData
  }
}

class Submit {
  highRisk: string[]
  fever: string[]
  badData: string[]

  constructor(props: {
    highRisk: string[]
    fever: string[]
    badData: string[]
  }) {
    this.highRisk = props.highRisk
    this.fever = props.fever
    this.badData = props.badData
  }
  
  async execute() {
    const url = "https://assessment.ksensetech.com/api/submit-assessment"

    const response = await fetch(
      url,
      { headers: {
          "x-api-key": process.env.API_KEY ?? "",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          high_risk_patients: this.highRisk,
          fever_patients: this.fever,
          data_quality_issues: this.badData
        })
      },
    );
    
    const json = await response.json()
    console.log("results: ", json);
  }
}

new Main().main();