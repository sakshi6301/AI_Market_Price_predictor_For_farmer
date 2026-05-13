# Real Market Dataset

Place official mandi/APMC/Agmarknet price CSV data here as:

```text
backend/data/mandi_prices.csv
```

Supported column names include common Agmarknet-style fields:

- `State`
- `District Name` or `District`
- `Market Name` or `Market`
- `Commodity` or `Crop`
- `Modal_price` or `Modal Price`
- `Min_price`
- `Max_price`
- `Price Date` or `Date`
- Optional: `MSP`, `Arrival`, `Arrival Qty`

Then retrain:

```powershell
npm run train:model
```

If this CSV has at least 100 valid rows, the model trains from the real CSV. If the file is missing or too small, the trainer falls back to generated market-profile data.
