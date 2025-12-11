import fs from 'fs';
import crypto from 'crypto';

const pem = fs.readFileSync('./extension.pem', 'utf8');
const pubDer = crypto
  .createPublicKey(pem)
  .export({ type: 'spki', format: 'der' });
const b64 = pubDer.toString('base64');
console.log(b64);
