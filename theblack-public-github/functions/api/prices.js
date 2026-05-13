import { json } from "../_shared/response.js";
import { readPrices, toPublicPrices } from "../_shared/prices-store.js";

export async function onRequestGet({ env }) {
  const prices = await readPrices(env);
  return json(toPublicPrices(prices));
}
