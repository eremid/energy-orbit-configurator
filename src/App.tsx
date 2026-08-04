import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import {
  ArrowDownUp,
  BatteryFull,
  Braces,
  Check,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Server,
  Sun,
  Trash2,
  TriangleAlert,
  Zap,
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

type EntityListField = 'solarEntityIds' | 'batteryEntityIds' | 'batteryPowerEntityIds';

type Language = 'fr' | 'en';

const REPO_URL = 'https://github.com/eremid/energy-orbit-configurator';

/** Upper bound of the peak-power sliders. Larger values can still be typed. */
const SLIDER_MAX = 12000;

/** The solar bolt sitting in the middle of the code, inlined so no request leaves. */
const QR_LOGO = {
  src:
    'data:image/svg+xml;base64,' +
    btoa(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FFCC00" stroke="#FFCC00" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    ),
  height: 40,
  width: 40,
  excavate: true,
} as const;

const translations = {
  fr: {
    locale: 'fr-FR',
    brand: 'Configurateur',
    privacyPill: 'Tout reste dans ce navigateur',
    title: 'Décrivez votre installation',
    subtitle:
      "Quatre étapes, puis un QR à scanner depuis l'app iPhone. Les identifiants Home Assistant sont facultatifs.",
    stepServer: 'Serveur',
    stepSolar: 'Solaire',
    stepBattery: 'Batterie',
    stepGrid: 'Réseau',
    serverTitle: 'Serveur Home Assistant',
    optional: 'Facultatif',
    address: 'Adresse',
    token: 'Jeton longue durée',
    showToken: 'Afficher le jeton',
    hideToken: 'Masquer le jeton',
    solarTitle: 'Production solaire',
    solarBadge: 'Σ additionnées',
    addEntity: 'Ajouter une entité',
    peak: 'Puissance crête',
    peakHint: 'échelle des jauges de la montre',
    batteryTitle: 'Batterie',
    batteryLevel: 'Charge — % · ⌀ moyenne',
    batteryPower: 'Puissance — W · Σ somme',
    signTitle: 'Signe attendu :',
    signValue: 'négatif = charge',
    signBody:
      "Conforme à l'app : une puissance batterie négative est lue comme une charge. Si votre onduleur fait l'inverse, inversez le signe dans Home Assistant.",
    mainsTitle: 'Réseau et maison',
    mainsBadge: "Même violet que l'app",
    gridEntity: 'Réseau',
    gridPeak: 'Puissance max',
    watchTitle: 'Aperçu montre',
    watchHint: 'exemple à l’échelle de vos puissances crêtes',
    viewBalance: 'Bilan',
    viewGauge: 'Jauge',
    viewContext: 'Contextuel',
    qrTitle: 'Votre QR',
    qrReady: 'Prêt à scanner',
    qrTitleAttr: 'QR Code de configuration Energy Orbit',
    qrWarning:
      'Ce QR contient votre jeton. À scanner devant vous, jamais à publier.',
    download: 'Télécharger',
    copy: 'Copier le JSON',
    copied: 'Copié',
    jsonTitle: 'JSON',
    importOpen: 'Importer',
    importClose: 'Fermer',
    importPlaceholder: 'Collez votre JSON ici…',
    importBtn: 'Appliquer le JSON',
    importSuccess: 'Configuration importée',
    importError: 'JSON invalide ou URL incorrecte',
    validationErrorEntity:
      "Format attendu : « sensor.nom_entite » (minuscules, chiffres, underscores).",
    validationErrorURL: 'L’URL doit commencer par http:// ou https://',
    placeholderHA: 'https://votre-ha.duckdns.org',
    placeholderToken: 'eyJhbGciOiJIUzI1NiI…',
    placeholderSensor: 'sensor.ma_donnee',
    remove: 'Supprimer',
    wHouse: 'Maison',
    wCharge: 'Charge',
    wSolar: 'Solaire',
    wGrid: 'Réseau',
    wBattery: 'Batt.',
    wProduced: 'Produit',
    wAutonomous: 'autonome',
    wSurplus: 'surplus',
    footer: 'Energy Orbit — pour une Apple Watch mieux informée.',
    footerHelp: 'Aide',
  },
  en: {
    locale: 'en-GB',
    brand: 'Configurator',
    privacyPill: 'Everything stays in this browser',
    title: 'Describe your installation',
    subtitle:
      'Four steps, then a QR to scan from the iPhone app. Home Assistant credentials are optional.',
    stepServer: 'Server',
    stepSolar: 'Solar',
    stepBattery: 'Battery',
    stepGrid: 'Grid',
    serverTitle: 'Home Assistant server',
    optional: 'Optional',
    address: 'Address',
    token: 'Long-lived token',
    showToken: 'Show token',
    hideToken: 'Hide token',
    solarTitle: 'Solar production',
    solarBadge: 'Σ added up',
    addEntity: 'Add an entity',
    peak: 'Peak power',
    peakHint: 'scale of the watch gauges',
    batteryTitle: 'Battery',
    batteryLevel: 'Charge — % · ⌀ average',
    batteryPower: 'Power — W · Σ sum',
    signTitle: 'Expected sign:',
    signValue: 'negative = charging',
    signBody:
      'Matches the app: negative battery power is read as charging. If your inverter does the opposite, flip the sign in Home Assistant.',
    mainsTitle: 'Grid and house',
    mainsBadge: 'Same purple as the app',
    gridEntity: 'Grid',
    gridPeak: 'Max power',
    watchTitle: 'Watch preview',
    watchHint: 'example scaled to your peak-power values',
    viewBalance: 'Balance',
    viewGauge: 'Gauge',
    viewContext: 'Contextual',
    qrTitle: 'Your QR',
    qrReady: 'Ready to scan',
    qrTitleAttr: 'Energy Orbit configuration QR Code',
    qrWarning:
      'This QR contains your token. Scan it in front of you, never publish it.',
    download: 'Download',
    copy: 'Copy the JSON',
    copied: 'Copied',
    jsonTitle: 'JSON',
    importOpen: 'Import',
    importClose: 'Close',
    importPlaceholder: 'Paste your JSON here…',
    importBtn: 'Apply the JSON',
    importSuccess: 'Configuration imported',
    importError: 'Invalid JSON or malformed URL',
    validationErrorEntity:
      'Expected format: "sensor.entity_name" (lowercase, digits, underscores).',
    validationErrorURL: 'The URL must start with http:// or https://',
    placeholderHA: 'https://your-ha.duckdns.org',
    placeholderToken: 'eyJhbGciOiJIUzI1NiI…',
    placeholderSensor: 'sensor.my_data',
    remove: 'Remove',
    wHouse: 'House',
    wCharge: 'Charge',
    wSolar: 'Solar',
    wGrid: 'Grid',
    wBattery: 'Batt.',
    wProduced: 'Produced',
    wAutonomous: 'autonomous',
    wSurplus: 'surplus',
    footer: 'Energy Orbit — for a better informed Apple Watch.',
    footerHelp: 'Help',
  },
} as const;

type Tone = 'neutral' | 'solar' | 'batt' | 'mains';

/** Tailwind cannot see interpolated class names, so every tone is spelled out. */
const TONES = {
  neutral: {
    card: 'bg-white/[0.035] border-white/[0.08]',
    field: 'border-white/[0.12] focus-within:border-white/30',
    icon: 'text-muted',
    text: 'text-muted',
    badge: 'bg-white/[0.07] text-muted',
    divider: 'border-white/[0.10]',
    accent: 'var(--color-muted)',
  },
  solar: {
    card: 'bg-linear-to-b from-solar/10 to-solar/[0.02] border-solar/25',
    field: 'border-solar/30 focus-within:border-solar/70',
    icon: 'text-solar',
    text: 'text-solar',
    badge: 'bg-solar/15 text-solar',
    divider: 'border-solar/15',
    accent: 'var(--color-solar)',
  },
  batt: {
    card: 'bg-linear-to-b from-batt/[0.08] to-batt/[0.02] border-batt/25',
    field: 'border-batt/30 focus-within:border-batt/70',
    icon: 'text-batt',
    text: 'text-batt',
    badge: 'bg-batt/15 text-batt',
    divider: 'border-batt/15',
    accent: 'var(--color-batt)',
  },
  mains: {
    card: 'bg-linear-to-b from-mains/[0.08] to-mains/[0.02] border-mains/25',
    field: 'border-mains/30 focus-within:border-mains/70',
    icon: 'text-mains',
    text: 'text-mains',
    badge: 'bg-mains/15 text-mains',
    divider: 'border-mains/15',
    accent: 'var(--color-mains)',
  },
} as const satisfies Record<Tone, Record<string, string>>;

const isValidEntityId = (id: string) => id === '' || /^sensor\.[a-z0-9_]+$/.test(id);

const isValidHAUrl = (url: string) => url === '' || /^https?:\/\/.+$/.test(url);

const sanitizeEntity = (val: string) => val.toLowerCase().replace(/[^a-z0-9_.]/g, '');

const filled = (ids: string[]) => ids.some((id) => id.trim() !== '' && isValidEntityId(id.trim()));

/** Updates every half-minute so the preview never shows a stale clock. */
function useClock(locale: string) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

// ─────────────────────────── shared pieces ───────────────────────────

function Card({
  tone,
  icon,
  title,
  badge,
  badgeMono,
  children,
}: {
  tone: Tone;
  icon: ReactNode;
  title: string;
  badge?: string;
  badgeMono?: boolean;
  children: ReactNode;
}) {
  const s = TONES[tone];
  return (
    <section
      className={`flex flex-col gap-4 rounded-[22px] border px-7 py-[26px] ${s.card}`}
    >
      <header className="flex items-center gap-3">
        <span className={s.icon} aria-hidden="true">
          {icon}
        </span>
        <h2 className="flex-1 text-[19px] font-black text-white">{title}</h2>
        {badge && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${s.badge} ${
              badgeMono ? 'font-mono font-bold' : 'tracking-[0.08em] uppercase'
            }`}
          >
            {badge}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[13px] font-extrabold tracking-[0.06em] text-muted uppercase"
    >
      {children}
    </label>
  );
}

function Well({
  tone,
  invalid,
  children,
}: {
  tone: Tone;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-[13px] border bg-well px-[15px] py-[13px] transition-colors ${
        invalid ? 'border-alert' : TONES[tone].field
      }`}
    >
      {children}
    </div>
  );
}

function TextField({
  id,
  tone,
  value,
  onChange,
  placeholder,
  type = 'text',
  invalid,
  errorMessage,
  trailing,
  autoComplete,
}: {
  id: string;
  tone: Tone;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: 'text' | 'url' | 'password';
  invalid?: boolean;
  errorMessage?: string;
  trailing?: ReactNode;
  autoComplete?: string;
}) {
  return (
    <>
      <Well tone={tone} invalid={invalid}>
        <input
          id={id}
          type={type}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-white outline-none placeholder:text-faint"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
        />
        {trailing}
      </Well>
      {invalid && errorMessage && (
        <p role="alert" className="text-xs font-semibold text-alert">
          {errorMessage}
        </p>
      )}
    </>
  );
}

/** One entity id, with the remove control the design puts inside the field. */
function EntityRow({
  id,
  tone,
  value,
  placeholder,
  errorMessage,
  removeLabel,
  onChange,
  onRemove,
}: {
  id: string;
  tone: Tone;
  value: string;
  placeholder: string;
  errorMessage: string;
  removeLabel: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
}) {
  const invalid = value !== '' && !isValidEntityId(value);
  return (
    <div className="flex flex-col gap-1.5">
      <TextField
        id={id}
        tone={tone}
        value={value}
        onChange={(v) => onChange(sanitizeEntity(v))}
        placeholder={placeholder}
        invalid={invalid}
        errorMessage={errorMessage}
        trailing={
          onRemove && (
            <button
              type="button"
              onClick={onRemove}
              title={removeLabel}
              aria-label={`${removeLabel} — ${value || placeholder}`}
              className="shrink-0 text-dim transition-colors hover:text-alert"
            >
              <Trash2 className="size-[18px]" />
            </button>
          )
        }
      />
    </div>
  );
}

function AddEntityButton({
  tone,
  label,
  onClick,
}: {
  tone: Tone;
  label: string;
  onClick: () => void;
}) {
  const s = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-[13px] border border-dashed px-[15px] py-[11px] text-sm font-extrabold transition-colors ${s.field} ${s.text} hover:bg-white/5`}
    >
      <Plus className="size-[18px]" />
      {label}
    </button>
  );
}

/** Peak power: a slider for the feel of it, a typeable readout for precision. */
function PeakSlider({
  id,
  tone,
  label,
  hint,
  value,
  locale,
  onChange,
}: {
  id: string;
  tone: Tone;
  label: string;
  hint?: string;
  value: number;
  locale: string;
  onChange: (value: number) => void;
}) {
  const s = TONES[tone];
  const fill = `${Math.min(100, (value / SLIDER_MAX) * 100)}%`;
  return (
    <div
      className={`flex flex-col gap-3 border-t pt-3.5 sm:flex-row sm:items-center sm:gap-[18px] ${s.divider}`}
    >
      <div className="flex flex-col gap-0.5">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {hint && <span className="text-xs font-semibold text-dim">{hint}</span>}
      </div>
      <div className="flex flex-1 items-center gap-3.5">
        <input
          id={id}
          type="range"
          className="eo-range flex-1"
          style={{ '--eo-accent': s.accent, '--eo-fill': fill } as CSSProperties}
          min={0}
          max={SLIDER_MAX}
          step={100}
          value={Math.min(value, SLIDER_MAX)}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
        <div className="flex shrink-0 items-baseline gap-1">
          <input
            type="number"
            className="eo-num w-[62px] bg-transparent text-right font-mono text-[15px] font-bold text-white outline-none"
            min={0}
            step={100}
            value={value}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
            aria-label={`${label} (W)`}
          />
          <span className="font-mono text-[15px] font-bold text-muted" aria-hidden="true">
            W
          </span>
          <span className="sr-only">{new Intl.NumberFormat(locale).format(value)} watts</span>
        </div>
      </div>
    </div>
  );
}

function Stepper({ steps }: { steps: { label: string; done: boolean }[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-3">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={`flex items-center gap-3 ${
            index < steps.length - 1 ? 'flex-1' : ''
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span
              className={`flex size-[26px] items-center justify-center rounded-full text-[13px] font-black ${
                step.done ? 'bg-solar text-ink' : 'bg-white/10 text-muted'
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`text-[13px] font-extrabold whitespace-nowrap ${
                step.done ? 'text-white' : 'text-muted'
              }`}
            >
              {step.label}
            </span>
          </span>
          {index < steps.length - 1 && (
            <span
              aria-hidden="true"
              className={`h-0.5 min-w-3 flex-1 ${step.done ? 'bg-solar/40' : 'bg-white/[0.12]'}`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}

// ─────────────────────────── watch preview ───────────────────────────

interface Snapshot {
  solar: number;
  house: number;
  charge: number;
  /** Production the battery cannot absorb — exported rather than drawn. */
  surplus: number;
  level: number;
}

type WatchView = 'balance' | 'gauge' | 'context';

const BEZEL =
  '0 0 0 6px #2b2b2e, 0 0 0 8px #141416, 0 14px 34px rgba(0, 0, 0, 0.6)';

function WatchLabel({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`text-[9px] font-black tracking-[0.08em] uppercase ${TONES[tone].text}`}
    >
      {children}
    </span>
  );
}

function BalanceView({
  snap,
  t,
  fmt,
}: {
  snap: Snapshot;
  t: (typeof translations)[Language];
  fmt: (n: number) => string;
}) {
  return (
    <>
      <div className="flex items-baseline gap-1 text-solar">
        <span className="text-[34px] leading-none font-black tracking-[-0.03em]">
          {fmt(snap.solar)}
        </span>
        <span className="text-sm font-extrabold">W</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3.5 rounded-[4px] bg-linear-to-b from-[#FFD84D] to-solar" />
        <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-[4px]">
          <div
            className="bg-linear-to-b from-[#C46BE8] to-mains"
            style={{ flex: snap.house }}
          />
          <div
            className="bg-linear-to-b from-[#3ECBFF] to-batt"
            style={{ flex: snap.charge }}
          />
          {snap.surplus > 0 && (
            <div
              className="bg-linear-to-b from-[#6CE58C] to-good"
              style={{ flex: snap.surplus }}
            />
          )}
        </div>
        <div className="flex gap-0.5">
          <div className="flex flex-col leading-[1.1]" style={{ flex: snap.house }}>
            <span className="text-[13px] font-black text-white">{fmt(snap.house)}</span>
            <WatchLabel tone="mains">{t.wHouse}</WatchLabel>
          </div>
          <div className="flex flex-col leading-[1.1]" style={{ flex: snap.charge }}>
            <span className="text-[13px] font-black text-white">{fmt(snap.charge)}</span>
            <WatchLabel tone="batt">{t.wCharge}</WatchLabel>
          </div>
        </div>
      </div>
      <div className="mt-auto flex items-center gap-1.5">
        <div className="h-[7px] flex-1 overflow-hidden rounded-full bg-white/[0.12]">
          <div className="h-full bg-batt" style={{ width: `${snap.level}%` }} />
        </div>
        <span className="text-xs font-black text-white">{snap.level} %</span>
      </div>
      <div className="text-[10px] leading-tight font-black tracking-[0.03em] text-good uppercase">
        {t.wGrid} 0 W — {snap.surplus > 0 ? t.wSurplus : t.wAutonomous}
      </div>
    </>
  );
}

function GaugeView({
  snap,
  peak,
  t,
  fmt,
}: {
  snap: Snapshot;
  peak: number;
  t: (typeof translations)[Language];
  fmt: (n: number) => string;
}) {
  const r = 62;
  const circumference = 2 * Math.PI * r;
  const share = peak > 0 ? Math.min(1, snap.solar / peak) : 0;
  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center">
        <svg viewBox="0 0 150 150" className="w-[116px]" aria-hidden="true">
          <g transform="rotate(-90 75 75)">
            <circle
              cx="75"
              cy="75"
              r={r}
              fill="none"
              stroke="var(--color-solar)"
              strokeOpacity="0.14"
              strokeWidth="12"
            />
            <circle
              cx="75"
              cy="75"
              r={r}
              fill="none"
              stroke="var(--color-solar)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${circumference * share} ${circumference}`}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-0.5 text-solar">
            <span className="text-[24px] leading-none font-black tracking-[-0.04em]">
              {fmt(snap.solar)}
            </span>
            <span className="text-[10px] font-extrabold">W</span>
          </div>
          <span className="text-[9px] font-extrabold tracking-[0.14em] text-solar/70 uppercase">
            {t.wSolar}
          </span>
        </div>
      </div>
      <div className="flex gap-1.5">
        {(
          [
            { tone: 'mains', value: `${fmt(snap.house)} W`, label: t.wHouse },
            { tone: 'batt', value: `${snap.level} %`, label: t.wCharge },
            { tone: 'good', value: '0 W', label: t.wGrid },
          ] as const
        ).map((pill) => (
          <div
            key={pill.label}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl border px-0.5 py-1.5 ${
              pill.tone === 'mains'
                ? 'border-mains/30 bg-mains/[0.12]'
                : pill.tone === 'batt'
                  ? 'border-batt/30 bg-batt/[0.12]'
                  : 'border-good/[0.28] bg-good/10'
            }`}
          >
            <span className="text-[12px] leading-none font-black whitespace-nowrap text-white">
              {pill.value}
            </span>
            <span
              className={`text-[8px] font-black tracking-[0.06em] whitespace-nowrap uppercase ${
                pill.tone === 'mains'
                  ? 'text-mains'
                  : pill.tone === 'batt'
                    ? 'text-batt'
                    : 'text-good'
              }`}
            >
              {pill.label}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function ContextView({
  snap,
  t,
  fmt,
  fmtKw,
}: {
  snap: Snapshot;
  t: (typeof translations)[Language];
  fmt: (n: number) => string;
  fmtKw: (n: number) => string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1">
      <Sun className="size-6 text-solar" aria-hidden="true" />
      <div className="flex items-baseline gap-1 text-solar">
        <span className="text-[40px] leading-none font-black tracking-[-0.03em]">
          {fmt(snap.solar)}
        </span>
        <span className="text-base font-extrabold">W</span>
      </div>
      <span className="text-[10px] font-extrabold tracking-[0.14em] text-solar/70 uppercase">
        {t.wSolar}
      </span>
      <div className="mt-4 flex w-full justify-between text-xs font-extrabold text-white">
        <span>
          {fmtKw(snap.house)}{' '}
          <span className="text-[9px] tracking-[0.1em] text-mains uppercase">
            {t.wHouse}
          </span>
        </span>
        <span>
          {snap.level} %{' '}
          <span className="text-[9px] tracking-[0.1em] text-batt uppercase">
            {t.wBattery}
          </span>
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────── JSON preview ───────────────────────────

const JSON_TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)|("(?:\\.|[^"\\])*")|(-?\d+(?:\.\d+)?)|(true|false|null)/g;

function highlightJson(src: string): ReactNode[] {
  const out: ReactNode[] = [];
  let cursor = 0;
  JSON_TOKEN.lastIndex = 0;
  for (let m = JSON_TOKEN.exec(src); m !== null; m = JSON_TOKEN.exec(src)) {
    if (m.index > cursor) out.push(src.slice(cursor, m.index));
    if (m[1]) {
      out.push(
        <span key={m.index} className="text-batt">
          {m[1]}
        </span>,
      );
      out.push(m[2]);
    } else {
      const value = m[3] ?? m[4] ?? m[5];
      const masked = m[3] !== undefined && /^"•+"$/.test(m[3]);
      out.push(
        <span
          key={m.index}
          className={masked ? 'text-faint' : m[3] ? 'text-solar' : 'text-good'}
        >
          {value}
        </span>,
      );
    }
    cursor = m.index + m[0].length;
  }
  if (cursor < src.length) out.push(src.slice(cursor));
  return out;
}

// ─────────────────────────── page ───────────────────────────

export default function App() {
  const [config, setConfig] = useState<ConfigState>(INITIAL_STATE);
  const [lang, setLang] = useState<Language>('fr');
  const [view, setView] = useState<WatchView>('balance');
  const [showToken, setShowToken] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const t = translations[lang];
  const ids = useId();
  const clock = useClock(t.locale);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const fmt = useCallback(
    (n: number) => new Intl.NumberFormat(t.locale).format(n),
    [t.locale],
  );

  const fmtKw = useCallback(
    (n: number) =>
      n >= 1000
        ? `${new Intl.NumberFormat(t.locale, { maximumFractionDigits: 1 }).format(n / 1000)} kW`
        : `${fmt(n)} W`,
    [fmt, t.locale],
  );

  const qrData = useMemo(() => {
    // Only fields with content go into the QR, so the code stays as small as
    // possible. The shape is the contract with the watch app — do not rename.
    const cleanedConfig: Partial<ConfigState> & Record<string, unknown> = { ...config };

    cleanedConfig.haURL = config.haURL.trim();
    cleanedConfig.haToken = config.haToken.trim();
    cleanedConfig.gridEntityId = config.gridEntityId.trim();

    if (!cleanedConfig.haURL) delete cleanedConfig.haURL;
    if (!cleanedConfig.haToken) delete cleanedConfig.haToken;

    cleanedConfig.solarEntityIds = config.solarEntityIds
      .map((id) => id.trim())
      .filter((id) => id !== '');

    cleanedConfig.batteryEntityIds = config.batteryEntityIds
      .map((id) => id.trim())
      .filter((id) => id !== '');

    cleanedConfig.batteryPowerEntityIds = config.batteryPowerEntityIds
      .map((id) => id.trim())
      .filter((id) => id !== '');

    cleanedConfig.gridMax = Number(config.gridMax);
    cleanedConfig.solarMax = Number(config.solarMax);
    cleanedConfig.batteryPowerMax = Number(config.batteryPowerMax);

    return JSON.stringify(cleanedConfig);
  }, [config]);

  // Parsing and re-stringifying is not free; keep it off every keystroke of the
  // import textarea and off language switches.
  const displayDataString = useMemo(() => {
    try {
      const displayData = JSON.parse(qrData);
      if (displayData.haToken) displayData.haToken = '••••••••••••';
      return JSON.stringify(displayData, null, 2);
    } catch {
      return '{}';
    }
  }, [qrData]);

  // The page never contacts Home Assistant, so there is no live reading to
  // show. This is an illustrative snapshot scaled to the configured peaks.
  const snap = useMemo<Snapshot>(() => {
    const solar = Math.round(config.solarMax * 0.213);
    const house = Math.round(solar * 0.531);
    const charge = Math.max(0, Math.min(solar - house, config.batteryPowerMax));
    return { solar, house, charge, surplus: solar - house - charge, level: 99 };
  }, [config.solarMax, config.batteryPowerMax]);

  const steps = [
    { label: t.stepServer, done: config.haURL.trim() !== '' && isValidHAUrl(config.haURL) },
    { label: t.stepSolar, done: filled(config.solarEntityIds) },
    {
      label: t.stepBattery,
      done: filled(config.batteryEntityIds) || filled(config.batteryPowerEntityIds),
    },
    {
      label: t.stepGrid,
      done: config.gridEntityId.trim() !== '' && isValidEntityId(config.gridEntityId),
    },
  ];

  const handleEntityChange = (field: EntityListField, index: number, value: string) => {
    const next = [...config[field]];
    next[index] = value;
    setConfig({ ...config, [field]: next });
  };

  const addEntity = (field: EntityListField) =>
    setConfig({ ...config, [field]: [...config[field], ''] });

  const removeEntity = (field: EntityListField, index: number) => {
    const next = config[field].filter((_, i) => i !== index);
    setConfig({ ...config, [field]: next.length > 0 ? next : [''] });
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);

      // Validation is strict on import — a bad URL should not slip through.
      const importedUrl = (parsed.haURL || '').trim();
      if (!isValidHAUrl(importedUrl)) throw new Error('Invalid URL');

      setConfig({
        haURL: importedUrl,
        haToken: (parsed.haToken || '').trim(),
        gridEntityId: sanitizeEntity(parsed.gridEntityId || ''),
        gridMax: Number(parsed.gridMax) || INITIAL_STATE.gridMax,
        solarEntityIds: Array.isArray(parsed.solarEntityIds)
          ? parsed.solarEntityIds.map(sanitizeEntity)
          : [''],
        solarMax: Number(parsed.solarMax) || INITIAL_STATE.solarMax,
        batteryEntityIds: Array.isArray(parsed.batteryEntityIds)
          ? parsed.batteryEntityIds.map(sanitizeEntity)
          : [''],
        batteryPowerEntityIds: Array.isArray(parsed.batteryPowerEntityIds)
          ? parsed.batteryPowerEntityIds.map(sanitizeEntity)
          : [''],
        batteryPowerMax: Number(parsed.batteryPowerMax) || INITIAL_STATE.batteryPowerMax,
      });
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  // Rasterised from the off-screen canvas, which already has the logo drawn in.
  const downloadPng = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'energy-orbit-config.png';
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(JSON.parse(qrData), null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const urlInvalid = config.haURL !== '' && !isValidHAUrl(config.haURL);

  return (
    <div className="flex min-h-screen flex-col bg-ink font-sans text-[#f2f2f5]">
      <header className="flex flex-wrap items-center gap-4 border-b border-white/[0.07] bg-white/[0.02] px-6 py-5 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex size-[38px] items-center justify-center rounded-[11px] bg-linear-[140deg,var(--color-solar),var(--color-solar-warm)]">
            <Zap className="size-[22px] text-ink" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-[1.2]">
            <span className="text-[17px] font-black tracking-[-0.01em] text-white">
              Energy Orbit
            </span>
            <span className="text-xs font-bold tracking-[0.1em] text-dim uppercase">
              {t.brand}
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <p className="flex items-center gap-[7px] rounded-full border border-good/30 bg-good/10 px-3.5 py-2 text-[13px] font-extrabold text-good">
            <Lock className="size-[17px]" aria-hidden="true" />
            {t.privacyPill}
          </p>
          <div className="flex rounded-full bg-white/[0.06] p-[3px]">
            {(['fr', 'en'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`rounded-full px-3.5 py-1.5 text-xs uppercase transition-colors ${
                  lang === code
                    ? 'bg-solar font-black text-ink'
                    : 'font-extrabold text-muted hover:text-white'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-10 px-6 py-10 lg:flex-row lg:px-12 lg:pb-12">
        <div className="flex min-w-0 flex-1 flex-col gap-[26px]">
          <div className="flex flex-col gap-2">
            <h1 className="text-[34px] font-black tracking-[-0.025em] text-white">
              {t.title}
            </h1>
            <p className="max-w-[560px] text-base leading-[1.5] text-muted">{t.subtitle}</p>
          </div>

          <Stepper steps={steps} />

          <Card
            tone="neutral"
            icon={<Server className="size-[22px]" />}
            title={t.serverTitle}
            badge={t.optional}
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 flex-col gap-[7px]">
                <FieldLabel htmlFor={`${ids}-url`}>{t.address}</FieldLabel>
                <TextField
                  id={`${ids}-url`}
                  tone="neutral"
                  type="url"
                  value={config.haURL}
                  onChange={(v) => setConfig({ ...config, haURL: v.trim() })}
                  placeholder={t.placeholderHA}
                  invalid={urlInvalid}
                  errorMessage={t.validationErrorURL}
                  trailing={
                    config.haURL !== '' &&
                    (urlInvalid ? (
                      <CircleAlert className="size-[18px] shrink-0 text-alert" aria-hidden="true" />
                    ) : (
                      <CircleCheck className="size-[18px] shrink-0 text-good" aria-hidden="true" />
                    ))
                  }
                />
              </div>
              <div className="flex flex-1 flex-col gap-[7px]">
                <FieldLabel htmlFor={`${ids}-token`}>{t.token}</FieldLabel>
                <TextField
                  id={`${ids}-token`}
                  tone="neutral"
                  type={showToken ? 'text' : 'password'}
                  value={config.haToken}
                  onChange={(v) => setConfig({ ...config, haToken: v.trim() })}
                  placeholder={t.placeholderToken}
                  autoComplete="off"
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      aria-label={showToken ? t.hideToken : t.showToken}
                      className="shrink-0 text-dim transition-colors hover:text-white"
                    >
                      {showToken ? (
                        <EyeOff className="size-[18px]" />
                      ) : (
                        <Eye className="size-[18px]" />
                      )}
                    </button>
                  }
                />
              </div>
            </div>
          </Card>

          <Card
            tone="solar"
            icon={<Sun className="size-[22px]" />}
            title={t.solarTitle}
            badge={t.solarBadge}
            badgeMono
          >
            <div className="flex flex-col gap-2.5">
              {config.solarEntityIds.map((id, index) => (
                <EntityRow
                  key={index}
                  id={`${ids}-solar-${index}`}
                  tone="solar"
                  value={id}
                  placeholder={t.placeholderSensor}
                  errorMessage={t.validationErrorEntity}
                  removeLabel={t.remove}
                  onChange={(v) => handleEntityChange('solarEntityIds', index, v)}
                  onRemove={() => removeEntity('solarEntityIds', index)}
                />
              ))}
              <AddEntityButton
                tone="solar"
                label={t.addEntity}
                onClick={() => addEntity('solarEntityIds')}
              />
            </div>
            <PeakSlider
              id={`${ids}-solar-max`}
              tone="solar"
              label={t.peak}
              hint={t.peakHint}
              value={config.solarMax}
              locale={t.locale}
              onChange={(solarMax) => setConfig({ ...config, solarMax })}
            />
          </Card>

          <Card
            tone="batt"
            icon={<BatteryFull className="size-[22px] rotate-90" />}
            title={t.batteryTitle}
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 flex-col gap-2">
                <FieldLabel>{t.batteryLevel}</FieldLabel>
                {config.batteryEntityIds.map((id, index) => (
                  <EntityRow
                    key={index}
                    id={`${ids}-level-${index}`}
                    tone="batt"
                    value={id}
                    placeholder={t.placeholderSensor}
                    errorMessage={t.validationErrorEntity}
                    removeLabel={t.remove}
                    onChange={(v) => handleEntityChange('batteryEntityIds', index, v)}
                    onRemove={() => removeEntity('batteryEntityIds', index)}
                  />
                ))}
                <AddEntityButton
                  tone="batt"
                  label={t.addEntity}
                  onClick={() => addEntity('batteryEntityIds')}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <FieldLabel>{t.batteryPower}</FieldLabel>
                {config.batteryPowerEntityIds.map((id, index) => (
                  <EntityRow
                    key={index}
                    id={`${ids}-power-${index}`}
                    tone="batt"
                    value={id}
                    placeholder={t.placeholderSensor}
                    errorMessage={t.validationErrorEntity}
                    removeLabel={t.remove}
                    onChange={(v) => handleEntityChange('batteryPowerEntityIds', index, v)}
                    onRemove={() => removeEntity('batteryPowerEntityIds', index)}
                  />
                ))}
                <AddEntityButton
                  tone="batt"
                  label={t.addEntity}
                  onClick={() => addEntity('batteryPowerEntityIds')}
                />
              </div>
            </div>

            <div className="flex items-start gap-[11px] rounded-[15px] border border-batt/20 bg-batt/[0.09] p-4">
              <ArrowDownUp className="size-[19px] shrink-0 text-batt" aria-hidden="true" />
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-extrabold text-white">
                  {t.signTitle} <span className="text-batt uppercase">{t.signValue}</span>
                </p>
                <p className="text-[13px] leading-[1.45] font-semibold text-muted">
                  {t.signBody}
                </p>
              </div>
            </div>

            <PeakSlider
              id={`${ids}-batt-max`}
              tone="batt"
              label={t.peak}
              hint={t.peakHint}
              value={config.batteryPowerMax}
              locale={t.locale}
              onChange={(batteryPowerMax) => setConfig({ ...config, batteryPowerMax })}
            />
          </Card>

          <Card
            tone="mains"
            icon={<Zap className="size-[22px]" />}
            title={t.mainsTitle}
            badge={t.mainsBadge}
          >
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor={`${ids}-grid`}>{t.gridEntity}</FieldLabel>
              <EntityRow
                id={`${ids}-grid`}
                tone="mains"
                value={config.gridEntityId}
                placeholder={t.placeholderSensor}
                errorMessage={t.validationErrorEntity}
                removeLabel={t.remove}
                onChange={(gridEntityId) => setConfig({ ...config, gridEntityId })}
              />
            </div>
            <PeakSlider
              id={`${ids}-grid-max`}
              tone="mains"
              label={t.gridPeak}
              hint={t.peakHint}
              value={config.gridMax}
              locale={t.locale}
              onChange={(gridMax) => setConfig({ ...config, gridMax })}
            />
          </Card>
        </div>

        <aside className="flex w-full flex-col gap-[22px] lg:w-[420px] lg:shrink-0">
          <div className="flex flex-col gap-5 rounded-[26px] border border-white/[0.09] bg-white/[0.04] p-7">
            <div className="flex flex-col gap-1">
              <h2 className="text-xs font-black tracking-[0.16em] text-dim uppercase">
                {t.watchTitle}
              </h2>
              <p className="text-sm font-bold text-muted">{t.watchHint}</p>
            </div>
            <div className="flex justify-center">
              <div
                className="relative h-[228px] w-[186px] overflow-hidden rounded-[38px] bg-ink"
                style={{ boxShadow: BEZEL }}
              >
                <span className="absolute top-3 right-4 text-base font-extrabold text-white">
                  {clock}
                </span>
                <div className="absolute inset-x-[18px] top-[42px] bottom-[18px] flex flex-col gap-2.5">
                  {view === 'balance' && <BalanceView snap={snap} t={t} fmt={fmt} />}
                  {view === 'gauge' && (
                    <GaugeView snap={snap} peak={config.solarMax} t={t} fmt={fmt} />
                  )}
                  {view === 'context' && (
                    <ContextView snap={snap} t={t} fmt={fmt} fmtKw={fmtKw} />
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {(
                [
                  ['balance', t.viewBalance],
                  ['gauge', t.viewGauge],
                  ['context', t.viewContext],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  aria-pressed={view === key}
                  className={`flex-1 rounded-xl py-2 text-xs transition-colors ${
                    view === key
                      ? 'border border-solar/35 bg-solar/[0.14] font-black text-solar'
                      : 'bg-white/[0.05] font-extrabold text-muted hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-[18px] rounded-[26px] border border-white/[0.09] bg-white/[0.04] p-7">
            <div className="flex w-full items-center gap-2.5">
              <h2 className="text-xs font-black tracking-[0.16em] text-dim uppercase">
                {t.qrTitle}
              </h2>
              <p className="ml-auto flex items-center gap-1.5 rounded-full border border-good/30 bg-good/[0.12] px-2.5 py-1 text-[11px] font-black tracking-[0.08em] text-good uppercase">
                {t.qrReady}
              </p>
            </div>

            <div className="flex size-[216px] items-center justify-center rounded-[20px] bg-white p-3.5">
              <QRCodeSVG
                value={qrData}
                title={t.qrTitleAttr}
                size={188}
                level="H"
                marginSize={0}
                fgColor="#0D0F14"
                imageSettings={QR_LOGO}
              />
            </div>

            {config.haToken && (
              <p className="flex items-start gap-2.5 rounded-[15px] border border-solar-warm/30 bg-solar-warm/10 px-[15px] py-3.5 text-[13px] leading-[1.45] font-bold text-[#f2d9b0]">
                <TriangleAlert
                  className="size-[18px] shrink-0 text-solar-warm"
                  aria-hidden="true"
                />
                {t.qrWarning}
              </p>
            )}

            <div className="flex w-full gap-2.5">
              <button
                type="button"
                onClick={downloadPng}
                className="flex flex-1 items-center justify-center gap-[7px] rounded-[14px] bg-solar py-3.5 text-sm font-black text-ink transition-colors hover:bg-[#ffdb45]"
              >
                <Download className="size-[18px]" aria-hidden="true" />
                {t.download}
              </button>
              <button
                type="button"
                onClick={copyJson}
                title={t.copy}
                aria-label={t.copy}
                className={`flex w-[50px] items-center justify-center rounded-[14px] transition-colors ${
                  copied ? 'bg-good/20 text-good' : 'bg-white/[0.07] text-[#e5e7eb] hover:bg-white/[0.12]'
                }`}
              >
                {copied ? <Check className="size-[19px]" /> : <Copy className="size-[19px]" />}
              </button>
            </div>
            <span role="status" className="sr-only">
              {copied ? t.copied : ''}
            </span>
          </div>

          <div className="flex flex-col gap-3 rounded-[22px] border border-white/[0.07] bg-white/[0.03] px-6 py-[22px]">
            <div className="flex items-center gap-2.5">
              <Braces className="size-[18px] text-dim" aria-hidden="true" />
              <h2 className="flex-1 text-xs font-black tracking-[0.14em] text-dim uppercase">
                {t.jsonTitle}
              </h2>
              <button
                type="button"
                onClick={() => setImportOpen(!importOpen)}
                aria-expanded={importOpen}
                className="text-xs font-extrabold text-solar hover:underline"
              >
                {importOpen ? t.importClose : t.importOpen}
              </button>
            </div>

            <pre className="overflow-x-auto rounded-[14px] bg-well p-4 font-mono text-[11.5px] leading-[1.7] text-muted">
              {highlightJson(displayDataString)}
            </pre>

            {importOpen && (
              <>
                <textarea
                  className="h-28 w-full resize-y rounded-[14px] border border-white/[0.12] bg-well p-3 font-mono text-xs text-white outline-none placeholder:text-faint focus:border-solar/60"
                  placeholder={t.importPlaceholder}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  aria-label={t.importPlaceholder}
                />
                <button
                  type="button"
                  onClick={handleImport}
                  className={`flex items-center justify-center gap-2 rounded-[14px] py-2.5 text-sm font-black transition-colors ${
                    importStatus === 'success'
                      ? 'bg-good/20 text-good'
                      : importStatus === 'error'
                        ? 'bg-alert/20 text-alert'
                        : 'bg-white/[0.07] text-white hover:bg-white/[0.12]'
                  }`}
                >
                  {importStatus === 'idle' && (
                    <>
                      <Braces className="size-4" aria-hidden="true" />
                      {t.importBtn}
                    </>
                  )}
                  {importStatus === 'success' && (
                    <>
                      <Check className="size-4" aria-hidden="true" />
                      {t.importSuccess}
                    </>
                  )}
                  {importStatus === 'error' && (
                    <>
                      <CircleAlert className="size-4" aria-hidden="true" />
                      {t.importError}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </aside>
      </main>

      <footer className="flex flex-wrap items-center gap-4 border-t border-white/[0.07] bg-white/[0.02] px-6 py-[22px] lg:px-12">
        <p className="text-[13px] font-bold text-faint">{t.footer}</p>
        <nav className="ml-auto flex gap-5 text-[13px] font-bold text-muted">
          <a className="hover:text-solar" href={REPO_URL}>
            GitHub
          </a>
          <a className="hover:text-solar" href={`${REPO_URL}#readme`}>
            {t.footerHelp}
          </a>
        </nav>
      </footer>

      {/* Off-screen, high-resolution twin used for the PNG download. */}
      <QRCodeCanvas
        ref={canvasRef}
        value={qrData}
        size={1024}
        level="H"
        marginSize={4}
        fgColor="#0D0F14"
        imageSettings={{ ...QR_LOGO, height: 168, width: 168 }}
        aria-hidden="true"
        className="pointer-events-none fixed -top-[9999px] -left-[9999px]"
      />
    </div>
  );
}
