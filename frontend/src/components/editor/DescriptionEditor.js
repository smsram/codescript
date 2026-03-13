"use client";
import React, { useRef, useState, useEffect } from 'react';
import Dropdown from '@/components/ui/Dropdown';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { showToast } from '@/components/ui/Toast';

export default function DescriptionEditor({ value, onChange }) {
  const textareaRef = useRef(null);
  const [isPreview, setIsPreview] = useState(false);
  
  // Image Modal States
  const [showImageModal, setShowImageModal] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");
  const [imgPublicId, setImgPublicId] = useState(""); 
  const [imgBorderRadius, setImgBorderRadius] = useState("8px"); 
  const [imgWidth, setImgWidth] = useState("auto"); // 🚀 Added Width
  const [imgHeight, setImgHeight] = useState("auto"); // 🚀 Added Height
  const [uploadingImg, setUploadingImg] = useState(false);
  const [deletingImg, setDeletingImg] = useState(false);

  // History States
  const [history, setHistory] = useState([value || ""]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Dropdown States
  const [headingVal, setHeadingVal] = useState('H');
  const [fontVal, setFontVal] = useState('F');
  const [sizeVal, setSizeVal] = useState('S');

  const headingOptions = [
    { label: 'Heading', value: 'H' }, { label: 'Normal Text', value: '0' },
    { label: 'Heading 1', value: '1' }, { label: 'Heading 2', value: '2' },
    { label: 'Heading 3', value: '3' }, { label: 'Heading 4', value: '4' }
  ];

  const fontOptions = [
    { label: 'Font Family', value: 'F' }, { label: 'Default Font', value: 'inherit' },
    { label: 'Sans-Serif', value: 'Arial, sans-serif' }, { label: 'Serif', value: 'Georgia, serif' },
    { label: 'Monospace', value: "'Courier New', monospace" }, { label: 'Comic Sans', value: "'Comic Sans MS', cursive" }
  ];

  const sizeOptions = [
    { label: 'Font Size', value: 'S' }, { label: 'Default Size', value: 'inherit' },
    { label: '12px', value: '12px' }, { label: '14px', value: '14px' },
    { label: '16px', value: '16px' }, { label: '18px', value: '18px' },
    { label: '24px', value: '24px' }, { label: '32px', value: '32px' }
  ];

  // 🚀 FIXED: Reliable history tracking without buggy useEffect loops
  const saveToHistory = (newValue) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const updateValue = (newValue, moveCursorTo = null) => {
    onChange(newValue);
    saveToHistory(newValue);

    if (moveCursorTo !== null && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(moveCursorTo, moveCursorTo);
      }, 0);
    }
  };

  const handleUndo = () => { if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); onChange(history[historyIndex - 1]); } };
  const handleRedo = () => { if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); onChange(history[historyIndex + 1]); } };

  // 🚀 FIXED: Alignment logic 
  const applyAlignment = (alignment) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let selectedText = value.substring(start, end) || "Aligned Content";
    
    selectedText = selectedText.replace(/<div align="[^"]+">\s*/g, '').replace(/\s*<\/div>/g, '');
    const wrapper = `\n<div align="${alignment}">\n\n${selectedText}\n\n</div>\n`;
    updateValue(value.substring(0, start) + wrapper + value.substring(end), start + wrapper.length - 9);
  };

  // 🚀 FIXED: Bulletproof Heading toggler
  const applyHeading = (level) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lineEndIndex = value.indexOf('\n', start);
    if (lineEndIndex === -1) lineEndIndex = value.length;
    
    let currentLine = value.substring(lineStart, lineEndIndex);
    currentLine = currentLine.replace(/^#{1,6}\s*/, ''); // Strip existing heading
    
    const prefix = level > 0 ? '#'.repeat(level) + ' ' : '';
    const newText = value.substring(0, lineStart) + prefix + currentLine + value.substring(lineEndIndex);
    updateValue(newText, start + prefix.length);
  };

  const applySpanStyle = (property, val) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (!selectedText) return showToast("Please select text first to apply formatting.", "warning");
    if (val === 'inherit') return; 

    const wrapper = `<span style="${property}: ${val};">${selectedText}</span>`;
    updateValue(value.substring(0, start) + wrapper + value.substring(end), start + wrapper.length);
  };

  // 🚀 FIXED: Perfected the block & inline formatters (No more cursor jumps)
  const applyFormat = (syntaxPrefix, syntaxSuffix = syntaxPrefix, isBlock = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    let newText = '', newCursorPos = start;

    if (isBlock) {
      if (syntaxPrefix === 'bullet') {
        const lines = selectedText ? selectedText.split('\n') : ['List item'];
        const bulleted = lines.map(line => `- ${line}`).join('\n');
        newText = value.substring(0, start) + bulleted + value.substring(end);
        newCursorPos = start + bulleted.length;
      } else if (syntaxPrefix === 'codeblock') {
        newText = value.substring(0, start) + '\n```text\n' + (selectedText || 'code here') + '\n```\n' + value.substring(end);
        newCursorPos = start + 9 + (selectedText.length || 9);
      }
    } else {
      if (syntaxPrefix === '[Link](') {
        newText = value.substring(0, start) + `[${selectedText || 'Link text'}](https://)` + value.substring(end);
        newCursorPos = start + (selectedText ? selectedText.length + 11 : 11);
      } else {
        newText = value.substring(0, start) + syntaxPrefix + (selectedText || 'text') + syntaxSuffix + value.substring(end);
        newCursorPos = start + syntaxPrefix.length + (selectedText.length || 4);
      }
    }
    updateValue(newText, newCursorPos);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) return showToast("Image is too large. Max size is 5MB.", "error");
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploadingImg(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ image: reader.result })
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed.");

        setImgUrl(data.url);
        setImgPublicId(data.public_id);
        setImgAlt(file.name.split('.')[0]);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setUploadingImg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImageFromModal = async () => {
    if (!imgPublicId) { setImgUrl(""); setImgAlt(""); setImgPublicId(""); return; }
    
    setDeletingImg(true);
    try {
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/delete-image`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ public_id: imgPublicId })
        });
        setImgUrl(""); setImgAlt(""); setImgPublicId("");
        showToast("Image removed from cloud.", "success");
    } catch (e) {
        showToast("Failed to delete image.", "error");
    } finally {
        setDeletingImg(false);
    }
  };

  // 🚀 FIXED: Injects Width and Height securely into the markdown string
  const handleInsertImage = () => {
    if (!imgUrl) return;
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : value.length;
    
    const pubIdAttr = imgPublicId ? `data-public-id="${imgPublicId}"` : '';
    const imgMarkdown = `\n<img src="${imgUrl}" alt="${imgAlt || 'image'}" width="${imgWidth}" height="${imgHeight}" style="border-radius: ${imgBorderRadius}; max-width: 100%;" ${pubIdAttr} />\n`;
    
    updateValue(value.substring(0, start) + imgMarkdown + value.substring(start), start + imgMarkdown.length);
    closeImageModal();
  };

  const handleDeleteSelectedImage = async () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (!selectedText.includes('<img') && !selectedText.includes('![')) {
        return showToast("Please select the entire image code block to delete it.", "warning");
    }

    const idMatch = selectedText.match(/data-public-id="([^"]+)"/);
    if (idMatch && idMatch[1]) {
        try {
            showToast("Deleting from cloud...", "info");
            const token = localStorage.getItem('token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/problems/delete-image`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ public_id: idMatch[1] })
            });
            showToast("Image permanently deleted.", "success");
        } catch (err) {
            showToast("Failed to delete from Cloudinary.", "error");
        }
    }
    updateValue(value.substring(0, start) + value.substring(end), start);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setImgUrl(""); setImgAlt(""); setImgPublicId(""); 
    setImgBorderRadius("8px"); setImgWidth("auto"); setImgHeight("auto");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      applyFormat('\t', '', false);
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'z') { e.preventDefault(); handleUndo(); }
      else if (e.key.toLowerCase() === 'y') { e.preventDefault(); handleRedo(); }
      else if (e.key.toLowerCase() === 'b') { e.preventDefault(); applyFormat('**'); }
      else if (e.key.toLowerCase() === 'i') { e.preventDefault(); applyFormat('_'); }
    }
  };

  return (
    <div className="pb-panel relative" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* 🚀 Disabled Toolbar entirely when Preview Mode is active to prevent crashes */}
      <div className="pb-panel-header" style={{ flexWrap: 'wrap', gap: '8px', pointerEvents: isPreview ? 'none' : 'auto', opacity: isPreview ? 0.6 : 1 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="btn-format" title="Undo (Ctrl+Z)" onClick={handleUndo} disabled={historyIndex === 0}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', opacity: historyIndex === 0 ? 0.3 : 1 }}>undo</span>
          </button>
          <button className="btn-format" title="Redo (Ctrl+Y)" onClick={handleRedo} disabled={historyIndex === history.length - 1}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', opacity: historyIndex === history.length - 1 ? 0.3 : 1 }}>redo</span>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <Dropdown minWidth="110px" value={headingVal} options={headingOptions} 
          onChange={(e) => { if (e.target.value !== 'H') { applyHeading(Number(e.target.value)); setHeadingVal('H'); } }} />
        <Dropdown minWidth="120px" value={fontVal} options={fontOptions} 
          onChange={(e) => { if (e.target.value !== 'F') { applySpanStyle('font-family', e.target.value); setFontVal('F'); } }} />
        <Dropdown minWidth="100px" value={sizeVal} options={sizeOptions} 
          onChange={(e) => { if (e.target.value !== 'S') { applySpanStyle('font-size', e.target.value); setSizeVal('S'); } }} />

        <div className="toolbar-divider"></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn-format" title="Bold (Ctrl+B)" onClick={() => applyFormat('**')}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_bold</span></button>
            <button className="btn-format" title="Italic (Ctrl+I)" onClick={() => applyFormat('_')}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_italic</span></button>
        </div>

        <div className="toolbar-divider"></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn-format" title="Inline Code" onClick={() => applyFormat('`')}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>code</span></button>
            <button className="btn-format" title="Code Block" onClick={() => applyFormat('codeblock', '', true)}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>data_object</span></button>
            <button className="btn-format" title="Link" onClick={() => applyFormat('[Link](' , ')', false)}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>link</span></button>
            <button className="btn-format" title="Bullet List" onClick={() => applyFormat('bullet', '', true)}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_list_bulleted</span></button>
            
            <button className="btn-format" title="Insert Image" onClick={() => setShowImageModal(true)}><span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#08b2d4' }}>image</span></button>
            <button className="btn-format" title="Delete Selected Image" onClick={handleDeleteSelectedImage} style={{ marginLeft: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ef4444' }}>image_not_supported</span>
            </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="image-dropdown-wrapper">
            <button className="btn-format" title="Universal Alignment"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_align_left</span></button>
            <div className="image-dropdown-menu">
            <button onClick={() => applyAlignment('left')}><span className="material-symbols-outlined">format_align_left</span> Align Left</button>
            <button onClick={() => applyAlignment('center')}><span className="material-symbols-outlined">format_align_center</span> Align Center</button>
            <button onClick={() => applyAlignment('right')}><span className="material-symbols-outlined">format_align_right</span> Align Right</button>
            </div>
        </div>

        <div style={{ flex: 1 }}></div>

        {/* 🚀 Reactivated pointer events for Preview Toggle so you can actually turn it off */}
        <button className={`btn-format ${isPreview ? 'active-preview' : ''}`} title="Toggle Preview" onClick={() => setIsPreview(!isPreview)} style={{ border: '1px solid #334155', borderRadius: '6px', padding: '4px 12px', color: isPreview ? 'var(--primary)' : '#94a3b8', pointerEvents: 'auto' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>{isPreview ? 'visibility_off' : 'visibility'}</span>
            {isPreview ? 'Edit Mode' : 'Preview'}
        </button>

      </div>
      
      {isPreview ? (
        <MarkdownRenderer content={value} className="md-preview-area" />
      ) : (
        <textarea 
          ref={textareaRef}
          className="md-editor"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            // Push history periodically if they type huge blocks manually
            if (e.target.value.length % 20 === 0) saveToHistory(e.target.value); 
          }}
          onKeyDown={handleKeyDown} 
          placeholder="Write your problem description here using Markdown... Select an image's HTML code and click the red image icon to permanently delete it from the server."
        />
      )}

      {/* 🚀 UPGRADED IMAGE MODAL WITH WIDTH & HEIGHT */}
      {showImageModal && (
        <>
          <div className="modal-backdrop" onClick={closeImageModal}></div>
          <div className="image-centered-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 600, margin: 0 }}>Insert Image</h4>
                <button onClick={closeImageModal} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><span className="material-symbols-outlined">close</span></button>
            </div>
            
            {imgUrl ? (
              <div className="img-preview-container">
                <img src={imgUrl} alt="Preview" style={{ maxHeight: '140px', maxWidth: '100%', borderRadius: imgBorderRadius, objectFit: 'contain' }} />
                <button onClick={handleRemoveImageFromModal} disabled={deletingImg} className="btn-remove-img">
                    {deletingImg ? 'Deleting...' : 'Remove'}
                </button>
              </div>
            ) : (
              <div className="img-upload-box">
                  <input type="file" id="file-upload" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                  <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>cloud_upload</span>
                      <span style={{ fontWeight: 600 }}>{uploadingImg ? 'Uploading to Cloudinary...' : 'Upload from Computer'}</span>
                  </label>
              </div>
            )}

            {!imgUrl && <div style={{ textAlign: 'center', color: '#64748b', margin: '16px 0', fontSize: '12px', fontWeight: 600 }}>OR</div>}

            <div style={{ display: 'flex', gap: '12px', marginTop: imgUrl ? '16px' : '0' }}>
                <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Image URL</label>
                    <input type="text" placeholder="https://..." value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} className="img-modal-input" disabled={!!imgPublicId} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Border Radius</label>
                    <input type="text" placeholder="8px" value={imgBorderRadius} onChange={(e) => setImgBorderRadius(e.target.value)} className="img-modal-input" />
                </div>
            </div>

            {/* 🚀 NEW WIDTH AND HEIGHT ROW */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Width (px or %)</label>
                    <input type="text" placeholder="auto" value={imgWidth} onChange={(e) => setImgWidth(e.target.value)} className="img-modal-input" />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Height (px or %)</label>
                    <input type="text" placeholder="auto" value={imgHeight} onChange={(e) => setImgHeight(e.target.value)} className="img-modal-input" />
                </div>
                <div style={{ flex: 2 }}>
                    <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>Alt Text</label>
                    <input type="text" placeholder="Diagram showing..." value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} className="img-modal-input" />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <button className="img-btn-cancel" onClick={closeImageModal}>Cancel</button>
              <button className="img-btn-insert" onClick={handleInsertImage} disabled={!imgUrl}>Insert Image</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}