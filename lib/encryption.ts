import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.AES_SECRET_KEY!;

if (!SECRET_KEY) {
  throw new Error("AES_SECRET_KEY is missing in .env");
}

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

export function decrypt(cipherText: string): string {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
