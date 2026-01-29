from flask import Flask, request, jsonify
from flask_cors import CORS
from deobfuscator import deobfuscate_lua
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'Moonsec Deobfuscator API'})

@app.route('/api/deobfuscate', methods=['POST'])
def deobfuscate():
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                'success': False,
                'error': 'No code provided'
            }), 400
        
        lua_code = data['code']
        
        # Deobfuscate the code
        result = deobfuscate_lua(lua_code)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/batch-deobfuscate', methods=['POST'])
def batch_deobfuscate():
    try:
        data = request.get_json()
        
        if not data or 'files' not in data:
            return jsonify({
                'success': False,
                'error': 'No files provided'
            }), 400
        
        files = data['files']
        results = []
        
        for file_content in files[:10]:  # Limit to 10 files
            result = deobfuscate_lua(file_content)
            results.append(result)
        
        return jsonify({
            'success': True,
            'results': results,
            'total_processed': len(results)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        
        if not data or 'code' not in data:
            return jsonify({
                'success': False,
                'error': 'No code provided'
            }), 400
        
        code = data['code']
        
        # Basic analysis
        analysis = {
            'length': len(code),
            'lines': len(code.split('\n')),
            'has_loadstring': 'loadstring' in code,
            'has_base64': 'base64' in code or 'frombase64' in code,
            'has_concatenation': '..' in code,
            'obfuscation_level': 'unknown'
        }
        
        # Determine obfuscation level
        indicators = 0
        if analysis['has_loadstring']:
            indicators += 1
        if analysis['has_base64']:
            indicators += 1
        if code.count('..') > 10:
            indicators += 1
        
        if indicators >= 2:
            analysis['obfuscation_level'] = 'high'
        elif indicators == 1:
            analysis['obfuscation_level'] = 'medium'
        else:
            analysis['obfuscation_level'] = 'low'
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # For production, use waitress
    from waitress import serve
    print("Starting Moonsec Deobfuscator API on port 5000...")
    serve(app, host='0.0.0.0', port=5000)
