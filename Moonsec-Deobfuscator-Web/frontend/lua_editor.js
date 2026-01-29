// Additional Lua editor functionality
class LuaEditor {
    constructor(textareaId) {
        this.textarea = document.getElementById(textareaId);
        this.setupEditor();
    }
    
    setupEditor() {
        // Add tab support
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.textarea.selectionStart;
                const end = this.textarea.selectionEnd;
                
                // Insert tab character
                this.textarea.value = this.textarea.value.substring(0, start) + 
                    '    ' + this.textarea.value.substring(end);
                
                // Move cursor
                this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
            }
            
            // Auto-close brackets and quotes
            if (['(', '[', '{', '"', "'"].includes(e.key)) {
                const pairs = {
                    '(': ')',
                    '[': ']',
                    '{': '}',
                    '"': '"',
                    "'": "'"
                };
                
                const start = this.textarea.selectionStart;
                const end = this.textarea.selectionEnd;
                
                this.textarea.value = this.textarea.value.substring(0, start) + 
                    e.key + pairs[e.key] + this.textarea.value.substring(end);
                
                this.textarea.selectionStart = this.textarea.selectionEnd = start + 1;
                e.preventDefault();
            }
        });
        
        // Add line numbers (optional enhancement)
        this.addLineNumbers();
    }
    
    addLineNumbers() {
        // This would require creating a separate line number display
        // For simplicity, we'll just count lines in updateStats
    }
    
    insertText(text) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        
        this.textarea.value = this.textarea.value.substring(0, start) + 
            text + this.textarea.value.substring(end);
        
        this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
        this.textarea.focus();
    }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LuaEditor('inputEditor');
});
