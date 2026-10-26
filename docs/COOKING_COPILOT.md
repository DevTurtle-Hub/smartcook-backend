# Cooking copilot

The assistant in cooking mode is restricted to the current recipe. This is application routing, recipe grounding and prompt configuration; no model weights were trained.

The app and server apply the same local topic filter before handling controls or calling Gemini. Clear unrelated requests are refused, ambiguous questions ask for detail, and known facts (ingredient amounts, current step, remaining timer) are read from the supplied recipe/session. A question such as “có nên thêm 2 phút không?” is advice, not a timer command.

Explicit navigation supports Vietnamese step numbers in digits or words: “chuyển sang bước thứ hai”, “qua bước số 3”, and “quay về bước một”. The resolver checks the requested step against the recipe before returning `GO_TO_STEP` with `actionPayload.targetStep`. Missing, invalid or current targets produce a local clarification. The mobile app maps the step number to the real recipe index and uses the same navigation/reset behavior as tapping a step. Actions execute before the spoken confirmation, so speech cannot hold up a step change.

Only cooking advice reaches the model. It receives ingredient quantities, the current and nearby/referenced steps, timer state and at most four short recent conversation turns. It must acknowledge missing information, ask for clarification and keep the answer under 60 words. Model output cannot change timers or steps. Malformed, overlong or unsupported action output falls back to a neutral message instead of guessed cooking advice.

Each advice request has a 15-second timeout (Gemini rejects deadlines under 10 seconds), no retries and a 512-token output limit. The mobile API timeout is 20 seconds so it does not abandon a valid backend request early. Identical requests share work while pending; valid answers are cached for 90 seconds with a 128-entry bound. Cache keys include the user and relevant cooking context, so changed context and other users cannot reuse the answer.

The local scope filter is conservative and heuristic, not a perfect semantic classifier. Unrecognized relevant questions may ask for more detail. Recognized cooking questions receive a second scope check in the model. Recipe data must be accurate; these controls cannot guarantee every model answer is correct.

Text filtering, controls and local facts use no model tokens. Voice transcription is a separate Gemini request and can still consume tokens before the recognized text can be filtered.

Regression checks (mocked providers, no paid model calls):

```sh
npm run test:voice:scope
npm run test:voice:commands
npm run test:voice:audio
npm run build
```

`test:voice:copilot` is a separate live-provider smoke test and can incur API usage. `test:voice:advice:live` tests the actual spoken broth question from the reported failure against Gemini (one paid request). Local mobile/server policy copies are compared by regression tests to prevent drift.

The provider receives a JSON response schema matching local validation. Fallback logs contain a reason category, model and provider status only; credentials and user transcript are omitted. Advice that mentions ingredients the user has already added is not mistaken for a claim that the app changed the timer.
