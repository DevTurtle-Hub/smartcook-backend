import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cookingAudioService } from "../services/cooking-audio.service";

// The fixture is synthetic desktop speech: "Go to step two", not a user recording.
async function main() {
  const source = readFileSync(resolve(__dirname, "fixtures/cooking-voice-probe.wav"));
  let rate = 0;
  let samples: Float32Array | undefined;
  for (let offset = 12; offset + 8 <= source.length;) {
    const kind = source.toString("ascii", offset, offset + 4);
    const size = source.readUInt32LE(offset + 4);
    if (kind === "fmt ") {
      assert.equal(source.readUInt16LE(offset + 8), 1);
      assert.equal(source.readUInt16LE(offset + 10), 1);
      rate = source.readUInt32LE(offset + 12);
      assert.equal(source.readUInt16LE(offset + 22), 16);
    }
    if (kind === "data") {
      samples = new Float32Array(size / 2);
      for (let index = 0; index < samples.length; index++) samples[index] = source.readInt16LE(offset + 8 + index * 2) / 32768;
    }
    offset += 8 + size + size % 2;
  }
  assert.ok(samples && rate);
  // Load the actual browser encoder without pulling web sources into the backend build.
  const browser = require(resolve(__dirname, "../../../smartcook-web/src/utils/cookingVoiceBrowser.ts")) as {
    encodeCookingWav(channels: readonly Float32Array[], sampleRate: number): ArrayBuffer;
  };
  const audio = Buffer.from(browser.encodeCookingWav([samples], rate));
  assert.equal(audio.readUInt32LE(24), 16000);
  const result = await cookingAudioService.transcribe(audio.toString("base64"), "audio/wav");
  assert.match(result.text.toLowerCase(), /step (two|2)|bước (hai|2)/);
  console.log("PASS: synthetic speech -> real web PCM WAV encoder -> live transcription service -> correct words.");
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Live transcription check failed");
  process.exitCode = 1;
});
