import React, { useState, useEffect } from 'react';
import { 
  Bot, User, Copy, Check, Send, Sparkles, ShieldAlert, Paperclip, Mic, 
  ArrowRight, ExternalLink, Activity, RefreshCw, Search, Briefcase, 
  AlertCircle, Clock, ShieldCheck, ArrowUpRight, Zap, CopyCheck, Terminal,
  Sliders, ShieldX
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

// 1. INLINE MARKDOWN PARSER COMPONENT
function InlineMarkdown({ text }) {
  if (!text) return null;
  
  let isChecklist = false;
  let isChecked = false;
  let cleanText = text;
  
  if (text.startsWith('[x] ') || text.startsWith('[X] ')) {
    isChecklist = true;
    isChecked = true;
    cleanText = text.substring(4);
  } else if (text.startsWith('[ ] ')) {
    isChecklist = true;
    isChecked = false;
    cleanText = text.substring(4);
  }
  
  // Parse inline bold (**), inline code (`), and links [label](url)
  const tokenRegex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = cleanText.split(tokenRegex);
  
  const renderedElements = parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-soc-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-[#162337] text-soc-primary px-1.5 py-0.5 rounded font-mono text-[10px] border border-soc-border mx-0.5">
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-soc-primary hover:underline inline-flex items-center gap-0.5 font-bold"
        >
          <span>{linkMatch[1]}</span>
          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
        </a>
      );
    }
    return part;
  });

  if (isChecklist) {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <input 
          type="checkbox" 
          checked={isChecked} 
          readOnly 
          className="h-3.5 w-3.5 rounded border-soc-border bg-soc-panel text-soc-primary focus:ring-soc-primary cursor-default" 
        />
        <span className={isChecked ? 'text-soc-muted line-through' : 'text-[#e8eaf0]'}>
          {renderedElements}
        </span>
      </div>
    );
  }

  return <>{renderedElements}</>;
}

// 2. BLOCK-LEVEL MARKDOWN PARSER
function parseMarkdownToReactBlocks(markdownText) {
  if (!markdownText) return [];
  const lines = markdownText.split('\n');
  const blocks = [];
  
  let currentBlock = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Code Block detector
    if (trimmed.startsWith('```')) {
      if (currentBlock && currentBlock.type === 'code') {
        blocks.push(currentBlock);
        currentBlock = null;
      } else {
        if (currentBlock) blocks.push(currentBlock);
        const lang = trimmed.slice(3).trim();
        currentBlock = { type: 'code', language: lang || 'text', codeLines: [] };
      }
      continue;
    }
    
    if (currentBlock && currentBlock.type === 'code') {
      currentBlock.codeLines.push(line);
      continue;
    }
    
    // Table detector
    if (trimmed.startsWith('|')) {
      if (currentBlock && currentBlock.type === 'table') {
        currentBlock.rows.push(line);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'table', rows: [line] };
      }
      continue;
    } else if (currentBlock && currentBlock.type === 'table') {
      blocks.push(currentBlock);
      currentBlock = null;
    }
    
    // Blockquote detector
    if (trimmed.startsWith('>')) {
      const text = trimmed.slice(1).trim();
      if (currentBlock && currentBlock.type === 'blockquote') {
        currentBlock.lines.push(text);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'blockquote', lines: [text] };
      }
      continue;
    } else if (currentBlock && currentBlock.type === 'blockquote') {
      blocks.push(currentBlock);
      currentBlock = null;
    }
    
    // Heading detector
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      if (currentBlock) blocks.push(currentBlock);
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      currentBlock = null;
      continue;
    }
    
    // Horizontal rule detector
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      if (currentBlock) blocks.push(currentBlock);
      blocks.push({ type: 'hr' });
      currentBlock = null;
      continue;
    }
    
    // List Item detector
    const bulletMatch = line.match(/^(\s*)[-\*]\s+(.*)$/);
    const numMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (bulletMatch) {
      if (currentBlock && currentBlock.type === 'bullet-list') {
        currentBlock.items.push(bulletMatch[2]);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'bullet-list', items: [bulletMatch[2]] };
      }
      continue;
    } else if (numMatch) {
      if (currentBlock && currentBlock.type === 'num-list') {
        currentBlock.items.push(numMatch[2]);
      } else {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = { type: 'num-list', items: [numMatch[2]] };
      }
      continue;
    }
    
    if (currentBlock && (currentBlock.type === 'bullet-list' || currentBlock.type === 'num-list')) {
      blocks.push(currentBlock);
      currentBlock = null;
    }
    
    // Empty line logic
    if (trimmed === '') {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }
    
    // Paragraph block
    if (currentBlock && currentBlock.type === 'paragraph') {
      currentBlock.text += ' ' + trimmed;
    } else {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { type: 'paragraph', text: trimmed };
    }
  }
  
  if (currentBlock) {
    blocks.push(currentBlock);
  }
  
  return blocks;
}

// Compile blocks into rich custom section cards
function compileCustomCards(blocks) {
  const finalBlocks = [];
  let currentCustomCard = null;
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Detect custom headers to group them
    if (block.type === 'heading' || (block.type === 'paragraph' && block.text.match(/^(Executive Summary|Risk Overview|Risk Assessment|Evidence|Timeline|Recommended Actions|MITRE ATT&CK)$/i))) {
      const rawTitle = block.type === 'heading' ? block.text : block.text;
      const title = rawTitle.toLowerCase();
      let sectionType = null;
      
      if (title.includes('executive summary')) {
        sectionType = 'executive-summary';
      } else if (title.includes('risk overview') || title.includes('risk assessment')) {
        sectionType = 'risk-assessment';
      } else if (title.includes('evidence')) {
        sectionType = 'evidence';
      } else if (title.includes('timeline')) {
        sectionType = 'timeline';
      } else if (title.includes('recommended actions') || title.includes('action')) {
        sectionType = 'recommended-actions';
      } else if (title.includes('mitre')) {
        sectionType = 'mitre';
      }
      
      if (sectionType) {
        if (currentCustomCard) {
          finalBlocks.push(currentCustomCard);
        }
        currentCustomCard = {
          type: 'custom-card',
          sectionType,
          title: rawTitle,
          blocks: []
        };
        continue;
      }
    }
    
    if (currentCustomCard) {
      if (block.type === 'heading') {
        finalBlocks.push(currentCustomCard);
        currentCustomCard = null;
        i--; // Re-evaluate heading
      } else {
        currentCustomCard.blocks.push(block);
      }
    } else {
      finalBlocks.push(block);
    }
  }
  
  if (currentCustomCard) {
    finalBlocks.push(currentCustomCard);
  }
  
  return finalBlocks;
}

// CUSTOM ENTERPRISE CARD COMPONENTS
function ExecutiveSummaryCard({ title, blocks }) {
  const listItems = [];
  blocks.forEach(b => {
    if (b.type === 'bullet-list' || b.type === 'num-list') listItems.push(...b.items);
    else if (b.type === 'paragraph') listItems.push(b.text);
  });

  return (
    <div className="border-l-4 border-soc-primary bg-[#101827] border border-soc-border/60 rounded-r p-4 mb-4 shadow-md">
      <span className="text-[10px] font-mono font-bold tracking-widest text-soc-primary uppercase block">
        Executive Summary
      </span>
      <div className="w-full h-[1px] bg-soc-border/40 my-2" />
      <ul className="space-y-2 text-xs">
        {listItems.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-[#e8eaf0]">
            <span className="text-soc-primary mt-0.5">•</span>
            <span><InlineMarkdown text={item} /></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RiskScoreCard({ title, blocks }) {
  const stats = [];
  blocks.forEach(block => {
    if (block.type === 'bullet-list' || block.type === 'num-list') {
      block.items.forEach(item => {
        const match = item.match(/^(.*?)\s*:\s*(.*)$/) || item.match(/^(.*?)\s*[-]\s*(.*)$/);
        if (match) {
          stats.push({ label: match[1].replace(/\*\*/g, '').trim(), value: match[2].replace(/\*\*/g, '').trim() });
        }
      });
    } else if (block.type === 'paragraph') {
      const lines = block.text.split('\n');
      lines.forEach(line => {
        const match = line.match(/^(.*?)\s*:\s*(.*)$/) || line.match(/^(.*?)\s*[-]\s*(.*)$/);
        if (match) {
          stats.push({ label: match[1].replace(/\*\*/g, '').trim(), value: match[2].replace(/\*\*/g, '').trim() });
        }
      });
    }
  });

  // Extract risk score value
  const overallRiskObj = stats.find(s => s.label.toLowerCase().includes('overall risk') || s.label.toLowerCase().includes('risk score'));
  const overallRisk = overallRiskObj ? overallRiskObj.value : '92';
  const otherStats = stats.filter(s => !s.label.toLowerCase().includes('overall risk') && !s.label.toLowerCase().includes('risk score'));

  return (
    <div className="bg-[#101827] border border-soc-border rounded-lg p-4 mb-4 shadow">
      <span className="text-[10px] font-mono font-bold tracking-widest text-[#f59e0b] uppercase block">
        Risk Assessment
      </span>
      <div className="w-full h-[1px] bg-soc-border/40 my-2" />
      
      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Risk score radial ring display */}
        <div className="col-span-1 flex flex-col items-center border-r border-soc-border/40 pr-2">
          <div className="relative flex items-center justify-center h-16 w-16 rounded-full border-4 border-red-500/20 border-t-red-500 shadow-inner">
            <span className="font-mono text-base font-black text-soc-text">{overallRisk.split('/')[0].trim()}</span>
          </div>
          <span className="text-[9px] uppercase font-mono text-soc-muted font-bold mt-1 text-center">Risk Score</span>
        </div>
        
        {/* Metric elements */}
        <div className="col-span-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs font-mono">
          {otherStats.map((stat, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[9px] text-soc-muted uppercase font-bold">{stat.label}</span>
              <span className="text-soc-text font-bold mt-0.5">{stat.value}</span>
            </div>
          ))}
          {otherStats.length === 0 && (
            <>
              <div className="flex flex-col">
                <span className="text-[9px] text-soc-muted uppercase font-bold">Confidence</span>
                <span className="text-emerald-400 font-bold mt-0.5">98%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-soc-muted uppercase font-bold">Estimated Loss</span>
                <span className="text-soc-text font-bold mt-0.5">₹1,980,000</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EvidenceTable({ title, blocks }) {
  const items = [];
  blocks.forEach(b => {
    if (b.type === 'bullet-list' || b.type === 'num-list') items.push(...b.items);
    else if (b.type === 'paragraph') items.push(b.text);
  });

  return (
    <div className="bg-[#101827] border border-soc-border rounded-lg p-4 mb-4 shadow">
      <span className="text-[10px] font-mono font-bold tracking-widest text-soc-danger uppercase block">
        Evidence Dossier
      </span>
      <div className="w-full h-[1px] bg-soc-border/40 my-2" />
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-xs text-[#e8eaf0] bg-[#0c121e]/40 p-2 border border-soc-border/40 rounded hover:border-soc-primary transition-all">
            <ShieldAlert className="h-3.5 w-3.5 text-soc-danger shrink-0 mt-0.5" />
            <span className="font-mono"><InlineMarkdown text={item} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineComponent({ title, blocks }) {
  const timelineItems = [];
  blocks.forEach(block => {
    if (block.type === 'bullet-list' || block.type === 'num-list') {
      block.items.forEach(item => {
        const match = item.match(/^(\d{2}:\d{2}:\d{2}\s*(?:AM|PM)?|.*?\d{1,2}\s+mins?\s+ago.*?)\s*[-:]?\s*(.*)$/i);
        if (match) {
          timelineItems.push({ time: match[1].trim(), text: match[2].trim() });
        } else {
          timelineItems.push({ time: 'LOG', text: item });
        }
      });
    }
  });

  return (
    <div className="bg-[#101827] border border-soc-border rounded-lg p-4 mb-4 shadow">
      <span className="text-[10px] font-mono font-bold tracking-widest text-[#a855f7] uppercase block">
        Investigation Timeline
      </span>
      <div className="w-full h-[1px] bg-soc-border/40 my-2" />
      
      <div className="relative pl-4 border-l border-soc-border/50 space-y-4 py-1.5 ml-2 font-mono">
        {timelineItems.map((item, idx) => (
          <div key={idx} className="relative">
            {/* Glowing timeline node */}
            <span className="absolute -left-[21px] top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-soc-panel border border-soc-primary">
              <span className="h-1 w-1 rounded-full bg-soc-primary animate-ping" />
            </span>
            <div className="flex flex-col text-xs">
              <span className="text-[9px] text-soc-muted font-bold uppercase">{item.time}</span>
              <span className="text-[#e8eaf0] mt-0.5 font-sans"><InlineMarkdown text={item.text} /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButtons({ title, blocks }) {
  const actions = [];
  blocks.forEach(block => {
    if (block.type === 'bullet-list' || block.type === 'num-list') {
      block.items.forEach(item => {
        const matches = item.match(/\[(.*?)\]/g);
        if (matches) {
          matches.forEach(m => actions.push(m.slice(1, -1).trim()));
        } else {
          actions.push(item.replace(/[-\*]/g, '').trim());
        }
      });
    } else if (block.type === 'paragraph') {
      const matches = block.text.match(/\[(.*?)\]/g);
      if (matches) {
        matches.forEach(m => actions.push(m.slice(1, -1).trim()));
      }
    }
  });

  const handleActionClick = (act) => {
    alert(`AI Copilot Command Dispatched: [ ${act} ]`);
  };

  return (
    <div className="bg-[#101827] border border-soc-border rounded-lg p-4 mb-4 shadow">
      <span className="text-[10px] font-mono font-bold tracking-widest text-[#10b981] uppercase block">
        Recommended Actions
      </span>
      <div className="w-full h-[1px] bg-soc-border/40 my-2" />
      <div className="grid grid-cols-2 gap-2 mt-2">
        {actions.map((act, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleActionClick(act)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-soc-panel border border-soc-border hover:border-soc-primary hover:bg-soc-primary/10 text-soc-text rounded text-xs font-bold font-mono transition-all hover:shadow-[0_0_10px_rgba(109,94,248,0.1)]"
          >
            <Zap className="h-3 w-3 text-[#f59e0b]" />
            <span>{act}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MITRETechniqueCard({ title, blocks }) {
  const items = [];
  blocks.forEach(b => {
    if (b.type === 'bullet-list' || b.type === 'num-list') items.push(...b.items);
    else if (b.type === 'paragraph') items.push(b.text);
  });

  return (
    <div className="bg-[#101827] border border-red-500/20 rounded-lg p-4 mb-4 shadow">
      <span className="text-[10px] font-mono font-bold tracking-widest text-red-500 uppercase block">
        MITRE ATT&CK Mapping
      </span>
      <div className="w-full h-[1px] bg-red-500/20 my-2" />
      <div className="grid gap-2 text-xs font-mono">
        {items.map((item, idx) => {
          const match = item.match(/^([T\d]+)\s*[-:]\s*(.*)$/);
          if (match) {
            return (
              <div key={idx} className="flex items-start gap-2 bg-red-950/20 border border-red-950/40 p-2 rounded">
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 font-black rounded text-[9px]">
                  {match[1]}
                </span>
                <span className="text-soc-text">{match[2]}</span>
              </div>
            );
          }
          return (
            <div key={idx} className="bg-red-950/20 border border-red-950/40 p-2 rounded text-soc-text">
              <InlineMarkdown text={item} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 3. MARKDOWN COMPONENT RENDERER ENGINE
function MarkdownReportRenderer({ content, onSelectCustomer }) {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState(null);

  const rawBlocks = useMemo(() => parseMarkdownToReactBlocks(content), [content]);
  const compiledBlocks = useMemo(() => compileCustomCards(rawBlocks), [rawBlocks]);

  const copyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(index);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  return (
    <div className="space-y-3 font-sans">
      {compiledBlocks.map((block, idx) => {
        
        // Handle Custom Cards
        if (block.type === 'custom-card') {
          switch (block.sectionType) {
            case 'executive-summary':
              return <ExecutiveSummaryCard key={idx} title={block.title} blocks={block.blocks} />;
            case 'risk-assessment':
              return <RiskScoreCard key={idx} title={block.title} blocks={block.blocks} />;
            case 'evidence':
              return <EvidenceTable key={idx} title={block.title} blocks={block.blocks} />;
            case 'timeline':
              return <TimelineComponent key={idx} title={block.title} blocks={block.blocks} />;
            case 'recommended-actions':
              return <ActionButtons key={idx} title={block.title} blocks={block.blocks} />;
            case 'mitre':
              return <MITRETechniqueCard key={idx} title={block.title} blocks={block.blocks} />;
            default:
              return null;
          }
        }

        // Handle Default Headings
        if (block.type === 'heading') {
          return (
            <div key={idx} className="mt-5 mb-2 first:mt-0 border-b border-soc-border pb-1">
              <h3 className="text-xs font-black tracking-wide text-soc-text uppercase font-mono">
                {block.text}
              </h3>
            </div>
          );
        }

        // Handle Default Paragraphs
        if (block.type === 'paragraph') {
          return (
            <p key={idx} className="mb-2 leading-relaxed text-[#e8eaf0]">
              <InlineMarkdown text={block.text} />
            </p>
          );
        }

        // Handle Bullet Lists
        if (block.type === 'bullet-list') {
          return (
            <ul key={idx} className="list-none space-y-1.5 pl-2 mb-3">
              {block.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[#e8eaf0]">
                  <span className="text-soc-primary mt-0.5">•</span>
                  <span><InlineMarkdown text={item} /></span>
                </li>
              ))}
            </ul>
          );
        }

        // Handle Numbered Lists
        if (block.type === 'num-list') {
          return (
            <ol key={idx} className="list-decimal space-y-1.5 pl-5 mb-3 text-[#e8eaf0] font-mono">
              {block.items.map((item, i) => (
                <li key={i} className="pl-1">
                  <InlineMarkdown text={item} />
                </li>
              ))}
            </ol>
          );
        }

        // Handle Blockquotes
        if (block.type === 'blockquote') {
          return (
            <blockquote key={idx} className="border-l-4 border-soc-primary bg-[#101827]/40 px-3.5 py-2 my-3 italic text-soc-muted rounded-r">
              {block.lines.join(' ')}
            </blockquote>
          );
        }

        // Handle Divider Rule
        if (block.type === 'hr') {
          return <div key={idx} className="my-4 border-t border-soc-border/60" />;
        }

        // Handle Code Blocks
        if (block.type === 'code') {
          const codeString = block.codeLines.join('\n');
          return (
            <div key={idx} className="relative bg-[#0c1017] rounded-lg border border-soc-border/60 overflow-hidden my-3 shadow">
              <div className="flex items-center justify-between px-3 py-1.5 bg-soc-panel border-b border-soc-border font-mono text-[9px] text-soc-muted">
                <span>{block.language || 'text'}</span>
                <button 
                  type="button" 
                  onClick={() => copyCode(codeString, idx)}
                  className="hover:text-soc-text transition-colors flex items-center gap-1"
                >
                  {copiedCodeIdx === idx ? <CopyCheck className="h-3 w-3 text-soc-success" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedCodeIdx === idx ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] font-mono text-soc-primary bg-[#080d16] no-scrollbar">
                <code>{codeString}</code>
              </pre>
            </div>
          );
        }

        // Handle Tables
        if (block.type === 'table') {
          const headers = [];
          const rows = [];
          
          block.rows.forEach((rowStr, rIdx) => {
            const cells = rowStr.split('|').map(c => c.trim()).filter(c => c !== '');
            if (rIdx === 0) {
              headers.push(...cells);
            } else if (rIdx === 1) {
              // Sep line
            } else {
              rows.push(cells);
            }
          });

          return (
            <div key={idx} className="overflow-x-auto border border-soc-border rounded-lg shadow my-3 no-scrollbar">
              <table className="w-full text-left text-[11px] font-mono border-collapse">
                <thead className="bg-[#162337] text-soc-muted uppercase text-[9px] font-black tracking-wider border-b border-soc-border">
                  <tr>
                    {headers.map((h, i) => <th key={i} className="p-2.5 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-soc-border/40 text-soc-text">
                  {rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-soc-panel/30 transition-colors cursor-pointer">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2.5 font-mono truncate max-w-[150px]">
                          <InlineMarkdown text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}

// 4. MAIN COPILOT PANEL
export default function AICopilotPanel({ activeContext, onSelectCustomer }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      timestamp: '10:24:32 AM',
      type: 'structured_alert',
      heading: 'Latest Critical Alerts',
      stats: [
        { label: 'Total Critical', value: '7', color: 'text-red-500' },
        { label: 'Affected Users', value: '5', color: 'text-soc-text' },
        { label: 'High Risk Score', value: '92', color: 'text-red-500 font-black' },
        { label: 'Confidence Avg.', value: '87%', color: 'text-soc-quantum' },
      ],
      tableData: [
        { time: '10:23:51 AM', type: 'Impossible Travel', typeIcon: '✈️', customer: 'Rajesh Kumar', customerId: 'CUST_982734', riskScore: 92, location: 'Mumbai ➔ New York 🇺🇸', status: 'New', statusColor: 'bg-red-500' },
        { time: '10:22:44 AM', type: 'Unusual Transaction', typeIcon: '💳', customer: 'Priya Sharma', customerId: 'CUST_442910', riskScore: 89, location: 'Bangalore, India 🇮🇳', status: 'New', statusColor: 'bg-red-500' },
        { time: '10:21:33 AM', type: 'Multiple Sessions', typeIcon: '📱', customer: 'Arjun Mehta', customerId: 'CUST_551029', riskScore: 88, location: 'Delhi, India 🇮🇳', status: 'In Progress', statusColor: 'bg-amber-500' },
        { time: '10:20:11 AM', type: 'New Device Login', typeIcon: '💻', customer: 'Sneha Iyer', customerId: 'CUST_110948', riskScore: 85, location: 'Chennai, India 🇮🇳', status: 'New', statusColor: 'bg-red-500' },
        { time: '10:19:02 AM', type: 'High Value Transfer', typeIcon: '💸', customer: 'Vikram Singh', customerId: 'CUST_330192', riskScore: 92, location: 'Hyderabad, India 🇮🇳', status: 'New', statusColor: 'bg-red-500' },
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  const loadingMessages = [
    "Analyzing platform telemetry...",
    "Correlating fraud graph node vectors...",
    "Evaluating real-time risk engine thresholds...",
    "Querying device fingerprint databases...",
    "Summarizing forensic indicators of compromise..."
  ];

  const quickActions = [
    { label: "Investigate Customer", query: "Investigate Rajesh Kumar", icon: Search },
    { label: "Show Critical Alerts", query: "Show me the latest critical alerts", icon: ShieldAlert, tint: "text-red-400" },
    { label: "Detect Anomalies", query: "Detect anomalies in active sessions", icon: Activity },
    { label: "Audit VPN Logins", query: "Who logged in through VPN today?", icon: ShieldAlert },
    { label: "Executive Report", query: "Generate executive report", icon: ExternalLink },
    { label: "Graph Analysis", query: "Show graph anomalies and mule accounts", icon: RefreshCw },
  ];

  // Rotate loading texts every 2 seconds
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMessageIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const sendMessage = async (overridePrompt) => {
    const promptToSend = overridePrompt || input;
    if (!promptToSend.trim()) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: promptToSend, timestamp: new Date().toLocaleTimeString() }
    ];
    setMessages(newMessages);
    if (!overridePrompt) setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: activeContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([
          ...newMessages,
          { role: 'model', content: data.response, timestamp: new Date().toLocaleTimeString() }
        ]);
      } else {
        setMessages([
          ...newMessages,
          { role: 'model', content: "### Error\n⚠️ Error connecting to Fuzen AI Copilot backend endpoint.", timestamp: new Date().toLocaleTimeString() }
        ]);
      }
    } catch (e) {
      setMessages([
        ...newMessages,
        { role: 'model', content: "### Connection Failed\n⚠️ Failed to fetch response. Please check backend API server.", timestamp: new Date().toLocaleTimeString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRiskScoreClass = (score) => {
    if (score >= 85) return 'text-red-500 font-bold';
    if (score >= 60) return 'text-amber-400 font-semibold';
    return 'text-emerald-400 font-medium';
  };

  return (
    <div className="flex flex-col h-full bg-[#07101C] text-[#e8eaf0] font-sans border-l border-soc-border">
      
      {/* Header Bar */}
      <div className="px-4 py-3 bg-[#101827] border-b border-soc-border flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#6d5ef8]/10 border border-[#6d5ef8]/30 text-soc-primary">
            <Bot className="w-4 h-4 text-soc-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-soc-text flex items-center gap-1.5 tracking-wider font-mono">
              Fuzen AI Copilot
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-soc-primary/15 border border-soc-primary/30 text-soc-primary font-mono font-bold">
                GEMINI POWERED
              </span>
            </h2>
            <p className="text-[10px] text-soc-muted font-mono font-semibold">Autonomous SOC Investigation Agent</p>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-3 text-[10px] text-soc-muted font-mono">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold">LIVE</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {/* Quick Actions Row */}
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.label}
                onClick={() => sendMessage(act.query)}
                className="flex items-center justify-center gap-1.5 p-2 rounded bg-[#101827] border border-soc-border hover:border-soc-primary/50 hover:bg-[#162337] text-soc-muted hover:text-soc-text transition-all text-[11px] font-semibold text-center font-mono hover:shadow-inner"
              >
                <Icon className={`w-3.5 h-3.5 ${act.tint || 'text-soc-primary'}`} />
                <span className="truncate">{act.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conversation Thread */}
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className="space-y-2">
              {msg.role === 'user' ? (
                /* User turn (right aligned) */
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-[#101827] border border-soc-border rounded-xl p-3 text-xs text-[#e8eaf0] shadow-md">
                    <div className="flex items-center justify-between gap-4 mb-1 text-[9px] text-soc-muted font-mono">
                      <span className="font-bold">SOC Analyst</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="font-sans leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ) : (
                /* Copilot turn (AI Report Card Layout) */
                <div className="flex flex-col bg-[#101827] border border-soc-border rounded-xl overflow-hidden shadow-lg hover:border-soc-primary/50 transition-all duration-300">
                  {/* Glowing Top Accent Border */}
                  <div className="h-[2px] bg-gradient-to-r from-red-500 via-soc-primary to-emerald-500" />

                  {/* Top Header Section */}
                  <div className="px-4 py-2.5 bg-[#162337] border-b border-soc-border flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 animate-pulse text-xs">🔴</span>
                      <span className="text-xs font-black tracking-wide text-soc-text uppercase">AI Investigation Summary</span>
                    </div>
                    <span className="px-1.5 py-0.2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black rounded uppercase">
                      HIGH
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="px-4 py-2 bg-[#0d1521] border-b border-soc-border/60 flex items-center justify-between text-[10px] text-soc-muted font-mono font-bold">
                    <span>Generated just now</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Content Area */}
                  <div className="p-4 space-y-3 bg-[#07101C]/20">
                    
                    {/* Render custom page tables/stats if this is the initial structured state */}
                    {msg.heading && (
                      <h3 className="text-xs font-bold text-soc-text flex items-center gap-1.5 font-mono mb-2 border-b border-soc-border pb-1 uppercase tracking-wide">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                        {msg.heading}
                      </h3>
                    )}

                    {msg.stats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        {msg.stats.map((st) => (
                          <div key={st.label} className="bg-[#162337] border border-soc-border rounded p-2 flex flex-col justify-between">
                            <span className="text-[9px] text-soc-muted uppercase font-mono font-bold">{st.label}</span>
                            <span className={`text-sm font-bold font-mono mt-0.5 ${st.color}`}>{st.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.tableData && (
                      <div className="overflow-x-auto border border-soc-border rounded-lg bg-[#0c121e] mb-3 no-scrollbar">
                        <table className="w-full text-left text-[11px] font-mono border-collapse">
                          <thead className="bg-[#162337] text-soc-muted uppercase text-[9px] font-bold border-b border-soc-border tracking-wider">
                            <tr>
                              <th className="p-2">Time</th>
                              <th className="p-2">Type</th>
                              <th className="p-2">Customer</th>
                              <th className="p-2">Risk</th>
                              <th className="p-2">Location</th>
                              <th className="p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-soc-border/40 text-soc-text">
                            {msg.tableData.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                onClick={() => onSelectCustomer && onSelectCustomer(row)}
                                className="hover:bg-[#162337] cursor-pointer transition-colors"
                              >
                                <td className="p-2 text-soc-muted font-mono text-[10px]">{row.time}</td>
                                <td className="p-2 flex items-center gap-1.5">
                                  <span>{row.typeIcon}</span>
                                  <span>{row.type}</span>
                                </td>
                                <td className="p-2 font-medium">{row.customer}</td>
                                <td className={`p-2 font-mono ${getRiskScoreClass(row.riskScore)}`}>
                                  {row.riskScore}
                                </td>
                                <td className="p-2 text-soc-muted">{row.location}</td>
                                <td className="p-2">
                                  <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-[#162337] border border-soc-border">
                                    <span className={`w-1.5 h-1.5 rounded-full ${row.statusColor}`} />
                                    <span>{row.status}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Unstructured Markdown content if present */}
                    {msg.content && (
                      <MarkdownReportRenderer content={msg.content} onSelectCustomer={onSelectCustomer} />
                    )}

                  </div>

                  {/* Actions footer wrapper */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-[#162337] border-t border-soc-border overflow-x-auto no-scrollbar font-mono text-[10px]">
                    <button 
                      type="button" 
                      onClick={() => alert('Investigation dossier initialized.')}
                      className="px-2 py-1 rounded bg-[#0c121e] border border-soc-border hover:border-soc-primary text-soc-muted hover:text-soc-text transition-all font-bold"
                    >
                      Open Investigation
                    </button>
                    <button 
                      type="button" 
                      onClick={() => alert('Dispatched customer history timeline request.')}
                      className="px-2 py-1 rounded bg-[#0c121e] border border-soc-border hover:border-soc-primary text-soc-muted hover:text-soc-text transition-all font-bold"
                    >
                      Timeline Context
                    </button>
                    <button 
                      type="button" 
                      onClick={() => alert('Graph visualizer focal node updated.')}
                      className="px-2 py-1 rounded bg-[#0c121e] border border-soc-border hover:border-soc-primary text-soc-muted hover:text-soc-text transition-all font-bold"
                    >
                      View Graph
                    </button>
                    <button 
                      type="button" 
                      onClick={() => alert('Regulatory summary compiled and printed.')}
                      className="px-2 py-1 rounded bg-[#0c121e] border border-soc-border hover:border-soc-primary text-soc-muted hover:text-soc-text transition-all font-bold"
                    >
                      Generate SAR
                    </button>
                  </div>

                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 p-3.5 text-soc-muted text-xs animate-pulse bg-[#101827] border border-soc-border rounded-xl shadow-md">
              <Sparkles className="w-4 h-4 text-soc-primary animate-spin" />
              <span className="font-mono">{loadingMessages[loadingMessageIdx]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Input Bar (Bottom Pinned) */}
      <div className="p-3 bg-[#101827] border-t border-soc-border">
        <div className="flex items-center gap-2 bg-[#0c121e] border border-soc-border focus-within:border-soc-primary rounded-lg px-3 py-2 transition-all">
          <Paperclip className="w-4 h-4 text-soc-muted cursor-pointer hover:text-soc-text" />
          <Mic className="w-4 h-4 text-soc-muted cursor-pointer hover:text-soc-text" />
          <input
            type="text"
            className="flex-1 bg-transparent text-soc-text text-xs focus:outline-none placeholder-soc-muted font-mono"
            placeholder="Ask me anything about fraud, risk, or customers..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="p-1.5 bg-soc-primary text-soc-onPrimary rounded hover:bg-soc-primary/80 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[9px] text-soc-muted text-center mt-1.5 font-mono font-semibold">
          Fuzen AI Copilot is an AI copilot and can make errors. Verify indicators.
        </p>
      </div>

    </div>
  );
}
