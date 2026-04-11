import bcrypt from "bcrypt";
export default async function generatePasswordAndHash(name) {
  `
  const {password, hashPassword} = await generatePassword("userName");

  `
  const clean = name.replace(/[^a-zA-Z]/g, "").toLowerCase();
  let namePart = (clean.slice(0, 4) + "user").slice(0, 4);
  namePart = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const symbols = "@#$%";
  const numbers = "0123456789";
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  const num1 = numbers[Math.floor(Math.random() * numbers.length)];
  const num2 = numbers[Math.floor(Math.random() * numbers.length)];
  const num3 = numbers[Math.floor(Math.random() * numbers.length)];

  const password = `${namePart}${symbol}${num1}${num2}${num3}`
  const hashPassword = await bcrypt.hash(password, 12);
  return {
    password,
    hashPassword
  }
}