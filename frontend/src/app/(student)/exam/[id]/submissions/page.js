"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Dropdown from '@/components/ui/Dropdown';
import Skeleton from '@/components/ui/Skeleton';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import './submissions.css';

export default function ExamSubmissionsPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: examId } = use(params);
  
  const reason = searchParams.get('reason') || 'success'; 

  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState(null);
  const [mergedData, setMergedData] = useState([]); 
  const [statusFilter, setStatusFilter] = useState('all');
  const [isGlobalEnded, setIsGlobalEnded] = useState(false);
  
  // Modal States
  const [selectedItem, setSelectedItem] = useState(null); 
  const [modalTab, setModalTab] = useState('problem'); 
  const [viewLang, setViewLang] = useState(''); 

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Accepted', value: 'Accepted' },
    { label: 'Failed / Wrong Answer', value: 'Failed' },
    { label: 'Error / TLE', value: 'Error' },
    { label: 'Draft (Not Run)', value: 'DRAFT' },
    { label: 'Not Attempted', value: 'Not Attempted' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.replace('/login');

        const [contestRes, subsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contests/${examId}/my-submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        // 🚀 Redirect if Contest Doesn't Exist (404) or is Unauthorized (403)
        if (!contestRes.ok) {
          return router.replace('/dashboard');
        }

        const contestData = await contestRes.json();
        
        // 🚀 Redirect to Lobby if the student hasn't submitted yet or hasn't joined
        const session = contestData.session;
        if (!session || session.status === 'IN_PROGRESS') {
          return router.replace(`/exam/${examId}/lobby`);
        }

        const subsData = await subsRes.json();

        const problems = contestData.contest?.problems || [];
        const answers = subsData.answers || [];

        const merged = problems.map(p => {
           const sub = answers.find(a => a.problemId === p.id);
           return { problem: p, submission: sub };
        });

        setContest(contestData.contest);
        setIsGlobalEnded(contestData.isGlobalContestEnded || false);
        setMergedData(merged);
      } catch (error) {
        console.error("Fetch Data Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [examId, router]);

  useEffect(() => {
    if (selectedItem) {
      const allowedLangs = contest?.allowedLangs ? contest.allowedLangs.split(',').map(l => l.trim()) : ['Python 3'];
      const subLang = selectedItem.submission?.language;
      
      if (subLang && allowedLangs.some(l => l.toLowerCase() === subLang.toLowerCase())) {
        const matched = allowedLangs.find(l => l.toLowerCase() === subLang.toLowerCase());
        setViewLang(matched);
      } else {
        setViewLang(allowedLangs[0]);
      }
    }
  }, [selectedItem, contest]);

  const getLangConfig = (lang) => {
    if (!lang) return { icon: 'horizontal_rule', color: '#64748b' };
    const l = lang.toLowerCase();
    if (l.includes('python')) return { icon: 'code', color: '#38bdf8' }; 
    if (l.includes('java') && !l.includes('script')) return { icon: 'local_fire_department', color: '#fb923c' }; 
    if (l.includes('c++') || l.includes('cpp') || l.includes('c')) return { icon: 'data_object', color: '#3b82f6' }; 
    if (l.includes('javascript') || l.includes('js')) return { icon: 'javascript', color: '#facc15' }; 
    return { icon: 'terminal', color: '#cbd5e1' };
  };

  const getStatusConfig = (status) => {
    if (!status || status === 'Not Attempted') return { type: 'draft', icon: 'remove_selection', label: 'Not Attempted' };
    if (status === 'Accepted') return { type: 'acc', icon: 'check_circle', label: 'Accepted' };
    if (status === 'Failed' || status === 'Wrong Answer') return { type: 'wa', icon: 'close', label: 'Failed' };
    if (status === 'TLE' || status.includes('Time Limit')) return { type: 'tle', icon: 'timer', label: 'Time Limit Exceeded' };
    if (status === 'Error' || status.includes('Runtime')) return { type: 'err', icon: 'error', label: 'Execution Error' };
    if (status === 'DRAFT') return { type: 'draft', icon: 'edit_document', label: 'Draft Saved' };
    return { type: 'err', icon: 'help', label: status };
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    const str = String(dateStr);
    const cleanStr = str.endsWith('Z') ? str.slice(0, -1) : str;
    const d = new Date(cleanStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getMapValue = (mapStringOrObj, langLabel) => {
    if (!mapStringOrObj || !langLabel) return null;
    let map = mapStringOrObj;
    if (typeof map === 'string') {
      try { map = JSON.parse(map); } catch(e) { return null; }
    }
    if (typeof map !== 'object' || map === null) return null;
    
    if (map[langLabel]) return map[langLabel];
    
    const target = langLabel.toLowerCase().replace(/\s+/g, '');
    for (const [k, v] of Object.entries(map)) {
        const normK = k.toLowerCase().replace(/\s+/g, '');
        if (normK === target || normK.includes(target) || target.includes(normK)) return v;
    }
    return null;
  };

  const filteredData = mergedData.filter(item => {
    const status = item.submission?.status || 'Not Attempted';
    if (statusFilter === 'all') return true;
    if (statusFilter === 'Failed') return status === 'Failed' || status === 'Wrong Answer';
    if (statusFilter === 'Error') return status === 'Error' || status === 'TLE' || status.includes('Runtime');
    return status === statusFilter;
  });

  const allowedLangsList = contest?.allowedLangs ? contest.allowedLangs.split(',').map(l => l.trim()) : ['Python 3'];

  return (
    <div className="subs-wrapper">
      <header className="subs-header">
        <div className="subs-header-gradient"></div>
        <div className="header-content">
          <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/CodeScriptLogo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="logo-text" style={{ fontWeight: 600 }}>CodeScript</span>
          </div>
          <div className="header-right">
            <Link href="/dashboard" className="btn-dashboard">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
              <span className="hidden sm:inline">Go to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="subs-main">
        <div className={`finish-banner banner-${reason}`}>
           <span className="material-symbols-outlined banner-icon">
             {reason === 'success' ? 'task_alt' : reason === 'timeout' ? 'timer_off' : 'gavel'}
           </span>
           <div className="banner-text">
              <h2>{reason === 'success' ? 'Exam Submitted Successfully' : reason === 'timeout' ? 'Time is Up!' : 'Exam Terminated'}</h2>
              <p>
                {reason === 'success' ? 'Your final code has been safely recorded.' : 
                 reason === 'timeout' ? 'Your exam time expired. Your last saved drafts were submitted.' : 
                 'You were removed from the session due to policy violations. Your last drafts were saved.'}
              </p>
           </div>
        </div>

        {!loading && !isGlobalEnded && (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '24px' }}>lock_clock</span>
             <div>
                <h4 style={{ margin: 0, color: '#3b82f6', fontSize: '0.95rem' }}>Global Contest is still Active</h4>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  You have submitted your exam early. To prevent cheating, official solutions and hidden test cases will remain locked until the contest ends for everyone.
                </p>
             </div>
          </div>
        )}

        <div className="page-title-row">
          <div className="page-title">
            <h1>Submission History</h1>
            <p>Review the problems and code from this exam.</p>
            {!loading && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                 <span style={{background: 'var(--bg-surface-hover)', padding: '4px 8px', borderRadius: '4px'}}>Total: <strong style={{color: 'var(--text-main)'}}>{mergedData.length}</strong></span>
                 <span style={{background: 'var(--bg-surface-hover)', padding: '4px 8px', borderRadius: '4px'}}>Attempted: <strong style={{color: '#3b82f6'}}>{mergedData.filter(m => m.submission).length}</strong></span>
                 <span style={{background: 'var(--bg-surface-hover)', padding: '4px 8px', borderRadius: '4px'}}>Accepted: <strong style={{color: '#10b981'}}>{mergedData.filter(m => m.submission?.status === 'Accepted').length}</strong></span>
              </div>
            )}
          </div>
          <div style={{ width: '200px' }}>
            <Dropdown value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={statusOptions} />
          </div>
        </div>

        <div className="table-card">
          <div className="table-responsive">
            <table className="subs-table">
              <thead>
                <tr>
                  <th>Time Saved</th>
                  <th>Problem Title</th>
                  <th>Language</th>
                  <th>Final Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                   <tr><td colSpan="5" style={{ padding: '20px' }}><Skeleton count={3} height="40px" /></td></tr>
                ) : filteredData.length === 0 ? (
                   <tr><td colSpan="5" className="empty-state">No problems match this filter.</td></tr>
                ) : (
                  filteredData.map((item) => {
                    const sub = item.submission;
                    const langConf = getLangConfig(sub?.language);
                    const statConf = getStatusConfig(sub?.status);

                    return (
                      <tr key={item.problem.id}>
                        <td className="td-time">{sub ? formatTime(sub.updatedAt) : '--'}</td>
                        <td className="td-title">{item.problem.title}</td>
                        <td>
                          <div className="lang-badge">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: langConf.color }}>
                              {langConf.icon}
                            </span>
                            {sub?.language || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-${statConf.type}`}>
                            {statConf.type === 'acc' && <span className="status-dot"></span>}
                            {statConf.type !== 'acc' && <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{statConf.icon}</span>}
                            {statConf.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-view-code" onClick={() => { setSelectedItem(item); setModalTab('problem'); }}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL */}
      {selectedItem && (
        <div className="code-modal-overlay" onClick={() => setSelectedItem(null)}>
           <div className="code-modal" onClick={e => e.stopPropagation()}>
              
              <div className="code-modal-header">
                 <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedItem.problem.title}
                      <span className={`status-badge status-${getStatusConfig(selectedItem.submission?.status).type}`} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                         {getStatusConfig(selectedItem.submission?.status).label}
                      </span>
                    </h3>
                 </div>
                 <button className="btn-close-modal" onClick={() => setSelectedItem(null)}>
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>

              <div className="code-modal-tabs">
                 <button onClick={() => setModalTab('problem')} className={modalTab === 'problem' ? 'active' : ''}>Problem</button>
                 <button onClick={() => setModalTab('code')} className={modalTab === 'code' ? 'active' : ''}>Code</button>
                 <button onClick={() => setModalTab('tests')} className={modalTab === 'tests' ? 'active' : ''}>Test Cases</button>
              </div>

              <div className="code-modal-body-scroll custom-scrollbar">
                 
                 {/* TAB 1: PROBLEM */}
                 {modalTab === 'problem' && (
                    <div className="problem-statement-html" style={{ color: 'var(--text-main)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                       <MarkdownRenderer content={selectedItem.problem.description} />
                    </div>
                 )}

                 {/* TAB 2: CODE & SOLUTION */}
                 {modalTab === 'code' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
                      
                      {/* Language Switcher */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Language:</span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {allowedLangsList.map(l => {
                             const isSubmittedLang = selectedItem.submission?.language?.toLowerCase() === l.toLowerCase();
                             return (
                               <button 
                                  key={l} 
                                  onClick={() => setViewLang(l)}
                                  style={{ 
                                    background: viewLang === l ? 'var(--primary)' : 'var(--bg-surface-hover)', 
                                    color: viewLang === l ? '#fff' : 'var(--text-muted)',
                                    border: isSubmittedLang ? '1px solid var(--primary)' : '1px solid var(--border-light)', 
                                    borderRadius: '4px', padding: '4px 10px', 
                                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                  }}
                               >
                                 {isSubmittedLang && <span className="material-symbols-outlined" style={{fontSize: '14px'}}>check_circle</span>}
                                 {l}
                               </button>
                             );
                          })}
                        </div>
                      </div>

                      {/* User's Code or Base Stub */}
                      <div className="code-block-wrapper">
                         <div className="code-block-header">
                            {selectedItem.submission && selectedItem.submission.language?.toLowerCase() === viewLang.toLowerCase() && selectedItem.submission.code
                               ? <span style={{color: '#38bdf8'}}><span className="material-symbols-outlined" style={{fontSize: '14px', verticalAlign: 'middle', marginRight: '4px'}}>account_circle</span> Your Saved Code</span>
                               : <span style={{color: 'var(--text-muted)'}}><span className="material-symbols-outlined" style={{fontSize: '14px', verticalAlign: 'middle', marginRight: '4px'}}>integration_instructions</span> Base Code Stub</span>
                            }
                         </div>
                         <pre style={{ margin: 0, padding: '16px', background: '#000', borderRadius: '0 0 8px 8px', border: '1px solid var(--border-light)', overflowX: 'auto' }}>
                           <code style={{ fontFamily: 'monospace', fontSize: '14px', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                             {(() => {
                                if (selectedItem.submission && selectedItem.submission.language?.toLowerCase() === viewLang.toLowerCase() && selectedItem.submission.code) {
                                   return selectedItem.submission.code;
                                }
                                const stub = getMapValue(selectedItem.problem.codeStubs, viewLang);
                                return stub || "// No base code available for this language.";
                             })()}
                           </code>
                         </pre>
                      </div>

                      {/* Official Solution */}
                      {isGlobalEnded ? (
                         getMapValue(selectedItem.problem.solutionCode, viewLang) ? (
                           <div className="code-block-wrapper" style={{ marginTop: '10px' }}>
                             <div className="code-block-header" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderBottom: 'none' }}>
                                <span style={{color: '#10b981'}}><span className="material-symbols-outlined" style={{fontSize: '14px', verticalAlign: 'middle', marginRight: '4px'}}>verified</span> Official Solution Code</span>
                             </div>
                             <pre style={{ margin: 0, padding: '16px', background: '#000', borderRadius: '0 0 8px 8px', border: '1px solid rgba(16, 185, 129, 0.3)', overflowX: 'auto' }}>
                               <code style={{ fontFamily: 'monospace', fontSize: '14px', color: '#10b981', whiteSpace: 'pre-wrap' }}>
                                 {getMapValue(selectedItem.problem.solutionCode, viewLang)}
                               </code>
                             </pre>
                           </div>
                         ) : (
                           <div style={{ marginTop: '10px', padding: '16px', border: '1px dashed var(--border-light)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                              No official solution was provided by the instructor for {viewLang}.
                           </div>
                         )
                      ) : (
                         <div style={{ marginTop: '10px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px dashed rgba(59, 130, 246, 0.3)', borderRadius: '8px', color: '#3b82f6', fontSize: '0.85rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>lock_clock</span>
                            Official solutions are locked until the global contest timer expires.
                         </div>
                      )}
                    </div>
                 )}

                 {/* TAB 3: TEST CASES (Simplified View) */}
                 {modalTab === 'tests' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {!isGlobalEnded && (
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '8px', color: '#3b82f6', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                           Detailed inputs and expected outputs for hidden test cases are locked until the contest officially ends.
                        </div>
                      )}

                      {(() => {
                          let probTests = [];
                          if (typeof selectedItem.problem.testCases === 'string') {
                              try { probTests = JSON.parse(selectedItem.problem.testCases); } catch(e) {}
                          } else {
                              probTests = selectedItem.problem.testCases || [];
                          }

                          let subResults = [];
                          if (selectedItem.submission?.results) {
                              if (typeof selectedItem.submission.results === 'string') {
                                  try { subResults = JSON.parse(selectedItem.submission.results); } catch(e) {}
                              } else {
                                  subResults = selectedItem.submission.results || [];
                              }
                          }

                          if (probTests.length === 0) {
                             return (
                               <div className="empty-state" style={{ padding: '3rem 0', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px dashed var(--border-light)' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-muted)', opacity: 0.5, marginBottom: '16px' }}>science</span>
                                  <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)', fontWeight: 500 }}>No Test Cases Found</p>
                                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>This problem does not have any test cases defined by the instructor.</p>
                               </div>
                             );
                          }

                          return probTests.map((pt, i) => {
                             const res = subResults.find(r => r.index === (i + 1)) || subResults[i];
                             const isHidden = pt.isHidden;
                             const hasExecuted = !!res;

                             return (
                               <div key={i} style={{ border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-surface)', overflow: 'hidden' }}>
                                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                        Test Case {i + 1} {isHidden ? <span style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>(Hidden)</span> : ''}
                                     </div>
                                  </div>
                                  
                                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                     {(!isGlobalEnded && isHidden) ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: 'var(--text-muted)', background: 'var(--bg-main)', borderRadius: '6px', border: '1px dashed var(--border-light)' }}>
                                          <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>lock</span>
                                          <p style={{ margin: 0, fontSize: '0.85rem' }}>Data hidden during active contest.</p>
                                        </div>
                                     ) : (
                                        <>
                                          {hasExecuted && (res.status === 'Runtime Error' || res.status === 'Time Limit Exceeded') ? (
                                            <div>
                                              <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>Error Message</div>
                                              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontFamily: 'monospace', color: '#ef4444', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                                {res.actualOutput || res.actual || res.error || "Execution Failed"}
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Input</div>
                                                <div style={{ padding: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '6px', fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{pt.input || '--'}</div>
                                              </div>
                                              <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Expected Output</div>
                                                <div style={{ padding: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '6px', fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{pt.expectedOutput || pt.output || '--'}</div>
                                              </div>
                                              {hasExecuted && (res.actualOutput || res.actual) && (
                                                <div>
                                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Your Output</div>
                                                  <div style={{ padding: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '6px', fontFamily: 'monospace', color: 'var(--text-main)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                                    {res.actualOutput || res.actual}
                                                  </div>
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </>
                                     )}
                                  </div>
                               </div>
                             );
                          });
                      })()}
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}