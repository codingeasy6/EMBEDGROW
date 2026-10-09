import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Instagram
    content = re.sub(r'<a href="https://instagram\.com"', r'<a href="https://www.instagram.com/embedgrow?igsi=NTB3enN5dHEwOTdh"', content)
    
    # Twitter
    content = re.sub(r'<a href="https://x\.com"', r'<a href="https://x.com/EMBEDGROW?utm_source=chatgpt.com"', content)
    
    # LinkedIn -> Facebook
    content = re.sub(
        r'<a href="https://linkedin\.com"([^>]*?)aria-label="LinkedIn">.*?</svg>\s*</a>', 
        r'<a href="https://www.facebook.com/profile.php?id=61593991533566"\1aria-label="Facebook">\n              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>\n            </a>', 
        content, 
        flags=re.DOTALL
    )
    
    # Phone number in contact.html
    if file == 'contact.html':
        content = re.sub(r'<a href="tel:\+15550192834">\+1 \(555\) 019-2834</a>', r'<a href="tel:+918610752189">+91 8610752189</a>', content)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
