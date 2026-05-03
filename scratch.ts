import { hashPassword } from "better-auth/crypto";
console.log(await hashPassword("testpassword"));
