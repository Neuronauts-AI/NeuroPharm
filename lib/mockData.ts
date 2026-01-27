import { Patient, Medicine } from '@/types';

export const mockMedicines: Medicine[] = [
  // Analjezik & Anti-inflamatuar
  { id: '1', name: 'Aspirin', dosage: '100mg', frequency: 'Günde 1 kez' },
  { id: '2', name: 'Parol (Parasetamol)', dosage: '500mg', frequency: 'Günde 3 kez' },
  { id: '3', name: 'Arveles (Deksketoprofen)', dosage: '25mg', frequency: 'Günde 2 kez' },
  { id: '4', name: 'Majezik (Flurbiprofen)', dosage: '100mg', frequency: 'Günde 2 kez' },
  { id: '5', name: 'Voltaren (Diklofenak)', dosage: '50mg', frequency: 'Günde 2 kez' },
  { id: '6', name: 'Nurofen (İbuprofen)', dosage: '400mg', frequency: 'Günde 3 kez' },
  { id: '7', name: 'Apranax (Naproksen)', dosage: '550mg', frequency: 'Günde 2 kez' },
  { id: '8', name: 'Minoset (Parasetamol)', dosage: '500mg', frequency: 'Günde 3 kez' },
  { id: '9', name: 'Vermidon', dosage: '500mg', frequency: 'Günde 3 kez' },
  { id: '10', name: 'Dorex', dosage: '10mg', frequency: 'Günde 2 kez' },

  // Antibiyotik & Antiviral
  { id: '11', name: 'Augmentin (Amoksisilin)', dosage: '1000mg', frequency: 'Günde 2 kez' },
  { id: '12', name: 'Largopen', dosage: '1g', frequency: 'Günde 2 kez' },
  { id: '13', name: 'Azitro (Azitromisin)', dosage: '500mg', frequency: 'Günde 1 kez' },
  { id: '14', name: 'Cipro (Siprofloksasin)', dosage: '500mg', frequency: 'Günde 2 kez' },
  { id: '15', name: 'Klamoks', dosage: '1000mg', frequency: 'Günde 2 kez' },
  { id: '16', name: 'Monurol', dosage: '3g', frequency: 'Tek doz' },
  { id: '17', name: 'Bactrim', dosage: '800/160mg', frequency: 'Günde 2 kez' },
  { id: '18', name: 'Flagyl (Metronidazol)', dosage: '500mg', frequency: 'Günde 3 kez' },
  { id: '19', name: 'Zinnat', dosage: '500mg', frequency: 'Günde 2 kez' },
  { id: '20', name: 'Valtrex', dosage: '500mg', frequency: 'Günde 2 kez' },

  // Kardiyovasküler (Tansiyon & Kolesterol)
  { id: '21', name: 'Lipitor (Atorvastatin)', dosage: '20mg', frequency: 'Günde 1 kez' },
  { id: '22', name: 'Crestor (Rosuvastatin)', dosage: '10mg', frequency: 'Günde 1 kez' },
  { id: '23', name: 'Norvasc (Amlodipin)', dosage: '5mg', frequency: 'Günde 1 kez' },
  { id: '24', name: 'Beloc ZOK (Metoprolol)', dosage: '50mg', frequency: 'Günde 1 kez' },
  { id: '25', name: 'Co-Diovan (Valsartan)', dosage: '160/12.5mg', frequency: 'Günde 1 kez' },
  { id: '26', name: 'Delix (Ramipril)', dosage: '5mg', frequency: 'Günde 1 kez' },
  { id: '27', name: 'Saneloc', dosage: '50mg', frequency: 'Günde 1 kez' },
  { id: '28', name: 'Vasoxen (Nebivolol)', dosage: '5mg', frequency: 'Günde 1 kez' },
  { id: '29', name: 'Coraspin', dosage: '100mg', frequency: 'Günde 1 kez' },
  { id: '30', name: 'Plavix (Klopidogrel)', dosage: '75mg', frequency: 'Günde 1 kez' },
  { id: '31', name: 'Coumadin (Warfarin)', dosage: '5mg', frequency: 'Günde 1 kez' },
  { id: '32', name: 'Xarelto (Rivaroksaban)', dosage: '20mg', frequency: 'Günde 1 kez' },
  { id: '33', name: 'Eliquis', dosage: '5mg', frequency: 'Günde 2 kez' },
  { id: '34', name: 'Lasix (Furosemid)', dosage: '40mg', frequency: 'Günde 1 kez' },
  { id: '35', name: 'Aldactazide', dosage: '25mg', frequency: 'Günde 1 kez' },

  // Diyabet (Şeker)
  { id: '36', name: 'Glifor (Metformin)', dosage: '1000mg', frequency: 'Günde 2 kez' },
  { id: '37', name: 'Matofin', dosage: '500mg', frequency: 'Günde 2 kez' },
  { id: '38', name: 'Januvia', dosage: '100mg', frequency: 'Günde 1 kez' },
  { id: '39', name: 'Diamicron', dosage: '60mg', frequency: 'Günde 1 kez' },
  { id: '40', name: 'Lantus (İnsülin)', dosage: '20 Unite', frequency: 'Günde 1 kez' },
  { id: '41', name: 'Humalog', dosage: '10 Unite', frequency: 'Yemeklerden önce' },
  { id: '42', name: 'Jardiance', dosage: '10mg', frequency: 'Günde 1 kez' },

  // Mide & Bağırsak (Gastro)
  { id: '43', name: 'Nexium (Esomeprazol)', dosage: '40mg', frequency: 'Günde 1 kez' },
  { id: '44', name: 'Lansor (Lansoprazol)', dosage: '30mg', frequency: 'Günde 1 kez' },
  { id: '45', name: 'Gaviscon', dosage: '10ml', frequency: 'Yemeklerden sonra' },
  { id: '46', name: 'Rennie', dosage: '1 tablet', frequency: 'Gerektiğinde' },
  { id: '47', name: 'Metpamid', dosage: '10mg', frequency: 'Günde 3 kez' },
  { id: '48', name: 'Buscopan', dosage: '10mg', frequency: 'Günde 3 kez' },
  { id: '49', name: 'Duphalac', dosage: '30ml', frequency: 'Günde 1 kez' },
  { id: '50', name: 'Talcid', dosage: '1 tablet', frequency: 'Gerektiğinde' },

  // Psikiyatri & Nöroloji
  { id: '51', name: 'Lustral (Sertralin)', dosage: '50mg', frequency: 'Günde 1 kez' },
  { id: '52', name: 'Prozac (Fluoksetin)', dosage: '20mg', frequency: 'Günde 1 kez' },
  { id: '53', name: 'Cipralex (Essitalopram)', dosage: '10mg', frequency: 'Günde 1 kez' },
  { id: '54', name: 'Efexor', dosage: '75mg', frequency: 'Günde 1 kez' },
  { id: '55', name: 'Lyrica', dosage: '75mg', frequency: 'Günde 2 kez' },
  { id: '56', name: 'Xanax (Alprazolam)', dosage: '0.5mg', frequency: 'Gerektiğinde' },
  { id: '57', name: 'Atarax', dosage: '25mg', frequency: 'Gece yatarken' },
  { id: '58', name: 'Concerta', dosage: '36mg', frequency: 'Günde 1 kez' },
  { id: '59', name: 'Ritalin', dosage: '10mg', frequency: 'Günde 2 kez' },

  // Solunum & Allerji
  { id: '60', name: 'Ventolin (Salbutamol)', dosage: '2 puf', frequency: 'Gerektiğinde' },
  { id: '61', name: 'Symbicort', dosage: '160/4.5mcg', frequency: 'Günde 2 kez' },
  { id: '62', name: 'Nasonex', dosage: '1 puf', frequency: 'Günde 1 kez' },
  { id: '63', name: 'Aerius', dosage: '5mg', frequency: 'Günde 1 kez' },
  { id: '64', name: 'Zyrtec', dosage: '10mg', frequency: 'Günde 1 kez' },
  { id: '65', name: 'Aircomb', dosage: '5/10mg', frequency: 'Günde 1 kez' },
  { id: '66', name: 'Sudafed', dosage: '60mg', frequency: 'Günde 3 kez' },
  { id: '67', name: 'Tylolhot', dosage: '1 poşet', frequency: 'Gerektiğinde' },

  // Vitamin & Takviye
  { id: '68', name: 'Devit-3', dosage: '10 damla', frequency: 'Günde 1 kez' },
  { id: '69', name: 'Benexol', dosage: '1 tablet', frequency: 'Günde 1 kez' },
  { id: '70', name: 'Dodex', dosage: '1 ampul', frequency: 'Ayda 1 kez' },
  { id: '71', name: 'Oswende', dosage: '1 tablet', frequency: 'Haftada 1 kez' },
  { id: '72', name: 'Ferro Sanol', dosage: '1 kapsül', frequency: 'Günde 1 kez' },
  { id: '73', name: 'Magnorm', dosage: '365mg', frequency: 'Günde 1 kez' },
  { id: '74', name: 'Calcium Sandoz', dosage: '1 efervesan', frequency: 'Günde 1 kez' },
  { id: '75', name: 'Supradyn', dosage: '1 tablet', frequency: 'Günde 1 kez' },

  // Diğer (Dermatoloji, Üroloji vb.)
  { id: '76', name: 'Fucidin Krem', dosage: 'İnce tabaka', frequency: 'Günde 2 kez' },
  { id: '77', name: 'Travazol Krem', dosage: 'İnce tabaka', frequency: 'Günde 2 kez' },
  { id: '78', name: 'Bepanthen', dosage: 'İnce tabaka', frequency: 'Gerektiğinde' },
  { id: '79', name: 'Viagra (Sildenafil)', dosage: '50mg', frequency: 'Aktiviteden önce' },
  { id: '80', name: 'Cialis (Tadalafil)', dosage: '20mg', frequency: 'Aktiviteden önce' },
  { id: '81', name: 'Xatral', dosage: '10mg', frequency: 'Günde 1 kez' },
  { id: '82', name: 'Tamiflu', dosage: '75mg', frequency: 'Günde 2 kez' },
  { id: '83', name: 'Zovirax', dosage: '200mg', frequency: 'Günde 5 kez' },
  { id: '84', name: 'Roaccutane', dosage: '20mg', frequency: 'Günde 1 kez' },
  { id: '85', name: 'Madecassol', dosage: 'İnce tabaka', frequency: 'Günde 2 kez' },
];

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    age: 45,
    gender: 'male',
    conditions: ['Hipertansiyon', 'Diyabet'],
    currentMedications: [
      { id: '36', name: 'Glifor (Metformin)', dosage: '1000mg', frequency: 'Günde 2 kez' },
      { id: '26', name: 'Delix (Ramipril)', dosage: '5mg', frequency: 'Günde 1 kez' },
    ],
    prescriptions: [],
  },
  {
    id: '2',
    name: 'Ayşe Kaya',
    age: 32,
    gender: 'female',
    conditions: ['Migren'],
    currentMedications: [
      { id: '2', name: 'Parol (Parasetamol)', dosage: '500mg', frequency: 'Günde 3 kez' },
    ],
    prescriptions: [],
  },
  {
    id: '3',
    name: 'Mehmet Demir',
    age: 58,
    gender: 'male',
    conditions: ['Kalp Hastalığı', 'Yüksek Kolesterol'],
    currentMedications: [
      { id: '29', name: 'Coraspin', dosage: '100mg', frequency: 'Günde 1 kez' },
      { id: '21', name: 'Lipitor (Atorvastatin)', dosage: '20mg', frequency: 'Günde 1 kez' },
    ],
    prescriptions: [],
  },
  {
    id: '4',
    name: 'Fatma Öztürk',
    age: 67,
    gender: 'female',
    conditions: ['Hipotiroidi', 'Hipertansiyon', 'Osteoporoz'],
    currentMedications: [
      { id: '9', name: 'Levotiron (Levotiroksin)', dosage: '50mcg', frequency: 'Günde 1 kez' },
      { id: '23', name: 'Norvasc (Amlodipin)', dosage: '5mg', frequency: 'Günde 1 kez' },
      { id: '74', name: 'Calcium Sandoz', dosage: '1 tablet', frequency: 'Günde 1 kez' },
    ],
    prescriptions: [],
  },
];
