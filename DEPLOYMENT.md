# Deployment — new GitHub repository

Recommended repository name: `BHH_Chemotherapy_Calculator_V2`

## One-time GitHub setup

1. Create a **new** GitHub repository. Do not overwrite the legacy `Chemotherapy_Calculator` repository.
2. Upload/push the contents of this folder to the repository root on branch `main`.
3. Open **Settings → Pages**.
4. Under **Build and deployment → Source**, select **GitHub Actions**.
5. Open **Actions** and confirm `Validate and Deploy GitHub Pages` passes.
6. The deployed URL appears in the deployment job and in **Settings → Pages**.

The included workflow validates the structured regimen registry and critical dose-engine behaviors before deploying. If validation fails, deployment is blocked.

## Clinical release gate

A successful GitHub Pages deployment means the **software deployment** passed. It does not by itself approve the clinical dataset.

Before patient-care use, BHH Oncology Pharmacy/PTC should approve:

- each regimen/version;
- local Carboplatin kidney-function policy;
- drug/protocol-specific dose rounding;
- hard maximum/minimum rules;
- renal/hepatic/hematologic/toxicity modification rules;
- adult/pediatric scope;
- local formulations and unit semantics;
- signed golden test cases.

The current registry intentionally retains `localApproval: true` for the included pilot records.

---

# Cloudflare Pages + KV Synchronization Setup

ระบบรองรับการ Deploy ผ่าน **Cloudflare Pages** พร้อม **Cloudflare KV** เพื่อให้เมื่อเภสัชกรเครื่องใดเครื่องหนึ่ง Publish สูตรยา ข้อมูลจะซิงก์อัปเดตตรงกันทุกเครื่องทันที

### ขั้นตอนที่ 1: เชื่อมต่อ Cloudflare Pages เข้ากับ GitHub
1. เข้า [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. ไปที่เมนู **Workers & Pages** → **Overview** → **Create application** → แท็บ **Pages**
3. เลือก **Connect to Git** แล้วเลือก Repository: `JuiPharm/BHH_Chemotherapy_Calculator_V2`
4. ตั้งค่า Build Settings:
   - **Project name**: `bhh-chemotherapy-calculator`
   - **Production branch**: `main`
   - **Framework preset**: `None`
   - **Build command**: *(เว้นว่างไว้)*
   - **Build output directory**: `/` *(หรือเว้นว่างไว้)*
5. กด **Save and Deploy**

### ขั้นตอนที่ 2: สร้าง KV Namespace
1. ที่เมนูด้านซ้าย ไปที่ **Storage & Databases** → **KV**
2. กดปุ่ม **Create a namespace**
3. ตั้งชื่อ Namespace เช่น `BHH_REGIMENS_DATA` แล้วกด **Add**

### ขั้นตอนที่ 3: Bind KV เข้ากับ Pages Project (สำคัญ)
1. กลับมาที่ **Workers & Pages** → เลือกโปรเจกต์ Pages ที่สร้างไว้
2. ไปที่แท็บ **Settings** → เมนูด้านซ้ายเลือก **Functions**
3. เลื่อนลงมาที่หัวข้อ **KV namespace bindings**
4. กด **Add binding**
   - **Variable name**: `REGIMENS_KV` *(ต้องใช้ชื่อนี้ตรงตาม Functions API)*
   - **KV namespace**: เลือก namespace ที่สร้างไว้ (เช่น `BHH_REGIMENS_DATA`)
5. กด **Save**

### ขั้นตอนที่ 4: กำหนดรหัส PIN ใน Environment Variables (ตัวเลือกเสริม)
1. ที่แท็บ **Settings** → **Environment variables**
2. กด **Add variable**:
   - **Variable name**: `APPROVE_PIN`
   - **Value**: `1234` *(หรือรหัส PIN เภสัชกรตามที่ต้องการ)*
3. กด **Save**

### ขั้นตอนที่ 5: Redeploy ให้การตั้งค่ามีผล
1. ไปที่แท็บ **Deployments**
2. ที่การ Deploy ล่าสุด กดปุ่ม `...` → **Retry deployment**
3. เมื่อ Deploy เสร็จ ทุกเครื่องที่เข้าใช้งานจะซิงก์ข้อมูลสูตรยาที่ Approved ผ่าน Cloudflare KV อัตโนมัติทันที
