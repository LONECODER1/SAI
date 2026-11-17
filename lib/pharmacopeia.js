/**
 * Pharmacopeia & Medicine Presets Database
 * Provides standardized pharmaceutical data for Indian telepharmacy dukaans.
 * Includes generic molecule mapping, dosage forms, therapeutic categories,
 * typical MRP, suggested competitive selling prices, safety thresholds, and imagery.
 */

import { MEDICINE_IMAGE_MAP, CATEGORY_IMAGE_FALLBACKS } from "./medicine-images.js";

export const PHARMACOPEIA_DATABASE = [
  // ==========================================
  // PAIN RELIEF & ANTIPYRETIC (ANALGESICS)
  // ==========================================
  {
    name: "Dolo 650",
    genericName: "Paracetamol 650mg",
    category: "Pain Relief",
    dosageForm: "Tablet",
    strength: "650mg (Strip of 15 Tablets)",
    mrp: 35.0,
    suggestedPrice: 30.0,
    safetyStock: 30,
    maxStockCap: 150,
    prescriptionRequired: false,
    description: "Fast-acting relief from fever, headache, body aches, and post-vaccination discomfort.",
    imageUrl: MEDICINE_IMAGE_MAP["dolo 650"],
  },
  {
    name: "Crocin Advance",
    genericName: "Paracetamol 500mg",
    category: "Pain Relief",
    dosageForm: "Tablet",
    strength: "500mg (Strip of 20 Tablets)",
    mrp: 28.0,
    suggestedPrice: 24.0,
    safetyStock: 25,
    maxStockCap: 120,
    prescriptionRequired: false,
    description: "Optizorb micro-particle formulation for fast absorption and fever reduction.",
    imageUrl: MEDICINE_IMAGE_MAP["crocin advance"],
  },
  {
    name: "Combiflam",
    genericName: "Ibuprofen 400mg + Paracetamol 325mg",
    category: "Pain Relief",
    dosageForm: "Tablet",
    strength: "400mg/325mg (Strip of 20 Tablets)",
    mrp: 48.0,
    suggestedPrice: 40.0,
    safetyStock: 20,
    maxStockCap: 100,
    prescriptionRequired: false,
    description: "Dual action NSAID and antipyretic for dental pain, muscular sprains, and headache.",
    imageUrl: MEDICINE_IMAGE_MAP["combiflam"],
  },
  {
    name: "Zerodol-SP",
    genericName: "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg",
    category: "Pain Relief",
    dosageForm: "Tablet",
    strength: "100mg/325mg/15mg (Strip of 10 Tablets)",
    mrp: 135.0,
    suggestedPrice: 115.0,
    safetyStock: 15,
    maxStockCap: 80,
    prescriptionRequired: true,
    description: "Triple-action pain relief with anti-inflammatory enzyme for joint pain and severe swelling.",
    imageUrl: MEDICINE_IMAGE_MAP["zerodol-sp"],
  },
  {
    name: "Volini Gel",
    genericName: "Diclofenac Diethylamine + Linseed Oil + Methyl Salicylate + Menthol",
    category: "Pain Relief",
    dosageForm: "Ointment",
    strength: "30g Tube",
    mrp: 150.0,
    suggestedPrice: 135.0,
    safetyStock: 15,
    maxStockCap: 60,
    prescriptionRequired: false,
    description: "Topical pain relief gel for neck, backache, shoulder, and knee stiffness.",
    imageUrl: CATEGORY_IMAGE_FALLBACKS["Pain Relief"],
  },

  // ==========================================
  // ANTIBIOTICS & ANTI-INFECTIVES
  // ==========================================
  {
    name: "Augmentin 625 Duo",
    genericName: "Amoxicillin 500mg + Clavulanic Acid 125mg",
    category: "Antibiotics",
    dosageForm: "Tablet",
    strength: "500mg/125mg (Strip of 10 Tablets)",
    mrp: 228.0,
    suggestedPrice: 195.0,
    safetyStock: 20,
    maxStockCap: 90,
    prescriptionRequired: true,
    description: "Broad-spectrum penicillin antibiotic with beta-lactamase inhibitor for respiratory, skin, and urinary tract infections.",
    imageUrl: MEDICINE_IMAGE_MAP["augmentin 625 duo"],
  },
  {
    name: "Amoxyclav 625",
    genericName: "Amoxicillin 500mg + Clavulanic Acid 125mg",
    category: "Antibiotics",
    dosageForm: "Tablet",
    strength: "500mg/125mg (Strip of 10 Tablets)",
    mrp: 210.0,
    suggestedPrice: 110.0,
    safetyStock: 25,
    maxStockCap: 100,
    prescriptionRequired: true,
    description: "Verified generic equivalent of Augmentin 625. Identical clinical bio-potency with up to 50% patient savings.",
    imageUrl: MEDICINE_IMAGE_MAP["amoxyclav 625"],
  },
  {
    name: "Azithral 500",
    genericName: "Azithromycin 500mg",
    category: "Antibiotics",
    dosageForm: "Tablet",
    strength: "500mg (Strip of 5 Tablets)",
    mrp: 145.0,
    suggestedPrice: 125.0,
    safetyStock: 15,
    maxStockCap: 80,
    prescriptionRequired: true,
    description: "Macrolide antibiotic for throat infections, bronchitis, tonsillitis, and sinusitis.",
    imageUrl: MEDICINE_IMAGE_MAP["azithral 500"],
  },
  {
    name: "Taxim-O 200",
    genericName: "Cefixime 200mg",
    category: "Antibiotics",
    dosageForm: "Tablet",
    strength: "200mg (Strip of 10 Tablets)",
    mrp: 180.0,
    suggestedPrice: 150.0,
    safetyStock: 15,
    maxStockCap: 70,
    prescriptionRequired: true,
    description: "Third-generation cephalosporin antibiotic for typhoid, ear infections, and urinary tract infections.",
    imageUrl: MEDICINE_IMAGE_MAP["taxim-o 200"],
  },
  {
    name: "Cifran 500",
    genericName: "Ciprofloxacin 500mg",
    category: "Antibiotics",
    dosageForm: "Tablet",
    strength: "500mg (Strip of 10 Tablets)",
    mrp: 46.0,
    suggestedPrice: 38.0,
    safetyStock: 15,
    maxStockCap: 80,
    prescriptionRequired: true,
    description: "Fluoroquinolone antibiotic for gastrointestinal, bone, and urinary bacterial infections.",
    imageUrl: CATEGORY_IMAGE_FALLBACKS["Antibiotics"],
  },

  // ==========================================
  // GASTROINTESTINAL & ACIDITY
  // ==========================================
  {
    name: "Pan-D",
    genericName: "Pantoprazole 40mg + Domperidone 30mg",
    category: "Gastrointestinal",
    dosageForm: "Capsule",
    strength: "40mg/30mg SR (Strip of 15 Capsules)",
    mrp: 215.0,
    suggestedPrice: 180.0,
    safetyStock: 25,
    maxStockCap: 120,
    prescriptionRequired: true,
    description: "Sustained release proton pump inhibitor with prokinetic agent for severe GERD, heartburn, and nausea.",
    imageUrl: MEDICINE_IMAGE_MAP["pan-d"],
  },
  {
    name: "Pantocid 40",
    genericName: "Pantoprazole 40mg",
    category: "Gastrointestinal",
    dosageForm: "Tablet",
    strength: "40mg (Strip of 15 Tablets)",
    mrp: 175.0,
    suggestedPrice: 145.0,
    safetyStock: 20,
    maxStockCap: 100,
    prescriptionRequired: false,
    description: "Fast-acting proton pump inhibitor for reducing stomach acid, peptic ulcers, and acid reflux.",
    imageUrl: MEDICINE_IMAGE_MAP["pantocid 40"],
  },
  {
    name: "Omez 20",
    genericName: "Omeprazole 20mg",
    category: "Gastrointestinal",
    dosageForm: "Capsule",
    strength: "20mg (Strip of 20 Capsules)",
    mrp: 65.0,
    suggestedPrice: 52.0,
    safetyStock: 20,
    maxStockCap: 100,
    prescriptionRequired: false,
    description: "Acid suppression for gastritis, heartburn, and gastroesophageal reflux.",
    imageUrl: MEDICINE_IMAGE_MAP["omeprazole"],
  },
  {
    name: "Digene Gel Mint",
    genericName: "Aluminium Hydroxide + Magnesium Hydroxide + Simethicone",
    category: "Gastrointestinal",
    dosageForm: "Syrup",
    strength: "200ml Bottle",
    mrp: 145.0,
    suggestedPrice: 125.0,
    safetyStock: 15,
    maxStockCap: 60,
    prescriptionRequired: false,
    description: "Fast relief antacid syrup for instant relief from acidity, gas, and bloated stomach.",
    imageUrl: CATEGORY_IMAGE_FALLBACKS["Gastrointestinal"],
  },

  // ==========================================
  // DIABETES CARE (CHRONIC ESSENTIALS)
  // ==========================================
  {
    name: "Glycomet-GP 1",
    genericName: "Metformin 500mg + Glimepiride 1mg",
    category: "Diabetes Care",
    dosageForm: "Tablet",
    strength: "500mg/1mg (Strip of 15 Tablets)",
    mrp: 110.0,
    suggestedPrice: 92.0,
    safetyStock: 30,
    maxStockCap: 150,
    prescriptionRequired: true,
    description: "Dual oral hypoglycemic agent for glycemic control in adult Type-2 Diabetes Mellitus.",
    imageUrl: MEDICINE_IMAGE_MAP["glycomet-gp 1"],
  },
  {
    name: "Metformin 500mg Generic",
    genericName: "Metformin 500mg",
    category: "Diabetes Care",
    dosageForm: "Tablet",
    strength: "500mg (Strip of 10 Tablets)",
    mrp: 45.0,
    suggestedPrice: 22.0,
    safetyStock: 40,
    maxStockCap: 200,
    prescriptionRequired: true,
    description: "Standard biguanide first-line therapy for insulin sensitivity and blood glucose regulation.",
    imageUrl: MEDICINE_IMAGE_MAP["metformin 500mg generic"],
  },
  {
    name: "Januvia 100mg",
    genericName: "Sitagliptin 100mg",
    category: "Diabetes Care",
    dosageForm: "Tablet",
    strength: "100mg (Strip of 7 Tablets)",
    mrp: 385.0,
    suggestedPrice: 345.0,
    safetyStock: 10,
    maxStockCap: 50,
    prescriptionRequired: true,
    description: "DPP-4 inhibitor for improving incretin hormone levels in Type-2 diabetes.",
    imageUrl: CATEGORY_IMAGE_FALLBACKS["Diabetes Care"],
  },

  // ==========================================
  // CARDIOVASCULAR & HYPERTENSION
  // ==========================================
  {
    name: "Telma 40",
    genericName: "Telmisartan 40mg",
    category: "Cardiovascular",
    dosageForm: "Tablet",
    strength: "40mg (Strip of 30 Tablets)",
    mrp: 260.0,
    suggestedPrice: 215.0,
    safetyStock: 25,
    maxStockCap: 120,
    prescriptionRequired: true,
    description: "Angiotensin II receptor blocker (ARB) for arterial blood pressure control and cardiovascular risk reduction.",
    imageUrl: MEDICINE_IMAGE_MAP["telma 40"],
  },
  {
    name: "Amlokind 5",
    genericName: "Amlodipine 5mg",
    category: "Cardiovascular",
    dosageForm: "Tablet",
    strength: "5mg (Strip of 15 Tablets)",
    mrp: 42.0,
    suggestedPrice: 32.0,
    safetyStock: 25,
    maxStockCap: 120,
    prescriptionRequired: true,
    description: "Calcium channel blocker for relaxing vascular smooth muscle and treating hypertension.",
    imageUrl: MEDICINE_IMAGE_MAP["amlokind 5"],
  },
  {
    name: "Atorva 10",
    genericName: "Atorvastatin 10mg",
    category: "Cardiovascular",
    dosageForm: "Tablet",
    strength: "10mg (Strip of 15 Tablets)",
    mrp: 115.0,
    suggestedPrice: 95.0,
    safetyStock: 20,
    maxStockCap: 100,
    prescriptionRequired: true,
    description: "HMG-CoA reductase inhibitor for reducing LDL cholesterol and preventing cardiac events.",
    imageUrl: CATEGORY_IMAGE_FALLBACKS["Cardiovascular"],
  },
  {
    name: "Concor 5",
    genericName: "Bisoprolol Fumarate 5mg",
    category: "Cardiovascular",
    dosageForm: "Tablet",
    strength: "5mg (Strip of 10 Tablets)",
    mrp: 120.0,
    suggestedPrice: 102.0,
    safetyStock: 15,
    maxStockCap: 70,
    prescriptionRequired: true,
    description: "Cardioselective beta-1 adrenergic blocker for managing high blood pressure and heart rate.",
    imageUrl: CATEGORY_IMAGE_FALLBACKS["Cardiovascular"],
  },

  // ==========================================
  // RESPIRATORY, COUGH & ALLERGIES
  // ==========================================
  {
    name: "Montair-LC",
    genericName: "Montelukast 10mg + Levocetirizine 5mg",
    category: "Respiratory & Cough",
    dosageForm: "Tablet",
    strength: "10mg/5mg (Strip of 10 Tablets)",
    mrp: 195.0,
    suggestedPrice: 160.0,
    safetyStock: 25,
    maxStockCap: 120,
    prescriptionRequired: true,
    description: "Leukotriene receptor antagonist with second-generation antihistamine for allergic rhinitis and asthma.",
    imageUrl: MEDICINE_IMAGE_MAP["montair-lc"],
  },
  {
    name: "Allegra 120mg",
    genericName: "Fexofenadine Hydrochloride 120mg",
    category: "Respiratory & Cough",
    dosageForm: "Tablet",
    strength: "120mg (Strip of 10 Tablets)",
    mrp: 220.0,
    suggestedPrice: 185.0,
    safetyStock: 15,
    maxStockCap: 80,
    prescriptionRequired: false,
    description: "Non-sedating antihistamine for seasonal allergic rhinitis, runny nose, and hives.",
    imageUrl: MEDICINE_IMAGE_MAP["allegra 120mg"],
  },
  {
    name: "Cetzine 10mg",
    genericName: "Cetirizine Hydrochloride 10mg",
    category: "Respiratory & Cough",
    dosageForm: "Tablet",
    strength: "10mg (Strip of 10 Tablets)",
    mrp: 24.0,
    suggestedPrice: 18.0,
    safetyStock: 30,
    maxStockCap: 150,
    prescriptionRequired: false,
    description: "Fast-acting antihistamine for sneezing, watery eyes, and itching.",
    imageUrl: MEDICINE_IMAGE_MAP["cetzine 10mg"],
  },
  {
    name: "Ascoril-D Plus Syrup",
    genericName: "Dextromethorphan + Phenylephrine + Chlorpheniramine",
    category: "Respiratory & Cough",
    dosageForm: "Syrup",
    strength: "100ml Bottle",
    mrp: 130.0,
    suggestedPrice: 110.0,
    safetyStock: 20,
    maxStockCap: 90,
    prescriptionRequired: false,
    description: "Triple active cough suppressant, nasal decongestant, and antihistamine syrup for dry cough.",
    imageUrl: MEDICINE_IMAGE_MAP["ascoril-d plus syrup"],
  },

  // ==========================================
  // VITAMINS & MINERAL SUPPLEMENTS
  // ==========================================
  {
    name: "Becosules Z Capsules",
    genericName: "Vitamin B-Complex + Vitamin C + Zinc",
    category: "Vitamins & Supplements",
    dosageForm: "Capsule",
    strength: "Strip of 20 Capsules",
    mrp: 52.0,
    suggestedPrice: 42.0,
    safetyStock: 30,
    maxStockCap: 160,
    prescriptionRequired: false,
    description: "High potency Vitamin B complex with Zinc for mouth ulcers, tissue repair, and immunity.",
    imageUrl: MEDICINE_IMAGE_MAP["becosules z capsules"],
  },
  {
    name: "Shelcal 500",
    genericName: "Calcium 500mg + Vitamin D3 250 IU",
    category: "Vitamins & Supplements",
    dosageForm: "Tablet",
    strength: "500mg (Strip of 15 Tablets)",
    mrp: 145.0,
    suggestedPrice: 120.0,
    safetyStock: 25,
    maxStockCap: 120,
    prescriptionRequired: false,
    description: "Bone health supplement with elemental calcium and vitamin D3 for bone mineral density.",
    imageUrl: MEDICINE_IMAGE_MAP["shelcal 500"],
  },
  {
    name: "Limcee 500 Chewable",
    genericName: "Vitamin C 500mg (Ascorbic Acid)",
    category: "Vitamins & Supplements",
    dosageForm: "Tablet",
    strength: "500mg (Strip of 15 Chewable Tablets)",
    mrp: 32.0,
    suggestedPrice: 25.0,
    safetyStock: 30,
    maxStockCap: 150,
    prescriptionRequired: false,
    description: "Orange-flavored chewable vitamin C supplement for antioxidant defense and immune booster.",
    imageUrl: CATEGORY_IMAGE_FALLBACKS["Vitamins & Supplements"],
  },
  {
    name: "Neurobion Forte",
    genericName: "Vitamin B1 + B2 + B3 + B5 + B6 + B12",
    category: "Vitamins & Supplements",
    dosageForm: "Tablet",
    strength: "Strip of 30 Tablets",
    mrp: 46.0,
    suggestedPrice: 38.0,
    safetyStock: 30,
    maxStockCap: 150,
    prescriptionRequired: false,
    description: "Essential nerve nourishing neurotropic B-vitamins for peripheral neuropathy and numbness.",
    imageUrl: CATEGORY_IMAGE_FALLBACKS["Vitamins & Supplements"],
  },

  // ==========================================
  // FIRST AID & DERMATOLOGY
  // ==========================================
  {
    name: "Betadine Ointment 20g",
    genericName: "Povidone Iodine 5% w/w",
    category: "First Aid & Devices",
    dosageForm: "Ointment",
    strength: "20g Tube",
    mrp: 82.0,
    suggestedPrice: 70.0,
    safetyStock: 20,
    maxStockCap: 90,
    prescriptionRequired: false,
    description: "Broad-spectrum antiseptic ointment for cuts, minor burns, abrasions, and wound disinfection.",
    imageUrl: MEDICINE_IMAGE_MAP["betadine ointment 20g"],
  },
  {
    name: "Soframycin Skin Cream",
    genericName: "Framycetin Sulphate 1% w/w",
    category: "First Aid & Devices",
    dosageForm: "Ointment",
    strength: "30g Tube",
    mrp: 65.0,
    suggestedPrice: 55.0,
    safetyStock: 20,
    maxStockCap: 80,
    prescriptionRequired: false,
    description: "Antibacterial topical cream for minor wound infection, boils, and superficial skin lesions.",
    imageUrl: CATEGORY_IMAGE_FALLBACKS["General Healthcare"],
  },
];

/**
 * Search the pharmacopeia by medicine brand name, generic salt, or category.
 */
export function searchPharmacopeia(query = "", category = "ALL", limit = 10) {
  const cleanQuery = query.trim().toLowerCase();
  
  return PHARMACOPEIA_DATABASE.filter((item) => {
    const matchesCategory = category === "ALL" || item.category === category;
    if (!matchesCategory) return false;

    if (!cleanQuery) return true;

    return (
      item.name.toLowerCase().includes(cleanQuery) ||
      item.genericName.toLowerCase().includes(cleanQuery) ||
      item.category.toLowerCase().includes(cleanQuery)
    );
  }).slice(0, limit);
}

/**
 * Returns top popular medicines for 1-click quick-pick buttons.
 */
export function getPopularMedicinePresets() {
  const popularNames = [
    "Dolo 650",
    "Augmentin 625 Duo",
    "Amoxyclav 625",
    "Pan-D",
    "Glycomet-GP 1",
    "Telma 40",
    "Montair-LC",
    "Becosules Z Capsules",
    "Crocin Advance",
    "Azithral 500",
  ];

  return PHARMACOPEIA_DATABASE.filter((item) => popularNames.includes(item.name));
}

/**
 * Generates a clean pharmaceutical batch number (e.g. BGP-2026-AUG-489)
 */
export function generateBatchNumber(brandName = "MED") {
  const prefix = brandName.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "MED";
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `BATCH-${year}-${prefix}-${randomNum}`;
}

/**
 * Returns ISO date string (YYYY-MM-DD) for N months from today
 */
export function getDefaultExpiryDate(monthsFromNow = 18) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsFromNow);
  return date.toISOString().split("T")[0];
}

/**
 * Sample CSV template content for store bulk import
 */
export const SAMPLE_CSV_TEMPLATE = `name,genericName,category,dosageForm,strength,price,mrp,stockQuantity,safetyStock,maxStockCap,expiryDate,description
Dolo 650,Paracetamol 650mg,Pain Relief,Tablet,650mg,30,35,80,25,150,2027-12-31,Relief from fever and body aches
Augmentin 625 Duo,Amoxicillin + Clavulanic Acid,Antibiotics,Tablet,625mg,195,228,45,20,100,2027-08-15,Broad spectrum antibiotic
Pan-D,Pantoprazole + Domperidone,Gastrointestinal,Capsule,40mg/30mg,180,215,60,25,120,2027-10-30,Antacid for acid reflux and GERD
Telma 40,Telmisartan 40mg,Cardiovascular,Tablet,40mg,215,260,50,20,120,2028-01-20,High blood pressure maintenance
Glycomet-GP 1,Metformin + Glimepiride,Diabetes Care,Tablet,500mg/1mg,92,110,75,30,150,2027-11-25,Type 2 diabetes glycemic control`;

/**
 * Parses CSV string into structured product records with validation
 */
export function parseMedicineCsv(csvText) {
  if (!csvText || typeof csvText !== "string") {
    return { success: false, error: "Empty or invalid CSV file provided" };
  }

  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { success: false, error: "CSV must contain a header row and at least 1 medicine row" };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const requiredHeaders = ["name", "price"];
  for (const req of requiredHeaders) {
    if (!header.includes(req)) {
      return { success: false, error: `Missing required column "${req}" in CSV header` };
    }
  }

  const parsedProducts = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Simple CSV parser supporting unescaped and basic quotes
    const cells = [];
    let insideQuotes = false;
    let currentCell = "";

    for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
      const char = rawLine[charIdx];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        cells.push(currentCell.trim());
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim());

    if (cells.length < header.length) {
      // pad with empty strings
      while (cells.length < header.length) cells.push("");
    }

    const rowObj = {};
    header.forEach((colName, idx) => {
      rowObj[colName] = cells[idx] || "";
    });

    if (!rowObj.name || !rowObj.price) {
      errors.push(`Row ${i + 1}: Medicine Name and Price are mandatory.`);
      continue;
    }

    const price = parseFloat(rowObj.price);
    if (isNaN(price) || price < 0) {
      errors.push(`Row ${i + 1}: Price must be a valid positive number.`);
      continue;
    }

    const mrp = rowObj.mrp ? parseFloat(rowObj.mrp) : price;
    const stockQuantity = rowObj.stockquantity ? parseInt(rowObj.stockquantity, 10) : 25;
    const safetyStock = rowObj.safetystock ? parseInt(rowObj.safetystock, 10) : 15;
    const maxStockCap = rowObj.maxstockcap ? parseInt(rowObj.maxstockcap, 10) : 120;

    let expiryDate = rowObj.expirydate ? new Date(rowObj.expirydate) : null;
    if (expiryDate && isNaN(expiryDate.getTime())) {
      expiryDate = null;
    }

    // Best effort image match
    const matchedImage = MEDICINE_IMAGE_MAP[rowObj.name.toLowerCase()] ||
      CATEGORY_IMAGE_FALLBACKS[rowObj.category] ||
      CATEGORY_IMAGE_FALLBACKS["General Healthcare"];

    parsedProducts.push({
      name: rowObj.name,
      genericName: rowObj.genericname || null,
      category: rowObj.category || "General Healthcare",
      dosageForm: rowObj.dosageform || "Tablet",
      strength: rowObj.strength || null,
      batchNumber: rowObj.batchnumber || generateBatchNumber(rowObj.name),
      price,
      mrp: isNaN(mrp) ? price : mrp,
      stockQuantity: isNaN(stockQuantity) ? 25 : Math.max(0, stockQuantity),
      safetyStock: isNaN(safetyStock) ? 15 : Math.max(5, safetyStock),
      maxStockCap: isNaN(maxStockCap) ? 120 : Math.max(stockQuantity, maxStockCap),
      expiryDate: expiryDate ? expiryDate.toISOString().split("T")[0] : getDefaultExpiryDate(18),
      imageUrl: rowObj.imageurl || matchedImage,
      description: rowObj.description || null,
    });
  }

  return {
    success: true,
    products: parsedProducts,
    errors,
    totalParsed: parsedProducts.length,
  };
}
