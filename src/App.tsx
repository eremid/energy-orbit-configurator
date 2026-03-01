import { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Zap, 
  Sun, 
  Battery, 
  Settings, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Info,
  Languages,
  FileJson,
  Check,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

interface ConfigState {
  haURL: string;
  haToken: string;
  gridEntityId: string;
  gridMax: number;
  solarEntityIds: string[];
  solarMax: number;
  batteryEntityIds: string[];
  batteryPowerEntityIds: string[];
  batteryPowerMax: number;
}

const INITIAL_STATE: ConfigState = {
  haURL: '',
  haToken: '',
  gridEntityId: '',
  gridMax: 6000,
  solarEntityIds: [''],
  solarMax: 3000,
  batteryEntityIds: [''],
  batteryPowerEntityIds: [''],
  batteryPowerMax: 2400,
};

type Language = 'fr' | 'en';

const translations = {
  fr: {
    title: "Energy Orbit Configurator",
    subtitle: "Générez votre QR Code de configuration pour Apple Watch.",
    privacyTitle: "Confidentialité garantie",
    privacyDesc: "Toutes les données sont traitées localement dans votre navigateur. Rien n'est envoyé à un serveur. L'URL et le Token sont optionnels.",
    haTitle: "Connexion Home Assistant (Optionnel)",
    haURL: "URL Home Assistant",
    haToken: "Token d'Accès Longue Durée",
    gridTitle: "Réseau Électrique",
    gridEntity: "Entité Puissance Réseau",
    powerMax: "Puissance Max (W)",
    solarTitle: "Production Solaire",
    solarEntity: "Entité Solaire",
    add: "Ajouter",
    battLevelTitle: "État de Charge (%)",
    battLevelEntity: "Entité Batterie (%)",
    battPowerTitle: "Puissance Batterie (W)",
    battPowerEntity: "Entité Puissance (W)",
    previewTitle: "Votre Configuration QR",
    formatTitle: "Format JSON",
    footer: "Energy Orbit Configurator — Pour une Apple Watch mieux informée.",
    validationErrorEntity: "Format invalide : 'sensor.nom_entite' (minuscules, chiffres, underscores uniquement).",
    validationErrorURL: "L'URL doit commencer par http:// ou https://",
    placeholderHA: "https://votre-ha.duckdns.org",
    placeholderToken: "eyJhbGciOiJIUzI1NiI...",
    placeholderSensor: "sensor.ma_donnee",
    importTitle: "Importer un JSON",
    importBtn: "Appliquer le JSON",
    importPlaceholder: "Collez votre JSON ici...",
    importSuccess: "Configuration importée !",
    importError: "JSON invalide ou URL incorrecte.",
    qrWarning: "Attention : Ce QR Code contient votre Token Home Assistant. Ne le partagez jamais publiquement !"
  },
  en: {
    title: "Energy Orbit Configurator",
    subtitle: "Generate your configuration QR Code for Apple Watch.",
    privacyTitle: "Privacy Guaranteed",
    privacyDesc: "All data is processed locally in your browser. Nothing is sent to a server. URL and Token are optional.",
    haTitle: "Home Assistant Connection (Optional)",
    haURL: "Home Assistant URL",
    haToken: "Long-Lived Access Token",
    gridTitle: "Electrical Grid",
    gridEntity: "Grid Power Entity",
    powerMax: "Max Power (W)",
    solarTitle: "Solar Production",
    solarEntity: "Solar Entity",
    add: "Add",
    battLevelTitle: "Battery Level (%)",
    battLevelEntity: "Battery Entity (%)",
    battPowerTitle: "Battery Power (W)",
    battPowerEntity: "Power Entity (W)",
    previewTitle: "Your QR Configuration",
    formatTitle: "JSON Format",
    footer: "Energy Orbit Configurator — For a better informed Apple Watch.",
    validationErrorEntity: "Invalid format: 'sensor.entity_name' (lowercase, numbers, underscores only).",
    validationErrorURL: "URL must start with http:// or https://",
    placeholderHA: "https://your-ha.duckdns.org",
    placeholderToken: "eyJhbGciOiJIUzI1NiI...",
    placeholderSensor: "sensor.my_data",
    importTitle: "Import JSON",
    importBtn: "Apply JSON",
    importPlaceholder: "Paste your JSON here...",
    importSuccess: "Configuration imported!",
    importError: "Invalid JSON or malformed URL.",
    qrWarning: "Warning: This QR Code contains your Home Assistant Token. Never share it publicly!"
  }
};

const InputWithError = ({ label, value, onChange, placeholder, type = "text", error, errorMessage }: any) => (
  <div>
    <label>{label}</label>
    <input 
      type={type} 
      placeholder={placeholder} 
      className={`w-full ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
      value={value}
      onChange={onChange}
    />
    {error && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
  </div>
);

export default function App() {
  const [config, setConfig] = useState<ConfigState>(INITIAL_STATE);
  const [lang, setLang] = useState<Language>('fr');
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const t = translations[lang];

  const isValidEntityId = (id: string) => {
    if (id === '') return true;
    return /^sensor\.[a-z0-9_]+$/.test(id);
  };

  const isValidHAUrl = (url: string) => {
    if (url === '') return true;
    return /^https?:\/\/.+$/.test(url);
  };

  const sanitizeEntity = (val: string) => {
    return val.toLowerCase().replace(/[^a-z0-9_.]/g, '');
  };

  const qrData = useMemo(() => {
    // Create a dynamic object to hold only the fields with content
    const cleanedConfig: any = { ...config };
    
    // Always trim
    cleanedConfig.haURL = config.haURL.trim();
    cleanedConfig.haToken = config.haToken.trim();
    cleanedConfig.gridEntityId = config.gridEntityId.trim();
    
    // Remove URL and Token if empty to avoid cluttering the QR code
    if (!cleanedConfig.haURL) delete cleanedConfig.haURL;
    if (!cleanedConfig.haToken) delete cleanedConfig.haToken;

    cleanedConfig.solarEntityIds = config.solarEntityIds
      .map(id => id.trim())
      .filter(id => id !== '');
    
    cleanedConfig.batteryEntityIds = config.batteryEntityIds
      .map(id => id.trim())
      .filter(id => id !== '');
      
    cleanedConfig.batteryPowerEntityIds = config.batteryPowerEntityIds
      .map(id => id.trim())
      .filter(id => id !== '');
    
    cleanedConfig.gridMax = Number(config.gridMax);
    cleanedConfig.solarMax = Number(config.solarMax);
    cleanedConfig.batteryPowerMax = Number(config.batteryPowerMax);

    return JSON.stringify(cleanedConfig);
  }, [config]);

  const handleEntityChange = (
    field: 'solarEntityIds' | 'batteryEntityIds' | 'batteryPowerEntityIds',
    index: number,
    value: string
  ) => {
    const newArray = [...config[field]];
    newArray[index] = sanitizeEntity(value);
    setConfig({ ...config, [field]: newArray });
  };

  const addEntity = (field: 'solarEntityIds' | 'batteryEntityIds' | 'batteryPowerEntityIds') => {
    setConfig({ ...config, [field]: [...config[field], ''] });
  };

  const removeEntity = (field: 'solarEntityIds' | 'batteryEntityIds' | 'batteryPowerEntityIds', index: number) => {
    const newArray = [...config[field]];
    newArray.splice(index, 1);
    setConfig({ ...config, [field]: newArray.length > 0 ? newArray : [''] });
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      
      // Validation strictly enforced on import
      const importedUrl = (parsed.haURL || '').trim();
      if (importedUrl !== '' && !isValidHAUrl(importedUrl)) {
        throw new Error('Invalid URL');
      }

      const newConfig: ConfigState = {
        haURL: importedUrl,
        haToken: (parsed.haToken || '').trim(),
        gridEntityId: sanitizeEntity(parsed.gridEntityId || ''),
        gridMax: Number(parsed.gridMax) || 6000,
        solarEntityIds: Array.isArray(parsed.solarEntityIds) ? parsed.solarEntityIds.map((id: string) => sanitizeEntity(id)) : [''],
        solarMax: Number(parsed.solarMax) || 3000,
        batteryEntityIds: Array.isArray(parsed.batteryEntityIds) ? parsed.batteryEntityIds.map((id: string) => sanitizeEntity(id)) : [''],
        batteryPowerEntityIds: Array.isArray(parsed.batteryPowerEntityIds) ? parsed.batteryPowerEntityIds.map((id: string) => sanitizeEntity(id)) : [''],
        batteryPowerMax: Number(parsed.batteryPowerMax) || 2400,
      };
      
      setConfig(newConfig);
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (e) {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Zap className="text-blue-500 w-8 h-8" />
                {t.title}
              </h1>
              <p className="text-slate-400 mt-2">{t.subtitle}</p>
            </div>
            <button 
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-slate-700"
            >
              <Languages className="w-4 h-4" />
              {lang.toUpperCase()}
            </button>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex gap-3 items-start">
            <ShieldCheck className="text-blue-400 w-6 h-6 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-200">{t.privacyTitle}</p>
              <p className="text-blue-100/70">{t.privacyDesc}</p>
            </div>
          </div>

          <section className="space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" /> {t.haTitle}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <InputWithError 
                  label={t.haURL}
                  placeholder={t.placeholderHA}
                  type="url"
                  value={config.haURL}
                  error={config.haURL && !isValidHAUrl(config.haURL)}
                  onChange={(e: any) => setConfig({ ...config, haURL: e.target.value.trim() })}
                  errorMessage={t.validationErrorURL}
                />
                <InputWithError 
                  label={t.haToken}
                  placeholder={t.placeholderToken}
                  type="password"
                  value={config.haToken}
                  onChange={(e: any) => setConfig({ ...config, haToken: e.target.value.trim() })}
                  errorMessage={t.validationErrorEntity}
                />
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-yellow-500">
                <Zap className="w-5 h-5" /> {t.gridTitle}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputWithError 
                  label={t.gridEntity}
                  placeholder={t.placeholderSensor}
                  value={config.gridEntityId}
                  error={config.gridEntityId && !isValidEntityId(config.gridEntityId)}
                  onChange={(e: any) => setConfig({ ...config, gridEntityId: sanitizeEntity(e.target.value) })}
                  errorMessage={t.validationErrorEntity}
                />
                <div>
                  <label>{t.powerMax}</label>
                  <input 
                    type="number" 
                    className="w-full"
                    value={config.gridMax}
                    onChange={(e) => setConfig({ ...config, gridMax: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-orange-500">
                  <Sun className="w-5 h-5" /> {t.solarTitle}
                </h2>
                <button onClick={() => addEntity('solarEntityIds')} className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md transition-colors flex items-center gap-1">
                  <Plus className="w-4 h-4" /> {t.add}
                </button>
              </div>
              <div className="space-y-3">
                {config.solarEntityIds.map((id, index) => (
                  <div key={index}>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder={t.placeholderSensor}
                        className={`flex-1 ${id && !isValidEntityId(id) ? 'border-red-500 focus:ring-red-500' : ''}`}
                        value={id}
                        onChange={(e) => handleEntityChange('solarEntityIds', index, e.target.value)}
                      />
                      <button onClick={() => removeEntity('solarEntityIds', index)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {id && !isValidEntityId(id) && <p className="text-red-500 text-xs mt-1">{t.validationErrorEntity}</p>}
                  </div>
                ))}
                <div className="pt-2">
                  <label>{t.powerMax}</label>
                  <input 
                    type="number" 
                    className="w-full"
                    value={config.solarMax}
                    onChange={(e) => setConfig({ ...config, solarMax: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-emerald-500">
                  <Battery className="w-5 h-5" /> {t.battLevelTitle}
                </h2>
                <button onClick={() => addEntity('batteryEntityIds')} className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md transition-colors flex items-center gap-1">
                  <Plus className="w-4 h-4" /> {t.add}
                </button>
              </div>
              <div className="space-y-3">
                {config.batteryEntityIds.map((id, index) => (
                  <div key={index}>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder={t.placeholderSensor}
                        className={`flex-1 ${id && !isValidEntityId(id) ? 'border-red-500 focus:ring-red-500' : ''}`}
                        value={id}
                        onChange={(e) => handleEntityChange('batteryEntityIds', index, e.target.value)}
                      />
                      <button onClick={() => removeEntity('batteryEntityIds', index)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {id && !isValidEntityId(id) && <p className="text-red-500 text-xs mt-1">{t.validationErrorEntity}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-blue-500">
                  <Zap className="w-5 h-5" /> {t.battPowerTitle}
                </h2>
                <button onClick={() => addEntity('batteryPowerEntityIds')} className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md transition-colors flex items-center gap-1">
                  <Plus className="w-4 h-4" /> {t.add}
                </button>
              </div>
              <div className="space-y-3">
                {config.batteryPowerEntityIds.map((id, index) => (
                  <div key={index}>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder={t.placeholderSensor}
                        className={`flex-1 ${id && !isValidEntityId(id) ? 'border-red-500 focus:ring-red-500' : ''}`}
                        value={id}
                        onChange={(e) => handleEntityChange('batteryPowerEntityIds', index, e.target.value)}
                      />
                      <button onClick={() => removeEntity('batteryPowerEntityIds', index)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {id && !isValidEntityId(id) && <p className="text-red-500 text-xs mt-1">{t.validationErrorEntity}</p>}
                  </div>
                ))}
                <div className="pt-2">
                  <label>{t.powerMax}</label>
                  <input 
                    type="number" 
                    className="w-full"
                    value={config.batteryPowerMax}
                    onChange={(e) => setConfig({ ...config, batteryPowerMax: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:sticky lg:top-8 space-y-8 h-fit">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <h3 className="text-slate-900 text-xl font-bold mb-6">{t.previewTitle}</h3>
            
            {config.haToken && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex gap-3 items-center text-sm animate-pulse">
                <AlertTriangle className="shrink-0 w-5 h-5 text-red-500" />
                <p className="font-medium leading-tight">{t.qrWarning}</p>
              </div>
            )}

            <div className="bg-slate-100 p-4 rounded-2xl">
              <QRCodeSVG 
                value={qrData} 
                size={256} 
                level="M" 
                includeMargin={true}
              />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileJson className="w-4 h-4" /> {t.importTitle}
            </h4>
            <textarea 
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={t.importPlaceholder}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
            <button 
              onClick={handleImport}
              className={`mt-3 w-full font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                importStatus === 'success' ? 'bg-emerald-600 text-white' : 
                importStatus === 'error' ? 'bg-red-600 text-white' : 
                'bg-slate-700 hover:bg-slate-600 text-slate-100'
              }`}
            >
              {importStatus === 'idle' && <><FileJson className="w-4 h-4" /> {t.importBtn}</>}
              {importStatus === 'success' && <><Check className="w-4 h-4" /> {t.importSuccess}</>}
              {importStatus === 'error' && <><AlertCircle className="w-4 h-4" /> {t.importError}</>}
            </button>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" /> {t.formatTitle}
            </h4>
            <pre className="text-xs bg-black/40 p-4 rounded-lg overflow-x-auto text-blue-300 font-mono">
              {(() => {
                const displayData = JSON.parse(qrData);
                if (displayData.haToken) displayData.haToken = '••••••••••••••••';
                return JSON.stringify(displayData, null, 2);
              })()}
            </pre>
          </div>
        </div>

      </div>
      
      <footer className="mt-16 text-center text-slate-500 text-sm">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
}
