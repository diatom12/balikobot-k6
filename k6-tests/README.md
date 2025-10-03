# Testování s k6 pro Balikobot API

Primárně je k6 určena k load/performance testům. V tomto projektu je však použita především pro
**funkční testování** Balikobot API endpointů. Jedná se o nástroj napsaný v GO, který umí spouštět
testy napsané v JavaScript/TypeScript.

## Funkční testy

Tento projekt obsahuje E2E (end-to-end) funkční testy pro Balikobot API. Testy jsou navrženy tak,
aby validovaly správné fungování jednotlivých endpointů a jejich response struktury.

K6 funkce jsou obaleny do vlastní logiky pro lepší debugování a validaci responses s detailním
logováním jednotlivých kroků.

## 📁 Struktura projektu

```
k6-tests/
├── src/
│   ├── http/                     # HTTP funkce organizované podle endpointů
│   │   ├── add/                  # ADD endpoint funkce
│   │   ├── services/             # Services endpoint funkce
│   │   ├── tracking/             # Tracking endpoint funkce
│   │   ├── order/                # Order endpoint funkce
│   │   └── ...                   # Další endpointy
│   ├── tests/                    # Funkční testy
│   │   ├── default/              # Základní testy
│   │   ├── cp/                   # Czech Post specifické testy
│   │   └── dpd/                  # DPD specifické testy
│   └── utils/                    # Pomocné funkce a typy
├── assets/                       # Statické súbory pre testy
├── dist/                         # Kompilované testy (generované webpack)
└── webpack.config.js             # Webpack konfigurácia pre TypeScript
```

## 🧪 Dostupné E2E testy

### `balikobot-basic.js`
- **Účel**: E2E validácia základných API endpointov
- **Čo testuje**:
  - API dostupnosť a response time
  - Autentifikáciu s API kľúčom
  - Services endpoint a JSON response validáciu
- **Konfigurácia**: 1 užívateľ, jednorazové spustenie

### `balikobot-add-test.js`
- **Účel**: E2E testovanie ADD endpointu
- **Čo testuje**:
  - Pridanie základného balíka
  - Pridanie balíka s COD (dobierka)
  - Testovanie rôznych service typov (NP, RR, SR)
  - Bulk operácie (pridanie viacerých balíkov)
  - Error handling pre neplatné údaje
  - Detailnú validáciu response štruktúry
- **Konfigurácia**: 1 užívateľ, kompletná E2E sekvencia

## 📋 Požiadavky

- [K6](https://k6.io/docs/get-started/installation/) nainštalované
- Node.js a npm pre build proces
- Balikobot API prihlasovacie údaje (API key)

## 🚀 Spouštění testů

### Bez dockeru

```bash
# Instalace závislostí
npm install

# Transpilace TypeScript do JavaScript
npm run build

# Spustenie základných E2E testov
k6 run dist/balikobot-basic.js

# Spustenie ADD endpoint testov s vlastnými credentials
k6 run -e API_KEY=your_api_key -e PARTNER=cp dist/balikobot-add-test.js
```

Pro lepší výstup u funkčních testů je doporučeno přidat `--log-format raw`:

```bash
k6 run --log-format raw dist/balikobot-add-test.js
```

### S dockerem

Lze použít Docker s upraveným Dockerfile pro lokální spuštění:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["k6", "run", "dist/balikobot-basic.js"]
```

## ⚙️ Konfigurácia

### Environment premenné:
- `API_KEY` - Balikobot API kľúč
- `PARTNER` - Kód partnera (cp, dpd, ppl, atd.)
- `BASE_URL` - Volitelná base URL (default: https://apiv2.balikobot.cz)

### E2E Test options:
Testy sú nakonfigurované pre E2E testovanie:
- **VUs**: 1 virtuálny užívateľ
- **Iterations**: Jednorazové spustenie kompletnej sekvencie
- **Execution**: Sekvenčné vykonávanie testov s detailným logovaním

### E2E Thresholds:
- Response time P95 < 10s (tolerantné pre E2E)
- Error rate < 10% (API chyby)
- Check success rate > 95% (validácie)
- API authentication errors < 5%

## 🔧 Vývoj

### Pridanie nového testu:
1. Vytvoriť HTTP funkcie v `src/http/[endpoint]/`
2. Pridať TypeScript typy pre request/response
3. Vytvoriť `.ts` súbor v `src/tests/[kategória]/`
4. Spustiť `npm run build`
5. Spustiť test s `k6 run dist/[názov-testu].js`

### Štruktúra HTTP funkcií:
Súbory v `src/http/` sú štruktúrované podle endpointů:
- `add/` - ADD endpoint (pridávanie balíkov)
- `services/` - Services endpoint (dostupné služby)
- `tracking/` - Tracking endpoint (sledovanie balíkov)
- `order/` - Order endpoint (objednávky)

### Užitočné príkazy:
```bash
# Formátovanie kódu
npm run prettier

# Linting
npm run lint

# Build
npm run build

# Spustenie všetkých testov
k6 run dist/*.js
```

## 📊 E2E Metriky

K6 zbiera E2E specific metriky:
- `http_req_duration` - Response time jednotlivých API calls
- `http_req_failed` - Failed requests rate
- `add_errors` - Chyby špecifické pre ADD endpoint
- `api_errors` - Všeobecné API autentifikačné chyby
- `checks` - Úspešnosť E2E validácií

## 📝 E2E Testing Best Practices

### Pred testovaním:
1. Overte, že máte platný API kľúč
2. Skontrolujte dostupnosť testovacieho prostredia
3. Pripravte si test údaje (adresy, service typy)

### Počas testovania:
- Sledujte detailné logovania v konzole
- Kontrolujte úspešnosť jednotlivých krokov
- Overujte vrátené package IDs a response štruktúry

### Desatero přikázání:

1. Názvy súborov testov postfixovať `*.test.ts` - `BalikoboAdd.test.ts`
2. HTTP funkcie organizovať podle endpointů v `src/http/[endpoint]/`
3. Testy spúšťatelné označovať `*.run*.ts` alebo umiestniť v `tests/` - transpilujú sa automaticky
4. Každému testu prideliť vlastný API kľúč/partner kombinaciu
5. Ručne typovať requesty a response pomocou TypeScript
6. Validovať JSON schémy v responses
7. Overiť stabilitu testov (opakovateľnosť)
8. Poslouchať *eslint* a *prettier*
9. Logovať detailne jednotlivé kroky pre debugging
10. Testovať error handling scenáre

## 🔍 Troubleshooting

### TypeScript chyby pre K6 moduly
Toto je normálne - K6 typy sú dostupné len v K6 runtime, nie počas TypeScript kompilácie.

### Webpack build chyby
Skontrolujte, že:
- `assets/` priečinok existuje
- Všetky závislosti sú nainštalované (`npm install`)
- TypeScript syntax je korektná
- Importy odkazujú na existujúce súbory

### API authentication chyby
- Skontrolujte platnosť API kľúča
- Overte správnosť PARTNER kódu
- Skontrolujte dostupnosť Balikobot API

## 📚 Dokumentácia

- [K6 Documentation](https://k6.io/docs/)
- [K6 Functional Testing](https://k6.io/docs/examples/functional-testing/)
- [Balikobot API Documentation](https://balikobot.docs.apiary.io/)
- [Webpack Documentation](https://webpack.js.org/)
