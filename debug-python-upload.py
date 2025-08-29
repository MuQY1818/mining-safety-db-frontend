#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Python文件上传测试脚本 - 用于对比前端proxy失败的原因
"""

import requests
import os
import sys
from typing import Dict, Any

# 确保输出编码
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 配置
API_BASE = "https://mining-backend.ziven.site/api"
JWT_TOKEN = "eyJhbGciOiJIUzM4NCJ9.eyJ1c2VyX2lkIjozMTA0NjczMjEyODMyNSwidXNlcl9yb2xlIjoiYWRtaW4iLCJzdWIiOiJBdXRoZW50aWNhdGlvbiIsImlhdCI6MTc1NjM3MjQ0NSwiZXhwIjoxNzU2OTc3MjQ1LCJqdGkiOiJiOWZhYWQ3NzJmNDM0ZjE1YTRhZjMxNjI4MDBkMTY4YSJ9.C4Gb4EE9pAUhuRbB5e54gZv9SgM98fSMH0oDHgezzaj_dS_6XB_YBl3qoalO6Lc7"
TEST_FILE = "test-small.txt"

def create_test_file():
    """创建测试文件"""
    content = "这是一个用于测试multipart上传的小文件。\n内容包含中文字符和特殊符号：!@#$%^&*()\n"
    with open(TEST_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    return os.path.getsize(TEST_FILE)

def upload_file_python() -> Dict[str, Any]:
    """使用Python requests上传文件"""
    print("Python直接上传测试")
    print("=" * 50)
    
    # 创建测试文件
    file_size = create_test_file()
    print(f"测试文件: {TEST_FILE} ({file_size} bytes)")
    
    # 准备请求
    headers = {
        'Authorization': f'Bearer {JWT_TOKEN}',
        'User-Agent': 'Python-Debug-Script/1.0'
    }
    
    # 详细记录请求信息
    print("\n请求详情:")
    print(f"URL: {API_BASE}/file/upload")
    print(f"Headers: {headers}")
    print(f"File: {TEST_FILE}")
    
    try:
        with open(TEST_FILE, 'rb') as f:
            # 使用files参数自动生成multipart/form-data
            files = {'file': (TEST_FILE, f, 'text/plain')}
            
            print("\n发送请求...")
            response = requests.post(
                f"{API_BASE}/file/upload",
                headers=headers,
                files=files,
                timeout=30
            )
            
            print(f"\n响应状态: {response.status_code}")
            print(f"响应头: {dict(response.headers)}")
            
            # 分析响应体
            try:
                response_data = response.json()
                print(f"响应数据: {response_data}")
                
                # 检查业务逻辑 - 后端成功码可能是0或200
                success_codes = [0, 200]
                if response_data.get('code') in success_codes:
                    print("SUCCESS: Python上传成功!")
                    print(f"文件URL: {response_data.get('data', {}).get('url')}")
                    return {
                        'success': True,
                        'url': response_data.get('data', {}).get('url'),
                        'response': response_data
                    }
                else:
                    print(f"FAILED: Python上传失败: {response_data}")
                    return {'success': False, 'error': response_data}
                    
            except Exception as e:
                print(f"ERROR: 响应解析失败: {e}")
                print(f"原始响应: {response.text}")
                return {'success': False, 'error': str(e)}
                
    except requests.exceptions.RequestException as e:
        print(f"ERROR: 请求异常: {e}")
        return {'success': False, 'error': str(e)}
    
    finally:
        # 清理测试文件
        if os.path.exists(TEST_FILE):
            os.remove(TEST_FILE)

def analyze_request_details():
    """分析Python requests生成的详细请求格式"""
    print("\nPython requests multipart分析")
    print("=" * 50)
    
    # 创建测试文件
    create_test_file()
    
    try:
        with open(TEST_FILE, 'rb') as f:
            files = {'file': (TEST_FILE, f, 'text/plain')}
            
            # 创建一个PreparedRequest来检查实际请求格式
            from requests import Request, Session
            
            req = Request(
                'POST',
                f"{API_BASE}/file/upload",
                headers={'Authorization': f'Bearer {JWT_TOKEN}'},
                files=files
            )
            
            prepared = req.prepare()
            
            print("Python生成的请求详情:")
            print(f"Method: {prepared.method}")
            print(f"URL: {prepared.url}")
            print(f"Headers: {dict(prepared.headers)}")
            
            # 分析Content-Type和boundary
            content_type = prepared.headers.get('Content-Type', '')
            if 'multipart/form-data' in content_type:
                # 提取boundary
                boundary = content_type.split('boundary=')[1] if 'boundary=' in content_type else 'N/A'
                print(f"Boundary: {boundary}")
                
            # 显示请求体的前200字符(包含multipart结构)
            if prepared.body:
                body_preview = str(prepared.body)[:400] if isinstance(prepared.body, bytes) else str(prepared.body)[:400]
                print(f"Body preview: {body_preview}...")
                print(f"Body length: {len(prepared.body) if prepared.body else 0} bytes")
            
    finally:
        if os.path.exists(TEST_FILE):
            os.remove(TEST_FILE)

def main():
    """主函数"""
    print("Python vs 前端文件上传差异分析")
    print("=" * 60)
    
    # 1. 执行Python上传测试
    result = upload_file_python()
    
    # 2. 分析请求格式详情
    analyze_request_details()
    
    # 3. 生成对比报告
    print("\n关键发现总结:")
    print("=" * 50)
    if result['success']:
        print("SUCCESS: Python requests 可以成功上传文件")
        print("SUCCESS: 后端服务正常运行，问题确实在前端proxy")
        print("FOCUS: 需要重点检查: proxy如何处理multipart/form-data")
    else:
        print("ERROR: Python上传也失败，问题可能在后端或网络")
    
    print("\n下一步行动:")
    print("1. 对比proxy转发的请求与Python生成的请求")
    print("2. 检查boundary和Content-Length是否一致")
    print("3. 验证文件数据在proxy中是否被截断")

if __name__ == "__main__":
    main()