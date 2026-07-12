const fs = require('fs');

let content = fs.readFileSync('src/components/AuthPage.tsx', 'utf8');

if (!content.includes("import Link from 'next/link';")) {
  content = content.replace(
    /import React, \{ useState, useRef, useEffect \} from 'react';/,
    `import React, { useState, useRef, useEffect } from 'react';\nimport Link from 'next/link';`
  );
}

// Add CTA in Login
const loginCta = `
                {/* CTA Admin Institusi - Login */}
                {isLogin && (
                  <div className="mt-8 border-t border-slate-200 dark:border-gray-700 pt-6">
                    <div className="flex flex-col items-center text-center gap-3 bg-slate-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-slate-100 dark:border-gray-700/50">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-1">
                        <Building2 size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                        🏫 Ingin mengelola sekolah, kampus, atau perusahaan?
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-gray-400 max-w-[280px]">
                        Kelola data peserta, pembimbing, absensi, logbook, dan laporan dalam satu dashboard.
                      </p>
                      <Link href="/register-admin" className="mt-2 w-full min-h-[44px] bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-primary font-bold text-sm rounded-xl border border-slate-200 dark:border-gray-700 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm">
                        Daftar sebagai Admin Institusi
                      </Link>
                    </div>
                  </div>
                )}
`;

if (!content.includes("Ingin mengelola sekolah, kampus, atau perusahaan?")) {
  // Insert before `{isForgotPassword && (` (line 929)
  content = content.replace(
    /\{\s*isForgotPassword && \(/,
    loginCta + '\n                {isForgotPassword && ('
  );
}

// Add CTA in Register
const registerCta = `
                {/* CTA Admin Institusi - Register */}
                {isRegister && (
                  <div className="mt-8 border-t border-slate-200 dark:border-gray-700 pt-6 text-center">
                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">
                      Ingin mendaftarkan sekolah, kampus, atau perusahaan?
                    </p>
                    <Link href="/register-admin" className="text-primary font-bold text-sm hover:text-blue-700 flex items-center justify-center gap-1 transition-colors">
                      Daftar sebagai Admin Institusi <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
`;

if (!content.includes("Ingin mendaftarkan sekolah, kampus, atau perusahaan?")) {
  content = content.replace(
    /\{\s*isForgotPassword && \(/,
    registerCta + '\n                {isForgotPassword && ('
  );
}

fs.writeFileSync('src/components/AuthPage.tsx', content);
console.log('Done patch CTA');
