# Mobile food scan

Mobile and web share the authenticated `POST /api/v1/ai/scan-ingredients` endpoint. The mobile camera button opens the phone camera; the gallery button opens the system photo picker. Cancel leaves the current result unchanged. The camera selector controls front/back camera for the next capture.

Mobile converts selected photos (including iPhone HEIC) to JPEG, preserving aspect ratio and resizing the longest edge to at most 1600 pixels. The actual image is uploaded as multipart field `image`. The API enforces the 5 MB upload limit and checks that the file signature matches its MIME type. JSON callers can send plain `imageBase64` and `mimeType`. URL-only requests are rejected rather than scanning a placeholder pixel.

The image is stored in Cloudinary and analyzed by Gemini. The response includes `title`, `dishes`, `ingredients`, `pins` and `suggestedRecipe`. Each ingredient has `source: visible|inferred`; confidence numbers are model estimates, not calibrated measurements. Hidden ingredients and seasonings cannot be established from a photo alone. Exact quantities and allergy claims must not be inferred from the image.

Only successful validated analysis is stored in scan history. Failed analysis removes its newly uploaded image and returns an actionable error; no sample ingredients or unrelated fallback recipe is substituted. A recipe-detail link is returned only for an active recipe with the same title. Previous legacy history remains readable; the mobile scanner starts without demonstration results and deduplicates history by server ID.

Failure responses: 400 invalid/missing photo, 401 not authenticated, 413 over 5 MB, 422 no recognizable food, 502 invalid AI result, 503 storage/AI unavailable. Client retry is manual to avoid repeating paid scans automatically.

Checks:

```sh
npm run test:scan
npm run build
```

`npm run test:scan:live` makes one actual Gemini request using the existing `hero-teriyaki-bowl.jpg` fixture and does not write to the database. The mocked API suite exercises camera/gallery multipart payloads, validation, persistence, recipe matching and failure cleanup. Camera permissions and capture still require a physical phone check in Expo Go.
