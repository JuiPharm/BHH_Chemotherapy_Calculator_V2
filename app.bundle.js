// BHH Chemotherapy Calculator V2.2.0 — simple production runtime
const BHH_PUBLISHED_REGIMENS = [{"id":"BHH-BREAST-TCH-EVIQ53","version":"2.1.0","name":"TCH","cancerGroup":"Breast","indication":"HER2-positive breast cancer — adjuvant TCH reference model","setting":"Adjuvant","intent":"Curative","population":"adult","cycleIntervalDays":21,"cycleCount":17,"status":"published","localApproval":true,"effectiveDate":"2026-10-07","lastReviewed":"2026-10-07","references":[{"label":"eviQ ID 53 — Breast adjuvant TCH","url":"https://www.eviq.org.au/medical-oncology/breast/neoadjuvant-adjuvant/53-breast-adjuvant-tch-docetaxel-carboplatin-tras","accessedDate":"2026-10-07"}],"clinicalNotes":["Local approval recorded per project owner confirmation on 7 October 2026 for this six-regimen pilot registry.","Published pilot registry entry based on the current referenced schedule; local approval is recorded for v2.1.0.","If estimated kidney function is >125 mL/min and AUC6 dose would exceed 900 mg, the reference recommends considering direct measurement of kidney function rather than applying a universal hard 900 mg cap."],"phases":[{"id":"tch-c1","name":"Cycle 1 — loading + combination","cycleStart":1,"cycleEnd":1,"orders":[{"id":"tch-c1-docetaxel","drugId":"docetaxel","drugName":"Docetaxel","dose":{"basis":"bsa","value":75,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1],"infusionMinutes":60},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"},{"id":"tch-c1-carboplatin","drugId":"carboplatin","drugName":"Carboplatin","dose":{"basis":"auc","value":6,"unit":"mg","displayDenominator":"AUC"},"route":"IV","schedule":{"days":[1],"infusionMinutes":60},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT","clinicalRules":[{"type":"warning_threshold","metric":"kidney_function","operator":"gt","value":125,"message":"Kidney function >125 mL/min: verify the regimen-specific Carboplatin kidney-function method; current TCH reference recommends considering direct measurement rather than an automatic 125 mL/min cap."}]},{"id":"tch-c1-trastuzumab","drugId":"trastuzumab","drugName":"Trastuzumab","dose":{"basis":"weight","value":8,"unit":"mg","displayDenominator":"kg"},"route":"IV","schedule":{"days":[1],"infusionMinutes":90,"note":"loading dose"},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"}]},{"id":"tch-c2-6","name":"Cycles 2–6 — combination","cycleStart":2,"cycleEnd":6,"orders":[{"id":"tch-c2-docetaxel","drugId":"docetaxel","drugName":"Docetaxel","dose":{"basis":"bsa","value":75,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1],"infusionMinutes":60},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"},{"id":"tch-c2-carboplatin","drugId":"carboplatin","drugName":"Carboplatin","dose":{"basis":"auc","value":6,"unit":"mg","displayDenominator":"AUC"},"route":"IV","schedule":{"days":[1],"infusionMinutes":60},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT","clinicalRules":[{"type":"warning_threshold","metric":"kidney_function","operator":"gt","value":125,"message":"Kidney function >125 mL/min: verify Carboplatin dosing method and consider measured GFR per protocol/reference."}]},{"id":"tch-c2-trastuzumab","drugId":"trastuzumab","drugName":"Trastuzumab","dose":{"basis":"weight","value":6,"unit":"mg","displayDenominator":"kg"},"route":"IV","schedule":{"days":[1],"infusionMinutes":30,"note":"subsequent dose"},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"}]},{"id":"tch-c7-17","name":"Cycles 7–17 — trastuzumab maintenance","cycleStart":7,"cycleEnd":17,"orders":[{"id":"tch-maint-trastuzumab","drugId":"trastuzumab","drugName":"Trastuzumab","dose":{"basis":"weight","value":6,"unit":"mg","displayDenominator":"kg"},"route":"IV","schedule":{"days":[1],"infusionMinutes":30,"note":"maintenance"},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"}]}]},{"id":"BHH-CRC-MFOLFOX6-EVIQ637","version":"2.1.0","name":"mFOLFOX6","cancerGroup":"Colorectal","indication":"Colorectal cancer — adjuvant modified FOLFOX6 reference model","setting":"Adjuvant","intent":"Curative","population":"adult","cycleIntervalDays":14,"cycleCount":12,"status":"published","localApproval":true,"effectiveDate":"2026-10-07","lastReviewed":"2026-10-07","references":[{"label":"eviQ ID 637 — Colorectal adjuvant modified FOLFOX6","url":"https://www.eviq.org.au/medical-oncology/colorectal/adjuvant-and-neoadjuvant/637-colorectal-adjuvant-folfox6-modified-fluoro","accessedDate":"2026-10-07"}],"clinicalNotes":["Local approval recorded per project owner confirmation on 7 October 2026 for this six-regimen pilot registry.","eviQ ID 637 currently uses calcium folinate (leucovorin) 50 mg fixed in this protocol; do not assume all mFOLFOX6 definitions use the same leucovorin dose.","Published rounding profiles are operational defaults and remain subject to BHH change control."],"phases":[{"id":"mfolfox6-c1-12","name":"Cycles 1–12","cycleStart":1,"cycleEnd":12,"orders":[{"id":"mfolfox6-oxaliplatin","drugId":"oxaliplatin","drugName":"Oxaliplatin","dose":{"basis":"bsa","value":85,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1],"infusionMinutes":120},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"},{"id":"mfolfox6-leucovorin","drugId":"calcium-folinate","drugName":"Calcium folinate (Leucovorin)","dose":{"basis":"fixed","value":50,"unit":"mg"},"route":"IV","schedule":{"days":[1],"note":"IV bolus"},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"},{"id":"mfolfox6-5fu-bolus","drugId":"fluorouracil","drugName":"Fluorouracil — bolus","dose":{"basis":"bsa","value":400,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1],"note":"IV bolus"},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"},{"id":"mfolfox6-5fu-civ","drugId":"fluorouracil","drugName":"Fluorouracil — continuous infusion","dose":{"basis":"bsa","value":2400,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1],"continuousInfusionHours":46},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"}]}]},{"id":"BHH-HEME-RCHOP21-EVIQ70","version":"2.1.0","name":"R-CHOP21","cancerGroup":"Hematologic","indication":"B-cell lymphoma / DLBCL reference model","setting":"Systemic therapy","intent":"Protocol dependent","population":"adult","cycleIntervalDays":21,"cycleCount":6,"status":"published","localApproval":true,"effectiveDate":"2026-10-07","lastReviewed":"2026-10-07","references":[{"label":"eviQ ID 70 — R-CHOP21","url":"https://www.eviq.org.au/haematology/lymphoma/other-b-cell-lymphoma/70-r-chop21-rituximab-cyclophosphamide-doxorubici","accessedDate":"2026-10-07"}],"clinicalNotes":["Local approval recorded per project owner confirmation on 7 October 2026 for this six-regimen pilot registry.","The approved pilot uses prednisolone 100 mg once daily on days 1–5. Any prednisone/prednisolone substitution requires an explicit new protocol version.","Vincristine hard maximum is applied before operational rounding."],"phases":[{"id":"rchop-c1-6","name":"Cycles 1–6","cycleStart":1,"cycleEnd":6,"orders":[{"id":"rchop-rituximab","drugId":"rituximab","drugName":"Rituximab","dose":{"basis":"bsa","value":375,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1]},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"},{"id":"rchop-cyclophosphamide","drugId":"cyclophosphamide","drugName":"Cyclophosphamide","dose":{"basis":"bsa","value":750,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1]},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"},{"id":"rchop-doxorubicin","drugId":"doxorubicin","drugName":"Doxorubicin","dose":{"basis":"bsa","value":50,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1]},"roundingProfileId":"BHH_NEAREST_1MG_DEFAULT"},{"id":"rchop-vincristine","drugId":"vincristine","drugName":"Vincristine","dose":{"basis":"bsa","value":1.4,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1]},"roundingProfileId":"BHH_NEAREST_1MG_DEFAULT","clinicalRules":[{"type":"hard_max","value":2,"unit":"mg","reason":"Protocol cap dose at 2 mg."}]},{"id":"rchop-prednisolone","drugId":"prednisolone","drugName":"Prednisolone","dose":{"basis":"fixed","value":100,"unit":"mg"},"route":"PO","schedule":{"days":[1,2,3,4,5],"note":"once daily"},"roundingProfileId":"NO_ROUND"}]}]},{"id":"BHH-HODGKIN-ABVD-ADV-EVIQ56","version":"2.1.0","name":"ABVD — advanced stage reference","cancerGroup":"Hematologic","indication":"Advanced stage classical Hodgkin lymphoma reference model","setting":"Systemic therapy","intent":"Curative","population":"adult","cycleIntervalDays":28,"cycleCount":6,"status":"published","localApproval":true,"effectiveDate":"2026-10-07","lastReviewed":"2026-10-07","references":[{"label":"eviQ ID 56 — Advanced stage ABVD","url":"https://www.eviq.org.au/haematology/lymphoma/hodgkin-lymphoma/56-advanced-stage-abvd-doxorubicin-bleomycin-vinb","accessedDate":"2026-10-07"}],"clinicalNotes":["Local approval recorded per project owner confirmation on 7 October 2026 for this six-regimen pilot registry.","Bleomycin is modeled explicitly in International Units (IU); it is never silently converted to mg."],"phases":[{"id":"abvd-c1-6","name":"Cycles 1–6","cycleStart":1,"cycleEnd":6,"orders":[{"id":"abvd-doxorubicin","drugId":"doxorubicin","drugName":"Doxorubicin","dose":{"basis":"bsa","value":25,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1,15]},"roundingProfileId":"BHH_NEAREST_1MG_DEFAULT"},{"id":"abvd-bleomycin","drugId":"bleomycin","drugName":"Bleomycin","dose":{"basis":"bsa","value":10000,"unit":"IU","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1,15]},"notes":"International Units; no mg conversion is performed by the engine."},{"id":"abvd-vinblastine","drugId":"vinblastine","drugName":"Vinblastine","dose":{"basis":"bsa","value":6,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1,15]},"roundingProfileId":"BHH_NEAREST_1MG_DEFAULT"},{"id":"abvd-dacarbazine","drugId":"dacarbazine","drugName":"Dacarbazine","dose":{"basis":"bsa","value":375,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1,15],"infusionMinutes":60},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"}]}]},{"id":"BHH-TESTICULAR-BEP-MET-EVIQ320","version":"2.1.0","name":"BEP — metastatic testicular germ cell","cancerGroup":"Genitourinary","indication":"Metastatic testicular germ cell tumour — BEP reference model","setting":"Systemic therapy","intent":"Curative","population":"adult","cycleIntervalDays":21,"cycleCount":3,"status":"published","localApproval":true,"effectiveDate":"2026-10-07","lastReviewed":"2026-10-07","references":[{"label":"eviQ ID 320 — Metastatic BEP","url":"https://www.eviq.org.au/medical-oncology/urogenital/testicular/320-testicular-germ-cell-metastatic-bep-bleomycin","accessedDate":"2026-10-07"}],"clinicalNotes":["Local approval recorded per project owner confirmation on 7 October 2026 for this six-regimen pilot registry.","Reference states cisplatin and etoposide doses are calculated on actual BSA and should not be capped or modified solely because of high BSA, due to underdosing risk.","Good-risk disease is commonly 3 cycles; intermediate/poor-risk disease may require 4 cycles. This pilot entry is configured for 3 cycles and must be selected only when appropriate."],"phases":[{"id":"bep-c1-3","name":"Cycles 1–3","cycleStart":1,"cycleEnd":3,"orders":[{"id":"bep-bleomycin","drugId":"bleomycin","drugName":"Bleomycin","dose":{"basis":"fixed","value":30000,"unit":"IU"},"route":"IM/IV","schedule":{"days":[1,8,15]},"notes":"International Units."},{"id":"bep-cisplatin","drugId":"cisplatin","drugName":"Cisplatin","dose":{"basis":"bsa","value":20,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1,2,3,4,5]},"roundingProfileId":"BHH_NEAREST_1MG_DEFAULT"},{"id":"bep-etoposide","drugId":"etoposide","drugName":"Etoposide","dose":{"basis":"bsa","value":100,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1,2,3,4,5]},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"}]}]},{"id":"BHH-OVARIAN-CARBO-TAXOL-EVIQ252","version":"2.1.0","name":"Carboplatin + Paclitaxel — ovarian","cancerGroup":"Gynecologic","indication":"Advanced ovarian cancer — three-weekly Carboplatin/Paclitaxel reference model","setting":"Systemic therapy","intent":"Protocol dependent","population":"adult","cycleIntervalDays":21,"cycleCount":6,"status":"published","localApproval":true,"effectiveDate":"2026-10-07","lastReviewed":"2026-10-07","references":[{"label":"eviQ ID 252 — Ovarian advanced Carboplatin and Paclitaxel three weekly","url":"https://www.eviq.org.au/medical-oncology/gynaecological/ovarian/252-ovarian-advanced-carboplatin-and-paclitaxel-th","accessedDate":"2026-10-07"}],"clinicalNotes":["Local approval recorded per project owner confirmation on 7 October 2026 for this six-regimen pilot registry.","Carboplatin is represented as discrete approved options AUC 5 or AUC 6, not as a continuous 5–6 range. AUC 5 is the published default; AUC 6 remains an explicit clinical selection when appropriate under the approved protocol."],"phases":[{"id":"ov-carbo-taxol-c1-6","name":"Cycles 1–6","cycleStart":1,"cycleEnd":6,"orders":[{"id":"ov-paclitaxel","drugId":"paclitaxel","drugName":"Paclitaxel","dose":{"basis":"bsa","value":175,"unit":"mg","displayDenominator":"m²"},"route":"IV","schedule":{"days":[1]},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"},{"id":"ov-carboplatin","drugId":"carboplatin","drugName":"Carboplatin","dose":{"basis":"auc","options":[5,6],"defaultOption":5,"unit":"mg","displayDenominator":"AUC"},"route":"IV","schedule":{"days":[1]},"roundingProfileId":"BHH_NEAREST_10MG_DEFAULT"}]}]}];
const BHH_ROUNDING_DEFAULTS = [{"id":"BHH_NEAREST_10MG_DEFAULT","label":"BHH default · nearest 10 mg","method":"nearest_half_up","increment":10,"unit":"mg","maxPercentDifference":5,"maxAbsoluteDifference":10,"notes":"Published default operational profile. Editable in the Rounding Policy screen as a browser-local override; export JSON for governed central publication."},{"id":"BHH_NEAREST_1MG_DEFAULT","label":"BHH default · nearest 1 mg","method":"nearest_half_up","increment":1,"unit":"mg","maxPercentDifference":5,"maxAbsoluteDifference":1,"notes":"Published default low-dose profile. Editable in the Rounding Policy screen as a browser-local override; export JSON for governed central publication."},{"id":"NO_ROUND","label":"No operational rounding","method":"none","increment":1,"unit":"mg","maxPercentDifference":0,"notes":"Locked no-rounding profile."}];
const BHH_LEGACY_REGIMENS = [{"ชื่อสูตรยา":"Pembrolizumab + Pemetrexed + Platinum regimen","ชนิดของมะเร็ง":"มะเร็งปอดชนิดไม่ใช่เซลล์เล็ก (Non-Squamous NSCLC)","รอบการรักษา":"4 cycles induction, followed by maintenance","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Pemetrexed","ขนาดยา":"500 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5-6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"}]},{"ชื่อสูตรยา":"Pembrolizumab + Paclitaxel + Carboplatin regimen","ชนิดของมะเร็ง":"มะเร็งปอดชนิดไม่ใช่เซลล์เล็ก (Squamous NSCLC)","รอบการรักษา":"4 cycles induction, followed by maintenance","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Paclitaxel","ขนาดยา":"200 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"}]},{"ชื่อสูตรยา":"Pembrolizumab + Platinum + Fluorouracil regimen","ชนิดของมะเร็ง":"มะเร็งหลอดอาหาร (Esophageal Squamous Cell Carcinoma)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"80-100 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"1000 mg/m² IV continuous days 1-4","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + Paclitaxel + Cisplatin ± Bevacizumab regimen","ชนิดของมะเร็ง":"มะเร็งปากมดลูก (Cervical Cancer)","รอบการรักษา":"Up to 35 cycles","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Paclitaxel","ขนาดยา":"175 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Bevacizumab","ขนาดยา":"15 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + Nab-Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม Triple-Negative (TNBC)","รอบการรักษา":"Up to 35 cycles","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Nab-Paclitaxel","ขนาดยา":"100 mg/m² IV days 1,8,15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + Pemetrexed + Platinum regimen","ชนิดของมะเร็ง":"มะเร็งเยื่อหุ้มปอด (Malignant Pleural Mesothelioma)","รอบการรักษา":"Up to 6 cycles induction, followed by maintenance","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Pemetrexed","ขนาดยา":"500 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + CAPOX regimen","ชนิดของมะเร็ง":"มะเร็งกระเพาะอาหาร (Gastroesophageal Adenocarcinoma)","รอบการรักษา":"4 cycles induction","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"400 mg IV day 1","ความถี่ในการให้":"ทุก 42 วัน","maximum_dose":null},{"ชื่อยา":"Capecitabine","ขนาดยา":"1000–1250 mg/m² PO BID days 1-14","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"PO","frequency":"BID","days":"1-14","dose_range_mg_per_m2":{"min":1000,"max":1250},"default_mg_per_m2":1000,"rounding":{"tablet_strengths_mg":[150,500],"policy":"nearest_150","max_overfill_pct":5}}},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"130 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + mFOLFOX6 regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (MSI-H/dMMR Colorectal Cancer)","รอบการรักษา":"Up to 2 years","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"85 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Pembrolizumab + Docetaxel regimen","ชนิดของมะเร็ง":"มะเร็งปอดชนิดไม่ใช่เซลล์เล็ก (NSCLC after CPI)","รอบการรักษา":"Up to progression","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Docetaxel","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Bevacizumab + Carboplatin + Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งปอดชนิดไม่ใช่เซลล์เล็ก (Non-Squamous NSCLC)","รอบการรักษา":"4-6 cycles, followed by maintenance","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"15 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Paclitaxel","ขนาดยา":"200 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Bevacizumab + Carboplatin + Gemcitabine regimen","ชนิดของมะเร็ง":"มะเร็งรังไข่ (Recurrent Platinum-Sensitive Ovarian Cancer)","รอบการรักษา":"6 cycles, followed by maintenance","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"15 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Bevacizumab + Paclitaxel + Cisplatin regimen","ชนิดของมะเร็ง":"มะเร็งปากมดลูก (Persistent/Recurrent Cervical Cancer)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"15 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Paclitaxel","ขนาดยา":"175 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Bevacizumab + Trifluridine-Tipiracil regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (Refractory Colorectal Cancer)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"5 mg/kg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Trifluridine-Tipiracil","ขนาดยา":"35 mg/m² PO BID days 1-5 and 8-12","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Bevacizumab + Cisplatin + Capecitabine regimen","ชนิดของมะเร็ง":"มะเร็งกระเพาะอาหาร (Gastric Cancer)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"7.5 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"80 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Capecitabine","ขนาดยา":"1000–1250 mg/m² PO BID days 1-14","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"PO","frequency":"BID","days":"1-14","dose_range_mg_per_m2":{"min":1000,"max":1250},"default_mg_per_m2":1000,"rounding":{"tablet_strengths_mg":[150,500],"policy":"nearest_150","max_overfill_pct":5}}}]},{"ชื่อสูตรยา":"Bevacizumab + FOLFOX regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (Metastatic Colorectal Cancer)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"5 mg/kg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"85 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Bevacizumab + FOLFIRI regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (Metastatic Colorectal Cancer)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"5 mg/kg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Irinotecan","ขนาดยา":"180 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Bevacizumab + Carboplatin + Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งรังไข่ (Advanced Ovarian Cancer)","รอบการรักษา":"6 cycles, followed by maintenance","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"15 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5-6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Paclitaxel","ขนาดยา":"175 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Nivolumab + Platinum + Fluoropyrimidine regimen","ชนิดของมะเร็ง":"มะเร็งหลอดอาหาร (Esophageal Squamous Cell Carcinoma)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"240 mg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"80 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"800 mg/m² IV continuous days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Nivolumab + Platinum + Fluoropyrimidine regimen","ชนิดของมะเร็ง":"มะเร็งกระเพาะอาหาร (Gastric Cancer)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"360 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"85 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"800 mg/m² IV continuous days 1-5","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Nivolumab + Etoposide + Platinum regimen","ชนิดของมะเร็ง":"มะเร็งปอดชนิดเซลล์เล็ก (Extensive-Stage SCLC)","รอบการรักษา":"4 cycles","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"360 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Etoposide","ขนาดยา":"100 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5-6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"}]},{"ชื่อสูตรยา":"Nivolumab + AVD regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง Hodgkin (Advanced Hodgkin Lymphoma)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"240 mg IV day 1 and 15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"25 mg/m² IV day 1 and 15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Vinblastine","ขนาดยา":"6 mg/m² IV day 1 and 15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Dacarbazine","ขนาดยา":"375 mg/m² IV day 1 and 15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Nivolumab + Platinum-Doublet regimen","ชนิดของมะเร็ง":"มะเร็งปอดชนิดไม่ใช่เซลล์เล็ก (Resectable NSCLC)","รอบการรักษา":"4 cycles neoadjuvant, followed by adjuvant","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"360 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Pemetrexed","ขนาดยา":"500 mg/m² IV day 1 (non-squamous)","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Nivolumab + Cisplatin + Gemcitabine regimen","ชนิดของมะเร็ง":"มะเร็งถุงน้ำดี (Biliary Tract Cancer)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"240 mg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"25 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Nivolumab + Ipilimumab regimen (with chemo if needed)","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (MSI-H/dMMR mCRC)","รอบการรักษา":"Up to 2 years","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"3 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Ipilimumab","ขนาดยา":"1 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + Bevacizumab + Carboplatin + Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งปอดชนิดไม่ใช่เซลล์เล็ก (Non-Squamous NSCLC)","รอบการรักษา":"4 cycles, followed by maintenance","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"1200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Bevacizumab","ขนาดยา":"15 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Paclitaxel","ขนาดยา":"200 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + Carboplatin + Nab-Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งปอดชนิดไม่ใช่เซลล์เล็ก (Non-Squamous NSCLC)","รอบการรักษา":"4 cycles, followed by maintenance","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"1200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Nab-Paclitaxel","ขนาดยา":"100 mg/m² IV day 1,8,15","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + Carboplatin + Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งปอดชนิดเซลล์เล็ก (Extensive-Stage SCLC)","รอบการรักษา":"4 cycles, followed by maintenance","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"1200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Etoposide","ขนาดยา":"100 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + Bevacizumab regimen","ชนิดของมะเร็ง":"มะเร็งตับ (Hepatocellular Carcinoma)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"1200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Bevacizumab","ขนาดยา":"15 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + Nab-Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม Triple-Negative (PD-L1+ TNBC)","รอบการรักษา":"Up to 35 cycles","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"840 mg IV day 1,15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Nab-Paclitaxel","ขนาดยา":"100 mg/m² IV days 1,8,15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + mFOLFOX6 regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (dMMR Stage III Colon Cancer)","รอบการรักษา":"12 cycles","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"840 mg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"85 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Atezolizumab + Lurbinectin regimen","ชนิดของมะเร็ง":"มะเร็งปอดชนิดเซลล์เล็ก (ES-SCLC Maintenance)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"1200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Lurbinectin","ขนาดยา":"3.2 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Cetuximab + FOLFIRI regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (KRAS Wild-Type mCRC)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Cetuximab","ขนาดยา":"400 mg/m² IV loading, then 250 mg/m² weekly","ความถี่ในการให้":"ทุก 7 วัน","maximum_dose":null},{"ชื่อยา":"Irinotecan","ขนาดยา":"180 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Cetuximab + FOLFOX regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (KRAS Wild-Type mCRC)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Cetuximab","ขนาดยา":"500 mg/m² IV every 2 weeks","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"85 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Cetuximab + Encorafenib + mFOLFOX6 regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (BRAF V600E mCRC)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Cetuximab","ขนาดยา":"400 mg/m² IV loading, then 250 mg/m² weekly","ความถี่ในการให้":"ทุก 7 วัน","maximum_dose":null},{"ชื่อยา":"Encorafenib","ขนาดยา":"300 mg PO daily","ความถี่ในการให้":"daily","maximum_dose":null},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"85 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Cetuximab + Irinotecan regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (Refractory mCRC)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Cetuximab","ขนาดยา":"400 mg/m² IV loading, then 250 mg/m² weekly","ความถี่ในการให้":"ทุก 7 วัน","maximum_dose":null},{"ชื่อยา":"Irinotecan","ขนาดยา":"350 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Cetuximab + Paclitaxel + Carboplatin regimen","ชนิดของมะเร็ง":"มะเร็งคอหูจมูก (Head and Neck Squamous Cell Carcinoma)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Cetuximab","ขนาดยา":"400 mg/m² IV loading, then 250 mg/m² weekly","ความถี่ในการให้":"ทุก 7 วัน","maximum_dose":null},{"ชื่อยา":"Paclitaxel","ขนาดยา":"135 mg/m² IV day 1","ความถี่ในการให้":"ทุก 7 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 2 IV day 1","ความถี่ในการให้":"ทุก 7 วัน","maximum_dose":"900 mg"}]},{"ชื่อสูตรยา":"Cetuximab + Docetaxel + Cisplatin + Fluorouracil regimen","ชนิดของมะเร็ง":"มะเร็งคอหูจมูก (Locally Advanced HNSCC)","รอบการรักษา":"3 cycles","รายการยา":[{"ชื่อยา":"Cetuximab","ขนาดยา":"400 mg/m² IV loading, then 250 mg/m² weekly","ความถี่ในการให้":"ทุก 7 วัน","maximum_dose":null},{"ชื่อยา":"Docetaxel","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"100 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"700 mg/m²/day IV continuous days 1-4","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-CHOP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง Non-Hodgkin (DLBCL)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"750 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Vincristine","ขนาดยา":"1.4 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"2 mg"},{"ชื่อยา":"Prednisone","ขนาดยา":"100 mg PO days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-CVP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง Follicular (FL)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"750 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Vincristine","ขนาดยา":"1.4 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"2 mg"},{"ชื่อยา":"Prednisone","ขนาดยา":"100 mg PO days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"BR regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง Follicular (Indolent NHL)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Bendamustine","ขนาดยา":"90 mg/m² IV days 1-2","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-ICE regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Relapsed NHL)","รอบการรักษา":"2-3 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Ifosfamide","ขนาดยา":"1500 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Etoposide","ขนาดยา":"100 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-DHAP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Relapsed DLBCL)","รอบการรักษา":"4 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Dexamethasone","ขนาดยา":"40 mg PO/IV days 1-4","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"100 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cytarabine","ขนาดยา":"2 g/m² IV every 12h day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-GemOx regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Relapsed/Refractory NHL)","รอบการรักษา":"4-6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"100 mg/m² IV day 2","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-FCM regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Mantle Cell Lymphoma)","รอบการรักษา":"4 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Fludarabine","ขนาดยา":"25 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"250 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Mitoxantrone","ขนาดยา":"10 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-BAC regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Waldenstrom Macroglobulinemia)","รอบการรักษา":"4-6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Bendamustine","ขนาดยา":"90 mg/m² IV days 1-2","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"600 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-CHOP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง Burkitt (Pediatric B-Cell Lymphoma)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"750 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Vincristine","ขนาดยา":"1.4 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"2 mg"},{"ชื่อยา":"Prednisone","ขนาดยา":"100 mg PO days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-DA-EPOCH regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (PMBL/MGZL)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Etoposide","ขนาดยา":"50 mg/m²/day IV continuous days 1-4","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Prednisone","ขนาดยา":"60 mg/m²/day PO days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Vincristine","ขนาดยา":"0.4 mg/m²/day IV continuous days 1-4","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"750 mg/m² IV day 5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"10 mg/m²/day IV continuous days 1-4","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-CODOX-M/IVAC regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง Burkitt (High-Risk)","รอบการรักษา":"Alternating cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"per cycle","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"800 mg/m² IV days 1-2","ความถี่ในการให้":"R-CODOX-M","maximum_dose":null},{"ชื่อยา":"Vincristine","ขนาดยา":"1.5 mg/m² IV days 1,8","ความถี่ในการให้":"R-CODOX-M","maximum_dose":"2 mg"},{"ชื่อยา":"Doxorubicin","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"R-CODOX-M","maximum_dose":null},{"ชื่อยา":"Methotrexate","ขนาดยา":"3 g/m² IV day 10","ความถี่ในการให้":"R-CODOX-M","maximum_dose":null},{"ชื่อยา":"Ifosfamide","ขนาดยา":"1500 mg/m² IV days 1-5","ความถี่ในการให้":"IVAC","maximum_dose":null},{"ชื่อยา":"Etoposide","ขนาดยา":"60 mg/m² IV days 1-5","ความถี่ในการให้":"IVAC","maximum_dose":null},{"ชื่อยา":"Cytarabine","ขนาดยา":"2 g/m² IV BID days 1-5","ความถี่ในการให้":"IVAC","maximum_dose":null}]},{"ชื่อสูตรยา":"R-HCVAD regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Lymphoblastic Lymphoma)","รอบการรักษา":"Alternating cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"per cycle","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"300 mg/m² IV every 12h days 1-3","ความถี่ในการให้":"odd cycles","maximum_dose":null},{"ชื่อยา":"Vincristine","ขนาดยา":"2 mg IV days 4-5","ความถี่ในการให้":"odd cycles","maximum_dose":"2 mg"},{"ชื่อยา":"Doxorubicin","ขนาดยา":"50 mg/m² IV day 4","ความถี่ในการให้":"odd cycles","maximum_dose":null},{"ชื่อยา":"Dexamethasone","ขนาดยา":"40 mg PO/IV days 1-4 and 11-14","ความถี่ในการให้":"odd cycles","maximum_dose":null},{"ชื่อยา":"Methotrexate","ขนาดยา":"1000 mg/m² IV day 1","ความถี่ในการให้":"even cycles","maximum_dose":null},{"ชื่อยา":"Cytarabine","ขนาดยา":"70 mg/m² IT day 2,7","ความถี่ในการให้":"even cycles","maximum_dose":null}]},{"ชื่อสูตรยา":"R-BEAM regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Autologous Transplant Conditioning)","รอบการรักษา":"1 cycle","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day -13 and -6","ความถี่ในการให้":"pre-transplant","maximum_dose":null},{"ชื่อยา":"Carmustine","ขนาดยา":"300 mg/m² IV day -6","ความถี่ในการให้":"day -6","maximum_dose":null},{"ชื่อยา":"Etoposide","ขนาดยา":"200 mg/m² IV days -5 to -2","ความถี่ในการให้":"days -5 to -2","maximum_dose":null},{"ชื่อยา":"Cytarabine","ขนาดยา":"400 mg/m² IV BID days -5 to -2","ความถี่ในการให้":"days -5 to -2","maximum_dose":null},{"ชื่อยา":"Melphalan","ขนาดยา":"140 mg/m² IV day -1","ความถี่ในการให้":"day -1","maximum_dose":null}]},{"ชื่อสูตรยา":"R-FND regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Marginal Zone Lymphoma)","รอบการรักษา":"4 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"250 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Fludarabine","ขนาดยา":"25 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Mitoxantrone","ขนาดยา":"8 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Dexamethasone","ขนาดยา":"20 mg PO days 1-5","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-GemVin regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Relapsed CLL)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV day 1,8,15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Vinorelbine","ขนาดยา":"25 mg/m² IV day 1,8,15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-CP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง CLL (Untreated CLL)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"1000 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Prednisone","ขนาดยา":"100 mg PO days 1-5","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-FC regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง CLL (Relapsed CLL)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Fludarabine","ขนาดยา":"25 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"250 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"R-B regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง CLL (Previously Untreated CLL)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Bendamustine","ขนาดยา":"90 mg/m² IV days 1-2","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"FOLFOX-4 regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (Colorectal Cancer)","รอบการรักษา":"12 รอบการรักษา","รายการยา":[{"ชื่อยา":"Oxaliplatin","ขนาดยา":"85 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"200 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil (5-FU) bolus","ขนาดยา":"400 mg/m² IV bolus day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil (5-FU) continuous infusion","ขนาดยา":"600 mg/m² IV over 22h day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"TCH regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม HER2-positive (HER2-positive Breast Cancer)","รอบการรักษา":"6 cycles combined chemotherapy, followed by trastuzumab alone to complete 1 year","รายการยา":[{"ชื่อยา":"Docetaxel","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน (6 cycles)","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 6 mg/ml/min IV day 1","ความถี่ในการให้":"ทุก 21 วัน (6 cycles)","maximum_dose":"900 mg"},{"ชื่อยา":"Trastuzumab (loading dose)","ขนาดยา":"8 mg/kg IV day 1","ความถี่ในการให้":"cycle 1 เท่านั้น","maximum_dose":null},{"ชื่อยา":"Trastuzumab (maintenance)","ขนาดยา":"6 mg/kg IV","ความถี่ในการให้":"ทุก 21 วัน (total 1 year, about 18 cycles)","maximum_dose":null}]},{"ชื่อสูตรยา":"FOLFIRI regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (Colorectal Cancer)","รอบการรักษา":"12 รอบการรักษา","รายการยา":[{"ชื่อยา":"Irinotecan","ขนาดยา":"180 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil (5-FU) bolus","ขนาดยา":"400 mg/m² IV bolus day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil (5-FU) continuous infusion","ขนาดยา":"2400 mg/m² IV over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"AC-T regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม (Breast Cancer)","รอบการรักษา":"4 cycles AC followed by 4 cycles T","รายการยา":[{"ชื่อยา":"Doxorubicin","ขนาดยา":"60 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"600 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Paclitaxel","ขนาดยา":"175 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"CMF regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม (Breast Cancer)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"100 mg/m² PO days 1-14","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Methotrexate","ขนาดยา":"40 mg/m² IV days 1 and 8","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"600 mg/m² IV days 1 and 8","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"ABVD regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง Hodgkin (Hodgkin Lymphoma)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Doxorubicin","ขนาดยา":"25 mg/m² IV day 1 and 15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Bleomycin","ขนาดยา":"10 units/m² IV day 1 and 15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Vinblastine","ขนาดยา":"6 mg/m² IV day 1 and 15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Dacarbazine","ขนาดยา":"375 mg/m² IV day 1 and 15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"7+3 regimen","ชนิดของมะเร็ง":"มะเร็งเม็ดเลือดขาวเฉียบพลัน (Acute Myeloid Leukemia)","รอบการรักษา":"1-2 cycles induction, followed by consolidation","รายการยา":[{"ชื่อยา":"Cytarabine","ขนาดยา":"100-200 mg/m² IV continuous infusion days 1-7","ความถี่ในการให้":"induction cycle","maximum_dose":null},{"ชื่อยา":"Daunorubicin","ขนาดยา":"60-90 mg/m² IV days 1-3","ความถี่ในการให้":"induction cycle","maximum_dose":null}]},{"ชื่อสูตรยา":"EP regimen","ชนิดของมะเร็ง":"มะเร็งปอด (Lung Cancer)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Etoposide","ขนาดยา":"100 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"80 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Carboplatin-Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งปอด (Non-Small Cell Lung Cancer)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Paclitaxel","ขนาดยา":"200 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Carboplatin-Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งรังไข่ (Ovarian Cancer)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5-6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Paclitaxel","ขนาดยา":"175 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"CHOP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง Non-Hodgkin (Non-Hodgkin Lymphoma)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"750 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Vincristine","ขนาดยา":"1.4 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"2 mg"},{"ชื่อยา":"Prednisone","ขนาดยา":"100 mg PO days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"FAC regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม (Breast Cancer)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Fluorouracil","ขนาดยา":"500 mg/m² IV days 1 and 8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"500 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"TC regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม (Breast Cancer)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Docetaxel","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"600 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"CVP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง Non-Hodgkin (Non-Hodgkin Lymphoma)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"750 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Vincristine","ขนาดยา":"1.4 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"2 mg"},{"ชื่อยา":"Prednisone","ขนาดยา":"100 mg PO days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"ICE regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Lymphoma Relapse)","รอบการรักษา":"2-3 รอบการรักษา","รายการยา":[{"ชื่อยา":"Ifosfamide","ขนาดยา":"1500 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Etoposide","ขนาดยา":"100 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Hyper-CVAD regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Lymphoblastic Lymphoma)","รอบการรักษา":"4-8 cycles alternating","รายการยา":[{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"300 mg/m² IV every 12h days 1-3","ความถี่ในการให้":"odd cycles","maximum_dose":null},{"ชื่อยา":"Vincristine","ขนาดยา":"2 mg IV days 4-5","ความถี่ในการให้":"odd cycles","maximum_dose":"2 mg"},{"ชื่อยา":"Doxorubicin","ขนาดยา":"50 mg/m² IV day 4","ความถี่ในการให้":"odd cycles","maximum_dose":null},{"ชื่อยา":"Dexamethasone","ขนาดยา":"40 mg PO/IV days 1-4 and 11-14","ความถี่ในการให้":"odd cycles","maximum_dose":null},{"ชื่อยา":"Methotrexate","ขนาดยา":"1000 mg/m² IV day 1","ความถี่ในการให้":"even cycles","maximum_dose":null},{"ชื่อยา":"Cytarabine","ขนาดยา":"70 mg/m² IT day 2,7","ความถี่ในการให้":"even cycles","maximum_dose":null}]},{"ชื่อสูตรยา":"BEP regimen","ชนิดของมะเร็ง":"มะเร็งอัณฑะ (Testicular Cancer)","รอบการรักษา":"3-4 รอบการรักษา","รายการยา":[{"ชื่อยา":"Bleomycin","ขนาดยา":"30 units IV days 1,8,15","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Etoposide","ขนาดยา":"100 mg/m² IV days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"20 mg/m² IV days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Gemcitabine-Cisplatin regimen","ชนิดของมะเร็ง":"มะเร็งถุงน้ำดี (Biliary Tract Cancer)","รอบการรักษา":"6-8 รอบการรักษา","รายการยา":[{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV days 1 and 8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"25 mg/m² IV days 1 and 8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"FL regimen","ชนิดของมะเร็ง":"มะเร็งกระเพาะอาหาร (Gastric Cancer)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Fluorouracil","ขนาดยา":"800 mg/m² IV continuous infusion days 1-5","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"20 mg/m² IV days 1-5","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"ECF regimen","ชนิดของมะเร็ง":"มะเร็งกระเพาะอาหาร (Gastric Cancer)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Epirubicin","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"60 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"200 mg/m² IV continuous infusion days 1-21","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Doxorubicin-Bleomycin regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Hodgkin Lymphoma)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Doxorubicin","ขนาดยา":"25 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Bleomycin","ขนาดยา":"10 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"MOPP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Hodgkin Lymphoma)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Mechlorethamine","ขนาดยา":"6 mg/m² IV day 1 and 8","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Vincristine","ขนาดยา":"1.4 mg/m² IV day 1 and 8","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":"2 mg"},{"ชื่อยา":"Procarbazine","ขนาดยา":"100 mg/m² PO days 1-10","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Prednisone","ขนาดยา":"40 mg/m² PO days 1-14","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"BEACOPP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Advanced Hodgkin Lymphoma)","รอบการรักษา":"6-8 รอบการรักษา","รายการยา":[{"ชื่อยา":"Bleomycin","ขนาดยา":"10 mg/m² IV day 8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Etoposide","ขนาดยา":"190 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Adriamycin (Doxorubicin)","ขนาดยา":"35 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"650 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Oncovin (Vincristine)","ขนาดยา":"1.4 mg/m² IV day 8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"2 mg"},{"ชื่อยา":"Procarbazine","ขนาดยา":"100 mg/m² PO days 1-7","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Prednisone","ขนาดยา":"40 mg/m² PO days 1-14","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"DHAP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Lymphoma Relapse)","รอบการรักษา":"4 รอบการรักษา","รายการยา":[{"ชื่อยา":"Dexamethasone","ขนาดยา":"40 mg PO/IV days 1-4","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"100 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cytarabine","ขนาดยา":"2 g/m² IV every 12h day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"ESHAP regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Non-Hodgkin Lymphoma)","รอบการรักษา":"4 รอบการรักษา","รายการยา":[{"ชื่อยา":"Etoposide","ขนาดยา":"40 mg/m² IV days 1-4","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Methylprednisolone","ขนาดยา":"500 mg IV days 1-4","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cytarabine","ขนาดยา":"2 g/m² IV day 4","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"25 mg/m² IV days 1-4","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"IMVP-16 regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Hodgkin Lymphoma)","รอบการรักษา":"4 รอบการรักษา","รายการยา":[{"ชื่อยา":"Ifosfamide","ขนาดยา":"1200 mg/m² IV days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Methotrexate","ขนาดยา":"30 mg/m² IV days 1,3,5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Etoposide","ขนาดยา":"100 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Prednisone","ขนาดยา":"50 mg PO days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Stanford V regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Hodgkin Lymphoma)","รอบการรักษา":"12 สัปดาห์","รายการยา":[{"ชื่อยา":"Doxorubicin","ขนาดยา":"25 mg/m² IV weeks 1,3,5,7,9,11","ความถี่ในการให้":"ตาม schedule","maximum_dose":null},{"ชื่อยา":"Vinblastine","ขนาดยา":"6 mg/m² IV weeks 1,3,5,7,9,11","ความถี่ในการให้":"ตาม schedule","maximum_dose":null},{"ชื่อยา":"Mechlorethamine","ขนาดยา":"6 mg/m² IV weeks 1,5,9","ความถี่ในการให้":"ตาม schedule","maximum_dose":null},{"ชื่อยา":"Etoposide","ขนาดยา":"60 mg/m² IV weeks 3,7,11","ความถี่ในการให้":"ตาม schedule","maximum_dose":null},{"ชื่อยา":"Prednisone","ขนาดยา":"40 mg PO even weeks","ความถี่ในการให้":"ตาม schedule","maximum_dose":null},{"ชื่อยา":"Bleomycin","ขนาดยา":"5 units/m² IV weeks 2,6,10","ความถี่ในการให้":"ตาม schedule","maximum_dose":null}]},{"ชื่อสูตรยา":"etoposide-Cisplatin regimen","ชนิดของมะเร็ง":"มะเร็งปอด (Small Cell Lung Cancer)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Etoposide","ขนาดยา":"100 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"80 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Carboplatin-Etoposide regimen","ชนิดของมะเร็ง":"มะเร็งปอด (Small Cell Lung Cancer)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5-6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Etoposide","ขนาดยา":"100 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pemetrexed-Cisplatin regimen","ชนิดของมะเร็ง":"มะเร็งปอด (Non-Squamous NSCLC)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Pemetrexed","ขนาดยา":"500 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Cisplatin-Gemcitabine regimen","ชนิดของมะเร็ง":"มะเร็งปอด (NSCLC)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Cisplatin","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1250 mg/m² IV days 1 and 8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Docetaxel-Cisplatin regimen","ชนิดของมะเร็ง":"มะเร็งปอด (NSCLC)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Docetaxel","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Cisplatin-5FU regimen","ชนิดของมะเร็ง":"มะเร็งหลอดอาหาร (Esophageal Cancer)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Cisplatin","ขนาดยา":"100 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"1000 mg/m² IV continuous infusion days 1-4","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"FOLFOX regimen","ชนิดของมะเร็ง":"มะเร็งหลอดอาหาร (Esophageal Cancer)","รอบการรักษา":"6-12 รอบการรักษา","รายการยา":[{"ชื่อยา":"Oxaliplatin","ขนาดยา":"85 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Carboplatin-Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งปากมดลูก (Cervical Cancer)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Paclitaxel","ขนาดยา":"135 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Cisplatin regimen","ชนิดของมะเร็ง":"มะเร็งปากมดลูก (Cervical Cancer)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Cisplatin","ขนาดยา":"40 mg/m² IV weekly","ความถี่ในการให้":"weekly","maximum_dose":null}]},{"ชื่อสูตรยา":"Doxorubicin-Dacarbazine regimen","ชนิดของมะเร็ง":"มะเร็งซอฟต์ทิชู (Soft Tissue Sarcoma)","รอบการรักษา":"6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Doxorubicin","ขนาดยา":"60 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Dacarbazine","ขนาดยา":"750 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Ifosfamide-Doxorubicin regimen","ชนิดของมะเร็ง":"มะเร็งซอฟต์ทิชู (Soft Tissue Sarcoma)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Ifosfamide","ขนาดยา":"2500 mg/m² IV days 1-4","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"20 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Methotrexate-Leucovorin regimen","ชนิดของมะเร็ง":"มะเร็งโพรงจมูก-คอ (Head and Neck Cancer)","รอบการรักษา":"Induction, then maintenance","รายการยา":[{"ชื่อยา":"Methotrexate","ขนาดยา":"40 mg/m² IV weekly","ความถี่ในการให้":"weekly","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"5 mg PO q6h x 6 doses","ความถี่ในการให้":"after Methotrexate","maximum_dose":null}]},{"ชื่อสูตรยา":"Cisplatin-5FU regimen","ชนิดของมะเร็ง":"มะเร็งโพรงจมูก-คอ (Head and Neck Cancer)","รอบการรักษา":"3-4 รอบการรักษา","รายการยา":[{"ชื่อยา":"Cisplatin","ขนาดยา":"100 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"1000 mg/m² IV continuous days 1-4","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Cisplatin-Topotecan regimen","ชนิดของมะเร็ง":"มะเร็งรังไข่ (Ovarian Cancer Relapse)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Cisplatin","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Topotecan","ขนาดยา":"0.75 mg/m² IV days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Liposomal Doxorubicin regimen","ชนิดของมะเร็ง":"มะเร็งรังไข่ (Ovarian Cancer Relapse)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Doxorubicin (liposomal)","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Bleomycin-Vinblastine-Cisplatin regimen","ชนิดของมะเร็ง":"มะเร็งอัณฑะ (Testicular Cancer)","รอบการรักษา":"3 รอบการรักษา","รายการยา":[{"ชื่อยา":"Bleomycin","ขนาดยา":"30 units IV days 2,9,16","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Vinblastine","ขนาดยา":"0.15 mg/kg IV days 2 and 16","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"20 mg/m² IV days 2-6","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"VIP regimen","ชนิดของมะเร็ง":"มะเร็งอัณฑะ (Testicular Cancer Relapse)","รอบการรักษา":"2 รอบการรักษา","รายการยา":[{"ชื่อยา":"Vinblastine","ขนาดยา":"0.11 mg/kg IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Ifosfamide","ขนาดยา":"1200 mg/m² IV days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"20 mg/m² IV days 1-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"TIP regimen","ชนิดของมะเร็ง":"มะเร็งอัณฑะ (Testicular Cancer Relapse)","รอบการรักษา":"2 รอบการรักษา","รายการยา":[{"ชื่อยา":"Paclitaxel","ขนาดยา":"250 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Ifosfamide","ขนาดยา":"1500 mg/m² IV days 2-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"25 mg/m² IV days 2-5","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"CISCA regimen","ชนิดของมะเร็ง":"มะเร็งกระเพาะปัสสาวะ (Bladder Cancer)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Cisplatin","ขนาดยา":"100 mg/m² IV day 2","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"50 mg/m² IV day 2","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"650 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"MVAC regimen","ชนิดของมะเร็ง":"มะเร็งกระเพาะปัสสาวะ (Bladder Cancer)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Methotrexate","ขนาดยา":"30 mg/m² IV days 1,15,22","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Vinblastine","ขนาดยา":"3 mg/m² IV days 2,15,22","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"30 mg/m² IV day 2","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"70 mg/m² IV day 2","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Gemcitabine-Cisplatin regimen","ชนิดของมะเร็ง":"มะเร็งกระเพาะปัสสาวะ (Bladder Cancer)","รอบการรักษา":"4-6 รอบการรักษา","รายการยา":[{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV days 1,8,15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"70 mg/m² IV day 2","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + Docetaxel + Carboplatin regimen","ชนิดของมะเร็ง":"มะเร็งปอด (NSCLC)","รอบการรักษา":"4-6 cycles","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Docetaxel","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"}]},{"ชื่อสูตรยา":"Bevacizumab + Cisplatin + Gemcitabine regimen","ชนิดของมะเร็ง":"มะเร็งปอด (NSCLC)","รอบการรักษา":"4-6 cycles","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"15 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1250 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Nivolumab + Gemcitabine + Cisplatin regimen","ชนิดของมะเร็ง":"มะเร็งปอด (NSCLC)","รอบการรักษา":"4-6 cycles","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"360 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"75 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + Carboplatin + Etoposide regimen","ชนิดของมะเร็ง":"มะเร็งปอด (SCLC)","รอบการรักษา":"4 cycles","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"1200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"},{"ชื่อยา":"Etoposide","ขนาดยา":"100 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Cetuximab + Irinotecan + Fluorouracil regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (mCRC)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Cetuximab","ขนาดยา":"500 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Irinotecan","ขนาดยา":"180 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Rituximab + Fludarabine + Cyclophosphamide regimen","ชนิดของมะเร็ง":"มะเร็งเม็ดเลือดขาว CLL (Untreated CLL)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Fludarabine","ขนาดยา":"25 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"250 mg/m² IV days 1-3","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + Gemcitabine regimen","ชนิดของมะเร็ง":"มะเร็งปอด (NSCLC after CPI)","รอบการรักษา":"Up to progression","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV day 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Bevacizumab + Oxaliplatin + Capecitabine regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (mCRC)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"7.5 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"130 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Capecitabine","ขนาดยา":"850 mg/m² PO BID days 1-14","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"PO","frequency":"BID","days":"1-14","dose_mg_per_m2":850,"rounding":{"tablet_strengths_mg":[150,500],"policy":"nearest_150","max_overfill_pct":5}}}]},{"ชื่อสูตรยา":"Nivolumab + Pemetrexed + Carboplatin regimen","ชนิดของมะเร็ง":"มะเร็งปอด (Non-Squamous NSCLC)","รอบการรักษา":"4 cycles","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"360 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Pemetrexed","ขนาดยา":"500 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 5 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"}]},{"ชื่อสูตรยา":"Atezolizumab + Paclitaxel + Carboplatin regimen","ชนิดของมะเร็ง":"มะเร็งปอด (Squamous NSCLC)","รอบการรักษา":"4 cycles","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"1200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Paclitaxel","ขนาดยา":"200 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Carboplatin","ขนาดยา":"AUC 6 IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":"900 mg"}]},{"ชื่อสูตรยา":"Cetuximab + Encorafenib regimen (with FOLFIRI if needed)","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (BRAF V600E mCRC)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Cetuximab","ขนาดยา":"400 mg/m² IV loading, then 250 mg/m² weekly","ความถี่ในการให้":"ทุก 7 วัน","maximum_dose":null},{"ชื่อยา":"Encorafenib","ขนาดยา":"300 mg PO daily","ความถี่ในการให้":"daily","maximum_dose":null},{"ชื่อยา":"Irinotecan","ขนาดยา":"180 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Rituximab + Lenalidomide regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (FL Grade 1-2)","รอบการรักษา":"12 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1 cycle 1, then weekly x4 cycle 1, day 1 cycles 2-5","ความถี่ในการให้":"per cycle","maximum_dose":null},{"ชื่อยา":"Lenalidomide","ขนาดยา":"20 mg PO days 1-21","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + Lenvatinib + mFOLFOX6 regimen","ชนิดของมะเร็ง":"มะเร็งกระเพาะอาหาร (Gastroesophageal Cancer)","รอบการรักษา":"6 cycles induction","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"400 mg IV day 1","ความถี่ในการให้":"ทุก 42 วัน","maximum_dose":null},{"ชื่อยา":"Lenvatinib","ขนาดยา":"8 mg PO daily","ความถี่ในการให้":"daily","maximum_dose":null},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"85 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"bolus","dose_mg_per_m2":400}},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"IV","type":"infusion","dose_mg_per_m2":2400,"infusion":{"duration_hours":46}}}]},{"ชื่อสูตรยา":"Bevacizumab + Paclitaxel regimen","ชนิดของมะเร็ง":"มะเร็งรังไข่ (Platinum-Resistant Ovarian Cancer)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"10 mg/kg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Paclitaxel","ขนาดยา":"80 mg/m² IV weekly","ความถี่ในการให้":"weekly","maximum_dose":null}]},{"ชื่อสูตรยา":"Nivolumab + Doxorubicin regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง (Hodgkin Lymphoma)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"240 mg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"25 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + Cobimetinib + Vemurafenib regimen","ชนิดของมะเร็ง":"มะเร็งผิวหนัง (BRAF-Mutant Melanoma)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"840 mg IV day 1,15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Cobimetinib","ขนาดยา":"60 mg PO days 1-21","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Vemurafenib","ขนาดยา":"960 mg PO BID daily","ความถี่ในการให้":"daily","maximum_dose":null}]},{"ชื่อสูตรยา":"Cetuximab + Panitumumab regimen","ชนิดของมะเร็ง":"มะเร็งลำไส้ใหญ่ (Refractory mCRC)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Cetuximab","ขนาดยา":"500 mg/m² IV every 2 weeks","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Panitumumab","ขนาดยา":"6 mg/kg IV every 2 weeks","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Rituximab + Ibrutinib regimen","ชนิดของมะเร็ง":"มะเร็งต่อมน้ำเหลือง CLL (Symptomatic CLL)","รอบการรักษา":"Up to 2 years","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV weekly x4, then monthly","ความถี่ในการให้":"per schedule","maximum_dose":null},{"ชื่อยา":"Ibrutinib","ขนาดยา":"420 mg PO daily","ความถี่ในการให้":"daily","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + Eribulin regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม Triple-Negative (PD-L1+ TNBC)","รอบการรักษา":"Until progression or up to 35 cycles","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Eribulin","ขนาดยา":"1.4 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + AC regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม (Early-Stage TNBC)","รอบการรักษา":"4 cycles","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"60 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"600 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + Sacituzumab Govitecan regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม Triple-Negative (Metastatic TNBC)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Sacituzumab Govitecan","ขนาดยา":"10 mg/kg IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + Anthracycline + Cyclophosphamide regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม (Early-Stage TNBC)","รอบการรักษา":"4 cycles neoadjuvant, followed by maintenance","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"1200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Epirubicin","ขนาดยา":"90 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"600 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + Capecitabine regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม Triple-Negative (PD-L1+ Metastatic TNBC)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"840 mg IV days 1,15","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Capecitabine","ขนาดยา":"1000–1250 mg/m² PO BID days 1-14","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"PO","frequency":"BID","days":"1-14","dose_range_mg_per_m2":{"min":1000,"max":1250},"default_mg_per_m2":1000,"rounding":{"tablet_strengths_mg":[150,500],"policy":"nearest_150","max_overfill_pct":5}}}]},{"ชื่อสูตรยา":"Nivolumab + Trastuzumab Deruxtecan regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม HER2-low (Metastatic Breast Cancer)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"240 mg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Trastuzumab Deruxtecan","ขนาดยา":"5.4 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Nivolumab + Paclitaxel + Doxorubicin regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม (Early-Stage TNBC)","รอบการรักษา":"4 cycles neoadjuvant","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"360 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Paclitaxel","ขนาดยา":"80 mg/m² IV weekly","ความถี่ในการให้":"weekly","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"60 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Bevacizumab + Doxorubicin + Cyclophosphamide regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม (Metastatic Breast Cancer)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"10 mg/kg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Doxorubicin","ขนาดยา":"50 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cyclophosphamide","ขนาดยา":"600 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Bevacizumab + Vinorelbine regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม (Metastatic Breast Cancer)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"10 mg/kg IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Vinorelbine","ขนาดยา":"25 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Rituximab + Bendamustine + Trastuzumab regimen","ชนิดของมะเร็ง":"มะเร็งเต้านม (HER2+ with CD20 Expression)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Rituximab","ขนาดยา":"375 mg/m² IV day 1","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Bendamustine","ขนาดยา":"90 mg/m² IV days 1-2","ความถี่ในการให้":"ทุก 28 วัน","maximum_dose":null},{"ชื่อยา":"Trastuzumab","ขนาดยา":"8 mg/kg IV loading, then 6 mg/kg","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Nivolumab + Cisplatin + Gemcitabine regimen","ชนิดของมะเร็ง":"มะเร็งท่อน้ำดี (Cholangiocarcinoma)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Nivolumab","ขนาดยา":"360 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"25 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + Gemcitabine + Oxaliplatin regimen","ชนิดของมะเร็ง":"มะเร็งท่อน้ำดี (Advanced Cholangiocarcinoma)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"100 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Atezolizumab + Gemcitabine + Cisplatin regimen","ชนิดของมะเร็ง":"มะเร็งท่อน้ำดี (Unresectable Cholangiocarcinoma)","รอบการรักษา":"6-8 cycles","รายการยา":[{"ชื่อยา":"Atezolizumab","ขนาดยา":"1200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Gemcitabine","ขนาดยา":"1000 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Cisplatin","ขนาดยา":"25 mg/m² IV days 1,8","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Bevacizumab + Capecitabine + Oxaliplatin regimen","ชนิดของมะเร็ง":"มะเร็งท่อน้ำดี (Advanced Cholangiocarcinoma)","รอบการรักษา":"6 cycles","รายการยา":[{"ชื่อยา":"Bevacizumab","ขนาดยา":"7.5 mg/kg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Capecitabine","ขนาดยา":"1000–1250 mg/m² PO BID days 1-14","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null,"structured_dose":{"schema":"per_m2","route":"PO","frequency":"BID","days":"1-14","dose_range_mg_per_m2":{"min":1000,"max":1250},"default_mg_per_m2":1000,"rounding":{"tablet_strengths_mg":[150,500],"policy":"nearest_150","max_overfill_pct":5}}},{"ชื่อยา":"Oxaliplatin","ขนาดยา":"130 mg/m² IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null}]},{"ชื่อสูตรยา":"Pembrolizumab + Fluorouracil + Leucovorin regimen","ชนิดของมะเร็ง":"มะเร็งท่อน้ำดี (MSI-H Cholangiocarcinoma)","รอบการรักษา":"Until progression","รายการยา":[{"ชื่อยา":"Pembrolizumab","ขนาดยา":"200 mg IV day 1","ความถี่ในการให้":"ทุก 21 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"400 mg/m² IV bolus","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Fluorouracil","ขนาดยา":"2400 mg/m² IV infusion over 46h","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null},{"ชื่อยา":"Leucovorin","ขนาดยา":"400 mg/m² IV day 1","ความถี่ในการให้":"ทุก 14 วัน","maximum_dose":null}]}];

// ---- engine.js ----
const EPS = Number.EPSILON * 10;
function mostellerBsa(heightCm, weightKg) {
    if (!(heightCm > 0) || !(weightKg > 0))
        throw new Error('Height and weight must be > 0');
    return Math.sqrt((heightCm * weightKg) / 3600);
}
function cockcroftGaultCrCl(patient) {
    const scr = patient.serumCreatinineMgDl;
    if (!(patient.ageYears > 0) || !(patient.weightKg > 0) || !(scr && scr > 0)) {
        throw new Error('Age, weight, and serum creatinine are required for Cockcroft-Gault');
    }
    let crcl = ((140 - patient.ageYears) * patient.weightKg) / (72 * scr);
    if (patient.sex === 'female')
        crcl *= 0.85;
    return Math.max(0, crcl);
}
function resolveKidneyFunction(patient, bsaM2) {
    const method = patient.kidneyMethod;
    if (!method)
        return {};
    if (method === 'measured_gfr') {
        if (!(patient.kidneyValue && patient.kidneyValue > 0))
            throw new Error('Measured GFR is required');
        return { value: patient.kidneyValue, label: 'Measured GFR (mL/min)' };
    }
    if (method === 'bsa_adjusted_egfr') {
        if (!(patient.kidneyValue && patient.kidneyValue > 0))
            throw new Error('eGFR is required');
        return {
            value: patient.kidneyValue * (bsaM2 / 1.73),
            label: 'BSA-adjusted eGFR (mL/min)',
        };
    }
    if (method === 'cockcroft_gault_legacy') {
        return {
            value: cockcroftGaultCrCl(patient),
            label: 'Cockcroft-Gault CrCl (legacy/local protocol)',
            warning: 'Cockcroft-Gault is provided only for legacy/local protocols. Verify the kidney-function method required by the regimen.',
        };
    }
    return assertNever(method);
}
function convertDose(value, from, to) {
    if (from === to)
        return value;
    if (from === 'g' && to === 'mg')
        return value * 1000;
    if (from === 'mg' && to === 'g')
        return value / 1000;
    if (from === 'mg' && to === 'mcg')
        return value * 1000;
    if (from === 'mcg' && to === 'mg')
        return value / 1000;
    throw new Error(`Unsupported unit conversion ${from} -> ${to}`);
}
function roundHalfUp(value, increment) {
    if (!(increment > 0))
        throw new Error('Rounding increment must be > 0');
    return Math.floor(value / increment + 0.5 + EPS) * increment;
}
function applyRounding(value, unit, profile) {
    if (profile.method === 'none')
        return { recommended: value, difference: 0, differencePct: 0 };
    let profileValue;
    try {
        profileValue = convertDose(value, unit, profile.unit);
    }
    catch {
        return { warning: `Rounding profile ${profile.label} uses ${profile.unit}, but dose is ${unit}.` };
    }
    const candidate = roundHalfUp(profileValue, profile.increment);
    const difference = candidate - profileValue;
    const differencePct = profileValue === 0 ? 0 : (difference / profileValue) * 100;
    const absPct = Math.abs(differencePct);
    const absDifference = Math.abs(difference);
    if (absPct > profile.maxPercentDifference + EPS) {
        return { warning: `Rounded candidate differs by ${absPct.toFixed(2)}%, exceeding ${profile.maxPercentDifference}%. Pharmacist review required.` };
    }
    if (profile.maxAbsoluteDifference !== undefined && absDifference > profile.maxAbsoluteDifference + EPS) {
        return { warning: `Rounded candidate differs by ${absDifference.toFixed(2)} ${profile.unit}, exceeding the approved absolute limit.` };
    }
    const recommendedInOriginalUnit = convertDose(candidate, profile.unit, unit);
    return {
        recommended: recommendedInOriginalUnit,
        difference: recommendedInOriginalUnit - value,
        differencePct: value === 0 ? 0 : ((recommendedInOriginalUnit - value) / value) * 100,
    };
}
function selectDoseValue(dose, orderId, selections) {
    if (dose.options?.length) {
        const selected = selections[orderId] ?? dose.defaultOption;
        if (selected === undefined)
            throw new Error('Clinical dose selection is required');
        if (!dose.options.some((v) => Math.abs(v - selected) < EPS))
            throw new Error('Selected dose is not an approved option');
        return selected;
    }
    if (dose.value === undefined)
        throw new Error('Dose value is missing');
    return dose.value;
}
function calculateRawDose(dose, orderId, selections, patient, bsaM2, kidneyFunctionMlMin) {
    const value = selectDoseValue(dose, orderId, selections);
    switch (dose.basis) {
        case 'fixed': return value;
        case 'bsa': return value * bsaM2;
        case 'weight': return value * patient.weightKg;
        case 'auc': {
            if (!(kidneyFunctionMlMin !== undefined && kidneyFunctionMlMin >= 0))
                throw new Error('Kidney function is required for Carboplatin AUC calculation');
            return value * (kidneyFunctionMlMin + 25);
        }
        default: return assertNever(dose.basis);
    }
}
function applyClinicalRules(value, unit, rules, kidneyFunctionMlMin) {
    let current = value;
    const notes = [];
    const warnings = [];
    for (const rule of rules ?? []) {
        if (rule.type === 'hard_max') {
            let maxInDoseUnit;
            try {
                maxInDoseUnit = convertDose(rule.value, rule.unit, unit);
            }
            catch {
                warnings.push(`Cannot apply hard maximum: unit mismatch (${rule.unit} vs ${unit}).`);
                continue;
            }
            if (current > maxInDoseUnit) {
                notes.push(`Hard maximum applied: ${formatNumber(rule.value)} ${rule.unit}. ${rule.reason}`);
                current = maxInDoseUnit;
            }
        }
        else if (rule.type === 'warning_threshold') {
            if (rule.metric === 'kidney_function' && kidneyFunctionMlMin !== undefined) {
                const matched = compare(kidneyFunctionMlMin, rule.operator, rule.value);
                if (matched)
                    warnings.push(rule.message);
            }
        }
        else {
            assertNever(rule);
        }
    }
    return { value: current, notes, warnings };
}
function compare(value, operator, threshold) {
    if (operator === 'gt')
        return value > threshold;
    if (operator === 'gte')
        return value >= threshold;
    if (operator === 'lt')
        return value < threshold;
    return value <= threshold;
}
function scheduleText(schedule) {
    const dayText = schedule.days.length === 1
        ? `day ${schedule.days[0]}`
        : `days ${schedule.days.join(', ')}`;
    const parts = [dayText];
    if (schedule.administrationsPerDay && schedule.administrationsPerDay > 1)
        parts.push(`${schedule.administrationsPerDay} administrations/day`);
    if (schedule.continuousInfusionHours)
        parts.push(`continuous infusion ${schedule.continuousInfusionHours} h`);
    else if (schedule.infusionMinutes)
        parts.push(`infusion ${schedule.infusionMinutes} min`);
    if (schedule.note)
        parts.push(schedule.note);
    return parts.join(' · ');
}
function protocolDoseText(dose) {
    const valueText = dose.options?.length
        ? dose.options.map(formatNumber).join(' or ')
        : formatNumber(dose.value ?? NaN);
    if (dose.basis === 'auc')
        return `AUC ${valueText}`;
    if (dose.basis === 'bsa')
        return `${valueText} ${dose.unit}/m²`;
    if (dose.basis === 'weight')
        return `${valueText} ${dose.unit}/kg`;
    return `${valueText} ${dose.unit}`;
}
function calculateRegimen(context) {
    const { patient, regimen, cycle, selections, roundingProfiles } = context;
    if (regimen.status !== 'published')
        throw new Error('Only published regimens can be calculated');
    if (regimen.population === 'adult' && patient.ageYears < 18)
        throw new Error('Selected regimen is adult-only');
    if (!(cycle >= 1))
        throw new Error('Cycle must be >= 1');
    const bsaM2 = mostellerBsa(patient.heightCm, patient.weightKg);
    const kidney = resolveKidneyFunction(patient, bsaM2);
    const warnings = [];
    if (kidney.warning)
        warnings.push(kidney.warning);
    if (!regimen.localApproval)
        warnings.push('CLINICAL APPROVAL PENDING: regimen has not been marked as locally approved by BHH. Verify local approval before patient care.');
    const phase = regimen.phases.find((p) => cycle >= p.cycleStart && (p.cycleEnd === undefined || cycle <= p.cycleEnd));
    if (!phase)
        throw new Error(`No regimen phase is defined for cycle ${cycle}`);
    const results = phase.orders.map((order) => {
        const resultWarnings = [];
        let blocked = false;
        let rawCalculatedDose = 0;
        let clinicalDose = 0;
        let recommendedDose;
        let difference;
        let differencePct;
        let roundingProfileLabel;
        const clinicalRuleNotes = [];
        try {
            rawCalculatedDose = calculateRawDose(order.dose, order.id, selections, patient, bsaM2, kidney.value);
            const clinical = applyClinicalRules(rawCalculatedDose, order.dose.unit, order.clinicalRules, kidney.value);
            clinicalDose = clinical.value;
            clinicalRuleNotes.push(...clinical.notes);
            resultWarnings.push(...clinical.warnings);
            if (order.roundingProfileId) {
                const profile = roundingProfiles[order.roundingProfileId];
                if (!profile) {
                    resultWarnings.push(`Unknown rounding profile: ${order.roundingProfileId}`);
                }
                else {
                    roundingProfileLabel = profile.label;
                    const rounded = applyRounding(clinicalDose, order.dose.unit, profile);
                    if (rounded.warning)
                        resultWarnings.push(rounded.warning);
                    recommendedDose = rounded.recommended;
                    difference = rounded.difference;
                    differencePct = rounded.differencePct;
                }
            }
        }
        catch (error) {
            blocked = true;
            resultWarnings.push(error instanceof Error ? error.message : String(error));
        }
        const administrations = Math.max(1, order.schedule.days.length * (order.schedule.administrationsPerDay ?? 1));
        const base = {
            orderId: order.id,
            drugName: order.drugName,
            protocolDoseText: protocolDoseText(order.dose),
            route: order.route,
            scheduleText: scheduleText(order.schedule),
            rawCalculatedDose,
            rawUnit: order.dose.unit,
            clinicalDose,
            clinicalUnit: order.dose.unit,
            clinicalRuleNotes,
            warnings: resultWarnings,
            blocked,
            administrationsThisCycle: administrations,
            cycleTotalClinicalDose: clinicalDose * administrations,
        };
        if (recommendedDose !== undefined)
            base.recommendedDose = recommendedDose;
        if (recommendedDose !== undefined)
            base.recommendedUnit = order.dose.unit;
        if (difference !== undefined)
            base.difference = difference;
        if (differencePct !== undefined)
            base.differencePct = differencePct;
        if (roundingProfileLabel !== undefined)
            base.roundingProfileLabel = roundingProfileLabel;
        return base;
    });
    const summary = { bsaM2, results, warnings };
    if (kidney.value !== undefined)
        summary.kidneyFunctionMlMin = kidney.value;
    if (kidney.label !== undefined)
        summary.kidneyMethodLabel = kidney.label;
    return summary;
}
function formatNumber(value, maxDecimals = 2) {
    if (!Number.isFinite(value))
        return '—';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxDecimals }).format(value);
}
function assertNever(value) {
    throw new Error(`Unexpected value: ${String(value)}`);
}


// ---- storage.js ----
const DRAFT_KEY = 'bhh-chemo-v2-regimen-drafts';
function loadDrafts() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
function saveDraft(regimen) {
    const drafts = loadDrafts();
    const next = drafts.filter((r) => r.id !== regimen.id);
    next.push(regimen);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
}
function deleteDraft(id) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(loadDrafts().filter((r) => r.id !== id)));
}
const ROUNDING_KEY = 'bhh-chemo-v2-rounding-overrides';
function loadRoundingOverrides() {
    try {
        const raw = localStorage.getItem(ROUNDING_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    }
    catch {
        return null;
    }
}
function saveRoundingOverrides(profiles) {
    localStorage.setItem(ROUNDING_KEY, JSON.stringify(profiles));
}
function clearRoundingOverrides() {
    localStorage.removeItem(ROUNDING_KEY);
}

// ---- validators.js ----
const KNOWN_UNITS = new Set(['mcg', 'mg', 'g', 'IU']);
function validateRegimen(regimen) {
    const issues = [];
    const add = (severity, path, message) => issues.push({ severity, path, message });
    if (!regimen.id.trim())
        add('error', 'id', 'Regimen ID is required.');
    if (!regimen.name.trim())
        add('error', 'name', 'Regimen name is required.');
    if (!regimen.indication.trim())
        add('error', 'indication', 'Indication is required.');
    if (!(regimen.cycleIntervalDays > 0))
        add('error', 'cycleIntervalDays', 'Cycle interval must be > 0.');
    if (!regimen.references.length)
        add('error', 'references', 'At least one clinical source is required.');
    if (!regimen.phases.length)
        add('error', 'phases', 'At least one phase is required.');
    if (regimen.status === 'published' && !regimen.lastReviewed)
        add('error', 'lastReviewed', 'Published regimen requires a review date.');
    const orderIds = new Set();
    for (const [pi, phase] of regimen.phases.entries()) {
        const p = `phases[${pi}]`;
        if (!(phase.cycleStart >= 1))
            add('error', `${p}.cycleStart`, 'Cycle start must be >= 1.');
        if (phase.cycleEnd !== undefined && phase.cycleEnd < phase.cycleStart)
            add('error', `${p}.cycleEnd`, 'Cycle end must be >= cycle start.');
        if (!phase.orders.length)
            add('warning', `${p}.orders`, 'Phase has no drug orders.');
        for (const [oi, order] of phase.orders.entries()) {
            const o = `${p}.orders[${oi}]`;
            if (orderIds.has(order.id))
                add('error', `${o}.id`, `Duplicate order ID: ${order.id}`);
            orderIds.add(order.id);
            if (!order.drugName.trim())
                add('error', `${o}.drugName`, 'Drug name is required.');
            if (!KNOWN_UNITS.has(order.dose.unit))
                add('error', `${o}.dose.unit`, `Unsupported unit: ${order.dose.unit}`);
            if (order.dose.options?.length) {
                if (order.dose.options.some((x) => !(x > 0)))
                    add('error', `${o}.dose.options`, 'Dose options must be > 0.');
                if (order.dose.defaultOption !== undefined && !order.dose.options.includes(order.dose.defaultOption)) {
                    add('error', `${o}.dose.defaultOption`, 'Default option must be one of the approved options.');
                }
            }
            else if (!(order.dose.value !== undefined && order.dose.value > 0)) {
                add('error', `${o}.dose.value`, 'Dose must be > 0.');
            }
            if (!order.schedule.days.length)
                add('error', `${o}.schedule.days`, 'At least one administration day is required.');
            if (order.schedule.days.some((d) => !Number.isInteger(d) || d < 1))
                add('error', `${o}.schedule.days`, 'Administration days must be positive integers.');
        }
    }
    if (!regimen.localApproval)
        add('warning', 'localApproval', 'Local BHH approval is not recorded. Keep TEST/NOT FOR PATIENT CARE banner enabled.');
    return issues;
}
function auditLegacyRegimens(input) {
    const root = input;
    const regimens = (root?.['สูตรยาเคมีบำบัด'] ?? input);
    if (!Array.isArray(regimens))
        throw new Error('Legacy file must contain an array or {"สูตรยาเคมีบำบัด": [...]}');
    const findings = [];
    for (const item of regimens) {
        const r = item;
        const regimenName = String(r['ชื่อสูตรยา'] ?? 'Unnamed regimen');
        const indication = String(r['ชนิดของมะเร็ง'] ?? '');
        const drugs = Array.isArray(r['รายการยา']) ? r['รายการยา'] : [];
        for (const drugItem of drugs) {
            const d = drugItem;
            const drugName = String(d['ชื่อยา'] ?? 'Unknown drug');
            const doseText = String(d['ขนาดยา'] ?? '').trim();
            const blockReason = legacyBlockReason(doseText);
            findings.push({
                regimenName,
                indication,
                drugName,
                doseText,
                status: blockReason ? 'blocked' : 'migratable_draft',
                reason: blockReason ?? 'Simple expression detected. It may be migrated to DRAFT only and still requires pharmacist review.',
            });
        }
    }
    return findings;
}
function legacyBlockReason(text) {
    if (!text)
        return 'Dose text is empty.';
    if (/\bthen\b/i.test(text))
        return 'Multi-phase loading/maintenance expression requires structured phases.';
    if (/\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?/i.test(text))
        return 'Dose/AUC range requires explicit clinical selection rules.';
    if (/\bg\/m[²2]\b/i.test(text))
        return 'g/m² must be explicitly structured and unit-normalized.';
    if (/\b(?:units?|IU)\b/i.test(text))
        return 'International Units/units require explicit unit semantics.';
    if (/\/day\b/i.test(text))
        return 'Per-day dose requires an explicit multi-day schedule.';
    if (/every\s+\d+\s*h|q\d+h|BID|TID|QID/i.test(text))
        return 'Repeated intra-day schedule requires structured frequency.';
    if (/AUC\s*\d+(?:\.\d+)?/i.test(text))
        return undefined;
    if (/\d+(?:\.\d+)?\s*mg\/m[²2]\b/i.test(text))
        return undefined;
    if (/\d+(?:\.\d+)?\s*mg\/kg\b/i.test(text))
        return undefined;
    if (/\d+(?:\.\d+)?\s*mg\b/i.test(text))
        return undefined;
    return 'Expression is not recognized safely. Manual structured migration is required.';
}

// ---- app.js ----
const $ = (selector) => {
const element = document.querySelector(selector);
if (!element)
throw new Error(`Missing element ${selector}`);
return element;
};
let publishedRegimens = [];
let defaultProfileList = [];
let profileList = [];
let profiles = {};
let roundingOverrideActive = false;
let lastCalculation = null;
let builderOrders = [];
let legacyFindings = [];
let legacyRegimens = [];
const cloneData = (value) => JSON.parse(JSON.stringify(value));
const newId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
async function init() {
try {
publishedRegimens = cloneData(BHH_PUBLISHED_REGIMENS);
defaultProfileList = cloneData(BHH_ROUNDING_DEFAULTS);
legacyRegimens = cloneData(BHH_LEGACY_REGIMENS);
const storedProfiles = loadRoundingOverrides();
profileList = storedProfiles && isCompatibleRoundingOverride(storedProfiles, defaultProfileList)
? storedProfiles
: cloneData(defaultProfileList);
roundingOverrideActive = Boolean(storedProfiles && isCompatibleRoundingOverride(storedProfiles, defaultProfileList));
profiles = Object.fromEntries(profileList.map((p) => [p.id, p]));
bindNavigation();
populateRegimenSelect();
bindCalculator();
bindRegistry();
bindLibrary();
bindBuilder();
bindRoundingPolicy();
bindLegacyValidator();
renderRegistry();
resetBuilder();
updateCalculatorContext();
$('#app-loading').classList.add('hidden');
$('#app-shell').classList.remove('hidden');
}
catch (error) {
$('#app-loading').innerHTML = `<div class="fatal">Unable to start application: ${escapeHtml(errorMessage(error))}</div>`;
}
}
function bindNavigation() {
document.querySelectorAll('[data-tab]').forEach((button) => {
button.addEventListener('click', () => showTab(button.dataset.tab ?? 'calculator'));
});
}
function showTab(tab) {
document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.add('hidden'));
document.querySelectorAll('[data-tab]').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
const panel = document.getElementById(`tab-${tab}`);
panel?.classList.remove('hidden');
if (tab === 'registry')
renderRegistry();
if (tab === 'library')
renderLibrary();
if (tab === 'builder')
renderBuilderOrders();
if (tab === 'rounding')
renderRoundingPolicy();
}
function populateRegimenSelect() {
const select = $('#regimen-select');
select.innerHTML = publishedRegimens
.map((r) => `<option value="${escapeAttr(r.id)}">${escapeHtml(r.name)} — ${escapeHtml(r.indication)}</option>`)
.join('');
}
function selectedRegimen() {
const id = $('#regimen-select').value;
const regimen = publishedRegimens.find((r) => r.id === id);
if (!regimen)
throw new Error('Select a regimen');
return regimen;
}
function bindCalculator() {
$('#regimen-select').addEventListener('change', updateCalculatorContext);
$('#cycle-input').addEventListener('input', updateCalculatorContext);
$('#kidney-method').addEventListener('change', updateKidneyUi);
$('#calc-form').addEventListener('submit', (event) => {
event.preventDefault();
runCalculation();
});
$('#print-btn').addEventListener('click', () => window.print());
$('#export-calc-btn').addEventListener('click', exportLastCalculation);
updateKidneyUi();
}
function updateKidneyUi() {
const method = $('#kidney-method').value;
const label = $('#kidney-value-label');
const valueInput = $('#kidney-value');
const scrWrap = $('#scr-wrap');
if (method === 'bsa_adjusted_egfr') {
label.textContent = 'eGFR (mL/min/1.73m²)';
valueInput.disabled = false;
scrWrap.classList.add('hidden');
}
else if (method === 'measured_gfr') {
label.textContent = 'Measured GFR (mL/min)';
valueInput.disabled = false;
scrWrap.classList.add('hidden');
}
else {
label.textContent = 'Kidney value (computed from SCr)';
valueInput.disabled = true;
scrWrap.classList.remove('hidden');
}
}
function updateCalculatorContext() {
const regimen = selectedRegimen();
const cycleInput = $('#cycle-input');
cycleInput.max = String(regimen.cycleCount ?? 99);
let cycle = Math.max(1, Number(cycleInput.value) || 1);
if (regimen.cycleCount && cycle > regimen.cycleCount) {
cycle = regimen.cycleCount;
cycleInput.value = String(cycle);
}
const phase = regimen.phases.find((p) => cycle >= p.cycleStart && (p.cycleEnd === undefined || cycle <= p.cycleEnd));
$('#regimen-context').innerHTML = `
<div><strong>${escapeHtml(regimen.name)}</strong> · ${escapeHtml(regimen.indication)}</div>
<div>Cycle ${cycle} · ${phase ? escapeHtml(phase.name) : '<span class="danger">No phase defined</span>'}</div>
<div class="micro">Version ${escapeHtml(regimen.version)} · Reviewed ${escapeHtml(regimen.lastReviewed)} · Local approval: <strong class="${regimen.localApproval ? 'success-text' : 'danger'}">${regimen.localApproval ? 'APPROVED' : 'NOT RECORDED'}</strong></div>`;
const aucBox = $('#dose-selections');
if (!phase) {
aucBox.innerHTML = '';
return;
}
const optionOrders = phase.orders.filter((o) => o.dose.options?.length);
aucBox.innerHTML = optionOrders.length
? `<h3>Clinical dose selection</h3>${optionOrders.map((order) => `
<label class="field">
<span>${escapeHtml(order.drugName)} — ${escapeHtml(order.dose.basis.toUpperCase())}</span>
<select data-dose-select="${escapeAttr(order.id)}">
${order.dose.options.map((v) => `<option value="${v}" ${v === order.dose.defaultOption ? 'selected' : ''}>${order.dose.basis === 'auc' ? 'AUC ' : ''}${v}</option>`).join('')}
</select>
</label>`).join('')}`
: '';
}
function runCalculation() {
try {
const regimen = selectedRegimen();
const selections = {};
document.querySelectorAll('[data-dose-select]').forEach((el) => {
if (el.dataset.doseSelect)
selections[el.dataset.doseSelect] = Number(el.value);
});
const method = $('#kidney-method').value;
const patient = {
ageYears: numberValue('#age-input'),
sex: $('#sex-input').value,
heightCm: numberValue('#height-input'),
weightKg: numberValue('#weight-input'),
kidneyMethod: method,
...(method === 'cockcroft_gault_legacy'
? { serumCreatinineMgDl: numberValue('#scr-input') }
: { kidneyValue: numberValue('#kidney-value') }),
};
const cycle = numberValue('#cycle-input');
const summary = calculateRegimen({ patient, regimen, cycle, selections, roundingProfiles: profiles });
lastCalculation = { generatedAt: new Date().toISOString(), regimenId: regimen.id, regimenVersion: regimen.version, cycle, patient, selections, summary };
renderCalculation(summary, regimen, cycle);
}
catch (error) {
$('#calc-output').innerHTML = `<div class="alert alert-error"><strong>Calculation blocked:</strong> ${escapeHtml(errorMessage(error))}</div>`;
lastCalculation = null;
}
}
function renderCalculation(summary, regimen, cycle) {
const warningHtml = [...summary.warnings, ...summary.results.flatMap((r) => r.warnings)]
.map((w) => `<div class="alert alert-warning">${escapeHtml(w)}</div>`)
.join('');
const rows = summary.results.map((result) => {
const recommended = result.recommendedDose === undefined
? '<span class="muted">Review / no rounding rule</span>'
: `<strong>${formatNumber(result.recommendedDose)} ${escapeHtml(result.recommendedUnit ?? result.clinicalUnit)}</strong>`;
const diff = result.differencePct === undefined
? '—'
: `${signed(result.difference ?? 0)} ${escapeHtml(result.clinicalUnit)} (${signed(result.differencePct)}%)`;
const ruleNotes = result.clinicalRuleNotes.length ? `<div class="micro rule-note">${result.clinicalRuleNotes.map(escapeHtml).join('<br>')}</div>` : '';
const blocked = result.blocked ? '<span class="badge badge-danger">BLOCKED</span>' : '';
return `<tr>
<td><strong>${escapeHtml(result.drugName)}</strong><div class="micro">${escapeHtml(result.route)} · ${escapeHtml(result.scheduleText)}</div>${blocked}</td>
<td>${escapeHtml(result.protocolDoseText)}</td>
<td><strong>${formatNumber(result.rawCalculatedDose)} ${escapeHtml(result.rawUnit)}</strong></td>
<td><strong>${formatNumber(result.clinicalDose)} ${escapeHtml(result.clinicalUnit)}</strong>${ruleNotes}</td>
<td>${recommended}<div class="micro">${escapeHtml(result.roundingProfileLabel ?? '')}</div></td>
<td>${diff}</td>
<td>${result.administrationsThisCycle > 1 ? `${formatNumber(result.cycleTotalClinicalDose)} ${escapeHtml(result.clinicalUnit)}<div class="micro">${result.administrationsThisCycle} administrations</div>` : '—'}</td>
</tr>`;
}).join('');
$('#calc-output').innerHTML = `
<section class="result-header">
<div><span class="kpi-label">BSA (full precision used)</span><strong>${summary.bsaM2.toFixed(5)} m²</strong></div>
<div><span class="kpi-label">Kidney function used</span><strong>${summary.kidneyFunctionMlMin !== undefined ? `${formatNumber(summary.kidneyFunctionMlMin)} mL/min` : 'Not required / unavailable'}</strong><span class="micro">${escapeHtml(summary.kidneyMethodLabel ?? '')}</span></div>
<div><span class="kpi-label">Regimen / cycle</span><strong>${escapeHtml(regimen.name)} · ${cycle}</strong></div>
</section>
${warningHtml}
<div class="table-wrap"><table>
<thead><tr><th>Drug</th><th>Protocol dose</th><th>Raw calculated</th><th>Clinical dose</th><th>Recommended</th><th>Difference</th><th>Cycle total*</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
<p class="micro">*Cycle total is arithmetic dose × structured administration count only; it is not a prescribing recommendation. Continuous infusions are counted as one administration.</p>`;
}
function bindLibrary() {
$('#library-search').addEventListener('input', renderLibrary);
renderLibrary();
}
function renderLibrary() {
const q = $('#library-search').value.trim().toLowerCase();
const filtered = legacyRegimens.filter((r) => {
const name = String(r['ชื่อสูตรยา'] ?? '');
const cancer = String(r['ชนิดของมะเร็ง'] ?? '');
const drugs = Array.isArray(r['รายการยา']) ? r['รายการยา'] : [];
const drugText = drugs.map((d) => String(d?.['ชื่อยา'] ?? '')).join(' ');
return `${name} ${cancer} ${drugText}`.toLowerCase().includes(q);
});
$('#library-summary').innerHTML = `<strong>${legacyRegimens.length}</strong> legacy regimen records preserved from V1 · <strong>${publishedRegimens.length}</strong> structured approved pilots active in Calculator · remaining legacy records require structured clinical migration before activation.`;
$('#library-list').innerHTML = filtered.map((r) => {
const name = String(r['ชื่อสูตรยา'] ?? 'Unnamed regimen');
const cancer = String(r['ชนิดของมะเร็ง'] ?? '');
const drugs = Array.isArray(r['รายการยา']) ? r['รายการยา'] : [];
return `<article class="registry-card">
<div class="registry-top"><div><span class="badge badge-warning">LEGACY REVIEW</span></div><span class="micro">${drugs.length} drug item(s)</span></div>
<h3>${escapeHtml(name)}</h3>
<p>${escapeHtml(cancer)}</p>
<details><summary>Original V1 drug/dose data</summary>
<div class="legacy-drug-list">${drugs.map((d) => `<div><strong>${escapeHtml(String(d?.['ชื่อยา'] ?? 'Unknown drug'))}</strong><span>${escapeHtml(String(d?.['ขนาดยา'] ?? ''))}</span></div>`).join('')}</div>
</details>
<p class="micro">Preserved for migration/reference. This record is not fed directly into the production calculation engine.</p>
</article>`;
}).join('') || '<p class="muted">No matching legacy regimens.</p>';
}
function bindRegistry() {
$('#registry-search').addEventListener('input', renderRegistry);
}
function renderRegistry() {
const q = $('#registry-search').value.trim().toLowerCase();
const drafts = loadDrafts();
const all = [...publishedRegimens, ...drafts];
const filtered = all.filter((r) => `${r.name} ${r.indication} ${r.cancerGroup}`.toLowerCase().includes(q));
$('#registry-list').innerHTML = filtered.map((r) => {
const issues = validateRegimen(r);
const errors = issues.filter((i) => i.severity === 'error').length;
const warnings = issues.filter((i) => i.severity === 'warning').length;
const source = r.references[0];
const draft = r.status === 'draft';
return `<article class="registry-card">
<div class="registry-top"><div><span class="badge ${draft ? 'badge-neutral' : 'badge-ok'}">${escapeHtml(r.status.toUpperCase())}</span> <span class="badge ${r.localApproval ? 'badge-ok' : 'badge-warning'}">${r.localApproval ? 'LOCAL APPROVED' : 'LOCAL APPROVAL PENDING'}</span></div><span class="micro">${escapeHtml(r.id)} · v${escapeHtml(r.version)}</span></div>
<h3>${escapeHtml(r.name)}</h3>
<p>${escapeHtml(r.indication)}</p>
<div class="meta-grid"><span>${escapeHtml(r.cancerGroup)}</span><span>${r.cycleIntervalDays} days/cycle</span><span>${r.cycleCount ?? 'variable'} cycles</span><span>${escapeHtml(r.population)}</span></div>
<div class="micro">Validation: ${errors} error(s), ${warnings} warning(s)</div>
${source ? `<a href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>` : ''}
${r.clinicalNotes?.length ? `<details><summary>Clinical notes</summary><ul>${r.clinicalNotes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul></details>` : ''}
<div class="button-row"><button class="secondary" data-clone="${escapeAttr(r.id)}">Clone to Builder</button>${draft ? `<button class="danger-button" data-delete-draft="${escapeAttr(r.id)}">Delete draft</button>` : ''}</div>
</article>`;
}).join('') || '<p class="muted">No matching regimens.</p>';
document.querySelectorAll('[data-clone]').forEach((button) => button.addEventListener('click', () => cloneToBuilder(button.dataset.clone ?? '')));
document.querySelectorAll('[data-delete-draft]').forEach((button) => button.addEventListener('click', () => {
if (button.dataset.deleteDraft)
deleteDraft(button.dataset.deleteDraft);
renderRegistry();
}));
}
function bindBuilder() {
$('#builder-add-order').addEventListener('click', () => {
builderOrders.push(blankBuilderOrder());
renderBuilderOrders();
});
$('#builder-reset').addEventListener('click', resetBuilder);
$('#builder-form').addEventListener('submit', (event) => {
event.preventDefault();
saveBuilderDraft();
});
$('#builder-export').addEventListener('click', exportBuilderJson);
}
function blankBuilderOrder() {
return {
id: newId(), drugName: '', basis: 'bsa', value: '', unit: 'mg', route: 'IV', days: '1', roundingProfileId: 'BHH_NEAREST_10MG_DEFAULT',
};
}
function resetBuilder() {
$('#builder-id').value = `BHH-DRAFT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.floor(Math.random() * 900 + 100)}`;
$('#builder-name').value = '';
$('#builder-cancer').value = '';
$('#builder-indication').value = '';
$('#builder-setting').value = '';
$('#builder-intent').value = '';
$('#builder-cycle-days').value = '21';
$('#builder-cycles').value = '6';
$('#builder-source').value = '';
builderOrders = [blankBuilderOrder()];
renderBuilderOrders();
$('#builder-validation').innerHTML = '';
}
function cloneToBuilder(id) {
const source = [...publishedRegimens, ...loadDrafts()].find((r) => r.id === id);
if (!source)
return;
$('#builder-id').value = `${source.id}-DRAFT-${Date.now().toString().slice(-6)}`;
$('#builder-name').value = `${source.name} — clone`;
$('#builder-cancer').value = source.cancerGroup;
$('#builder-indication').value = source.indication;
$('#builder-setting').value = source.setting;
$('#builder-intent').value = source.intent;
$('#builder-cycle-days').value = String(source.cycleIntervalDays);
$('#builder-cycles').value = String(source.cycleCount ?? 1);
$('#builder-source').value = source.references[0]?.url ?? '';
const firstPhase = source.phases[0];
builderOrders = (firstPhase?.orders ?? []).map((o) => ({
id: newId(),
drugName: o.drugName,
basis: o.dose.basis,
value: String(o.dose.value ?? o.dose.defaultOption ?? ''),
unit: o.dose.unit,
route: o.route,
days: o.schedule.days.join(','),
roundingProfileId: o.roundingProfileId ?? '',
}));
if (!builderOrders.length)
builderOrders = [blankBuilderOrder()];
renderBuilderOrders();
showTab('builder');
$('#builder-validation').innerHTML = '<div class="alert alert-warning">Clone created as DRAFT. Complex multi-phase details are intentionally not auto-flattened; verify against the source protocol before approval.</div>';
}
function renderBuilderOrders() {
$('#builder-orders').innerHTML = builderOrders.map((order, index) => `
<div class="builder-order" data-builder-index="${index}">
<div class="field"><span>Drug</span><input data-bo="drugName" value="${escapeAttr(order.drugName)}" placeholder="Generic name"></div>
<div class="field"><span>Dose basis</span><select data-bo="basis">${optionList(['fixed', 'bsa', 'weight', 'auc'], order.basis)}</select></div>
<div class="field"><span>Dose / AUC</span><input data-bo="value" type="number" step="any" min="0" value="${escapeAttr(order.value)}"></div>
<div class="field"><span>Unit</span><select data-bo="unit">${optionList(['mcg', 'mg', 'g', 'IU'], order.unit)}</select></div>
<div class="field"><span>Route</span><select data-bo="route">${optionList(['IV', 'PO', 'SC', 'IM', 'IM/IV'], order.route)}</select></div>
<div class="field"><span>Days</span><input data-bo="days" value="${escapeAttr(order.days)}" placeholder="1 or 1,8,15"></div>
<div class="field"><span>Rounding</span><select data-bo="roundingProfileId"><option value="">None</option>${profileList.map((p) => `<option value="${escapeAttr(p.id)}" ${p.id === order.roundingProfileId ? 'selected' : ''}>${escapeHtml(p.label)}</option>`).join('')}</select></div>
<button type="button" class="danger-button compact" data-remove-order="${index}">Remove</button>
</div>`).join('');
document.querySelectorAll('.builder-order').forEach((row) => {
const index = Number(row.dataset.builderIndex);
row.querySelectorAll('[data-bo]').forEach((input) => input.addEventListener('input', () => {
const key = input.dataset.bo;
const item = builderOrders[index];
if (!key || !item)
return;
item[key] = input.value;
}));
});
document.querySelectorAll('[data-remove-order]').forEach((button) => button.addEventListener('click', () => {
builderOrders.splice(Number(button.dataset.removeOrder), 1);
if (!builderOrders.length)
builderOrders.push(blankBuilderOrder());
renderBuilderOrders();
}));
}
function buildDraftFromForm() {
const now = new Date().toISOString().slice(0, 10);
const cycles = numberValue('#builder-cycles');
const sourceUrl = $('#builder-source').value.trim();
const orders = builderOrders.map((o, i) => {
const days = o.days.split(',').map((d) => Number(d.trim())).filter((d) => Number.isInteger(d) && d > 0);
const order = {
id: o.id || `order-${i + 1}`,
drugId: slugify(o.drugName || `drug-${i + 1}`),
drugName: o.drugName.trim(),
dose: { basis: o.basis, value: Number(o.value), unit: o.unit },
route: o.route,
schedule: { days },
};
if (o.roundingProfileId)
order.roundingProfileId = o.roundingProfileId;
return order;
});
return {
id: $('#builder-id').value.trim(),
version: '0.1.0-draft',
name: $('#builder-name').value.trim(),
cancerGroup: $('#builder-cancer').value.trim(),
indication: $('#builder-indication').value.trim(),
setting: $('#builder-setting').value.trim(),
intent: $('#builder-intent').value.trim(),
population: 'adult',
cycleIntervalDays: numberValue('#builder-cycle-days'),
cycleCount: cycles,
status: 'draft',
localApproval: false,
effectiveDate: now,
lastReviewed: now,
references: sourceUrl ? [{ label: 'Draft source', url: sourceUrl, accessedDate: now }] : [],
phases: [{ id: `${slugify($('#builder-id').value)}-phase1`, name: `Cycles 1–${cycles}`, cycleStart: 1, cycleEnd: cycles, orders }],
clinicalNotes: ['Created in V2 Regimen Builder. Draft only; requires independent oncology pharmacist review and approval before publication.'],
};
}
function saveBuilderDraft() {
const draft = buildDraftFromForm();
const issues = validateRegimen(draft);
renderValidationIssues(issues, '#builder-validation');
if (issues.some((i) => i.severity === 'error'))
return;
saveDraft(draft);
$('#builder-validation').insertAdjacentHTML('afterbegin', '<div class="alert alert-success">Draft saved locally. It is NOT published and cannot be used by the calculator.</div>');
}
function exportBuilderJson() {
const draft = buildDraftFromForm();
renderValidationIssues(validateRegimen(draft), '#builder-validation');
downloadJson(`${slugify(draft.id || 'regimen-draft')}.json`, draft);
}
function renderValidationIssues(issues, target) {
$(target).innerHTML = issues.length
? issues.map((i) => `<div class="alert ${i.severity === 'error' ? 'alert-error' : i.severity === 'warning' ? 'alert-warning' : 'alert-info'}"><strong>${escapeHtml(i.severity.toUpperCase())}</strong> · ${escapeHtml(i.path)} — ${escapeHtml(i.message)}</div>`).join('')
: '<div class="alert alert-success">No schema validation issues detected. Clinical review is still required.</div>';
}
function bindRoundingPolicy() {
$('#rounding-save').addEventListener('click', saveRoundingPolicyFromUi);
$('#rounding-reset').addEventListener('click', resetRoundingPolicy);
$('#rounding-export').addEventListener('click', () => downloadJson('BHH-rounding-policy.json', profileList));
$('#rounding-import').addEventListener('change', importRoundingPolicy);
renderRoundingPolicy();
}
function isCompatibleRoundingOverride(candidate, defaults) {
if (!Array.isArray(candidate) || candidate.length !== defaults.length)
return false;
const defaultIds = new Set(defaults.map((p) => p.id));
return candidate.every((p) => defaultIds.has(p.id)
&& (p.method === 'nearest_half_up' || p.method === 'none')
&& Number.isFinite(p.increment) && p.increment > 0
&& Number.isFinite(p.maxPercentDifference) && p.maxPercentDifference >= 0
&& p.maxPercentDifference <= 100
&& (p.maxAbsoluteDifference === undefined || (Number.isFinite(p.maxAbsoluteDifference) && p.maxAbsoluteDifference >= 0)));
}
function renderRoundingPolicy() {
const status = roundingOverrideActive
? '<span class="badge badge-warning">BROWSER OVERRIDE ACTIVE</span>'
: '<span class="badge badge-ok">PUBLISHED DEFAULT</span>';
$('#rounding-status').innerHTML = `${status}<span class="micro">Changes here affect calculations on this browser only until exported and centrally published.</span>`;
$('#rounding-policy-list').innerHTML = profileList.map((p, index) => {
const locked = p.method === 'none';
return `<article class="rounding-card" data-rounding-index="${index}">
<div class="registry-top"><div><strong>${escapeHtml(p.label)}</strong></div><span class="micro">${escapeHtml(p.id)}</span></div>
<div class="form-grid compact-grid">
<label class="field field-wide"><span>Label</span><input data-rp="label" value="${escapeAttr(p.label)}" ${locked ? 'disabled' : ''}></label>
<label class="field"><span>Increment (${escapeHtml(p.unit)})</span><input data-rp="increment" type="number" min="0.000001" step="any" value="${p.increment}" ${locked ? 'disabled' : ''}></label>
<label class="field"><span>Max difference (%)</span><input data-rp="maxPercentDifference" type="number" min="0" max="100" step="0.01" value="${p.maxPercentDifference}" ${locked ? 'disabled' : ''}></label>
<label class="field"><span>Max absolute difference (${escapeHtml(p.unit)})</span><input data-rp="maxAbsoluteDifference" type="number" min="0" step="any" value="${p.maxAbsoluteDifference ?? ''}" ${locked ? 'disabled' : ''}></label>
<label class="field"><span>Method</span><input value="${escapeAttr(p.method)}" disabled></label>
</div>
<p class="micro">${escapeHtml(p.notes ?? '')}</p>
</article>`;
}).join('');
document.querySelectorAll('[data-rounding-index]').forEach((card) => {
const index = Number(card.dataset.roundingIndex);
card.querySelectorAll('[data-rp]').forEach((input) => input.addEventListener('input', () => {
const p = profileList[index];
if (!p || p.method === 'none')
return;
const key = input.dataset.rp;
if (key === 'label')
p.label = input.value;
if (key === 'increment')
p.increment = Number(input.value);
if (key === 'maxPercentDifference')
p.maxPercentDifference = Number(input.value);
if (key === 'maxAbsoluteDifference') {
const v = input.value.trim();
if (v === '')
delete p.maxAbsoluteDifference;
else
p.maxAbsoluteDifference = Number(v);
}
}));
});
}
function validateRoundingPolicy(candidate) {
const errors = [];
for (const p of candidate) {
if (!p.label.trim())
errors.push(`${p.id}: label is required.`);
if (!(Number.isFinite(p.increment) && p.increment > 0))
errors.push(`${p.id}: increment must be > 0.`);
if (!(Number.isFinite(p.maxPercentDifference) && p.maxPercentDifference >= 0 && p.maxPercentDifference <= 100))
errors.push(`${p.id}: max % difference must be between 0 and 100.`);
if (p.maxAbsoluteDifference !== undefined && !(Number.isFinite(p.maxAbsoluteDifference) && p.maxAbsoluteDifference >= 0))
errors.push(`${p.id}: max absolute difference must be >= 0.`);
}
return errors;
}
function saveRoundingPolicyFromUi() {
const errors = validateRoundingPolicy(profileList);
if (errors.length) {
$('#rounding-message').innerHTML = errors.map((e) => `<div class="alert alert-error">${escapeHtml(e)}</div>`).join('');
return;
}
saveRoundingOverrides(profileList);
roundingOverrideActive = true;
profiles = Object.fromEntries(profileList.map((p) => [p.id, p]));
$('#rounding-message').innerHTML = '<div class="alert alert-success">Rounding policy saved as a browser-local override and is active for calculations on this device.</div>';
renderRoundingPolicy();
renderBuilderOrders();
}
function resetRoundingPolicy() {
clearRoundingOverrides();
profileList = cloneData(defaultProfileList);
profiles = Object.fromEntries(profileList.map((p) => [p.id, p]));
roundingOverrideActive = false;
$('#rounding-message').innerHTML = '<div class="alert alert-success">Reset to published rounding defaults.</div>';
renderRoundingPolicy();
renderBuilderOrders();
}
async function importRoundingPolicy(event) {
const input = event.currentTarget;
const file = input.files?.[0];
if (!file)
return;
try {
const candidate = JSON.parse(await file.text());
if (!isCompatibleRoundingOverride(candidate, defaultProfileList))
throw new Error('Imported policy is incompatible with the published profile IDs or contains invalid values.');
const errors = validateRoundingPolicy(candidate);
if (errors.length)
throw new Error(errors.join(' '));
profileList = candidate;
profiles = Object.fromEntries(profileList.map((p) => [p.id, p]));
saveRoundingOverrides(profileList);
roundingOverrideActive = true;
$('#rounding-message').innerHTML = '<div class="alert alert-success">Imported rounding policy is now active as a browser-local override.</div>';
renderRoundingPolicy();
renderBuilderOrders();
}
catch (error) {
$('#rounding-message').innerHTML = `<div class="alert alert-error">${escapeHtml(errorMessage(error))}</div>`;
}
finally {
input.value = '';
}
}
function bindLegacyValidator() {
$('#legacy-file').addEventListener('change', async (event) => {
const file = event.currentTarget.files?.[0];
if (!file)
return;
try {
const json = JSON.parse(await file.text());
legacyFindings = auditLegacyRegimens(json);
renderLegacyFindings();
}
catch (error) {
$('#legacy-results').innerHTML = `<div class="alert alert-error">${escapeHtml(errorMessage(error))}</div>`;
}
});
$('#legacy-export').addEventListener('click', exportLegacyCsv);
}
function renderLegacyFindings() {
const blocked = legacyFindings.filter((f) => f.status === 'blocked').length;
const draftable = legacyFindings.length - blocked;
$('#legacy-results').innerHTML = `
<section class="result-header"><div><span class="kpi-label">Drug entries</span><strong>${legacyFindings.length}</strong></div><div><span class="kpi-label">Blocked</span><strong class="danger">${blocked}</strong></div><div><span class="kpi-label">Draft-migratable*</span><strong>${draftable}</strong></div></section>
<p class="micro">*Draft-migratable means only that a simple expression was recognized; it still requires structured conversion and pharmacist review before publication.</p>
<div class="table-wrap"><table><thead><tr><th>Status</th><th>Regimen</th><th>Drug</th><th>Legacy dose</th><th>Reason</th></tr></thead><tbody>
${legacyFindings.slice(0, 500).map((f) => `<tr><td><span class="badge ${f.status === 'blocked' ? 'badge-danger' : 'badge-neutral'}">${f.status === 'blocked' ? 'BLOCK' : 'DRAFT'}</span></td><td>${escapeHtml(f.regimenName)}<div class="micro">${escapeHtml(f.indication)}</div></td><td>${escapeHtml(f.drugName)}</td><td>${escapeHtml(f.doseText)}</td><td>${escapeHtml(f.reason)}</td></tr>`).join('')}
</tbody></table></div>`;
}
function exportLegacyCsv() {
if (!legacyFindings.length)
return;
const headers = ['status', 'regimen', 'indication', 'drug', 'legacy_dose', 'reason'];
const rows = legacyFindings.map((f) => [f.status, f.regimenName, f.indication, f.drugName, f.doseText, f.reason]);
const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
downloadBlob('legacy-regimen-migration-report.csv', csv, 'text/csv;charset=utf-8');
}
function exportLastCalculation() {
if (!lastCalculation) {
alert('Run a calculation first.');
return;
}
downloadJson(`bhh-chemo-calculation-${new Date().toISOString().slice(0, 10)}.json`, lastCalculation);
}
function downloadJson(filename, value) {
downloadBlob(filename, JSON.stringify(value, null, 2), 'application/json');
}
function downloadBlob(filename, content, type) {
const blob = new Blob([content], { type });
const url = URL.createObjectURL(blob);
const anchor = document.createElement('a');
anchor.href = url;
anchor.download = filename;
anchor.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvCell(value) {
return `"${value.replaceAll('"', '""')}"`;
}
function optionList(values, selected) {
return values.map((v) => `<option value="${escapeAttr(v)}" ${v === selected ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('');
}
function numberValue(selector) {
const value = Number($(selector).value);
if (!Number.isFinite(value))
throw new Error(`Invalid numeric input: ${selector}`);
return value;
}
function signed(value) {
const rounded = Number(value.toFixed(2));
return `${rounded > 0 ? '+' : ''}${formatNumber(rounded)}`;
}
function slugify(value) {
return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}
function errorMessage(error) {
return error instanceof Error ? error.message : String(error);
}
function escapeHtml(value) {
return value.replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[ch] ?? ch);
}
function escapeAttr(value) { return escapeHtml(value); }
init();

