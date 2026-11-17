import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedBhagalpur() {
  console.log("🏥 Starting Bhagalpur Healthcare & Telepharmacy Ecosystem Seed...");

  // 1. Fetch or identify primary user
  const existingUsers = await prisma.user.findMany();
  let primaryUser = existingUsers[0];

  if (!primaryUser) {
    primaryUser = await prisma.user.create({
      data: {
        clerkUserId: "user_seed_aditya_bgp",
        email: "aditya.bgp@careconnect.in",
        name: "Aditya Gupta",
        role: "SELLER",
        credits: 10,
      },
    });
    console.log("👤 Created primary user:", primaryUser.name);
  } else {
    console.log("👤 Found existing primary user:", primaryUser.name, primaryUser.email, `(Current Role: ${primaryUser.role})`);
  }

  // 2. Create Doctors in Bhagalpur Zone
  console.log("👨‍⚕️ Seeding Bhagalpur Doctors...");
  const doctorsData = [
    {
      clerkUserId: "doctor_bgp_alok_verma",
      email: "dr.alokverma.bgp@careconnect.in",
      name: "Dr. Alok Kumar Verma",
      role: "DOCTOR",
      specialty: "General Physician",
      experience: 14,
      credentialUrl: "https://nmc.org.in/verify/BR-MED-2010-0982",
      description:
        "Senior Consultant Physician at JLNMCH Bhagalpur. 14+ years clinical expertise in infectious diseases, chronic diabetes management, hypertension, and family medicine.",
      verificationStatus: "VERIFIED",
    },
    {
      clerkUserId: "doctor_bgp_priya_sneha",
      email: "dr.priyasneha.bgp@careconnect.in",
      name: "Dr. Priya Sneha",
      role: "DOCTOR",
      specialty: "Pediatrician",
      experience: 9,
      credentialUrl: "https://nmc.org.in/verify/BR-PED-2015-4421",
      description:
        "Consultant Pediatrician in Tilkamanjhi, Bhagalpur. Specialist in infant nutrition, pediatric respiratory care, and childhood immunizations.",
      verificationStatus: "VERIFIED",
    },
    {
      clerkUserId: "doctor_bgp_rakesh_ranjan",
      email: "dr.rakeshranjan.bgp@careconnect.in",
      name: "Dr. Rakesh Ranjan",
      role: "DOCTOR",
      specialty: "Cardiologist",
      experience: 16,
      credentialUrl: "https://nmc.org.in/verify/BR-CARD-2008-1102",
      description:
        "Consultant Cardiologist at Bhagalpur Heart Care. Specializes in preventive cardiology, coronary care, and hypertension control.",
      verificationStatus: "VERIFIED",
    },
  ];

  const seededDoctors = [];
  for (const doc of doctorsData) {
    const upserted = await prisma.user.upsert({
      where: { email: doc.email },
      update: {
        role: "DOCTOR",
        specialty: doc.specialty,
        experience: doc.experience,
        description: doc.description,
        verificationStatus: "VERIFIED",
      },
      create: doc,
    });
    seededDoctors.push(upserted);

    // Create availability slots for the doctor
    const now = new Date();
    for (let day = 1; day <= 3; day++) {
      const slotStart = new Date(now);
      slotStart.setDate(slotStart.getDate() + day);
      slotStart.setHours(10 + (day % 4), 0, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setHours(slotStart.getHours() + 1);

      const existingSlot = await prisma.availability.findFirst({
        where: { doctorId: upserted.id, startTime: slotStart },
      });

      if (!existingSlot) {
        await prisma.availability.create({
          data: {
            doctorId: upserted.id,
            startTime: slotStart,
            endTime: slotEnd,
            status: "AVAILABLE",
          },
        });
      }
    }
  }

  // 3. Create Bhagalpur Pharmacy Stores ("Dukaans")
  console.log("🏪 Seeding Bhagalpur Pharmacy Stores...");
  const storesData = [
    {
      storeName: "Amrit Pharmacy (JLNMCH Campus)",
      ownerName: "Rajesh Kumar Sharma",
      ownerEmail: "rajesh.amritpharmacy@gmail.com",
      clerkUserId: "seller_bgp_amrit",
      phone: "+91 94312 87654",
      licenseNumber: "BR-BGP-2023-DL-0892",
      storeAddress: "Emergency Gate Road, JLNMCH Hospital Complex, Mayaganj",
      city: "Bhagalpur",
      postalCode: "812001",
      latitude: 25.2635,
      longitude: 87.0175,
      rating: 4.9,
    },
    {
      storeName: "Davaindia Generic Pharmacy (Tilkamanjhi)",
      ownerName: "Amit Sinha",
      ownerEmail: "amit.davaindia.bgp@gmail.com",
      clerkUserId: "seller_bgp_davaindia",
      phone: "+91 98350 44321",
      licenseNumber: "BR-BGP-2022-DL-0419",
      storeAddress: "Trimurti Chowk, RBSS Road, Tilkamanjhi",
      city: "Bhagalpur",
      postalCode: "812002",
      latitude: 25.2472,
      longitude: 86.9928,
      rating: 4.8,
    },
    {
      storeName: "Roshan Medical Hall (Khalifabag)",
      ownerName: "Md. Roshan Alam",
      ownerEmail: "roshan.medical.bgp@gmail.com",
      clerkUserId: "seller_bgp_roshan",
      phone: "+91 91223 55678",
      licenseNumber: "BR-BGP-2021-DL-0112",
      storeAddress: "Near Jama Masjid, Khalifabag Market Road",
      city: "Bhagalpur",
      postalCode: "812002",
      latitude: 25.2458,
      longitude: 86.9745,
      rating: 4.7,
    },
    {
      storeName: "Uma Medical Hall (MG Road)",
      ownerName: "Pradeep Kumar Gupta",
      ownerEmail: "umamedical.bgp@gmail.com",
      clerkUserId: "seller_bgp_uma",
      phone: "+91 93041 98765",
      licenseNumber: "BR-BGP-2020-DL-0331",
      storeAddress: "Opposite Head Post Office, Mahatma Gandhi Road",
      city: "Bhagalpur",
      postalCode: "812001",
      latitude: 25.2435,
      longitude: 86.9712,
      rating: 4.8,
    },
    {
      storeName: "DEV Medicals (Zero Mile)",
      ownerName: "Vikram Dev",
      ownerEmail: "devmedicals.bgp@gmail.com",
      clerkUserId: "seller_bgp_dev",
      phone: "+91 99342 11223",
      licenseNumber: "BR-BGP-2024-DL-1055",
      storeAddress: "Zero Mile Chowk, Barari / Tilkamanjhi Sector",
      city: "Bhagalpur",
      postalCode: "812003",
      latitude: 25.251,
      longitude: 87.008,
      rating: 4.9,
    },
  ];

  const seededStores = [];

  for (let i = 0; i < storesData.length; i++) {
    const s = storesData[i];

    // If this is the first store and primaryUser has role SELLER, link primary user as owner
    let ownerId;
    if (i === 0 && primaryUser.role === "SELLER") {
      ownerId = primaryUser.id;
    } else {
      // Find or create a seller user
      const sellerUser = await prisma.user.upsert({
        where: { email: s.ownerEmail },
        update: { role: "SELLER" },
        create: {
          clerkUserId: s.clerkUserId,
          email: s.ownerEmail,
          name: s.ownerName,
          role: "SELLER",
        },
      });
      ownerId = sellerUser.id;
    }

    // Check if store already exists for this owner
    let store = await prisma.store.findUnique({
      where: { ownerId },
    });

    if (store) {
      store = await prisma.store.update({
        where: { id: store.id },
        data: {
          storeName: s.storeName,
          phone: s.phone,
          licenseNumber: s.licenseNumber,
          storeAddress: s.storeAddress,
          city: s.city,
          postalCode: s.postalCode,
          latitude: s.latitude,
          longitude: s.longitude,
          verificationStatus: "VERIFIED",
          isActive: true,
          rating: s.rating,
        },
      });
    } else {
      store = await prisma.store.create({
        data: {
          ownerId,
          storeName: s.storeName,
          ownerName: s.ownerName,
          ownerEmail: s.ownerEmail,
          phone: s.phone,
          licenseNumber: s.licenseNumber,
          storeAddress: s.storeAddress,
          city: s.city,
          postalCode: s.postalCode,
          latitude: s.latitude,
          longitude: s.longitude,
          verificationStatus: "VERIFIED",
          isActive: true,
          rating: s.rating,
        },
      });
    }

    seededStores.push(store);
  }

  console.log(`✅ Seeded ${seededStores.length} Verified Bhagalpur Stores.`);

  // 4. Seed Product Catalog with Controlled Expiry Dates & Generics
  console.log("💊 Seeding Common Medicines with Controlled Shelf-Lives...");

  const baseMedicines = [
    // Pain Relief & Antipyretic
    {
      name: "Dolo 650",
      genericName: "Paracetamol 650mg",
      category: "Pain Relief",
      dosageForm: "Tablet",
      strength: "650mg",
      price: 32.0,
      mrp: 35.0,
      stockQuantity: 95,
      safetyStock: 25,
      daysUntilExpiry: 365, // Safe (1 Year)
      description: "Fast relief from fever, headache, body aches, and viral discomfort.",
    },
    {
      name: "Crocin Advance",
      genericName: "Paracetamol 500mg",
      category: "Pain Relief",
      dosageForm: "Tablet",
      strength: "500mg",
      price: 24.0,
      mrp: 28.0,
      stockQuantity: 80,
      safetyStock: 20,
      daysUntilExpiry: 420, // Safe
      description: "Fast-acting micro-particle paracetamol for gentle fever reduction.",
    },
    {
      name: "Combiflam",
      genericName: "Ibuprofen + Paracetamol",
      category: "Pain Relief",
      dosageForm: "Tablet",
      strength: "400mg/325mg",
      price: 42.0,
      mrp: 48.0,
      stockQuantity: 60,
      safetyStock: 15,
      daysUntilExpiry: 280, // Safe
      description: "Dual action NSAID analgesic for dental pain, muscular pain, and fever.",
    },
    {
      name: "Zerodol-SP",
      genericName: "Aceclofenac + Paracetamol + Serratiopeptidase",
      category: "Pain Relief",
      dosageForm: "Tablet",
      strength: "100mg/325mg/15mg",
      price: 118.0,
      mrp: 135.0,
      stockQuantity: 45,
      safetyStock: 12,
      daysUntilExpiry: 180, // Safe
      description: "Triple active pain relief with anti-inflammatory enzyme for severe swelling.",
    },

    // Antibiotics & Anti-Infectives (Includes Generic Savings & Near-Expiry Clearance)
    {
      name: "Augmentin 625 Duo",
      genericName: "Amoxicillin + Clavulanic Acid",
      category: "Antibiotics",
      dosageForm: "Tablet",
      strength: "500mg/125mg",
      price: 205.0,
      mrp: 228.0,
      stockQuantity: 35,
      safetyStock: 15,
      daysUntilExpiry: 240, // Safe
      description: "Broad-spectrum penicillin antibiotic with beta-lactamase inhibitor.",
    },
    {
      name: "Amoxyclav 625",
      genericName: "Amoxicillin + Clavulanic Acid",
      category: "Antibiotics",
      dosageForm: "Tablet",
      strength: "500mg/125mg",
      price: 110.0,
      mrp: 210.0,
      stockQuantity: 70,
      safetyStock: 20,
      daysUntilExpiry: 300, // Safe (Bio-equivalent generic - Save 46%!)
      description: "Verified generic equivalent of Augmentin 625. Identical clinical bio-potency.",
    },
    {
      name: "Azithral 500",
      genericName: "Azithromycin 500mg",
      category: "Antibiotics",
      dosageForm: "Tablet",
      strength: "500mg",
      price: 128.0,
      mrp: 145.0,
      stockQuantity: 18,
      safetyStock: 10,
      daysUntilExpiry: 18, // 🔴 CRITICAL ALERT: 18 Days Left!
      description: "Azalide macrolide antibiotic for upper and lower respiratory infections.",
    },
    {
      name: "Zithrox 500",
      genericName: "Azithromycin 500mg",
      category: "Antibiotics",
      dosageForm: "Tablet",
      strength: "500mg",
      price: 68.0,
      mrp: 125.0,
      stockQuantity: 40,
      safetyStock: 15,
      daysUntilExpiry: 210, // Safe
      description: "Cost-effective generic alternative for azithromycin 500mg.",
    },
    {
      name: "Taxim-O 200",
      genericName: "Cefixime 200mg",
      category: "Antibiotics",
      dosageForm: "Tablet",
      strength: "200mg",
      price: 105.0,
      mrp: 120.0,
      stockQuantity: 50,
      safetyStock: 15,
      daysUntilExpiry: 320, // Safe
      description: "Third-generation cephalosporin for typhoid fever, UTI, and throat infections.",
    },

    // Acidity & Gastrointestinal
    {
      name: "Pan-D",
      genericName: "Pantoprazole + Domperidone",
      category: "Gastrointestinal",
      dosageForm: "Capsule",
      strength: "40mg/30mg",
      price: 185.0,
      mrp: 212.0,
      stockQuantity: 55,
      safetyStock: 15,
      daysUntilExpiry: 260, // Safe
      description: "Relieves gastroesophageal reflux disease (GERD), heartburn, and nausea.",
    },
    {
      name: "Pantocid 40",
      genericName: "Pantoprazole 40mg",
      category: "Gastrointestinal",
      dosageForm: "Tablet",
      strength: "40mg",
      price: 145.0,
      mrp: 168.0,
      stockQuantity: 65,
      safetyStock: 20,
      daysUntilExpiry: 350, // Safe
      description: "Proton pump inhibitor that reduces stomach acid production.",
    },
    {
      name: "Omez 20",
      genericName: "Omeprazole 20mg",
      category: "Gastrointestinal",
      dosageForm: "Capsule",
      strength: "20mg",
      price: 62.0,
      mrp: 72.0,
      stockQuantity: 40,
      safetyStock: 15,
      daysUntilExpiry: 52, // 🟡 APPROACHING EXPIRY: 52 Days Left
      description: "Rapid relief from hyperacidity, peptic ulcer, and gastric reflux.",
    },
    {
      name: "Gelusil MPS Antacid Syrup",
      genericName: "Aluminium Hydroxide + Dimethicone",
      category: "Gastrointestinal",
      dosageForm: "Syrup",
      strength: "200ml",
      price: 130.0,
      mrp: 148.0,
      stockQuantity: 28,
      safetyStock: 10,
      daysUntilExpiry: 190, // Safe
      description: "Sugar-free antacid liquid for instant relief from acidity and gas.",
    },

    // Chronic Care: Diabetes & Hypertension (Daily Maintenance - Ideal for Clearance Hub)
    {
      name: "Glycomet 500 SR",
      genericName: "Metformin Hydrochloride",
      category: "Diabetes Care",
      dosageForm: "Tablet",
      strength: "500mg",
      price: 48.0,
      mrp: 56.0,
      stockQuantity: 24,
      safetyStock: 15,
      daysUntilExpiry: 40, // 🟡 Approaching (40 days left) -> Enrolled in Flash Clearance!
      isFlashSale: true,
      flashSaleDiscount: 50.0,
      flashSalePrice: 24.0,
      description: "Sustained release metformin for blood glucose control in type 2 diabetes.",
    },
    {
      name: "Metformin 500mg Generic",
      genericName: "Metformin Hydrochloride",
      category: "Diabetes Care",
      dosageForm: "Tablet",
      strength: "500mg",
      price: 20.0,
      mrp: 45.0,
      stockQuantity: 120,
      safetyStock: 30,
      daysUntilExpiry: 400, // Safe
      description: "Affordable generic daily diabetes maintenance strip.",
    },
    {
      name: "Telma 40",
      genericName: "Telmisartan 40mg",
      category: "Cardiovascular",
      dosageForm: "Tablet",
      strength: "40mg",
      price: 115.0,
      mrp: 138.0,
      stockQuantity: 45,
      safetyStock: 15,
      daysUntilExpiry: 290, // Safe
      description: "Angiotensin II receptor blocker for essential hypertension management.",
    },
    {
      name: "Telpres 40",
      genericName: "Telmisartan 40mg",
      category: "Cardiovascular",
      dosageForm: "Tablet",
      strength: "40mg",
      price: 58.0,
      mrp: 120.0,
      stockQuantity: 75,
      safetyStock: 20,
      daysUntilExpiry: 330, // Safe Generic (Save 49%!)
      description: "Cost-effective bio-equivalent telmisartan for blood pressure regulation.",
    },
    {
      name: "Amlokind 5",
      genericName: "Amlodipine 5mg",
      category: "Cardiovascular",
      dosageForm: "Tablet",
      strength: "5mg",
      price: 35.0,
      mrp: 42.0,
      stockQuantity: 60,
      safetyStock: 15,
      daysUntilExpiry: 310, // Safe
      description: "Calcium channel blocker for coronary vasodilation and blood pressure control.",
    },

    // Respiratory, Cough & Allergy
    {
      name: "Montair-LC",
      genericName: "Montelukast + Levocetirizine",
      category: "Respiratory & Cough",
      dosageForm: "Tablet",
      strength: "10mg/5mg",
      price: 195.0,
      mrp: 224.0,
      stockQuantity: 40,
      safetyStock: 15,
      daysUntilExpiry: 270, // Safe
      description: "Combination dual action for allergic rhinitis, asthma symptoms, and sneezing.",
    },
    {
      name: "Montek-LC Generic",
      genericName: "Montelukast + Levocetirizine",
      category: "Respiratory & Cough",
      dosageForm: "Tablet",
      strength: "10mg/5mg",
      price: 98.0,
      mrp: 195.0,
      stockQuantity: 65,
      safetyStock: 20,
      daysUntilExpiry: 320, // Safe Generic (Save 50%!)
      description: "Affordable bio-equivalent allergy and asthma relief tablet.",
    },
    {
      name: "Allegra 120mg",
      genericName: "Fexofenadine 120mg",
      category: "Respiratory & Cough",
      dosageForm: "Tablet",
      strength: "120mg",
      price: 198.0,
      mrp: 228.0,
      stockQuantity: 32,
      safetyStock: 12,
      daysUntilExpiry: 22, // 🔴 CRITICAL ALERT: 22 Days Left!
      description: "Non-sedating modern antihistamine for rapid hives and dust allergy relief.",
    },
    {
      name: "Cetzine 10mg",
      genericName: "Cetirizine Hydrochloride",
      category: "Respiratory & Cough",
      dosageForm: "Tablet",
      strength: "10mg",
      price: 22.0,
      mrp: 26.0,
      stockQuantity: 110,
      safetyStock: 30,
      daysUntilExpiry: 450, // Safe
      description: "Proven fast-acting antihistamine for runny nose and allergic itchy eyes.",
    },
    {
      name: "Ascoril-D Plus Syrup",
      genericName: "Dextromethorphan + Phenylephrine + Chlorpheniramine",
      category: "Respiratory & Cough",
      dosageForm: "Syrup",
      strength: "100ml",
      price: 125.0,
      mrp: 142.0,
      stockQuantity: 30,
      safetyStock: 10,
      daysUntilExpiry: 180, // Safe
      description: "Cough suppressant syrup for dry hacking cough and throat congestion.",
    },

    // Vitamins, Supplements & First Aid
    {
      name: "Becosules Z Capsules",
      genericName: "Vitamin B-Complex with Zinc",
      category: "Vitamins & Supplements",
      dosageForm: "Capsule",
      strength: "Strip of 20",
      price: 52.0,
      mrp: 60.0,
      stockQuantity: 85,
      safetyStock: 25,
      daysUntilExpiry: 340, // Safe
      description: "Therapeutic vitamin B-complex with zinc for mouth ulcers and immune stamina.",
    },
    {
      name: "Zincovit Tablets",
      genericName: "Multivitamin + Multimineral with Grape Seed Extract",
      category: "Vitamins & Supplements",
      dosageForm: "Tablet",
      strength: "Strip of 15",
      price: 105.0,
      mrp: 120.0,
      stockQuantity: 70,
      safetyStock: 20,
      daysUntilExpiry: 360, // Safe
      description: "Daily antioxidant multivitamin formula for overall wellness and recovery.",
    },
    {
      name: "Electral ORS Powder",
      genericName: "Oral Rehydration Salts (WHO Formula)",
      category: "First Aid & Devices",
      dosageForm: "Sachet",
      strength: "21.8g",
      price: 21.0,
      mrp: 23.5,
      stockQuantity: 150,
      safetyStock: 40,
      daysUntilExpiry: 500, // Safe
      description: "WHO-standard electrolyte restoration for dehydration, diarrhea, and heat exhaustion.",
    },
    {
      name: "Betadine 10% Ointment",
      genericName: "Povidone Iodine 10%",
      category: "First Aid & Devices",
      dosageForm: "Ointment",
      strength: "20g",
      price: 115.0,
      mrp: 130.0,
      stockQuantity: 35,
      safetyStock: 10,
      daysUntilExpiry: 260, // Safe
      description: "Broad-spectrum topical microbicidal antiseptic for cuts, burns, and wounds.",
    },
    {
      name: "Betadine 10% Batch #B881 (Expired Sample)",
      genericName: "Povidone Iodine 10%",
      category: "First Aid & Devices",
      dosageForm: "Ointment",
      strength: "20g",
      price: 115.0,
      mrp: 130.0,
      stockQuantity: 4,
      safetyStock: 5,
      daysUntilExpiry: -5, // ⛔ EXPIRED: -5 Days Past (Demonstrates legal block & write-off)
      description: "Expired batch sample to demonstrate system automated blocking gate.",
    },
  ];

  // Seed medicines across stores with variations
  for (const store of seededStores) {
    for (const med of baseMedicines) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + med.daysUntilExpiry);

      let expiryStatus = "SAFE";
      if (med.daysUntilExpiry <= 0) {
        expiryStatus = "EXPIRED";
      } else if (med.daysUntilExpiry <= 30) {
        expiryStatus = "CRITICAL_EXPIRY";
      } else if (med.daysUntilExpiry <= 90) {
        expiryStatus = "APPROACHING_EXPIRY";
      }

      const batchNumber = `BGP-${med.name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      // Check if product already exists
      const existingProduct = await prisma.product.findFirst({
        where: { storeId: store.id, name: med.name },
      });

      if (!existingProduct) {
        await prisma.product.create({
          data: {
            storeId: store.id,
            name: med.name,
            genericName: med.genericName,
            category: med.category,
            dosageForm: med.dosageForm,
            strength: med.strength,
            batchNumber,
            price: med.price,
            mrp: med.mrp,
            stockQuantity: med.stockQuantity,
            safetyStock: med.safetyStock,
            maxStockCap: 150,
            expiryDate,
            expiryStatus,
            isFlashSale: med.isFlashSale || false,
            flashSaleDiscount: med.flashSaleDiscount || null,
            flashSalePrice: med.flashSalePrice || null,
            description: med.description,
            isActive: med.daysUntilExpiry > 0,
          },
        });
      }
    }
  }

  console.log("✅ Seeded full medicine catalogs across all Bhagalpur stores.");

  // 5. Seed a Sample Consultation Appointment with a Digital E-Prescription
  console.log("📝 Seeding Doctor Consultation & Verified E-Prescription...");
  const alokDoctor = seededDoctors[0];

  const apptStartTime = new Date();
  apptStartTime.setHours(apptStartTime.getHours() - 2);
  const apptEndTime = new Date(apptStartTime);
  apptEndTime.setHours(apptEndTime.getHours() + 1);

  const existingAppt = await prisma.appointment.findFirst({
    where: { doctorId: alokDoctor.id, patientId: primaryUser.id },
  });

  let appointment = existingAppt;
  if (!appointment) {
    appointment = await prisma.appointment.create({
      data: {
        doctorId: alokDoctor.id,
        patientId: primaryUser.id,
        startTime: apptStartTime,
        endTime: apptEndTime,
        status: "COMPLETED",
        notes: "Patient presented with severe pharyngitis, productive cough, and mild febrile spikes for 3 days. Throat hyperemic. Chest bilaterally clear. Started on amoxicillin/clavulanic acid and symptomatic support.",
        patientDescription: "High fever and persistent painful dry cough since Sunday evening.",
      },
    });
  }

  // Create or update digital prescription for this appointment
  let prescription = await prisma.prescription.findUnique({
    where: { appointmentId: appointment.id },
    include: { items: true },
  });

  if (!prescription) {
    prescription = await prisma.prescription.create({
      data: {
        appointmentId: appointment.id,
        doctorId: alokDoctor.id,
        patientId: primaryUser.id,
        diagnosis: "Acute Bronchial Infection & Pyrexia of Unknown Origin",
        instructions:
          "Take Augmentin strictly after heavy meals. Drink at least 3 liters of warm fluids daily. Return for review in 5 days if fever does not subside.",
        items: {
          create: [
            {
              medicineName: "Augmentin 625 Duo",
              genericName: "Amoxicillin + Clavulanic Acid",
              dosage: "1 Tab twice daily after food",
              durationDays: 5,
              quantity: 10,
              instructions: "Do not skip doses. Complete 5-day course.",
            },
            {
              medicineName: "Dolo 650",
              genericName: "Paracetamol 650mg",
              dosage: "1 Tab SOS (when fever exceeds 100°F)",
              durationDays: 5,
              quantity: 10,
              instructions: "Maintain at least 6 hours between doses.",
            },
            {
              medicineName: "Pan-D",
              genericName: "Pantoprazole + Domperidone",
              dosage: "1 Cap once daily in the morning",
              durationDays: 5,
              quantity: 5,
              instructions: "30 minutes before breakfast.",
            },
            {
              medicineName: "Ascoril-D Plus Syrup",
              genericName: "Dextromethorphan + Phenylephrine",
              dosage: "10ml twice daily after meals",
              durationDays: 5,
              quantity: 1,
              instructions: "Gently shake bottle before pouring.",
            },
          ],
        },
      },
      include: { items: true },
    });
    console.log("✅ Seeded Digital E-Prescription linking Doctor to Patient & Stores.");
  }

  // 6. Seed Realistic Pipeline Orders (Pending, Accepted, Preparing, Delivered)
  console.log("📦 Seeding Store Order Dispatch Pipeline...");
  const firstStore = seededStores[0];
  const secondStore = seededStores[1];

  const storeProducts = await prisma.product.findMany({
    where: { storeId: firstStore.id, stockQuantity: { gt: 0 } },
    take: 6,
  });

  if (storeProducts.length >= 2) {
    // 1. New Pending Order
    const existingPending = await prisma.order.findFirst({
      where: { storeId: firstStore.id, status: "PENDING" },
    });

    if (!existingPending) {
      await prisma.order.create({
        data: {
          orderNumber: "CC-ORD-882194",
          patientId: primaryUser.id,
          storeId: firstStore.id,
          prescriptionId: prescription.id,
          status: "PENDING",
          deliveryType: "HOME_DELIVERY",
          deliveryAddress: "Flat 302, Gangotri Apartments, Barari Road, Bhagalpur - 812003",
          customerPhone: "+91 98351 22445",
          subtotal: 315.0,
          deliveryFee: 30.0,
          totalAmount: 345.0,
          items: {
            create: [
              {
                productId: storeProducts[0].id,
                quantity: 2,
                unitPrice: storeProducts[0].price,
                totalPrice: storeProducts[0].price * 2,
              },
              {
                productId: storeProducts[1].id,
                quantity: 1,
                unitPrice: storeProducts[1].price,
                totalPrice: storeProducts[1].price,
              },
            ],
          },
        },
      });
    }

    // 2. Preparing Order
    const existingPreparing = await prisma.order.findFirst({
      where: { storeId: firstStore.id, status: "PREPARING" },
    });

    if (!existingPreparing) {
      await prisma.order.create({
        data: {
          orderNumber: "CC-ORD-771420",
          patientId: primaryUser.id,
          storeId: firstStore.id,
          status: "PREPARING",
          deliveryType: "HOME_DELIVERY",
          deliveryAddress: "House 14, Opposite Tilkamanjhi Police Station, Bhagalpur - 812002",
          customerPhone: "+91 94318 66778",
          subtotal: 420.0,
          deliveryFee: 30.0,
          totalAmount: 450.0,
          items: {
            create: [
              {
                productId: storeProducts[1].id,
                quantity: 2,
                unitPrice: storeProducts[1].price,
                totalPrice: storeProducts[1].price * 2,
              },
            ],
          },
        },
      });
    }

    // 3. Out for Delivery Order
    const existingOut = await prisma.order.findFirst({
      where: { storeId: firstStore.id, status: "OUT_FOR_DELIVERY" },
    });

    if (!existingOut) {
      await prisma.order.create({
        data: {
          orderNumber: "CC-ORD-660912",
          patientId: primaryUser.id,
          storeId: firstStore.id,
          status: "OUT_FOR_DELIVERY",
          deliveryType: "HOME_DELIVERY",
          deliveryAddress: "Shop 4, Khalifabag Chowk, Bhagalpur - 812002",
          customerPhone: "+91 91224 88990",
          subtotal: 185.0,
          deliveryFee: 30.0,
          totalAmount: 215.0,
          items: {
            create: [
              {
                productId: storeProducts[0].id,
                quantity: 1,
                unitPrice: storeProducts[0].price,
                totalPrice: storeProducts[0].price,
              },
            ],
          },
        },
      });
    }

    // 4. Delivered Historical Orders Across 2026 for Rich Analytics Histogram
    const existingDelivered = await prisma.order.count({
      where: { storeId: firstStore.id, status: "DELIVERED" },
    });

    if (existingDelivered < 15) {
      console.log("📊 Seeding Historical Delivered Orders for Analytics Histogram...");
      const currentYear = new Date().getFullYear();

      const monthlySalesPattern = [
        { month: 0, count: 3, avgAmount: 320 }, // Jan
        { month: 1, count: 4, avgAmount: 410 }, // Feb
        { month: 2, count: 5, avgAmount: 480 }, // Mar
        { month: 3, count: 6, avgAmount: 390 }, // Apr
        { month: 4, count: 7, avgAmount: 540 }, // May
        { month: 5, count: 8, avgAmount: 620 }, // Jun
        { month: 6, count: 9, avgAmount: 580 }, // Jul
        { month: 7, count: 8, avgAmount: 610 }, // Aug
        { month: 8, count: 10, avgAmount: 690 }, // Sep
        { month: 9, count: 11, avgAmount: 750 }, // Oct
        { month: 10, count: 12, avgAmount: 820 }, // Nov
      ];

      for (const m of monthlySalesPattern) {
        for (let j = 0; j < m.count; j++) {
          const orderDate = new Date(currentYear, m.month, 5 + j * 2, 14, 30);
          const orderNum = `CC-ORD-HIST-${m.month + 1}${100 + j}`;

          const existingHist = await prisma.order.findUnique({
            where: { orderNumber: orderNum },
          });

          if (!existingHist) {
            await prisma.order.create({
              data: {
                orderNumber: orderNum,
                patientId: primaryUser.id,
                storeId: firstStore.id,
                status: "DELIVERED",
                deliveryType: "HOME_DELIVERY",
                deliveryAddress: `Local Customer in Bhagalpur Sector ${j + 1}`,
                customerPhone: `+91 98350 ${10000 + j}`,
                subtotal: m.avgAmount - 30,
                deliveryFee: 30.0,
                totalAmount: m.avgAmount,
                createdAt: orderDate,
                updatedAt: orderDate,
                items: {
                  create: [
                    {
                      productId: storeProducts[0].id,
                      quantity: 1,
                      unitPrice: m.avgAmount - 30,
                      totalPrice: m.avgAmount - 30,
                    },
                  ],
                },
              },
            });
          }
        }
      }
    }
  }

  // 7. Seed Demand Signals at Bhagalpur Coordinates for SmartStock AI
  console.log("⚡ Seeding Local Demand Signals for SmartStock AI Engine...");
  const bhagalpurLat = 25.2425;
  const bhagalpurLng = 86.9842;

  const demandMedicines = [
    { name: "Dolo 650", generic: "Paracetamol 650mg", count: 18 },
    { name: "Augmentin 625 Duo", generic: "Amoxicillin + Clavulanic Acid", count: 14 },
    { name: "Pan-D", generic: "Pantoprazole + Domperidone", count: 12 },
    { name: "Glycomet 500 SR", generic: "Metformin Hydrochloride", count: 16 },
    { name: "Montair-LC", generic: "Montelukast + Levocetirizine", count: 9 },
    { name: "Ascoril-D Plus Syrup", generic: "Dextromethorphan", count: 8 },
  ];

  for (const dm of demandMedicines) {
    const existingSignals = await prisma.demandSignal.count({
      where: { medicineName: dm.name },
    });

    if (existingSignals < dm.count) {
      for (let k = 0; k < dm.count; k++) {
        const signalDate = new Date();
        signalDate.setDate(signalDate.getDate() - (k % 12));

        const types = ["PRESCRIPTION", "SEARCH", "ORDER"];
        const signalType = types[k % 3];

        await prisma.demandSignal.create({
          data: {
            medicineName: dm.name,
            genericName: dm.generic,
            latitude: bhagalpurLat + (Math.random() - 0.5) * 0.05,
            longitude: bhagalpurLng + (Math.random() - 0.5) * 0.05,
            signalType,
            weight: signalType === "ORDER" ? 1.5 : signalType === "PRESCRIPTION" ? 1.0 : 0.5,
            createdAt: signalDate,
          },
        });
      }
    }
  }

  console.log("🎉 Bhagalpur Zone Seeding Completed Successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 Zone Center: Bhagalpur, Bihar (25.2425° N, 86.9842° E)");
  console.log("🏪 Verified Dukaans: 5 (Amrit, Davaindia, Roshan, Uma, DEV)");
  console.log("💊 Medicines Seeded: 30+ items per store across all categories");
  console.log("🔴 Critical Expiry Batches: Azithral 500 (18d), Allegra 120 (22d)");
  console.log("🟡 Approaching Expiry Batches: Glycomet 500 (40d), Omez 20 (52d)");
  console.log("⚡ Active Clearance Deals: Glycomet 500 SR @ 50% OFF (₹24)");
  console.log("⛔ Expired Blocked Batch: Betadine 10% Batch #B881 (-5d past)");
  console.log("👨‍⚕️ Verified Doctors: 3 (Dr. Alok Verma, Dr. Priya Sneha, Dr. Rakesh Ranjan)");
  console.log("📋 Verified Digital E-Prescription issued to Aditya Gupta");
  console.log("📦 Live Order Pipeline: Pending, Preparing, Out for Delivery, Delivered");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

seedBhagalpur()
  .catch((err) => {
    console.error("❌ Seeding failed with error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
