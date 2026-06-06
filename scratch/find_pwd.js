import crypto from 'crypto';

const targets = {
  admin: '97679320924f825aff30a51d45f2f09a28d6e3695941ae159064836803875f87'
};

const prefixes = ['admin', 'pmdf', 'cavalaria', 'rpmon', 'root', 'senha', '123456'];
const suffixes = ['', '123', '321', '1234', '!', '@', '1', '2', '3', '2024', '2025', '2026', '@123', '@pmdf'];

const candidates = [];
for (const p of prefixes) {
  for (const s of suffixes) {
    candidates.push(p + s);
    candidates.push(p.toUpperCase() + s);
  }
}

for (const pwd of candidates) {
  const hash = crypto.createHash('sha256').update(pwd).digest('hex');
  if (hash === targets.admin) {
    console.log(`FOUND PASSWORD FOR admin: ${pwd}`);
    process.exit(0);
  }
}
console.log("Not found in candidates.");
