const fs = require('fs');

let content = fs.readFileSync('src/components/LogbookTable.tsx', 'utf8');

const coverReplacement = `
        {/* Printable Cover Page */}
        <div className="hidden print:flex flex-col items-center justify-center min-h-[26cm] w-full" style={{ pageBreakAfter: 'always' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/interntrack.jpg" alt="Logo" className="w-48 h-48 object-contain mb-10" />
          <h1 className="text-3xl font-bold uppercase text-black text-center leading-snug">LAPORAN JURNAL KEGIATAN</h1>
          <h1 className="text-3xl font-bold uppercase text-black text-center mb-16 leading-snug">PRAKTIK KERJA LAPANGAN (PKL)</h1>
          
          <table className="mt-8 text-base font-bold text-black border-none text-left w-full max-w-2xl">
            <tbody>
              <tr><td className="py-3 pr-4 w-64">Nama Siswa</td><td className="py-3 px-2 w-4">:</td><td className="py-3">{state.studentName || '-'}</td></tr>
              <tr><td className="py-3 pr-4">NIS / NISN</td><td className="py-3 px-2">:</td><td className="py-3">{state.nisn || '-'}</td></tr>
              <tr><td className="py-3 pr-4">Asal Sekolah</td><td className="py-3 px-2">:</td><td className="py-3">{(currentUser as any)?.school || '-'}</td></tr>
              <tr><td className="py-3 pr-4">Perusahaan PKL</td><td className="py-3 px-2">:</td><td className="py-3">{state.companyName || '-'}</td></tr>
              <tr><td className="py-3 pr-4">Pembimbing Eksternal (Perusahaan)</td><td className="py-3 px-2">:</td><td className="py-3">{state.mentorName || '-'}</td></tr>
              <tr><td className="py-3 pr-4">Pembimbing Internal (Sekolah)</td><td className="py-3 px-2">:</td><td className="py-3">{state.advisorName || '-'}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Printable Header Info */}
        <div className="hidden print:block mb-6 border-b-[3px] border-black pb-4 mt-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-black uppercase tracking-wide">
              {t('logbookTitle')}
            </h2>
            <p className="text-sm text-black/80 mt-1">
              {t('logbookSubtitle')}
            </p>
          </div>
        </div>
`;

const tableReplacement = `
        {/* Table representation (Desktop) */}
        <div className="hidden md:block print:block overflow-x-auto print:overflow-visible w-full">
          <table className="w-full text-left border-collapse text-xs border border-[#E2E8F0] dark:border-gray-700 rounded-xl overflow-hidden print:overflow-visible shadow-sm print:border-black print:rounded-none">
            <thead className="print:table-header-group">
              <tr className="border-b border-[#E2E8F0] dark:border-gray-700 text-slate-500 dark:text-gray-300 font-semibold uppercase tracking-wider bg-[#F8FAFC] dark:bg-gray-900 print:border-black print:text-black print:bg-gray-100">
                <th className="py-3 px-2 w-10 text-center print:border print:border-black print:py-3 print:px-2">No</th>
                <th className="py-3 px-3 w-28 print:border print:border-black print:py-3 print:px-2">Tanggal</th>
                <th className="py-3 px-3 w-24 print:border print:border-black print:py-3 print:px-2">Kategori</th>
                <th className="py-3 px-4 print:border print:border-black print:py-3 print:px-2">Rincian Kegiatan</th>
                <th className="py-3 px-3 w-20 text-center hidden print:table-cell print:border print:border-black print:py-3 print:px-2">Jam</th>
                <th className="py-3 px-3 w-24 text-center print:border print:border-black print:py-3 print:px-2">Status</th>
                <th className="py-3 px-3 w-32 hidden print:table-cell print:border print:border-black print:py-3 print:px-2">Evaluasi Pembimbing Internal</th>
                <th className="py-3 px-3 w-32 hidden print:table-cell print:border print:border-black print:py-3 print:px-2">Evaluasi Pembimbing Eksternal</th>
                <th className="py-3 px-4 w-48 print:hidden">{t('eval')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] print:divide-black text-slate-700 print:text-black">
              {state.cards.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 dark:text-gray-2000 italic print:border print:border-black">
                    {t('emptyLogbook')}
                  </td>
                </tr>
              ) : (
                state.cards.map((card, index) => (
                  <tr key={card.id} className="hover:bg-[#F8FAFC] dark:bg-gray-900 transition duration-150 print:hover:bg-transparent">
                    <td className="py-4 px-2 text-center font-medium print:border print:border-black print:py-2 align-top">{index + 1}</td>
                    <td className="py-4 px-3 print:border print:border-black print:py-2 align-top">
                      <div className="flex flex-col gap-1.5">
                        <div className="font-medium flex items-center gap-1.5 whitespace-nowrap print:whitespace-normal">
                          <Calendar size={12} className="text-gray-400 print:hidden" />
                          {new Date(card.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </div>
                        {(card.startTime || card.endTime) && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold print:hidden">
                            <Clock size={11} className="text-primary" />
                            <span>{card.startTime || '-'} - {card.endTime || '-'}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-3 print:border print:border-black print:py-2 align-top">
                      <span className="px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 print:border-none print:bg-transparent text-[11px] text-slate-700 print:px-0 print:py-0 print:font-medium">
                        {card.category === 'Laporan' ? t('report') : card.category === 'Lainnya' ? t('others') : card.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 leading-relaxed font-medium print:border print:border-black print:py-2 align-top">
                      <div className="font-bold text-slate-800 dark:text-gray-200 print:text-black mb-1">{card.title}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-gray-300 print:text-black line-clamp-2 print:line-clamp-none whitespace-pre-wrap">
                        {card.description}
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center text-slate-800 dark:text-gray-200 print:text-black font-semibold hidden print:table-cell whitespace-nowrap print:border print:border-black print:py-2 align-top">
                      {card.startTime || '-'} - {card.endTime || '-'}
                    </td>
                    <td className="py-4 px-3 text-center whitespace-nowrap print:border print:border-black print:py-2 align-top">
                      <span className={\`px-2 py-0.5 rounded border text-[10px] font-bold \${getStatusBadge(card.columnId)} print:border-none print:text-black print:bg-transparent print:px-0 print:py-0 print:text-xs\`}>
                        {getStatusText(card.columnId)}
                      </span>
                    </td>
                    
                    {/* Pembimbing Internal (Sekolah) */}
                    <td className="py-2 px-3 hidden print:table-cell print:border print:border-black align-top">
                      {card.scoreAdvisor !== undefined ? (
                        <div className="text-xs">
                          <div className="font-bold mb-1">Nilai: {card.scoreAdvisor}/100</div>
                          {card.feedbackAdvisor && <div className="italic text-[10px] mt-1">&ldquo;{card.feedbackAdvisor}&rdquo;</div>}
                        </div>
                      ) : (
                        <span className="italic text-black/60 text-xs">-</span>
                      )}
                    </td>

                    {/* Pembimbing Eksternal (Perusahaan) */}
                    <td className="py-2 px-3 hidden print:table-cell print:border print:border-black align-top">
                      {card.scoreMentor !== undefined ? (
                        <div className="text-xs">
                          <div className="font-bold mb-1">Nilai: {card.scoreMentor}/100</div>
                          {card.feedbackMentor && <div className="italic text-[10px] mt-1">&ldquo;{card.feedbackMentor}&rdquo;</div>}
                        </div>
                      ) : (
                        <span className="italic text-black/60 text-xs">-</span>
                      )}
                    </td>

                    {/* Desktop/Screen Evaluation Combined */}
                    <td className="py-4 px-4 print:hidden">
                      <div className="flex flex-col gap-1.5 text-[10px]">
                        {card.scoreMentor !== undefined ? (
                          <div className="flex flex-col gap-0.5 border-b border-[#E2E8F0] dark:border-gray-700 pb-1 last:border-0 last:pb-0">
                            <div className="flex items-center gap-1 text-purple-600 font-bold text-[10px]">
                              <Award size={10} />
                              {t('mentor')}: {card.scoreMentor}/100 (D:{card.scoreMentorDiscipline} K:{card.scoreMentorSkill} S:{card.scoreMentorAttitude})
                            </div>
                            {card.feedbackMentor && (
                              <div className="text-[9px] text-[#64748B] dark:text-gray-300 italic leading-snug">
                                &ldquo;{card.feedbackMentor}&rdquo;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-gray-2000 italic text-[9px] border-b border-[#E2E8F0] dark:border-gray-700 pb-1">{t('notEvaluatedMentor')}</span>
                        )}

                        {card.scoreAdvisor !== undefined ? (
                          <div className="flex flex-col gap-0.5 pt-0.5">
                            <div className="flex items-center gap-1 text-yellow-600 font-bold text-[10px]">
                              <Award size={10} />
                              {t('teacher')}: {card.scoreAdvisor}/100 (D:{card.scoreAdvisorDiscipline} L:{card.scoreAdvisorReport} K:{card.scoreAdvisorCommunication})
                            </div>
                            {card.feedbackAdvisor && (
                              <div className="text-[9px] text-[#64748B] dark:text-gray-300 italic leading-snug">
                                &ldquo;{card.feedbackAdvisor}&rdquo;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-gray-2000 italic text-[9px] pt-0.5">{t('notEvaluatedAdvisor')}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
`;

const signatureReplacement = `
        {/* Printable Signature Lines */}
        <div className="hidden print:grid grid-cols-3 gap-8 mt-24 text-[11px] text-black" style={{ pageBreakInside: 'avoid' }}>
          <div className="flex flex-col items-center text-center">
            <span>Mengetahui,</span>
            <span className="font-bold mt-1">Pembimbing Eksternal (Perusahaan)</span>
            <div className="h-24" />
            <span className="font-bold underline">{state.mentorName || '____________________'}</span>
            <span className="mt-1">Jabatan: ____________________</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span>Mengetahui,</span>
            <span className="font-bold mt-1">Pembimbing Internal (Sekolah)</span>
            <div className="h-24" />
            <span className="font-bold underline">{state.advisorName || '____________________'}</span>
            <span className="mt-1">NIP: ____________________</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span>Bojong, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="font-bold mt-1">Siswa PKL</span>
            <div className="h-24" />
            <span className="font-bold underline">{state.studentName || '____________________'}</span>
            <span className="mt-1">{state.nisn ? \`NIS/NISN: \${state.nisn}\` : 'NIS/NISN: ____________________'}</span>
          </div>
        </div>

        {/* Print Footer Elements */}
        <div className="hidden print:block fixed bottom-0 left-0 right-0 text-[10px] text-black pt-2 pb-2 mt-16">
           <div className="border-t-[1.5px] border-black pt-2 flex justify-between items-center">
             <div>
               Dicetak melalui <strong>InternTrack</strong> - https://nebotrack.vercel.app
             </div>
             <div>
               Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Halaman <span className="pageNumber"></span> dari <span className="totalPages"></span>
             </div>
           </div>
        </div>
      </div>
`;

const stylesReplacement = `
      {/* Tailwind print helper styles */}
      <style jsx global>{\`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
            line-height: 1.5 !important;
          }
          /* Hide non-printable elements */
          nav, header, footer:not(.print\\\\:block), button, .print\\\\:hidden, [role="button"] {
            display: none !important;
          }
          /* Remove layout containers shadows */
          main, div, table, tr, td {
            box-shadow: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          /* Prevent row splitting across pages */
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Ensure table headers repeat on multi-page tables */
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          /* Format signature block nicely */
          .print\\\\:grid {
            display: grid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Fix fixed positioning for footer */
          .fixed.bottom-0 {
            position: fixed !important;
            bottom: 0 !important;
          }
          
          /* Page margins and layout */
          @page {
            size: A4 portrait;
            margin: 2cm;
          }
        }
      \`}</style>
`;

let newContent = content;

// Replace cover page
newContent = newContent.replace(/\{\/\* Printable Cover Page \*\/\}[\s\S]*?(?=\{\/\* Table representation)/, coverReplacement);

// Replace Table representation
newContent = newContent.replace(/\{\/\* Table representation \(Desktop\) \*\/\}[\s\S]*?(?=\{\/\* Mobile Timeline\/Card List)/, tableReplacement);

// Replace Signatures. We added a </div> at the end to match what was deleted.
newContent = newContent.replace(/\{\/\* Printable Signature Lines \*\/\}[\s\S]*?(?=\{\/\* Tailwind print helper styles)/, signatureReplacement);

// Replace styles
newContent = newContent.replace(/\{\/\* Tailwind print helper styles \*\/\}[\s\S]*?(?=\<\/div\>\s*\n\s*\);)/, stylesReplacement);

fs.writeFileSync('src/components/LogbookTable.tsx', newContent);
console.log('Successfully replaced LogbookTable.tsx');
