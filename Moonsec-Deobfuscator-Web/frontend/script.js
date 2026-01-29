class MoonsecDeobfuscatorUI {
    constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5000/api'
            : '/api';
        
        this.initElements();
        this.bindEvents();
        this.checkApiStatus();
        this.setupExampleCode();
    }
    
    initElements() {
        this.inputEditor = document.getElementById('inputEditor');
        this.outputEditor = document.getElementById('outputEditor');
        this.deobfuscateBtn = document.getElementById('deobfuscateBtn');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.formatBtn = document.getElementById('formatBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.apiStatus = document.getElementById('apiStatus');
        this.statusDot = this.apiStatus.querySelector('.status-dot');
        this.analysisPanel = document.getElementById('analysisPanel');
        this.analysisContent = document.getElementById('analysisContent');
        this.closeAnalysis = document.getElementById('closeAnalysis');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.notification = document.getElementById('notification');
        this.reportIssue = document.getElementById('reportIssue');
        
        // Stats elements
        this.charCount = document.getElementById('charCount');
        this.lineCount = document.getElementById('lineCount');
        this.outputCharCount = document.getElementById('outputCharCount');
        this.outputLineCount = document.getElementById('outputLineCount');
    }
    
    bindEvents() {
        this.inputEditor.addEventListener('input', () => this.updateStats());
        this.deobfuscateBtn.addEventListener('click', () => this.deobfuscate());
        this.analyzeBtn.addEventListener('click', () => this.analyzeCode());
        this.copyBtn.addEventListener('click', () => this.copyOutput());
        this.formatBtn.addEventListener('click', () => this.formatOutput());
        this.downloadBtn.addEventListener('click', () => this.downloadOutput());
        this.clearBtn.addEventListener('click', () => this.clearEditors());
        this.pasteBtn.addEventListener('click', () => this.pasteExample());
        this.closeAnalysis.addEventListener('click', () => this.hideAnalysis());
        this.reportIssue.addEventListener('click', (e) => {
            e.preventDefault();
            this.reportBug();
        });
        
        // Auto-update output stats
        const observer = new MutationObserver(() => this.updateOutputStats());
        observer.observe(this.outputEditor, { childList: true, subtree: true });
    }
    
    async checkApiStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            if (response.ok) {
                this.statusDot.classList.add('connected');
                this.apiStatus.querySelector('span:last-child').textContent = 'API Status: Connected';
            } else {
                throw new Error('API not responding');
            }
        } catch (error) {
            this.statusDot.classList.remove('connected');
            this.apiStatus.querySelector('span:last-child').textContent = 'API Status: Disconnected';
            this.showNotification('API server is not running. Some features may be limited.', 'warning');
        }
    }
    
    updateStats() {
        const text = this.inputEditor.value;
        this.charCount.textContent = `${text.length} characters`;
        this.lineCount.textContent = `${text.split('\n').length} lines`;
    }
    
    updateOutputStats() {
        const text = this.outputEditor.textContent;
        this.outputCharCount.textContent = `${text.length} characters`;
        this.outputLineCount.textContent = `${text.split('\n').length} lines`;
    }
    
    showLoading() {
        this.loadingOverlay.style.display = 'flex';
    }
    
    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }
    
    showNotification(message, type = 'info') {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.classList.add('show');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 5000);
    }
    
    async deobfuscate() {
        const code = this.inputEditor.value.trim();
        
        if (!code) {
            this.showNotification('Please enter some Lua code to deobfuscate', 'warning');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/deobfuscate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const highlightedCode = this.highlightLua(result.deobfuscated_code);
                this.outputEditor.innerHTML = highlightedCode;
                
                // Enable output buttons
                this.copyBtn.disabled = false;
                this.formatBtn.disabled = false;
                this.downloadBtn.disabled = false;
                
                this.showNotification('Code deobfuscated successfully!', 'success');
                
                // Show embedded snippets if any
                if (result.embedded_snippets && result.embedded_snippets.length > 0) {
                    this.showNotification(`Found ${result.embedded_snippets.length} embedded code snippets`, 'info');
                }
            } else {
                throw new Error(result.error || 'Deobfuscation failed');
            }
        } catch (error) {
            console.error('Deobfuscation error:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
            this.outputEditor.textContent = '// Error during deobfuscation\n// ' + error.message;
        } finally {
            this.hideLoading();
        }
    }
    
    async analyzeCode() {
        const code = this.inputEditor.value.trim();
        
        if (!code) {
            this.showNotification('Please enter some Lua code to analyze', 'warning');
            return;
        }
        
        this.showLoading();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.displayAnalysis(result.analysis);
                this.analysisPanel.style.display = 'block';
                this.showNotification('Code analyzed successfully', 'success');
            } else {
                throw new Error(result.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showNotification(`Analysis error: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    displayAnalysis(analysis) {
        const badgeClass = `badge-${analysis.obfuscation_level}`;
        
        this.analysisContent.innerHTML = `
            <div class="analysis-item">
                <h4>Code Length</h4>
                <div class="value">${analysis.length}</div>
                <div class="description">characters</div>
            </div>
            <div class="analysis-item">
                <h4>Lines of Code</h4>
                <div class="value">${analysis.lines}</div>
                <div class="description">lines</div>
            </div>
            <div class="analysis-item">
                <h4>Loadstring Detection</h4>
                <div class="value">${analysis.has_loadstring ? 'Yes' : 'No'}</div>
                <div class="description">${analysis.has_loadstring ? 'Potential obfuscation' : 'Clean'}</div>
            </div>
            <div class="analysis-item">
                <h4>Base64 Encoding</h4>
                <div class="value">${analysis.has_base64 ? 'Yes' : 'No'}</div>
                <div class="description">${analysis.has_base64 ? 'Encoded strings found' : 'No encoding'}</div>
            </div>
            <div class="analysis-item">
                <h4>Obfuscation Level</h4>
                <div class="value">${analysis.obfuscation_level.toUpperCase()}</div>
                <div class="badge ${badgeClass}">${analysis.obfuscation_level}</div>
            </div>
        `;
    }
    
    hideAnalysis() {
        this.analysisPanel.style.display = 'none';
    }
    
    copyOutput() {
        const text = this.outputEditor.textContent;
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Code copied to clipboard!', 'success');
        }).catch(err => {
            this.showNotification('Failed to copy code', 'error');
        });
    }
    
    formatOutput() {
        const code = this.outputEditor.textContent;
        const formatted = this.formatLuaCode(code);
        const highlighted = this.highlightLua(formatted);
        this.outputEditor.innerHTML = highlighted;
        this.showNotification('Code formatted', 'info');
    }
    
    downloadOutput() {
        const code = this.outputEditor.textContent;
        const blob = new Blob([code], { type: 'text/x-lua' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deobfuscated_script.lua';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('Code downloaded as deobfuscated_script.lua', 'success');
    }
    
    clearEditors() {
        this.inputEditor.value = '';
        this.outputEditor.textContent = '';
        this.updateStats();
        this.updateOutputStats();
        this.copyBtn.disabled = true;
        this.formatBtn.disabled = true;
        this.downloadBtn.disabled = true;
        this.hideAnalysis();
        this.showNotification('Editors cleared', 'info');
    }
    
    pasteExample() {
        const exampleCode = `-- Example of Moonsec obfuscated Lua code
local a = "lo"
local b = "ad"
local c = "string"
local d = "from"
local e = "base64"
local f = d..e

local encoded = "bG9hZHN0cmluZygiLXx8LSIp" -- This is base64 encoded code

local function decode(str)
    return (str:gsub('.', function(x) 
        return string.char(x:byte() + 1)
    end))
end

local code = decode(encoded)
loadstring(code)()`;
        
        this.inputEditor.value = exampleCode;
        this.updateStats();
        this.showNotification('Example code loaded', 'info');
    }
    
    reportBug() {
        const url = 'https://github.com/yourusername/Moonsec-Deobfuscator-Web/issues/new';
        window.open(url, '_blank');
    }
    
    highlightLua(code) {
        // Simple Lua syntax highlighter
        const keywords = [
            'and', 'break', 'do', 'else', 'elseif', 'end',
            'false', 'for', 'function', 'goto', 'if', 'in',
            'local', 'nil', 'not', 'or', 'repeat', 'return',
            'then', 'true', 'until', 'while'
        ];
        
        const patterns = [
            { regex: /--.*$/gm, class: 'comment' }, // Single line comments
            { regex: /--\[\[[\s\S]*?\]\]/g, class: 'comment' }, // Multi-line comments
            { regex: /(["'])(?:\\.|(?!\1).)*\1/g, class: 'string' }, // Strings
            { regex: /\b(\d+\.?\d*|\.\d+)\b/g, class: 'number' }, // Numbers
            { regex: new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), class: 'keyword' },
            { regex: /\b(function)\b/g, class: 'function' },
            { regex: /[=+\-*/%^#<>~]|\.\.|\.\.\./g, class: 'operator' }
        ];
        
        let highlighted = code;
        
        // Escape HTML
        highlighted = highlighted
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        // Apply highlighting patterns
        patterns.forEach(pattern => {
            highlighted = highlighted.replace(pattern.regex, 
                `<span class="${pattern.class}">$&</span>`);
        });
        
        return highlighted;
    }
    
    formatLuaCode(code) {
        // Basic Lua code formatter
        let formatted = code;
        
        // Add spaces around operators
        formatted = formatted.replace(/([=+\-*/%^<>])(?!=)/g, ' $1 ');
        formatted = formatted.replace(/\.\./g, ' .. ');
        
        // Fix indentation
        const lines = formatted.split('\n');
        let indent = 0;
        const formattedLines = [];
        
        for (let line of lines) {
            line = line.trim();
            if (!line) {
                formattedLines.push('');
                continue;
            }
            
            // Decrease indent for end, elseif, else
            if (line.startsWith('end') || line.startsWith('elseif') || line.startsWith('else')) {
                indent = Math.max(0, indent - 1);
            }
            
            // Add line with proper indentation
            formattedLines.push('    '.repeat(indent) + line);
            
            // Increase indent for blocks
            if (line.endsWith('then') || line.endsWith('do') || line.includes('function') || 
                line.startsWith('if') || line.startsWith('for') || line.startsWith('while')) {
                indent++;
            }
        }
        
        return formattedLines.join('\n');
    }
    
    setupExampleCode() {
        // Add some default text to input editor
        setTimeout(() => {
            if (!this.inputEditor.value.trim()) {
                this.pasteExample();
            }
        }, 1000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MoonsecDeobfuscatorUI();
});
