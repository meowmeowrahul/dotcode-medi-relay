# **Product Design Document: MediRelay**

## **1\. Executive Summary**

**Product Name:** MediRelay

**Tagline:** Structured Inter-Hospital Patient Handoff and Transfer Record Application

**SDG Alignment:** SDG 3: Good Health & Well-Being

**Problem:** Patient transfers between hospitals currently rely on unstructured, often illegible, paper-based records. This leads to critical information loss, missed allergies, medication errors, and delays in emergency care upon arrival at the receiving facility.

**Solution:** A mobile application designed for healthcare professionals to quickly generate a structured, scannable, and consistent patient handoff document. It surfaces critical information immediately and uses QR codes/links to ensure the receiving team can access the data in under 90 seconds, even without the app installed.

## **2\. Target Audience & Personas**

* **Persona A (The Sender):** Dr. Sharma, a medical officer at a primary/rural health centre. Often works with limited internet connectivity. Needs to transfer a critical patient to a district hospital quickly without spending 20 minutes writing a detailed referral note.  
* **Persona B (The Receiver):** Nurse/Dr. Patel, an emergency room resident at a tertiary care centre. Receives multiple transfers a day. Needs to know immediately *why* the patient is here, what *not* to give them (allergies), and what *must* be continued (critical meds).

## **3\. UI/UX Design Guidelines**

### **3.1 Design Principles**

1. **Emergency-First Scannability:** The UI must be highly legible. Critical information must catch the eye immediately without requiring the user to scroll or search.  
2. **High Contrast & Accessibility:** Use clear contrast ratios for harsh lighting environments (e.g., ambulances, bright ERs).  
3. **Frictionless Entry:** Input forms must use smart defaults, dropdowns, and dictation to minimize typing on mobile screens.  
4. **Clear Affordance:** Primary actions (Submit, Scan, Acknowledge) must be massive, obvious, and color-coded.

### **3.2 Color Palette**

The color palette is designed to instill trust (blues), indicate health/success (greens), and clearly highlight critical medical warnings (reds/oranges).

* **Primary Brand Color (Medical Blue):** \#0A5C8C  
  * *Use:* App bar, primary buttons, major headings. Represents trust and stability.  
* **Secondary/Action Color (Teal/Green):** \#00897B  
  * *Use:* Floating Action Buttons (FAB), "Mark as Reviewed" toggles, success states.  
* **Critical Alert (Emergency Red):** \#D32F2F  
  * *Use:* **Known Allergies**, critical error states, "Do Not Stop" medication flags.  
* **Warning (Interaction Orange):** \#F57C00  
  * *Use:* Drug interaction flags (Optional Feature), pending investigations.  
* **Background (Soft Gray):** \#F4F6F8  
  * *Use:* App background to make white cards pop out and reduce eye strain.  
* **Surface/Card Color:** \#FFFFFF  
  * *Use:* Form containers, patient history cards.  
* **Typography Colors:**  
  * Primary Text: \#1D1D1D (Near black for high readability)  
  * Secondary Text: \#5C6670 (Subtitles, timestamps)

### **3.3 Typography**

* **Font Family:** Inter or Roboto (Clean, modern sans-serif fonts with easily distinguishable alphanumeric characters to prevent medical misreading).  
* **Hierarchy:**  
  * **H1 (Critical Data):** 24sp, Bold, Red/Dark Gray (e.g., ALLERGIES: PENICILLIN)  
  * **H2 (Section Headers):** 18sp, Semi-Bold, Primary Blue  
  * **Body 1 (Input/Standard text):** 16sp, Regular, Primary Text  
  * **Body 2 (Metadata/Timestamps):** 12sp, Regular, Secondary Text

## **4\. Core Feature Specifications**

### **4.1 Structured Transfer Form (Sending Team)**

A fixed-structure, paginated or clearly segmented form.

* **Mandatory Fields:** Patient Identifiers (Name, Age, Sex, ID), Primary Diagnosis, Reason for Transfer.  
* **Clinical Data:** Active medications (Dose \+ Route), Known Allergies, Last Vitals (BP, HR, SpO2, Temp), Pending Investigations.  
* **Clinical Summary:** Free-text field, hard-capped at **200 words** to enforce brevity.  
* *Validation:* No ambiguous fields; critical fields cannot be left blank (must select "None" or "Unknown" explicitly).

### **4.2 Critical Information Surfacing (Receiving Team)**

The receiving view is completely different from the sending view. The top of the screen (Hero Section) is locked and requires **zero scrolling** to see:

1. **Known Allergies** (Highlighted in Red background).  
2. **Active Medications that MUST NOT be stopped** (Highlighted with a warning icon).  
3. **Primary Reason for Transfer** (Large, bold text).

### **4.3 QR Code and Shareable Link**

* **Generation:** Upon form submission, the app generates a unique, secure URL.  
* **QR Encoding:** The QR code displays on the sender's screen.  
  * *Online state:* QR encodes the short URL.  
  * *Offline state (Optional Feature):* QR heavily compresses the JSON payload and encodes the raw data directly into a dense QR code, allowing data transfer via camera without any internet.  
* **Access:** Receiving team scans via standard phone camera. Opens a web-view (no app installation required for basic read access).

### **4.4 Receiving Team Acknowledgement**

* **Action:** A persistent "Acknowledge Receipt" button at the bottom of the read-view.  
* **Inputs:** \* Arrival condition (Stable/Unstable dropdown).  
  * Brief arrival note (Text area).  
  * Discrepancy flag (e.g., checkbox for "Patient reports different medications").  
* **Audit Trail:** Timestamped and cryptographically/digitally attached to the original transfer record.

### **4.5 Transfer History Timeline**

* Visual timeline (similar to package tracking UI) showing the patient's journey.  
* **Nodes:** Hospital A (Departure time) \-\> Transit \-\> Hospital B (Arrival time, Arrival Note).  
* Allows receiving doctors to instantly see if a patient has bounced between multiple facilities.

## **5\. Optional / Advanced Features**

### **5.1 Allergy and Drug Interaction Flag**

* **Implementation:** Bundle a lightweight SQLite database of common, severe drug-drug and drug-allergy interactions.  
* **Trigger:** Evaluated locally onBlur or onSubmit of the medication/allergy fields.  
* **UI:** Modal popup: "⚠️ Warning: Patient has known Penicillin allergy. Amoxicillin entered in Active Medications. Proceed?"

### **5.2 Offline-First with Sync on Connectivity**

* **Architecture:** Local-first architecture (e.g., using WatermelonDB, Realm, or standard SQLite).  
* **Flow:** 1\. User fills form in a basement with no signal.  
  2\. App saves to local queue.  
  3\. App generates "Data-payload QR code" so the physical transfer isn't delayed.  
  4\. Background worker listens for NetworkStatus.isOnline. Once connected, pushes queue to cloud server.

### **5.3 Voice-Dictated Clinical Summary**

* **Integration:** Utilize Native OS Speech-to-Text APIs (iOS Speech framework, Android SpeechRecognizer).  
* **Flow:** Tap microphone icon in the 200-word summary field \-\> Speak \-\> Live transcription \-\> User taps "Stop" \-\> Reviews text \-\> Edits if necessary \-\> Saves.

## **6\. Technical Architecture Recommendations**

### **6.1 Tech Stack**

* **Mobile App (Sender & Receiver Power Users):** React Native or Flutter (Cross-platform, easy access to native camera/speech APIs, strong offline-first libraries).  
* **Web View (Receiver Light Users):** Next.js or React SPA (Responsive, fast-loading, accessed via QR scan).  
* **Backend & Database:** Node.js/Express with PostgreSQL (for structured relational data) or Firebase/Supabase (for built-in offline sync and real-time updates).  
* **Offline Storage:** WatermelonDB (Highly optimized for React Native offline-first apps).

### **6.2 Data Model (High-Level)**

**Entity: TransferRecord**

* id (UUID)  
* patientId (String)  
* senderHospitalId (String)  
* receiverHospitalId (String \- optional at creation)  
* status (Enum: IN\_TRANSIT, RECEIVED, DISCREPANCY)  
* criticalInfo (JSON: { allergies: \[\], criticalMeds: \[\], reason: string })  
* vitals (JSON: { bp, hr, spo2, temp, timestamp })  
* clinicalSummary (String, max limit)  
* timestamps (createdAt, acknowledgedAt)  
* acknowledgement (JSON: { receiverName, arrivalNote, discrepancies })

## **7\. Next Steps for Implementation**

1. **Prototyping:** Create wireframes of the two main screens: The Sender Form and the Receiver "Zero-Scroll" Hero view.  
2. **Database Design:** Finalize the schema for the offline-first data structure.  
3. **QR Strategy:** Test maximum payload size for offline QR code generation vs. URL routing.