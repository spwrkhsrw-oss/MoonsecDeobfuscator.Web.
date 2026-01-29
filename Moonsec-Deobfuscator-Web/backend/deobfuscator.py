import os
import re
import base64
import subprocess
import tempfile
import json
from pathlib import Path

class MoonsecDeobfuscator:
    def __init__(self):
        self.patterns = {
            'base64': r'frombase64\("([^"]+)"\)',
            'string_concat': r'("\s*\.\.\s*")',
            'hex_strings': r'\\x[0-9a-fA-F]{2}',
            'number_obfuscation': r'\(\(\)\)\[.*?\]+\(\)',
        }
        
    def extract_lua_bytecode(self, content):
        """Extract Lua bytecode from obfuscated script"""
        # Look for common Moonsec patterns
        patterns = [
            r'loadstring\(([^)]+)\)',
            r'load\(([^)]+)\)',
            r'assert\(load\(([^)]+)\)\)',
            r'local\s+[a-zA-Z_][a-zA-Z0-9_]*\s*=\s*loadstring\([^)]+\)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content, re.DOTALL)
            if matches:
                return matches[0]
        return None
    
    def decode_base64(self, encoded_string):
        """Decode base64 strings"""
        try:
            # Add padding if needed
            padding = 4 - len(encoded_string) % 4
            if padding != 4:
                encoded_string += "=" * padding
            return base64.b64decode(encoded_string).decode('utf-8', errors='ignore')
        except:
            return encoded_string
    
    def clean_string_concat(self, code):
        """Clean string concatenation patterns"""
        # Remove unnecessary concatenations
        code = re.sub(r'""\s*\.\.\s*', '', code)
        code = re.sub(r'"\s*\.\.\s*""', '', code)
        
        # Fix string building patterns
        lines = code.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Handle common Moonsec string building
            if '..' in line and '"' in line:
                parts = re.split(r'\s*\.\.\s*', line)
                reconstructed = ''
                for part in parts:
                    part = part.strip()
                    if part.startswith('"') and part.endswith('"'):
                        reconstructed += part[1:-1]
                    elif part.startswith("'") and part.endswith("'"):
                        reconstructed += part[1:-1]
                    else:
                        reconstructed += part
                line = f'"{reconstructed}"'
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def extract_embedded_code(self, content):
        """Extract embedded Lua code from obfuscated script"""
        # Look for encoded sections
        encoded_sections = re.findall(r'([A-Za-z0-9+/=]{20,})', content)
        
        results = []
        for section in encoded_sections:
            try:
                decoded = self.decode_base64(section)
                if 'function' in decoded or 'local' in decoded or '=' in decoded:
                    results.append(decoded)
            except:
                continue
        
        return results
    
    def deobfuscate(self, input_code):
        """Main deobfuscation function"""
        try:
            # Create a copy to work with
            code = input_code
            
            # Step 1: Extract bytecode if present
            bytecode = self.extract_lua_bytecode(code)
            if bytecode:
                code = bytecode
            
            # Step 2: Decode base64 strings
            base64_matches = re.findall(self.patterns['base64'], code)
            for match in base64_matches:
                decoded = self.decode_base64(match)
                code = code.replace(f'frombase64("{match}")', f'"{decoded}"')
            
            # Step 3: Clean string concatenations
            code = self.clean_string_concat(code)
            
            # Step 4: Extract embedded code
            embedded = self.extract_embedded_code(code)
            
            # Step 5: Try to beautify the code
            code = self.beautify_lua(code)
            
            result = {
                'success': True,
                'deobfuscated_code': code,
                'embedded_snippets': embedded[:5],  # Limit to 5 snippets
                'warnings': []
            }
            
            if len(embedded) > 5:
                result['warnings'].append(f'Found {len(embedded)} embedded code snippets, showing first 5')
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'deobfuscated_code': input_code
            }
    
    def beautify_lua(self, code):
        """Basic Lua code beautifier"""
        # Add line breaks after semicolons
        code = code.replace(';', ';\n')
        
        # Add line breaks after end keywords
        code = code.replace('end ', 'end\n')
        code = code.replace('end}', 'end\n}')
        code = code.replace('end)', 'end\n)')
        
        # Fix indentation
        lines = code.split('\n')
        indented_lines = []
        indent_level = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Decrease indent for end, elseif, else
            if line.startswith('end') or line.startswith('elseif') or line.startswith('else'):
                indent_level = max(0, indent_level - 1)
            
            # Add current line with proper indentation
            indented_lines.append('    ' * indent_level + line)
            
            # Increase indent for if, function, do, then
            if line.endswith('then') or line.endswith('do') or 'function' in line:
                indent_level += 1
        
        return '\n'.join(indented_lines)

# Create instance
deobfuscator = MoonsecDeobfuscator()

def deobfuscate_lua(code):
    return deobfuscator.deobfuscate(code)
