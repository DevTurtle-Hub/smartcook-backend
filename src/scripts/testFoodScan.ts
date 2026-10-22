import assert from "node:assert/strict";
import { mock } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AddressInfo } from "node:net";
import { Types } from "mongoose";
import { PassThrough } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import express, { ErrorRequestHandler } from "express";
import aiRouter from "../routes/ai.routes";
import { JwtHelper } from "../utils/jwt";
import { userRepository } from "../repositories/user.repository";
import { scanHistoryRepository } from "../repositories/scanHistory.repository";
import type { IScanHistory } from "../models/ScanHistory";
import Recipe from "../models/Recipe";
import { geminiClient } from "../config/gemini";
import { validateFoodPhoto } from "../services/food-vision.service";

async function main() {
  const jpeg = readFileSync(resolve(__dirname, "../../../smartcook-mobile/assets/images/hero-teriyaki-bowl.jpg"));
  const uid = new Types.ObjectId();
  const records: Record<string, unknown>[] = [];
  let output: unknown = {
    isFood: true, title: "Cơm gà Teriyaki", accuracy: 64,
    dishes: [{ name: "Cơm gà Teriyaki", confidence: "72%" }],
    ingredients: [
      { name: "Thịt gà", confidence: "85%", icon: "food-drumstick", source: "visible" },
      { name: "Nước tương", confidence: "55%", icon: "bottle-tonic", source: "inferred" },
    ],
    pins: [{ text: "Thịt gà", top: 30, left: 25 }],
    suggestedRecipe: { title: "Cơm gà (Teriyaki)+", desc: "Gợi ý liên quan đến món nhận diện.", calories: 0, durationMinutes: 0, matchPercent: 72 },
  };
  const validOutput = output;
  mock.method(JwtHelper, "verifyAccessToken", () => ({ id: uid.toString() }));
  mock.method(userRepository, "findById", async () => ({ _id: uid, isActive: true }));
  const upload = mock.method(cloudinary.uploader, "upload_stream", (_options: unknown, callback: (error: Error | null, result?: object) => void) => {
    const stream = new PassThrough();
    stream.resume();
    stream.on("finish", () => callback(null, { secure_url: "https://example.com/scans/real-photo.jpg", public_id: "test/new-photo" }));
    return stream;
  });
  const cleanup = mock.method(cloudinary.uploader, "destroy", async () => ({ result: "ok" }));
  const generation = mock.method(geminiClient.models, "generateContent", async () => ({ text: JSON.stringify(output) }));
  const lookup = mock.method(Recipe, "findOne", () => ({ exec: async () => null }));
  mock.method(scanHistoryRepository, "create", async (data: Partial<IScanHistory>) => {
    const record = { ...data, _id: new Types.ObjectId() };
    records.push(record);
    return record;
  });
  mock.method(scanHistoryRepository, "findByUserId", async () => records);
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use("/ai", aiRouter);
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  };
  app.use(errors);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/ai`;
  const headers = { Authorization: "Bearer test-scan-token" };
  const sendPhoto = (filename = "camera.jpg", bytes = jpeg, type = "image/jpeg") => {
    const body = new FormData();
    body.append("image", new Blob([new Uint8Array(bytes)], { type }), filename);
    return fetch(url + "/scan-ingredients", { method: "POST", headers, body });
  };
  const sendJson = (body: object) => fetch(url + "/scan-ingredients", {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  try {
    assert.throws(() => validateFoodPhoto(Buffer.from("not a photo"), "image/jpeg"), { statusCode: 400 });
    assert.equal((await fetch(url + "/scan-ingredients", { method: "POST" })).status, 401);
    assert.equal((await sendJson({})).status, 400);
    assert.equal((await sendJson({ imageUrl: "https://example.com/photo.jpg" })).status, 400, "Never scan a dummy 1x1 image for a URL");
    assert.equal((await sendPhoto("fake.jpg", Buffer.from("not an image"))).status, 400);
    assert.equal((await sendPhoto("photo.png", jpeg, "image/png")).status, 400);
    assert.equal((await sendPhoto("too-large.jpg", Buffer.alloc(5 * 1024 * 1024 + 1))).status, 413);
    assert.equal(upload.mock.callCount(), 0);

    for (const filename of ["camera.jpg", "gallery.jpg"]) {
      const response = await sendPhoto(filename);
      assert.equal(response.status, 201);
      const result = (await response.json()).data;
      assert.equal(result.title, "Cơm gà Teriyaki");
      assert.equal(result.accuracy, 64, "Keep the actual estimate, not a fabricated 96%");
      assert.equal(result.dishes[0].name, "Cơm gà Teriyaki");
      assert.equal(result.ingredients[1].source, "inferred");
      assert.equal(result.imageUrl, "https://example.com/scans/real-photo.jpg");
      assert.equal(result.suggestedRecipe.id, undefined, "Never link an arbitrary recipe");
      assert.match(result.id, /^[a-f0-9]{24}$/);
    }
    const history = await fetch(url + "/scan-history", { headers });
    assert.equal((await history.json()).data.length, 2);
    assert.equal(cleanup.mock.callCount(), 0, "Keep successful uploads for history");
    const filter = lookup.mock.calls[0].arguments[0] as unknown as { title: { $regex: string }; isActive: boolean };
    assert.equal(filter.isActive, true);
    assert.equal(filter.title.$regex, "^Cơm gà \\(Teriyaki\\)\\+$");

    const before = records.length;
    output = { isFood: false };
    assert.equal((await sendPhoto()).status, 422);
    output = { isFood: true, ingredients: "bad" };
    assert.equal((await sendPhoto()).status, 502);
    generation.mock.mockImplementation(async () => { throw Object.assign(new Error("unavailable"), { status: 429 }); });
    assert.equal((await sendPhoto()).status, 503);
    assert.equal(records.length, before, "Failures must never create sample history");
    assert.equal(cleanup.mock.callCount(), 3, "Remove only uploads from failed scans");
    upload.mock.mockImplementation(() => { throw new Error("storage down"); });
    const callsBeforeStorageFailure = generation.mock.callCount();
    assert.equal((await sendPhoto()).status, 503);
    assert.equal(generation.mock.callCount(), callsBeforeStorageFailure, "Do not spend AI tokens when upload fails");
    assert.equal((await fetch(url + "/unknown", { headers })).status, 404);
    output = validOutput;
    console.log("PASS: camera/gallery multipart uploads, MIME/signature/size validation, 201/400/401/404/413/422/502/503, real-image persistence, inferred ingredients, exact recipe matching and failure cleanup; no live provider or database calls.");
  } finally {
    mock.restoreAll();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
