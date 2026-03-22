export interface PrecomputedScenarioSignature {
  age: number;
  gender: string;
  conditions: string[];
  current: string[];
  incoming: string[];
}

export interface PrecomputedScenario {
  id: string;
  label: string;
  sourceFile: string;
  signature: PrecomputedScenarioSignature;
}

export const PRECOMPUTED_SCENARIOS: PrecomputedScenario[] = [
  {
    "id": "preset-1",
    "label": "aspirin + atorvastatin -> warfarin",
    "sourceFile": "2026-03-22_12-22-45___analyze_df0da9cc.json",
    "signature": {
      "age": 58,
      "gender": "male",
      "conditions": [
        "kalp hastalığı",
        "yüksek kolesterol"
      ],
      "current": [
        "aspirin",
        "atorvastatin"
      ],
      "incoming": [
        "warfarin"
      ]
    }
  },
  {
    "id": "preset-2",
    "label": "paracetamol -> aspirin",
    "sourceFile": "2026-02-18_17-34-50___analyze_d2435ced.json",
    "signature": {
      "age": 32,
      "gender": "female",
      "conditions": [
        "migren"
      ],
      "current": [
        "paracetamol"
      ],
      "incoming": [
        "aspirin"
      ]
    }
  },
  {
    "id": "preset-3",
    "label": "paracetamol -> finasteride",
    "sourceFile": "2026-02-18_17-07-09___analyze_e0697489.json",
    "signature": {
      "age": 32,
      "gender": "female",
      "conditions": [
        "migren"
      ],
      "current": [
        "paracetamol"
      ],
      "incoming": [
        "finasteride"
      ]
    }
  },
  {
    "id": "preset-4",
    "label": "metformin + ramipril -> aspirin",
    "sourceFile": "2026-02-18_17-00-50___analyze_a007924b.json",
    "signature": {
      "age": 45,
      "gender": "male",
      "conditions": [
        "diyabet",
        "hipertansiyon"
      ],
      "current": [
        "metformin",
        "ramipril"
      ],
      "incoming": [
        "aspirin"
      ]
    }
  },
  {
    "id": "preset-5",
    "label": "metformin + ramipril -> fosfomycin + klopidogrel + rosuvastatin",
    "sourceFile": "2026-02-18_16-17-47___analyze_a52d6eb6.json",
    "signature": {
      "age": 45,
      "gender": "male",
      "conditions": [
        "diyabet",
        "hipertansiyon"
      ],
      "current": [
        "metformin",
        "ramipril"
      ],
      "incoming": [
        "fosfomycin",
        "klopidogrel",
        "rosuvastatin"
      ]
    }
  },
  {
    "id": "preset-6",
    "label": "metformin + ramipril -> aspirin + fosfomycin + rosuvastatin",
    "sourceFile": "2026-02-18_16-16-40___analyze_faee77d2.json",
    "signature": {
      "age": 45,
      "gender": "male",
      "conditions": [
        "diyabet",
        "hipertansiyon"
      ],
      "current": [
        "metformin",
        "ramipril"
      ],
      "incoming": [
        "aspirin",
        "fosfomycin",
        "rosuvastatin"
      ]
    }
  },
  {
    "id": "preset-7",
    "label": "paracetamol -> paracetamol",
    "sourceFile": "2026-02-16_18-53-38___analyze_3c4b13a3.json",
    "signature": {
      "age": 32,
      "gender": "female",
      "conditions": [
        "migren"
      ],
      "current": [
        "paracetamol"
      ],
      "incoming": [
        "paracetamol"
      ]
    }
  },
  {
    "id": "preset-8",
    "label": "amlodipine + calcium carbonate + levothyroxine -> paracetamol",
    "sourceFile": "2026-02-16_18-52-23___analyze_24e12d18.json",
    "signature": {
      "age": 67,
      "gender": "female",
      "conditions": [
        "hipertansiyon",
        "hipotiroidi",
        "osteoporoz"
      ],
      "current": [
        "amlodipine",
        "calcium carbonate",
        "levothyroxine"
      ],
      "incoming": [
        "paracetamol"
      ]
    }
  },
  {
    "id": "preset-9",
    "label": "paracetamol -> codeine",
    "sourceFile": "2026-02-07_16-37-43__analyze_c24abf76.json",
    "signature": {
      "age": 32,
      "gender": "female",
      "conditions": [
        "migren"
      ],
      "current": [
        "paracetamol"
      ],
      "incoming": [
        "codeine"
      ]
    }
  },
  {
    "id": "preset-10",
    "label": "aspirin + atorvastatin -> paracetamol",
    "sourceFile": "2026-02-07_16-18-01__analyze_b4d9d929.json",
    "signature": {
      "age": 58,
      "gender": "male",
      "conditions": [
        "kalp hastalığı",
        "yüksek kolesterol"
      ],
      "current": [
        "aspirin",
        "atorvastatin"
      ],
      "incoming": [
        "paracetamol"
      ]
    }
  }
];
