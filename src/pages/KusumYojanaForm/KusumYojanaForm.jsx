import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase, supabaseReady } from '../../lib/supabase';
import { cleanPhone, isValidPhone, PHONE_LENGTH, PHONE_ERROR } from '../../utils/phone';

const MAX_SUBSTATION_KM = 3;

const inputCls = 'w-full h-12 border border-[#ecd9b8] rounded-lg px-3 text-base text-[#14301f] bg-[#fdecd0] focus:outline-none focus:ring-2 focus:ring-[#1f5a36] focus:bg-[#fff3de]';
const emptyForm = {
  ownerName: '', mobile: '', village: '', tehsil: '', district: '', khasraNumbers: '',
  totalAcres: '', farmerCount: '', substationName: '', substationRoadKm: '', roadToRoadKm: '', expectedRentPerAcre: ''
};

const Section = ({ title, children }) => (
  <section className="bg-[#fffaf0] border border-[#f0e2c4] rounded-2xl p-4 md:p-5 space-y-4">
    <h2 className="text-lg md:text-xl font-bold text-[#14301f]">{title}</h2>
    {children}
  </section>
);

const Field = ({ label, error, note, children }) => (
  <div className="space-y-1.5 min-w-0">
    <label className="block text-base font-medium text-[#14301f]">{label}</label>
    {children}
    {note && <p className="text-xs md:text-sm text-gray-600">{note}</p>}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

export default function KusumYojanaForm() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };
  const text = (key, props = {}) => (
    <input className={inputCls} value={form[key]} onChange={(e) => set(key, e.target.value)} {...props} />
  );
  const number = (key, props = {}) => (
    <input className={inputCls} type="number" min="0" step="any" inputMode="decimal" value={form[key]} onChange={(e) => set(key, e.target.value)} {...props} />
  );

  const validate = () => {
    const e = {};
    const required = 'यह जानकारी आवश्यक है';
    ['ownerName', 'village', 'tehsil', 'district', 'substationName'].forEach((k) => { if (!form[k].trim()) e[k] = required; });
    if (!isValidPhone(form.mobile) || !form.mobile) e.mobile = PHONE_ERROR;
    ['totalAcres', 'farmerCount', 'substationRoadKm', 'roadToRoadKm', 'expectedRentPerAcre'].forEach((k) => {
      if (form[k] === '' || Number.isNaN(Number(form[k])) || Number(form[k]) < 0) e[k] = required;
    });
    if (!e.totalAcres && Number(form.totalAcres) <= 0) e.totalAcres = 'रकबा 0 से अधिक होना चाहिए';
    if (!e.farmerCount && (Number(form.farmerCount) < 1 || !Number.isInteger(Number(form.farmerCount)))) e.farmerCount = 'किसानों की संख्या पूर्ण संख्या (कम से कम 1) में लिखें';
    return e;
  };

  // after the keyboard opens, bring the field being typed in to the middle of the visible area
  const keepFieldVisible = (e) => {
    const el = e.target;
    if (el.tagName === 'INPUT') setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (saving) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) { toast.error('कृपया सभी आवश्यक जानकारी सही भरें'); return; }
    if (!supabaseReady) { toast.error('Database is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env and rebuild'); return; }
    setSaving(true);
    const { error } = await supabase.from('kusum_land_proposals').insert({
      owner_name: form.ownerName.trim(),
      mobile: form.mobile,
      village: form.village.trim(),
      tehsil: form.tehsil.trim(),
      district: form.district.trim(),
      khasra_numbers: form.khasraNumbers.split(',').map((s) => s.trim()).filter(Boolean),
      total_acres: Number(form.totalAcres),
      farmer_count: Number(form.farmerCount),
      substation_name: form.substationName.trim(),
      substation_road_km: Number(form.substationRoadKm),
      road_to_road_km: Number(form.roadToRoadKm),
      expected_rent_per_acre: Number(form.expectedRentPerAcre)
    });
    setSaving(false);
    if (error) { toast.error(error.message || 'जानकारी सहेजी नहीं जा सकी'); return; }
    setSubmitted(true);
    setForm(emptyForm);
  };

  return (
    <div className="h-full flex flex-col bg-[#fdf3e1]">
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">धन्यवाद!</h2>
            <p className="text-sm text-gray-600">आपकी जानकारी सफलतापूर्वक जमा हो गई है।</p>
            <button type="button" autoFocus onClick={() => setSubmitted(false)} className="w-full py-2.5 font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all">ठीक है</button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate onFocus={keepFieldVisible} className="flex-1 flex flex-col min-h-0 w-full">
        <header className="flex-shrink-0 bg-[#14301f] px-4 py-3 md:py-4">
          <div className="max-w-3xl mx-auto space-y-1 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">कुसुम योजना – भूमि प्रस्ताव फॉर्म</h1>
            <p className="text-base md:text-lg text-[#e8b923] leading-snug">सौर संयंत्र हेतु 50 एकड़ भूमि, 25 वर्षों की अवधि तक किराए पर</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto min-h-0 px-3 md:px-4 py-3">
          <div className="max-w-3xl mx-auto space-y-3">
        <Section title="1. भूमि स्वामी / प्रतिनिधि की जानकारी">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="नाम" error={errors.ownerName}>{text('ownerName')}</Field>
            <Field label="मोबाइल नंबर" error={errors.mobile}>
              {text('mobile', { type: 'tel', inputMode: 'numeric', maxLength: PHONE_LENGTH, onChange: (e) => set('mobile', cleanPhone(e.target.value)) })}
            </Field>
          </div>
        </Section>

        <Section title="2. भूमि कहाँ स्थित है?">
          <div className="grid grid-cols-2 gap-4">
            <Field label="ग्राम का नाम" error={errors.village}>{text('village')}</Field>
            <Field label="तहसील" error={errors.tehsil}>{text('tehsil')}</Field>
            <Field label="जिला" error={errors.district}>{text('district')}</Field>
          </div>
          <Field label="खसरा नंबर (वैकल्पिक)" note="नोट: यदि एक से अधिक खसरा नंबर हैं, तो उन्हें कॉमा (,) लगाकर लिखें।">
            {text('khasraNumbers', { placeholder: 'जैसे: 112, 113/2, 114' })}
          </Field>
        </Section>

        <Section title="3. रकबा एवं स्वामित्व">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="कुल रकबा (एकड़)" error={errors.totalAcres}>{number('totalAcres')}</Field>
            <Field label="कुल रकबा कितने किसानों के नाम पर है (किसान)" error={errors.farmerCount}>{number('farmerCount', { step: '1' })}</Field>
          </div>
          <p className="text-xs text-gray-500">नोट: कम किसानों के नाम पर भूमि होने से अनुबंध की प्रक्रिया आसान रहती है।</p>
        </Section>

        <Section title="4. दूरी की जानकारी">
          <Field label="नजदीकी 33/11 केवी विद्युत सब स्टेशन का नाम" error={errors.substationName}>{text('substationName')}</Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="विद्युत सब स्टेशन से सड़क मार्ग की दूरी (किलोमीटर)" error={errors.substationRoadKm} note={`नोट: दूरी अधिकतम ${MAX_SUBSTATION_KM} किलोमीटर होनी चाहिए।`}>
              {number('substationRoadKm')}
            </Field>
            <Field label="रोड टू रोड दूरी (सड़क से सड़क की दूरी) (किलोमीटर)" error={errors.roadToRoadKm}>{number('roadToRoadKm')}</Field>
          </div>
        </Section>

        <Section title="5. अपेक्षित किराया">
          <Field label="अनुमानित वार्षिक किराया (प्रति एकड़)" error={errors.expectedRentPerAcre}>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-semibold">₹</span>
              {number('expectedRentPerAcre', { placeholder: 'जैसे: ₹ 25000' })}
            </div>
          </Field>
        </Section>

          </div>
        </div>

        <footer className="flex-shrink-0 px-3 md:px-4 py-3 border-t border-[#f0e2c4] bg-[#fdf3e1]">
          <div className="max-w-3xl mx-auto">
          <button
            type="submit"
            disabled={saving}
            className={`w-full h-12 px-4 text-lg font-bold bg-[#14301f] text-white rounded-xl hover:bg-[#1f5a36] transition-all ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {saving ? 'जमा हो रहा है...' : 'जानकारी जमा करें'}
          </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
