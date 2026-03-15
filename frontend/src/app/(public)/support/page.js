"use client";

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/ui/Toast';
import Dropdown from '@/components/ui/Dropdown'; // 🚀 Imported your custom Dropdown
import './support.css';

export default function SupportPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Technical Bug');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const fileInputRef = useRef(null);

  // 🚀 Added more relevant FAQs for the CodeScript platform
  const faqs = [
    {
      id: 1,
      icon: "videocam",
      q: "Why did I receive a webcam strike?",
      a: "Webcam strikes occur if the AI detects you looking away from the screen for prolonged periods, if another person enters the frame, or if your face is obscured. Ensure you are in a well-lit room."
    },
    {
      id: 2,
      icon: "timer",
      q: "Why did my code throw a Time Limit Exceeded (TLE) error?",
      a: "A TLE means your code took too long to run. This usually happens if you have an infinite loop, or if your algorithm is too slow (e.g., O(N^2) instead of O(N log N)) for the hidden test cases."
    },
    {
      id: 3,
      icon: "wifi_off",
      q: "What happens if my internet disconnects during an exam?",
      a: "CodeScript auto-saves your drafts to your browser's local storage and the cloud every 10 seconds. If you disconnect, do not refresh the page. Reconnect to Wi-Fi, and your progress will instantly sync back."
    },
    {
      id: 4,
      icon: "gavel",
      q: "What are the rules for exam integrity?",
      a: "You must remain in full screen. Switching tabs, using secondary devices, or copy-pasting code from external sources will trigger automated flags and may terminate your session."
    },
    {
      id: 5,
      icon: "deployed_code",
      q: "Can I use external libraries like NumPy or Pandas?",
      a: "Students cannot manually pip install packages during an exam. However, if your professor requires specific libraries (like scikit-learn), they will be pre-installed globally on the server and ready to import instantly."
    },
    {
      id: 6,
      icon: "alarm",
      q: "What happens if the exam timer runs out?",
      a: "When the global exam timer or your personal duration limit expires, the platform will automatically submit your most recently saved draft. No manual action is required."
    }
  ];

  // 🚀 Options for your custom Dropdown component
  const categoryOptions = [
    { label: 'Technical Bug / Editor Issue', value: 'Technical Bug' },
    { label: 'Camera / Proctoring Issue', value: 'Proctoring Issue' },
    { label: 'Account Access / Login', value: 'Account Access' },
    { label: 'Appeal a Flag / Dispute', value: 'Exam Dispute' },
    { label: 'Other (Custom)', value: 'Custom' }
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        return showToast("File size must be under 5MB", "error");
      }
      const reader = new FileReader();
      reader.onloadend = () => setFile(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !description.trim()) {
      return showToast("Please fill in all required fields.", "warning");
    }

    const finalCategory = category === 'Custom' ? customCategory : category;
    if (!finalCategory.trim()) {
      return showToast("Please specify your custom category.", "warning");
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/support/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, category: finalCategory, description, attachment: file })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit ticket");

      showToast("Support ticket submitted successfully!", "success");
      setDescription('');
      setFile(null);
      if (category === 'Custom') setCustomCategory('');
    } catch (err) {
      // 🚀 Will now display the actual error instead of an HTML parsing error!
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-page-container">
      <div className="support-wrapper container">
        
        {/* Minimal Header */}
        <nav className="support-nav-header anim-fade-up">
          <button onClick={() => router.back()} className="back-btn">
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Go Back</span>
          </button>
          <div className="nav-brand">
             <span className="material-symbols-outlined text-primary">support_agent</span>
             <span>CodeScript <span className="hide-mobile">Support</span></span>
          </div>
        </nav>

        <main className="support-main">
          
          {/* Status Indicator */}
          <div className="status-indicator anim-fade-up">
            <span className="status-ping">
              <span className="ping-anim"></span>
              <span className="ping-dot"></span>
            </span>
            <span>All Execution Systems Operational</span>
          </div>

          <div className="support-layout anim-fade-up delay-1">
            
            {/* Left Column: Form */}
            <div className="support-form-card">
              <h2>Submit a Support Ticket</h2>
              <p className="form-sub">Encountered an issue during a lab or exam? Let IT Support know.</p>
              
              <form onSubmit={handleSubmit} className="ticket-form">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="your.name@student.ggu.edu" 
                  />
                </div>

                <div className="form-group">
                  <label>Issue Category *</label>
                  {/* 🚀 Replaced native select with your custom Dropdown */}
                  <Dropdown 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    options={categoryOptions} 
                  />
                </div>

                {category === 'Custom' && (
                  <div className="form-group anim-fade-up">
                    <label>Specify Category *</label>
                    <input 
                      type="text" 
                      required 
                      value={customCategory} 
                      onChange={e => setCustomCategory(e.target.value)} 
                      placeholder="e.g., Grade discrepancy" 
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Description *</label>
                  <textarea 
                    required 
                    rows="5" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Please describe the issue in detail. If it happened during an exam, include the Exam ID."
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Upload Screenshot (Optional)</label>
                  <div className="file-drop-area" onClick={() => fileInputRef.current.click()}>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      hidden 
                      accept="image/png, image/jpeg, image/jpg" 
                      onChange={handleFileChange} 
                    />
                    <span className="material-symbols-outlined file-icon">
                      {file ? 'check_circle' : 'cloud_upload'}
                    </span>
                    <p>{file ? 'Image attached successfully!' : 'Click to browse images'}</p>
                    {!file && <span className="file-hint">PNG, JPG up to 5MB</span>}
                  </div>
                  {file && (
                    <button type="button" className="remove-file-btn" onClick={() => setFile(null)}>
                      Remove Attachment
                    </button>
                  )}
                </div>

                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? (
                    <span className="material-symbols-outlined animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined">send</span>
                  )}
                  {loading ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </form>
            </div>

            {/* Right Column: FAQs */}
            <div className="support-sidebar">
              <h3>Frequently Asked Questions</h3>
              
              <div className="faq-list">
                {faqs.map(faq => (
                  <div 
                    key={faq.id} 
                    className={`faq-item ${openFaq === faq.id ? 'open' : ''}`}
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  >
                    <div className="faq-q">
                      <div className="faq-q-inner">
                        <span className="material-symbols-outlined text-primary">{faq.icon}</span>
                        <span>{faq.q}</span>
                      </div>
                      <span className="material-symbols-outlined chevron">expand_more</span>
                    </div>
                    <div className="faq-a">
                      <p>{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 🚀 Updated Email Address */}
              <div className="support-contact-box">
                <span className="material-symbols-outlined">mail</span>
                <div>
                  <h4>Direct Contact</h4>
                  <p>codescriptggu@gmail.com</p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}