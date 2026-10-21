import React from 'react';
import {
  Compass,
  FileCode,
  HelpCircle,
  MapPin,
  Radio,
  ShieldAlert,
  Smartphone,
  Wifi,
  Zap,
} from 'lucide-react';

export const FieldGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Hero Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#121922] border border-slate-800 shadow-xl">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
          คู่มือการสื่อสารและนำทาง PBMaps ในป่าลึกไร้สัญญาณ (Wilderness Offline Field Guide)
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          ในพื้นที่ทุรกันดาร ป่าทึบ หรือหุบเขาสูงที่ไม่มีสัญญาณมือถือและอินเทอร์เน็ตแม้แต่ขีดเดียว <strong>PBMaps</strong> ทำงานร่วมกับการเชื่อมต่อแบบ Peer-to-Peer ด้วยคลื่นวิทยุ <strong>LoRa (Long Range)</strong> และ <strong>Bluetooth Mesh</strong> เพื่อติดตามพิกัดเพื่อนร่วมทีมแบบ Real-time และการกู้ภัยฉุกเฉิน
        </p>
      </div>

      {/* Grid of Key Concepts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LoRa Section */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Radio className="w-5 h-5 shrink-0" />
            <span>1. ทำไม LoRa จึงส่งสัญญาณได้ไกลทะลุป่า?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            LoRa ใช้เทคโนโลยีการมอดูเลตแบบ <strong>Chirp Spread Spectrum (CSS)</strong> ในย่านความถี่ต่ำ Sub-GHz (433 / 868 / 915 MHz) คลื่นความถี่ระดับนี้มีความยาวคลื่นมากพอที่จะเลี้ยวเบนข้ามยอดไม้ เจาะผ่านใบไม้หนาทึบ และสะท้อนตามไหล่เขาได้ดีกว่าคลื่น 4G/5G และ Wi-Fi หลายเท่าตัว
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 text-xs font-mono text-slate-400 space-y-1">
            <p>• ระยะส่งในป่าทึบ: 2 – 6 กิโลเมตร</p>
            <p>• ระยะส่งจากยอดเขาสันเขา (Line-of-Sight): 15 – 40+ กิโลเมตร</p>
            <p>• พลังงาน: 100mW (แบตเตอรี่ 18650 ก้อนเดียวเปิดทิ้งไว้ได้ 3-5 วัน)</p>
          </div>
        </div>

        {/* Bluetooth Mesh Section */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Wifi className="w-5 h-5 shrink-0" />
            <span>2. Bluetooth Mesh ทำงานอย่างไร?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            หากไม่มีกล่องอุปกรณ์ LoRa เสริม มือถือทั่วไปสามารถใช้ <strong>Bluetooth Low Energy (BLE) Mesh</strong> เพื่อสื่อสารกันในระยะ 30 – 100 เมตร โดยส่งข้อมูลแบบ <em>Multi-Hop Relay</em> คือให้เครื่องของเพื่อนที่อยู่ตรงกลางทำหน้าที่เป็นสะพานกระโดดส่งต่อพิกัดไปเรื่อยๆ จนถึงหัวขบวนและท้ายขบวน
          </p>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 text-xs font-mono text-slate-400 space-y-1">
            <p>• ระยะหวังผล: 30 - 80 เมตรต่อ Node</p>
            <p>• อุปกรณ์: มือถือสมาร์ทโฟนทั่วไปไม่ต้องซื้อเพิ่ม</p>
            <p>• ความเหมาะสม: กลุ่มเดินป่าที่เดินเรียงเดี่ยวในระยะสายตา</p>
          </div>
        </div>

        {/* Recommended Hardware */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Zap className="w-5 h-5 shrink-0" />
            <span>3. อุปกรณ์ฮาร์ดแวร์แนะนำที่หาซื้อได้ง่าย</span>
          </div>
          <div className="text-xs text-slate-300 space-y-2">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
              <p className="font-bold text-white">LilyGO T-Beam / T-Echo (LoRa + GPS)</p>
              <p className="text-[11px] text-slate-400">
                มีชิป GPS ในตัว + ภาครับส่ง LoRa SX1262 + ช่องใส่แบตเตอรี่ 18650 ห้อยเป้สะพายหลังได้สะดวก นิยมลง Firmware Meshtastic
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-850">
              <p className="font-bold text-white">Heltec LoRa32 / V3</p>
              <p className="text-[11px] text-slate-400">
                ขนาดเล็กเท่ากล่องไม้ขีด มีหน้าจอ OLED แสดงพิกัดและแบตเตอรี่ น้ำหนักเบามาก
              </p>
            </div>
          </div>
        </div>

        {/* GPX Navigation Section */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <FileCode className="w-5 h-5 shrink-0" />
            <span>4. มาตรฐานไฟล์ .GPX และการนำทางย้อนรอย (Backtrack)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            ไฟล์ <strong>.gpx (GPS Exchange Format)</strong> เป็นไฟล์มาตรฐานระดับสากล บันทึกพิกัด Latitude, Longitude, Altitude และ Timestamp ที่สามารถนำไปเปิดในนาฬิกา Garmin, Gaia GPS, Google Earth หรือเครื่อง GPS เดินป่ามืออาชีพได้ทันที
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>โหมด Backtrack:</strong> หากหลงทิศในป่า ให้กดปุ่ม Backtrack ระบบจะกลับทิศทางเส้นทางที่เคยเดินมา พร้อมลูกศรชี้บอกระยะทางเบี่ยงออกจากแนวเดิม เพื่อให้คุณเดินกลับจุดเริ่มต้นได้อย่างปลอดภัย
          </p>
        </div>
      </div>

      {/* Satellite vs GPS Detailed Breakdown */}
      <div className="p-6 rounded-2xl bg-slate-900/95 border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              ใช้สัญญาณ GPS ในการส่งสัญญาณหากันได้ไหม? แล้วระบบดาวเทียม (Satellite) ต้องใช้อะไร?
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              คำตอบทางเทคนิคที่ถูกต้องสำหรับการเดินป่าและการสำรวจทุรกันดาร
            </p>
          </div>
        </div>

        {/* The Big Truth: GPS is Receive-Only */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
              ข้อเท็จจริง
            </span>
            <span>สัญญาณ GPS ทั่วไป "ส่งข้อมูลหากันไม่ได้" (Receive-Only)</span>
          </div>
          <p className="leading-relaxed">
            ดาวเทียม GPS (สหรัฐฯ), GLONASS (รัสเซีย), หรือ Galileo (ยุโรป) ที่โคจรอยู่สูงกว่า <strong>20,200 กิโลเมตร</strong> ทำหน้าที่ยิงสัญญาณเวลาและพิกัดลงมายังโลกทางเดียว (One-Way Downlink) ชิป GPS ในสมาร์ทโฟนของทุกคนทำหน้าที่เป็นเพียง <strong>"เครื่องรับฟังวิทยุ"</strong> เพื่อคำนวณว่าตัวเราอยู่ที่ไหน ไม่มีเสาส่งกำลังและแบตเตอรี่มากพอที่จะยิงคลื่นสะท้อนกลับขึ้นไปหาดาวเทียม GPS ได้ครับ
          </p>
        </div>

        {/* What Can Send via Satellite? */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="font-bold text-cyan-400 text-sm flex items-center gap-1.5">
              <span>🛰 ระบบดาวเทียมสื่อสาร 2 ทาง (Two-Way Satellite)</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              หากต้องการส่งพิกัดขึ้นดาวเทียมจริงๆ ต้องใช้อุปกรณ์ประเภท <strong>Satellite Communicator</strong> เช่น:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li><strong>Iridium Network (เช่น Garmin inReach, Bivy Stick, ZOLEO):</strong> ยิงข้อความสั้นและพิกัดขึ้นดาวเทียมวงโคจรต่ำ (LEO 780 กม.) ครอบคลุมทั่วโลก 100%</li>
              <li><strong>Globalstar Network (เช่น SPOT Gen4 / SPOT X):</strong> ส่งพิกัดและแจ้งเตือน SOS</li>
              <li><strong>Apple Satellite SOS:</strong> บน iPhone 14/15/16 ยิงสัญญาณฉุกเฉินขึ้นดาวเทียม Globalstar โดยตรง</li>
              <li><strong>Starlink Direct-to-Cell:</strong> เทคโนโลยีใหม่ที่เชื่อมมือถือ 5G เข้ากับดาวเทียมโดยตรง</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
              <span>⚖ เปรียบเทียบ: LoRa Mesh vs Satellite Messenger</span>
            </h4>
            <div className="space-y-2 text-slate-300">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <p className="font-bold text-emerald-400">LoRa / BLE Mesh (PBMaps):</p>
                <p className="text-[11px] text-slate-400">• ฟรี 100% ตลอดชีพ ไม่มีค่าบริการรายเดือน</p>
                <p className="text-[11px] text-slate-400">• คลื่นทะลุเรือนยอดไม้หนาทึบและหุบเขาได้ดีมาก</p>
                <p className="text-[11px] text-slate-400">• เหมาะสำหรับ: แชร์พิกัดระหว่างเพื่อนทั้งกลุ่ม 2-15+ กม.</p>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <p className="font-bold text-blue-400">Satellite Messenger (inReach / Iridium):</p>
                <p className="text-[11px] text-slate-400">• มีค่าบริการรายเดือน (ประมาณ 500 – 1,800 บาท/เดือน)</p>
                <p className="text-[11px] text-slate-400">• ต้องมี "มุมมองท้องฟ้าเปิดโล่ง" (ถ้าป่าทึบหรือในถ้ำสัญญาณจะหาย)</p>
                <p className="text-[11px] text-slate-400">• เหมาะสำหรับ: ส่งข่าวกลับบ้านหรือกู้ภัยระดับชาติ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Pro Strategy */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 text-emerald-200 text-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <h3 className="font-bold text-white text-sm">
              สถาปัตยกรรมระดับสากล: รับดาวเทียม (GPS In) + แชร์เพื่อนด้วย LoRa (LoRa Out)
            </h3>
          </div>
          <p className="leading-relaxed text-slate-300">
            นี่คือ <strong>"สูตรที่สมบูรณ์แบบและดีที่สุด 100%"</strong> ที่นักเดินป่า เจ้าหน้าที่อุทยาน และทีมกู้ภัยทั่วโลกเลือกใช้ เพราะรวมข้อดีของทั้ง 2 โลกเข้าด้วยกัน:
          </p>

          {/* ASCII Data Flow */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300 leading-relaxed overflow-x-auto">
            ┌──────────────────────┐       ┌────────────────────────┐       ┌──────────────────────┐<br/>
            │ 🛰 ดาวเทียม GPS/GNSS │ ───►  │ 📱 มือถือ + แอพ PBMaps │ ───►  │ 📡 คลื่นวิทยุ LoRa   │<br/>
            │ (รับคลื่นฟรีจากฟ้า)   │       │ (บันทึก Track .GPX)     │       │ (แชร์เพื่อน 2-15 กม.) │<br/>
            └──────────────────────┘       └────────────────────────┘       └──────────────────────┘<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;┌──────────────────────┐<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ 👥 เพื่อนเห็นบนแผนที่  │<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│ Real-time & เข็มทิศ  │<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──────────────────────┘
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
              <p className="font-bold text-amber-400">1. ขารับ: ดาวเทียม GPS (แม่นยำสูง ฟรี 100%)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                มือถือรับสัญญาณจากดาวเทียม GPS บนฟ้าได้ทุกที่บนโลกโดยไม่ต้องต่อเน็ต และบันทึกเส้นทางเดินป่า (Breadcrumb trail) พร้อมระดับความสูงเป็นไฟล์ .GPX ไว้ในเครื่อง
              </p>
            </div>
            <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
              <p className="font-bold text-emerald-400">2. ขาส่ง: คลื่น LoRa (ทะลุป่าทึบ ไร้เน็ต)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                แอพ PBMaps นำพิกัด GPS ที่ได้ ยิงผ่านกล่อง LoRa ไปหาเพื่อนร่วมทีมทุกคนในรัศมี 2 – 15+ กิโลเมตร ทะลุไหล่เขาและยอดไม้ ทำให้ทุกคนเห็นพิกัดของกันและกันแบบสดๆ!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Apple Find My Integration Section */}
      <div className="p-6 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2.5 text-white font-bold text-sm">
          <span className="text-xl">🍏</span>
          <span>5. แอพ PBMaps ซิงค์กับระบบ Apple "Find My" (ค้นหาของฉัน) ได้ไหม?</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          นี่เป็นคำถามยอดนิยม คำตอบทางเทคนิคคือ <strong>"ไม่สามารถซิงค์อัตโนมัติแบบ Real-time ตรงๆ ผ่านระบบคลาวด์ได้ แต่สามารถส่งต่อลิงก์พิกัดข้ามไปมาระหว่างกันได้"</strong> เนื่องจาก:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-amber-400">ข้อจำกัดของ Apple Find My ในป่า:</h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400">
              <li><strong>ระบบปิดและเข้ารหัสเฉพาะ Apple ID:</strong> Apple ไม่อนุญาตให้เว็บแอพภายนอกเข้าไปดึงพิกัด Real-time ของ Find My</li>
              <li><strong>ในป่าไร้สัญญาณเน็ต Find My จะค้าง:</strong> Find My ต้องใช้อินเทอร์เน็ตส่งพิกัดขึ้นเซิร์ฟเวอร์ Apple หากไม่มีเน็ต ตำแหน่งเพื่อนใน Find My จะไม่ขยับเลย</li>
              <li><strong>Find My via Satellite (iPhone 14/15/16):</strong> ส่งได้เพียงภาพพิกัดนิ่ง (Snapshot) 1 ครั้งทุกๆ 15 นาที ไม่สามารถติดตามแบบต่อเนื่องได้</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400">วิธีที่ PBMaps ทำงานร่วมกับ iPhone:</h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-400">
              <li><strong>สร้างลิงก์ Apple Maps ในคลิกเดียว:</strong> ในแท็บ "⚡ Zero-Hardware Hub" คุณสามารถกดสร้างลิงก์ Apple Maps ของพิกัดตนเอง ส่งให้เพื่อน iPhone เปิดนำทางได้ทันที</li>
              <li><strong>นำเข้าลิงก์ Apple Maps / SMS ดาวเทียม:</strong> หากเพื่อน iPhone ส่งพิกัดมาเป็นลิงก์ Apple Maps สามารถนำมาวางใน PBMaps เพื่อปักหมุดและเปิดเรดาร์นำทางได้ทันที</li>
              <li><strong>ใช้ LoRa / PBMaps แทนในป่า:</strong> PBMaps ออกแบบมาเพื่ออุดจุดอ่อนของ Find My ในป่าโดยเฉพาะ เพื่อให้ทุกคนเห็นตำแหน่งกันสดๆ 100% แม้ไม่มีเน็ต</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Emergency Distress Protocol */}
      <div className="p-5 rounded-xl bg-red-950/40 border border-red-500/60 space-y-2">
        <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span>ระเบียบปฏิบัติเมื่อเกิดเหตุฉุกเฉิน (SOS Emergency Beacon Protocol)</span>
        </h3>
        <p className="text-xs text-red-200 leading-relaxed">
          เมื่อมีคนในทีมบาดเจ็บหรือพลัดหลง ให้กดปุ่ม <strong>"Broadcast Emergency SOS Beacon"</strong> สัญญาณคลื่นวิทยุฉุกเฉินจะถูกยิงกระจายทุกๆ 10 วินาที พร้อมพิกัด GPS แม่นยำระดับ 5 เมตร ระดับความสูง และเปอร์เซ็นต์แบตเตอรี่ หน้าจอมือถือของเพื่อนร่วมทีมทุกคนในรัศมีคลื่นจะสั่นเตือนและล็อคลูกศรนำทางไปยังผู้ประสบภัยทันที
        </p>
      </div>
    </div>
  );
};
